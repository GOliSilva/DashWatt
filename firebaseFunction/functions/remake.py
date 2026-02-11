from datetime import datetime, timedelta
import logging
import os
from zoneinfo import ZoneInfo

import firebase_admin
from firebase_admin import credentials, firestore, messaging
from firebase_functions import scheduler_fn , logger

ALERTS_LIMIT = 100
FCM_BATCH_SIZE = 100


def _init_firebase():
    if firebase_admin._apps:
        return

    # Production: use ADC. Dev/test: allow explicit service account path.
    cred_path = (
        os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )
    if cred_path:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    else:
        firebase_admin.initialize_app()


def get_db():
    _init_firebase()
    return firestore.client()


def get_user_tokens(user_id: str, db) -> list[str]:
    """Fetch user's FCM tokens from Firestore."""
    try:
        tokens_ref = db.collection("members").document(user_id).collection("fcmtokens")
        tokens_docs = tokens_ref.stream()

        tokens = []
        for token_doc in tokens_docs:
            token_data = token_doc.to_dict() or {}
            fcm_token = None
            possible_keys = ["fcmToken", "fcmtoken", "token", "FCMToken", "fcm_token"]

            for key in possible_keys:
                if key in token_data:
                    fcm_token = token_data[key]
                    break

            # Fallback: token stored as document ID.
            if not fcm_token and token_doc.id and len(token_doc.id) > 50:
                fcm_token = token_doc.id

            if fcm_token:
                tokens.append(fcm_token)

        return tokens
    except Exception as exc:
        logger.error(f"Error fetching tokens for {user_id}: {exc}")
        return []


def alert_for_consultor_pending_tasks(
    owner_id: str,
    activity_name: str,
    project_name: str,
    tokens: list[str] | None = None,
    due_at=None,
):
    if not tokens:
        logger.warning(f"No tokens available for owner {owner_id}")
        return

    try:
        for i in range(0, len(tokens), FCM_BATCH_SIZE):
            token_chunk = tokens[i : i + FCM_BATCH_SIZE]

            message = messaging.MulticastMessage(
                tokens=token_chunk,
                notification=messaging.Notification(
                    title="Alerta de Tarefa Pendente",
                    body=(
                        f"A tarefa '{activity_name}' do projeto '{project_name}' vence em "
                        f"{due_at.strftime('%d/%m/%Y') if due_at else 'breve'}."
                    ),
                ),
                data={
                    "ownerId": owner_id,
                    "activityName": activity_name,
                    "projectName": project_name,
                    "timestamp": datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat(),
                },
            )

            response = messaging.send_multicast(message)
            logger.info(
                "Notifications sent to owner: "
                f"{response.success_count} success, {response.failure_count} failed"
            )
    except Exception as exc:
        logger.error(f"Error sending owner alerts: {exc}")


def alert_for_manager_pending_tasks(
    manager_id: str,
    activity_name: str,
    project_name: str,
    tokens: list[str] | None = None,
    due_at=None,
):
    if not tokens:
        logger.warning(f"No tokens available for manager {manager_id}")
        return

    try:
        for i in range(0, len(tokens), FCM_BATCH_SIZE):
            token_chunk = tokens[i : i + FCM_BATCH_SIZE]

            message = messaging.MulticastMessage(
                tokens=token_chunk,
                notification=messaging.Notification(
                    title="Alerta de Tarefa Pendente",
                    body=(
                        f"A tarefa '{activity_name}' do projeto '{project_name}' vence em "
                        f"{due_at.strftime('%d/%m/%Y') if due_at else 'breve'}."
                    ),
                ),
                data={
                    "managerId": manager_id,
                    "activityName": activity_name,
                    "projectName": project_name,
                    "timestamp": datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat(),
                },
            )

            response = messaging.send_multicast(message)
            logger.info(
                "Notifications sent to manager: "
                f"{response.success_count} success, {response.failure_count} failed"
            )
    except Exception as exc:
        logger.error(f"Error sending manager alerts: {exc}")


def analyze_tasks(project, db):
    """Analyze a single project and send alerts for pending tasks."""
    try:
        activities = project.get("activities", [])
        now_brasilia = datetime.now(ZoneInfo("America/Sao_Paulo"))

        for activity in activities:
            status = activity.get("status")
            due_at = activity.get("dueAt")

            if due_at and hasattr(due_at, "to_pydatetime"):
                due_at = due_at.to_pydatetime()

            if (
                status not in ("Concluido", "Cancelado")
                and due_at
                and due_at < (now_brasilia + timedelta(days=7))
            ):
                owner_id = activity.get("ownerId")
                activity_name = activity.get("name")
                project_name = project.get("name")

                owner_tokens = get_user_tokens(owner_id, db)
                alert_for_consultor_pending_tasks(
                    owner_id, activity_name, project_name, owner_tokens, due_at
                )

                manager_id = project.get("managerId")
                if manager_id and manager_id != owner_id:
                    manager_tokens = get_user_tokens(manager_id, db)
                    alert_for_manager_pending_tasks(
                        manager_id,
                        activity_name,
                        project_name,
                        manager_tokens,
                        due_at,
                    )
    except Exception as exc:
        logger.error(f"Error analyzing project tasks: {exc}")


def run_pending_tasks_check():
    """Run pending task check for all projects."""
    try:
        db = get_db()
        projects = db.collection("projects").stream()

        project_count = 0
        for project_doc in projects:
            project = project_doc.to_dict() or {}
            analyze_tasks(project, db)
            project_count += 1

        logger.info(f"Task scan completed - {project_count} projects analyzed")
        return project_count
    except Exception as exc:
        logger.error(f"Error running pending task check: {exc}")
        raise


@scheduler_fn.on_schedule(
    schedule="every day 08:00",
    timezone="America/Sao_Paulo",
)
def scheduled_task(req: scheduler_fn.ScheduledEvent) -> None:
    """Daily scheduled check for pending tasks."""
    try:
        run_pending_tasks_check()
    except Exception as exc:
        logger.error(f"Error in scheduled task: {exc}")

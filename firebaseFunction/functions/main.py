from firebase_functions.options import set_global_options

from remake import check_pending_tasks

# Cost control for this codebase.
set_global_options(max_instances=10)

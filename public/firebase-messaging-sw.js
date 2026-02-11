importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyB7n9nNQlloAu9qxFPCb8jj1jUAfP2xi2I',
  authDomain: 'wattdash-e0e52.firebaseapp.com',
  projectId: 'wattdash-e0e52',
  storageBucket: 'wattdash-e0e52.firebasestorage.app',
  messagingSenderId: '72161505763',
  appId: '1:72161505763:web:753c3cb9703f2e041ab0d6'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload?.notification) return;

  const title = payload?.data?.title || 'Nova notificação';
  const body = payload?.data?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    data: payload?.data || {}
  });
});

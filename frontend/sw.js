//Event that shows a notification when is received by push
self.addEventListener('push', (event) => {
    const data = event.data.json();
    if (typeof data?.title === 'string') {
        self.registration.showNotification(data.title, {
            ...data,
            data
        });
    }
    if ('setAppBadge' in navigator && typeof data.badgeCount === 'number') {
        navigator.setAppBadge(data.badgeCount ?? 0);
    }
});

self.addEventListener(
    'notificationclick',
    (evt) => {
        if (evt?.notification?.data?.redirect) {
            clients.openWindow(evt.notification.data.redirect);
        }
        evt.notification.close();
    },
    false
);

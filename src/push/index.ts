import db from '../db';
import webPush from 'web-push';

export function configure() {
    if (!db.get('vapidPublic') || !db.get('vapidPrivate')) {
        const keys = webPush.generateVAPIDKeys();
        db.set('vapidPublic', keys.publicKey);
        db.set('vapidPrivate', keys.privateKey);
    }
}

export async function sendPushNotification(body: {
    title?: string;
    body?: string;
    badgeCount?: number;
}) {
    if (!body.title) throw new Error("You can't make a push notification without a title");

    const clients = db.get('push-clients') || [];

    for (const { subscription } of clients) {
        const payload = JSON.stringify({
            title: body.title,
            body: body.body,
            badgeCount: body.badgeCount
        });

        await webPush.setVapidDetails(
            subscription.endpoint,
            db.get('vapidPublic'),
            db.get('vapidPrivate')
        );

        await webPush.sendNotification(subscription, payload);
    }
}

import db from '../db';
import webPush from 'web-push';
import { toReadableDate } from '../util';

export function configure() {
    if (!db.get('vapidPublic') || !db.get('vapidPrivate')) {
        const keys = webPush.generateVAPIDKeys();
        db.set('vapidPublic', keys.publicKey);
        db.set('vapidPrivate', keys.privateKey);
    }
}

export function cleanTopic(str: string) {
    return str.replace(/\./g, '_').trim().toLowerCase();
}

export async function sendPushNotification(body: {
    title?: string;
    body?: string;
    badgeCount?: number;
    topic: string;
    icon?: string;
}) {
    if (!body.title) throw new Error("You can't make a push notification without a title");

    const clients = db.get(`clients.topics.${cleanTopic(body.topic)}`);
    if (!clients) throw new Error('No clients for topic ' + cleanTopic(body.topic));

    console.info(
        `Sending notification to ${clients.length} clients at ${toReadableDate()}: ${body.title}`
    );

    for (const { subscription } of clients) {
        const payload = JSON.stringify({
            title: body.title,
            body: body.body,
            badgeCount: body.badgeCount,
            icon: body.icon
        });

        await webPush.setVapidDetails(
            subscription.endpoint,
            db.get('vapidPublic'),
            db.get('vapidPrivate')
        );
        await webPush.sendNotification(subscription, payload).catch(() => null);
    }

    return {
        clients: clients.length
    };
}

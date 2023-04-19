import express from 'express';
import db from './db';
import cors from 'cors';
import bodyParser from 'body-parser';
import { cleanTopic } from './push';
import { sendPushNotification } from './push';
import notificationScheduler from './scheduler';
import { NotifWithId } from './types';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/get-public-vapid-key', (req, res) => {
    res.json({
        data: db.get('vapidPublic')
    });
});

app.post('/subscribe', (req, res) => {
    const body = req.body;
    const topic = cleanTopic(body.topic);

    if (!body?.subscription?.endpoint) {
        res.status(403);
        res.json({
            status: 403,
            message: 'No endpoint'
        });
        return; // There should probably be more checks here, huh
    }

    if (!topic || topic.length === 0) {
        res.status(403);
        res.json({
            status: 403,
            message: 'No topic'
        });
        return; // There should probably be more checks here, huh
    }

    // Store in db
    const dbKey = `clients.topics.${topic}`;
    const clients = db.get(dbKey) || [];
    clients.push({
        ...body,
        addedAt: new Date().toISOString()
    }); // Validation is for babies
    db.set(dbKey, clients);
    db.store(false);

    res.send({
        status: 200
    });
});

app.get('/send-notification', async (req, res) => {
    const topic = ((req.query.topic as string) || '').trim();
    const title = ((req.query.title as string) || '').trim();
    const body = ((req.query.body as string) || '').trim();
    const at = ((req.query.at as string) || '').trim();

    const badgeNum = Number((req.query.body as string).trim() || NaN);
    const badgeCount = Number.isNaN(badgeNum) ? badgeNum : undefined;

    if (at && !new Date(at)) {
        res.status(403);
        res.json({
            status: 403,
            message: `Invalid "at"`
        });
        return;
    }

    if (!title || !topic) {
        res.status(403);
        res.json({
            status: 403,
            message: `Missing ${!topic ? 'topic' : 'title'}` // Clever eh
        });
        return;
    }

    let data = {
        status: 200,
        message: ''
    };
    if (at) {
        data.message = 'Scheduled notification';
        notificationScheduler.add({
            at,
            topic,
            data: {
                title,
                body,
                badgeCount,
                topic
            }
        });
    } else {
        try {
            data = {
                ...data,
                ...(await sendPushNotification({
                    topic,
                    title,
                    body,
                    badgeCount
                }))
            };
        } catch (err) {
            data = {
                status: 500,
                message: err as string
            };
        }
    }

    res.json(data);
});

app.get('/get-notifications', async (req, res) => {
    const topic = cleanTopic((req.query.topic as string) || '');

    if (!topic) {
        res.status(403);
        res.json({
            status: 403,
            message: 'Missing topic'
        });
        return;
    }

    const notifications: NotifWithId[] = db.get('notifications') || [];
    const notificationsInTopic = notifications.filter((notif) => notif.topic === cleanTopic(topic));

    res.json({
        status: 200,
        data: notificationsInTopic
    });
});

app.get('/remove-notification', async (req, res) => {
    const id = cleanTopic((req.query.id as string) || '');

    if (!id) {
        res.status(403);
        res.json({
            status: 403,
            message: 'Missing id'
        });
        return;
    }

    const { success } = notificationScheduler.remove(id);

    res.json({
        status: success ? 200 : 404,
        message: success ? 'Removed notification' : 'Unable to find notification with id'
    });
});

export function startServer() {
    app.listen(8080);
}

import express from 'express';
import db from './db';
import cors from 'cors';
import bodyParser from 'body-parser';
import { cleanTopic } from './push';
import { sendPushNotification } from './push';
import notificationScheduler from './scheduler';
import { NotifWithId } from './types';
import { toReadableDate } from './util';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.redirect('https://github.com/JipFr/push-api');
});

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

    console.info(`New client subscribed to topic "${topic}" at ${toReadableDate()}`);

    res.send({
        status: 200,
        topic
    });
});

app.get('/send-notification', async (req, res) => {
    const topic = ((req.query.topic as string) || '').trim();
    const title = ((req.query.title as string) || '').trim();
    const body = ((req.query.body as string) || '').trim();
    const icon = ((req.query.icon as string) || '').trim();
    const at = ((req.query.at as string) || '').trim();

    const badgeNum = Number(((req.query.body as string) || '').trim() || NaN);
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
    if (at && new Date(at).getTime()) {
        console.info(
            `Scheduled notification in topic "${topic}" for ${toReadableDate(at)}: ${title}`
        );
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
                    badgeCount,
                    icon
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
    const topic = cleanTopic((req.query.topic as string) || '');

    if (!id && !topic) {
        res.status(403);
        res.json({
            status: 403,
            message: 'Topic or ID required'
        });
        return;
    }

    console.info(`Removing notifications with ${id ? 'ID' : 'topic'} ${id || topic}`);

    if (id) {
        const { success } = notificationScheduler.remove(id);

        res.json({
            status: success ? 200 : 404,
            message: success ? 'Removed notification' : 'Unable to find notification with id'
        });
    } else {
        let notifications: NotifWithId[] = db.get('notifications') || [];
        const before = notifications.length;
        notifications = notifications.filter((t) => t.topic !== topic);
        const diff = before - notifications.length;
        db.set('notifications', notifications);

        res.json({
            status: 200,
            message: `Removed ${diff} notifications`
        });
    }
});

export function startServer() {
    const port = process.env.port || 8080;
    app.listen(port, () => {
        console.info(`Listening on port ${port}`);
    });
}

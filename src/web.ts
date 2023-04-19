import express from 'express';
import db from './db';
import cors from 'cors';
import bodyParser from 'body-parser';
import { cleanTopic } from './push';
import { sendPushNotification } from './push';

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
    const badgeCount = Number((req.query.body as string) || '') || undefined;

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

    res.json(data);
});

export function startServer() {
    app.listen(8080);
}

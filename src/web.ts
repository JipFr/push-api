import express from 'express';
import db from './db';
import cors from 'cors';
import bodyParser from 'body-parser';

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
    const topic = body.topic.replace(/\./g, '_').trim();

    console.log(body);

    if (!body?.subscription?.endpoint) {
        res.status(403);
        res.json({
            status: 403,
            message: 'No endpoint'
        });
        return; // There should probably be more checks here, huh
    }

    if (!topic) {
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

export function startServer() {
    app.listen(8080);
}

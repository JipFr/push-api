import { sendPushNotification } from './';

(async () => {
    const topic = 'any';

    console.info('Sending push notif on topic:', topic);

    await sendPushNotification({
        topic,
        title: `Topic: ${topic}`,
        body: 'Yep',
        badgeCount: 1
    });

    console.info('Sent one, wait 5s for setting badge to 0');

    await new Promise((resolve) => setTimeout(resolve, 5e3));

    await sendPushNotification({
        topic,
        title: `Another on topic: ${topic}`,
        body: 'Yep :-)',
        badgeCount: 0
    });
})();

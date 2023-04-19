import db from './db';
import { sendPushNotification } from './push';
import { NotifWithId, Notification } from './types';

const timeouts: NodeJS.Timeout[] = [];

export async function add(notif: Notification) {
    const notifications: NotifWithId[] = db.get('notifications');
    notifications.push({
        ...notif,
        id: `${notif.topic}-${notifications.length}`
    });
    db.set('notifications', notifications);
    setTimeouts();
}

export function remove(id: string) {
    let notifications: NotifWithId[] = db.get('notifications');

    const before = notifications.length;
    notifications = notifications.filter(Boolean).filter((notif) => notif.id !== id);
    const after = notifications.length;

    if (before === after) {
        return { success: false };
    }

    db.set('notifications', notifications);
    setTimeouts();
    return { success: true };
}

function setTimeouts() {
    // Clear existing timeouts
    for (const timeoutId of timeouts) clearTimeout(timeoutId);

    // Get notifications from db
    const notifications: NotifWithId[] = db.get('notifications');

    // Set a timeout until trigger for each notification
    for (const notif of notifications) {
        const at = new Date(notif.at);
        const timeoutInMs = at.getTime() - Date.now();

        timeouts.push(
            setTimeout(() => {
                // Send
                sendPushNotification(notif.data);

                // Remove from array
                remove(notif.id);
            }, Math.min(Math.max(0, timeoutInMs), 2147483646))
        );
    }
}

setTimeouts();
setInterval(setTimeouts, 60e3 * 15);

export default { add, remove };

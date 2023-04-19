export interface Database {
    clients: {
        topics: {
            [key: string]: PushClient[];
        };
    };
    notifications: Notification[];
    vapidPublic: string | null;
    vapidPrivate: string | null;
}

export interface Notification {
    at: string;
    topic: string;
    data: {
        title: string;
        body?: string;
        badgeCount?: number;
        topic: string;
    };
}

export interface PushClient {
    subscription: {
        endpoint: string;
        expirationTime: null | unknown;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}

export type NotifWithId = Notification & { id: string };

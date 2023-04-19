import { Database } from './types';
import Db from 'jipdb';

// Configure DB's default values
const defaults: Database = {
    clients: {
        topics: {}
    },
    notifications: [],
    vapidPublic: null,
    vapidPrivate: null
};

// Make db
const db = new Db('./data.json', defaults);

// Export database for the entire app's use
export default db;

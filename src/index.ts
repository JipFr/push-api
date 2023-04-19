import { config } from 'dotenv';
import { configure as configurePush } from './push';
import { startServer } from './web';

config();
configurePush();
startServer();

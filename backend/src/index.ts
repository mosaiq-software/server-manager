import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { initApp } from './app';
import { applyGithubFingerprints } from './utils/authGit';
import { exit } from 'process';
import { sequelize } from './utils/dbHelper';
import cron from 'node-cron';
import { logContainerStatusesForAllWorkers } from './controllers/statusController';

const start = async () => {
    applyGithubFingerprints();
    const app = await initApp();
    const server = app.listen(process.env.API_PORT, () => {
        console.log(`Server started on port ${process.env.API_PORT}`);
    });

    sequelize.sync();

    cron.schedule('*/2 * * * *', () => {
        try {
            logContainerStatusesForAllWorkers();
        } catch (error) {
            console.error('Error logging container statuses:', error);
        }
    });
    process.on('SIGTERM', async () => {
        console.warn('Received SIGTERM, Ignoring...');
    });

    process.on('SIGINT', async () => {
        console.warn('Received SIGINT');
        server.close(() => {
            console.log('Server closed');
            exit(0);
        });
    });
};

start();

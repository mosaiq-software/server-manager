import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { initApp } from './app';
import { applyGithubFingerprints } from './utils/authGit';
import { exit } from 'process';
import { sequelize } from './utils/dbHelper';

const start = async () => {
    applyGithubFingerprints();
    const app = await initApp();
    const server = app.listen(process.env.API_PORT, () => {
        console.log(`Server started on port ${process.env.API_PORT}`);
    });

    sequelize.sync();

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

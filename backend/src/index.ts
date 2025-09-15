import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { initApp } from './app';
import { applyGithubFingerprints, handleSignals, registerCronJobs } from './utils/initUtils';
import { sequelize } from './utils/dbHelper';

const start = async () => {
    applyGithubFingerprints();
    const app = await initApp();
    if (!process.env.API_PORT) {
        throw new Error('API_PORT not set in environment variables');
    }
    const server = app.listen(process.env.API_PORT, () => {
        console.log(`Server started on port ${process.env.API_PORT}`);
    });

    sequelize.sync();

    handleSignals(server);
    registerCronJobs();
};

start();

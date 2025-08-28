import 'dotenv/config';
import { initApp } from './app';
import { applyGithubFingerprints } from './utils/authGit';

const start = async () => {
    const app = await initApp();
    app.listen(process.env.API_PORT, () => {
        console.log(`Server started at ${process.env.API_URL}:${process.env.API_PORT}`);
    });

    applyGithubFingerprints();
};

start();

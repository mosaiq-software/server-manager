import { execSync } from 'child_process';
import { exit } from 'process';
import cron from 'node-cron';
import { CONTROL_PLANE_HEARTBEAT_INTERVAL_MINS, handleControlPlaneHeartbeat, logContainerStatusesForAllWorkers } from '@/controllers/statusController';

const githubPublicFingerprint1 = 'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl';
const githubPublicFingerprint2 = 'github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=';
const githubPublicFingerprint3 = 'github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=';

export const applyGithubFingerprints = () => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping GitHub fingerprint application');
        return;
    }
    try {
        execSync(`mkdir -p ~/.ssh`);
        execSync(`echo "${githubPublicFingerprint1}" >> ~/.ssh/known_hosts`);
        execSync(`echo "${githubPublicFingerprint2}" >> ~/.ssh/known_hosts`);
        execSync(`echo "${githubPublicFingerprint3}" >> ~/.ssh/known_hosts`);
        console.log('GitHub fingerprints added to known_hosts');
    } catch (e) {
        console.error('Error adding GitHub fingerprints to known_hosts:', e);
    }
};

export const handleSignals = (server: any) => {
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

    console.log('Signal handlers registered');
};

export const registerCronJobs = () => {
    cron.schedule('*/2 * * * *', () => {
        try {
            logContainerStatusesForAllWorkers();
        } catch (error) {
            console.error('Error logging container statuses:', error);
        }
    });
    console.log('Scheduled container status logging every 2 minutes');

    cron.schedule(`*/${CONTROL_PLANE_HEARTBEAT_INTERVAL_MINS} * * * *`, () => {
        try {
            handleControlPlaneHeartbeat();
        } catch (error) {
            console.error('Error handling control plane heartbeat:', error);
        }
    });
    console.log(`Scheduled control plane heartbeat handling every ${CONTROL_PLANE_HEARTBEAT_INTERVAL_MINS} minutes`);

    console.log('Cron jobs registered');
};

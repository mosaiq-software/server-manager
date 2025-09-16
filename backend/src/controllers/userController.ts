import { getAllowedOrganizationsModel, getAllowedUsersModel } from '@/persistence/allowedEntitiesPersistence';
import { createUserModel, deleteUserByAuthTokenModel, getUserByAuthTokenModel } from '@/persistence/userPersistence';
import { getOrgsForUser, getPrivateGitHubUserData, revokeGithubAuth } from '@/utils/authUtils';
import { User } from '@mosaiq/nsm-common/types';

export const signInUser = async (authToken: string) => {
    try {
        const githubUser = await getPrivateGitHubUserData(authToken);
        if (!githubUser) {
            console.error('Failed to fetch GitHub user data');
            throw new Error('Failed to fetch GitHub user data');
        }
        const usersOrgs = await getOrgsForUser(authToken);
        if (!usersOrgs) {
            console.error('Failed to fetch GitHub organizations');
            throw new Error('Failed to fetch GitHub organizations');
        }
        const allowedUsers = await getAllowedUsersModel();
        const allowedOrgs = await getAllowedOrganizationsModel();
        const isUserAllowed = allowedUsers.some((u) => u.id.toLowerCase() === githubUser.login.toLowerCase());
        const isOrgAllowed = usersOrgs.some((org) => allowedOrgs.some((allowed) => allowed.id.toLowerCase() === org.login.toLowerCase()));
        if (!isUserAllowed && !isOrgAllowed && process.env.GITHUB_OAUTH_DEFAULT_USER?.toLocaleLowerCase() !== githubUser.login.toLowerCase()) {
            return null;
        }
        const user: User = {
            githubId: githubUser.id,
            name: githubUser.login,
            authToken,
            avatarUrl: githubUser.avatar_url || '',
            created: Date.now(),
        };
        const existingUser = await getUserByAuthTokenModel(authToken);
        if (existingUser) {
            await deleteUserByAuthTokenModel(authToken);
        }
        await createUserModel(user);
        return user;
    } catch (error: any) {
        console.error('Failed to sign in user:', error);
        throw new Error('Failed to sign in user' + error.message);
    }
};

export const verifyAuthToken = async (token: string): Promise<boolean> => {
    try {
        const user = await getUserByAuthTokenModel(token);
        if (!user) return false;
        return true;
    } catch (error) {
        return false;
    }
};

export const signOutUser = async (authToken: string): Promise<void> => {
    try {
        await deleteUserByAuthTokenModel(authToken);
        await revokeGithubAuth(authToken);
    } catch (e: any) {
        console.error('Failed to sign out user:', e);
        throw new Error('Failed to sign out user: ' + e.message);
    }
};

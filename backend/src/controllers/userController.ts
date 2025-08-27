import { User, UserId } from 'common';

export const getUser = async (userId: UserId): Promise<User | undefined> => {
    // call persistence here to get the user...
};

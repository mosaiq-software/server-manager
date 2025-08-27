import { useUser } from '@/contexts/user-context';
import { apiGet } from '@/utils/api';
import { setTitle } from '@/utils/tabUtils';
import { Center, Loader, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES, User, UserId } from 'common';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ProfilePage = () => {
    const params = useParams();
    const userId = params.userId as UserId | undefined;
    const [user, setUser] = useState<User | undefined | null>(undefined);
    const userCtx = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const getUserData = async () => {
            try {
                if (!userId || userId.trim().length === 0) {
                    return;
                }
                const data = await apiGet(API_ROUTES.GET_USER, { userId }, undefined);
                if (!data) {
                    setUser(null);
                    return;
                }
                setUser(data);
                setTitle(`${data.name}'s Profile`);
            } catch (e: any) {
                console.error('Error fetching user', userId, e);
                notifications.show({ message: "Error getting the user's data", color: 'red' });
            }
        };
        getUserData();
    }, [userId]);

    if (user === undefined) {
        return (
            <Center>
                <Loader />
            </Center>
        );
    }

    if (!user || !user.id) {
        return (
            <Center>
                <Stack>
                    <Title order={4}>User &quot;{userId}&quot; not found!</Title>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack>
            <Title>Hello {user.name}</Title>
        </Stack>
    );
};

export default ProfilePage;

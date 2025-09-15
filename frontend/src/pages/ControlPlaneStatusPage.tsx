import { ActionIcon, Code, Group, Stack, Text, Title } from '@mantine/core';
import { ControlPlaneStatus, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { MdOutlineLaunch } from 'react-icons/md';
import { Link } from 'react-router';
import { Heatmap } from '@mantine/charts';
import { apiGet } from '@/utils/api';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';

interface ControlPlaneStatusPageProps {}
const ControlPlaneStatusPage = (props: ControlPlaneStatusPageProps) => {
    const [logs, setLogs] = useState<string>('');
    const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);
    const [status, setStatus] = useState<string>('Unknown');
    const [data, setData] = useState<{ [date: string]: number }>({});

    const getData = async () => {
        try {
            const res = await apiGet(API_ROUTES.GET_CONTROL_PLANE_STATUS, {}, 'AUTH TOKEN...');
            if (!res) {
                setStatus('Unavailable');
                return;
            }
            const status = res as ControlPlaneStatus;
            setLogs(status.containerLog || '');
            setLastHeartbeat(status.lastHeartbeat || 0);
            const pastNDays: { [date: string]: number } = {};
            for (const incident of status.incidents) {
                const incidentEndedOnDate = new Date(incident.to);

                // go through each day from the incident start to end, and increment the count for that day
                const currentDay = new Date(incident.from);
                while (currentDay <= incidentEndedOnDate) {
                    const dayKey = currentDay.toISOString().split('T')[0];
                    pastNDays[dayKey] = (pastNDays[dayKey] || 0) + 1000 * 60 * 60 * 24; // add the full day in ms
                    currentDay.setDate(currentDay.getDate() + 1);
                }
                // subtract the extra time added for start of the start day before the incident started, and the extra time added for the end of the end day after the incident ended
                const startDayKey = new Date(incident.from).toISOString().split('T')[0];
                const endDayKey = new Date(incident.to).toISOString().split('T')[0];
                pastNDays[startDayKey] -= incident.from - new Date(startDayKey).getTime();
                pastNDays[endDayKey] -= new Date(endDayKey).getTime() + 1000 * 60 * 60 * 24 - incident.to;
            }
            setData(pastNDays);
            setStatus('OK');
        } catch (error) {
            console.error('Error fetching control plane status:', error);
        }
    };

    useEffect(() => {
        getData();
        const interval = setInterval(getData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Stack>
            <Text
                size="lg"
                color="dimmed"
            >
                Last Heartbeat: {lastHeartbeat ? new Date(lastHeartbeat).toLocaleString() : 'Never'}
            </Text>
            <Group>
                <Title order={2}>Control Plane Status: {status}</Title>
            </Group>
            <Heatmap
                startDate={new Date(new Date().setDate(new Date().getDate() - 90)).toLocaleDateString()}
                endDate={new Date().toLocaleDateString()}
                withTooltip
                getTooltipLabel={({ date, value }) => {
                    const newDate = new Date(date);
                    return `${newDate.toLocaleDateString()} - ${value ? `${Math.round((value / 1000 / 60) * 100) / 100} mins` : 'No Outages'}`;
                }}
                data={data}
                colors={['var(--mantine-color-red-4)', 'var(--mantine-color-red-6)', 'var(--mantine-color-red-7)', 'var(--mantine-color-red-9)']}
            />
            <Code block>{logs}</Code>
        </Stack>
    );
};

export default ControlPlaneStatusPage;

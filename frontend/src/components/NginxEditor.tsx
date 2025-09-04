import { ActionIcon, Button, Group, Stack, Title, Text, Switch, Textarea, TextInput, Menu, Tooltip, Fieldset, Space, NumberInput, Select, Chip, Badge, Divider } from '@mantine/core';
import { ConfigLocation, NginxConfigLocationType, Project, ProjectNginxConfig } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { MdOutlineArrowCircleRight, MdOutlineCode, MdOutlineComputer, MdOutlineDelete, MdOutlineDns, MdOutlineHardware, MdOutlineHttp, MdOutlineLink, MdOutlineNewspaper, MdOutlinePages, MdOutlineStorage, MdOutlineTextFields, MdOutlineWeb } from 'react-icons/md';

interface NginxEditorProps {
    current: ProjectNginxConfig;
    onSave: (config: ProjectNginxConfig) => void;
    project: Project;
}
export const NginxEditor = (props: NginxEditorProps) => {
    const [config, setConfig] = useState<ProjectNginxConfig>(JSON.parse(JSON.stringify(props.current)));

    useEffect(() => {
        const json = JSON.stringify(props.current);
        const curr = JSON.stringify(config);
        if (json !== curr) setConfig(JSON.parse(json));
    }, [props.current]);

    useEffect(() => {
        const oldConfig = JSON.stringify(props.current);
        const newConfig = JSON.stringify(config);
        if (oldConfig !== newConfig) {
            props.onSave(JSON.parse(newConfig));
        }
    }, [config]);

    const handleAddServer = () => {
        const maxIndex = config.servers.reduce((max, srv) => (srv.index > max ? srv.index : max), 0);
        const newServer: ProjectNginxConfig['servers'][number] = {
            serverId: crypto.randomUUID(),
            index: maxIndex + 1,
            domain: '',
            wildcardSubdomain: false,
            locations: [],
        };
        setConfig({ ...config, servers: [...config.servers, newServer] });
    };

    const handleAddLocation = (serverIndex: number, locationType: NginxConfigLocationType) => {
        let newLocation: ConfigLocation;
        const maxIndex = config.servers[serverIndex].locations.reduce((max, loc) => (loc.index > max ? loc.index : max), 0);
        switch (locationType) {
            case NginxConfigLocationType.STATIC:
                newLocation = {
                    locationId: crypto.randomUUID(),
                    index: maxIndex + 1,
                    type: NginxConfigLocationType.STATIC,
                    path: '/',
                    serveDir: '',
                    spa: false,
                    explicitCors: false,
                };
                break;
            case NginxConfigLocationType.PROXY:
                newLocation = {
                    locationId: crypto.randomUUID(),
                    index: maxIndex + 1,
                    type: NginxConfigLocationType.PROXY,
                    path: '/',
                    proxyPass: '',
                    timeout: undefined,
                    maxClientBodySizeMb: undefined,
                    websocketSupport: false,
                    replications: 1,
                };
                break;
            case NginxConfigLocationType.REDIRECT:
                newLocation = {
                    locationId: crypto.randomUUID(),
                    index: maxIndex + 1,
                    type: NginxConfigLocationType.REDIRECT,
                    path: '/',
                    target: '',
                };
                break;
            case NginxConfigLocationType.CUSTOM:
                newLocation = {
                    locationId: crypto.randomUUID(),
                    index: maxIndex + 1,
                    type: NginxConfigLocationType.CUSTOM,
                    path: '/',
                    content: '',
                };
        }
        setConfig((prevConfig) => ({
            ...prevConfig,
            servers: prevConfig.servers.map((srv, idx) => (idx === serverIndex ? { ...srv, locations: [...srv.locations, newLocation] } : srv)),
        }));
    };

    const handleRemoveLocation = (serverId: string, locationId: string) => {
        setConfig((prevConfig) => ({
            ...prevConfig,
            servers: prevConfig.servers.map((srv) => (srv.serverId === serverId ? { ...srv, locations: srv.locations.filter((loc) => loc.locationId !== locationId) } : srv)),
        }));
    };

    const handleRemoveServer = (serverId: string) => {
        setConfig((prevConfig) => ({
            ...prevConfig,
            servers: prevConfig.servers.filter((srv) => srv.serverId !== serverId),
        }));
    };

    const MenuItems = {
        [NginxConfigLocationType.CUSTOM]: { icon: MdOutlineCode, desc: 'Custom location block', title: 'Custom NGINX Block' },
        [NginxConfigLocationType.REDIRECT]: { icon: MdOutlineLink, desc: 'Redirect requests to another URL', title: 'Redirect Link' },
        [NginxConfigLocationType.PROXY]: { icon: MdOutlineDns, desc: 'Proxy requests to another server', title: 'API Service' },
        [NginxConfigLocationType.STATIC]: { icon: MdOutlineWeb, desc: 'Serve static files from a directory', title: 'Static Page' },
    };

    const duplicateDomain = config.servers.map((srv) => srv.domain).find((domain, idx, arr) => arr.indexOf(domain) !== idx);
    return (
        <Stack>
            <Title order={5}>Domain Configuration</Title>
            {config.servers.map((server, serverIndex) => {
                const duplicatePath = server.locations.map((loc) => loc.path).find((path, idx, arr) => arr.indexOf(path) !== idx);
                return (
                    <Fieldset key={server.serverId}>
                        <Title order={5}>{`Domain ${String.fromCharCode(64 + server.index)}`}</Title>
                        <Group
                            justify="space-between"
                            align="flex-end"
                            gap="xl"
                        >
                            <Group>
                                <TextInput
                                    required
                                    label="Domain"
                                    placeholder="nsm.mosaiq.dev"
                                    value={server.domain}
                                    onChange={(event) => {
                                        const newServers = [...config.servers];
                                        newServers[serverIndex].domain = event.currentTarget.value;
                                        setConfig({ ...config, servers: newServers });
                                    }}
                                    error={duplicateDomain === server.domain ? 'Duplicate Domain' : undefined}
                                />
                                <Switch
                                    label="Wildcard"
                                    description={`Capture all subdomains? ( *.${server.domain} -> ${server.domain} )`}
                                    checked={server.wildcardSubdomain}
                                    onChange={(event) => {
                                        const newServers = [...config.servers];
                                        newServers[serverIndex].wildcardSubdomain = event.currentTarget.checked;
                                        setConfig({ ...config, servers: newServers });
                                    }}
                                />
                            </Group>
                            <Tooltip label={`Remove Domain ${String.fromCharCode(64 + server.index)}`}>
                                <ActionIcon
                                    onClick={() => handleRemoveServer(server.serverId)}
                                    variant="light"
                                    color="red"
                                    size={'input-sm'}
                                >
                                    <MdOutlineDelete />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                        <Space h="md" />
                        <Text>Resources:</Text>
                        <Space h="xs" />
                        <Group
                            wrap="wrap"
                            align="flex-start"
                        >
                            {server.locations.map((location, locationIndex) => {
                                return (
                                    <Fieldset key={location.locationId}>
                                        <Stack
                                            w="300px"
                                            gap="xs"
                                        >
                                            <Group
                                                justify="space-between"
                                                align="center"
                                            >
                                                <Group>
                                                    <Title order={5}>{`${String.fromCharCode(64 + server.index)}${location.index}`}</Title>
                                                    <Badge
                                                        leftSection={MenuItems[location.type].icon({ size: 14 })}
                                                        variant="outline"
                                                    >
                                                        {MenuItems[location.type].title}
                                                    </Badge>
                                                </Group>
                                                <Tooltip label={`Remove ${MenuItems[location.type].title} ${String.fromCharCode(64 + server.index)}${location.index}`}>
                                                    <ActionIcon
                                                        onClick={() => handleRemoveLocation(server.serverId, location.locationId)}
                                                        variant="light"
                                                        color="red"
                                                        size={'input-xs'}
                                                    >
                                                        <MdOutlineDelete />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                            <RenderLocation
                                                location={location}
                                                domain={server.domain}
                                                onChange={(updatedLocation) => {
                                                    setConfig((prevConfig) => {
                                                        const newLocations = [...prevConfig.servers[serverIndex].locations];
                                                        newLocations[locationIndex] = updatedLocation;
                                                        const newServers = [...prevConfig.servers];
                                                        newServers[serverIndex].locations = newLocations;
                                                        return { ...prevConfig, servers: newServers };
                                                    });
                                                }}
                                                duplicatePath={duplicatePath === location.path}
                                            />
                                        </Stack>
                                    </Fieldset>
                                );
                            })}
                            <Menu
                                withArrow
                                shadow="md"
                                trigger={'hover'}
                            >
                                <Menu.Target>
                                    <Button
                                        variant="light"
                                        w="min-content"
                                        size="compact-sm"
                                    >
                                        Add Resource
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Stack p="xs">
                                        {Object.entries(MenuItems).map(([key, value]) => (
                                            <Menu.Item
                                                key={key}
                                                leftSection={<value.icon size={24} />}
                                                onClick={() => handleAddLocation(serverIndex, key as NginxConfigLocationType)}
                                            >
                                                <Title order={6}>{MenuItems[key].title}</Title>
                                                <Text fz=".75rem">{value.desc}</Text>
                                            </Menu.Item>
                                        ))}
                                    </Stack>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Fieldset>
                );
            })}
            <Button
                onClick={handleAddServer}
                w="min-content"
                disabled={config.servers.length >= 26}
            >
                Add a Domain
            </Button>
        </Stack>
    );
};

interface RenderLocationProps {
    location: ConfigLocation;
    domain: string;
    onChange: (location: ConfigLocation) => void;
    duplicatePath: boolean;
}

const RenderLocation = (props: RenderLocationProps) => {
    if (props.location.type === NginxConfigLocationType.STATIC) {
        return (
            <>
                <TextInput
                    required
                    value={props.location.path}
                    label="Path"
                    placeholder="/"
                    description={props.domain && props.location.path.startsWith('/') ? `https://${props.domain}${props.location.path}` : ''}
                    onChange={(e) => props.location.type === NginxConfigLocationType.STATIC && props.onChange({ ...props.location, path: e.currentTarget.value })}
                    error={props.duplicatePath ? 'Duplicate Path' : undefined}
                />
                <Switch
                    label="Single Page Application"
                    description="Serve index.html for all non-file requests"
                    checked={!!props.location.spa}
                    onChange={(e) => props.location.type === NginxConfigLocationType.STATIC && props.onChange({ ...props.location, spa: e.currentTarget.checked })}
                />
                <Switch
                    label="Force Allow CORS"
                    description="Explicitly allow CORS for this location. Use with caution."
                    checked={!!props.location.explicitCors}
                    onChange={(e) => props.location.type === NginxConfigLocationType.STATIC && props.onChange({ ...props.location, explicitCors: e.currentTarget.checked })}
                />
            </>
        );
    }
    if (props.location.type === NginxConfigLocationType.PROXY) {
        return (
            <>
                <TextInput
                    required
                    value={props.location.path}
                    label="Path"
                    placeholder="/"
                    description={props.domain && props.location.path.startsWith('/') ? `https://${props.domain}${props.location.path}` : ''}
                    onChange={(e) => props.location.type === NginxConfigLocationType.PROXY && props.onChange({ ...props.location, path: e.currentTarget.value })}
                    error={props.duplicatePath ? 'Duplicate Path' : undefined}
                />
                <NumberInput
                    value={props.location.timeout}
                    label="Timeout (ms)"
                    placeholder="60sec default"
                    min={0}
                    max={1000 * 60 * 60}
                    description="The timeout for the proxy connection."
                    onChange={(e) => {
                        if (props.location.type !== NginxConfigLocationType.PROXY) return;
                        if (e === '') {
                            props.onChange({ ...props.location, timeout: undefined });
                            return;
                        }
                        const value = Number(e);
                        if (!isNaN(value)) {
                            props.onChange({ ...props.location, timeout: value });
                        }
                    }}
                />
                <NumberInput
                    value={props.location.maxClientBodySizeMb}
                    label="Max Client Body Size (MB)"
                    min={0}
                    max={1000 * 1000}
                    placeholder="10mb default"
                    description="The maximum allowed size of the client request body."
                    onChange={(e) => {
                        if (props.location.type !== NginxConfigLocationType.PROXY) return;
                        if (e === '') {
                            props.onChange({ ...props.location, maxClientBodySizeMb: undefined });
                            return;
                        }
                        const value = Number(e);
                        if (!isNaN(value)) {
                            props.onChange({ ...props.location, maxClientBodySizeMb: value });
                        }
                    }}
                />
                {/* <NumberInput
                    value={props.location.replications}
                    label="Replications"
                    min={1}
                    max={5}
                    placeholder="1 default"
                    description="Amount of replicas per worker node."
                    onChange={(e) => {
                        if (props.location.type !== NginxConfigLocationType.PROXY) return;
                        if (e === '') {
                            props.onChange({ ...props.location, replications: undefined });
                            return;
                        }
                        const value = Number(e);
                        if (!isNaN(value)) {
                            props.onChange({ ...props.location, replications: value });
                        }
                    }}
                /> */}
                {/* <Text
                    fz=".75rem"
                    c="dimmed"
                    mt="-xs"
                    pl="xs"
                >{`${props.location.replications ?? 1} replicas x ${props.workerNodes} workers = ${(props.location.replications ?? 1) * props.workerNodes} total instances of the service`}</Text> */}
                <Switch
                    label="Support WebSockets"
                    checked={!!props.location.websocketSupport}
                    onChange={(e) => props.location.type === NginxConfigLocationType.PROXY && props.onChange({ ...props.location, websocketSupport: e.currentTarget.checked })}
                />
            </>
        );
    }
    if (props.location.type === NginxConfigLocationType.REDIRECT) {
        return (
            <>
                <TextInput
                    required
                    value={props.location.path}
                    label="Path"
                    placeholder="/"
                    description={props.domain && props.location.path.startsWith('/') ? `https://${props.domain}${props.location.path}` : ''}
                    onChange={(e) => props.location.type === NginxConfigLocationType.REDIRECT && props.onChange({ ...props.location, path: e.currentTarget.value })}
                    error={props.duplicatePath ? 'Duplicate Path' : undefined}
                />
                <TextInput
                    required
                    value={props.location.target}
                    label="Redirects To"
                    placeholder="https://example.com"
                    onChange={(e) => props.location.type === NginxConfigLocationType.REDIRECT && props.onChange({ ...props.location, target: e.currentTarget.value })}
                />
            </>
        );
    }
    if (props.location.type === NginxConfigLocationType.CUSTOM) {
        return (
            <>
                <TextInput
                    required
                    value={props.location.path}
                    label="Path"
                    placeholder="/"
                    description={props.domain && props.location.path.startsWith('/') ? `https://${props.domain}${props.location.path}` : ''}
                    onChange={(e) => props.location.type === NginxConfigLocationType.CUSTOM && props.onChange({ ...props.location, path: e.currentTarget.value })}
                    error={props.duplicatePath ? 'Duplicate Path' : undefined}
                />
                <Textarea
                    required
                    value={props.location.content}
                    label="Content"
                    description="Location scope directives"
                    placeholder={`proxy_pass http://localhost:3000;`}
                    onChange={(e) => props.location.type === NginxConfigLocationType.CUSTOM && props.onChange({ ...props.location, content: e.currentTarget.value })}
                />
            </>
        );
    }
};

const pascalCase = (str: string) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toUpperCase() : match.toLowerCase())).replace(/\s+/g, '');
};

import { ActionIcon, Button, Group, Stack, Title, Text, Switch, Textarea, TextInput, Menu, Tooltip, Fieldset, Space, NumberInput, Select } from '@mantine/core';
import { ConfigLocation, NginxConfigLocationType, Project, ProjectNginxConfig } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { MdOutlineArrowCircleRight, MdOutlineCode, MdOutlineComputer, MdOutlineDelete, MdOutlineHardware, MdOutlineHttp, MdOutlineLink, MdOutlineNewspaper, MdOutlinePages, MdOutlineTextFields } from 'react-icons/md';

interface NginxEditorProps {
    current: ProjectNginxConfig;
    onSave: (config: ProjectNginxConfig) => void;
}
export const NginxEditor = (props: NginxEditorProps) => {
    const [config, setConfig] = useState<ProjectNginxConfig>(props.current);

    useEffect(() => {
        setConfig(props.current);
    }, [props.current]);

    const handleSave = () => {
        props.onSave(config);
    };

    const handleAddServer = () => {
        const newServer: ProjectNginxConfig['servers'][number] = {
            domain: '',
            wildcardSubdomain: false,
            locations: [],
        };
        setConfig({ ...config, servers: [...config.servers, newServer] });
    };

    const handleAddLocation = (serverIndex: number, locationType: NginxConfigLocationType) => {
        let newLocation: ConfigLocation;
        switch (locationType) {
            case NginxConfigLocationType.STATIC:
                newLocation = {
                    type: NginxConfigLocationType.STATIC,
                    path: '/',
                    serveDir: '',
                    spa: false,
                    explicitCors: false,
                };
                break;
            case NginxConfigLocationType.PROXY:
                newLocation = {
                    type: NginxConfigLocationType.PROXY,
                    path: '/',
                    proxyPass: '',
                    timeout: undefined,
                    maxClientBodySizeMb: undefined,
                    websocketSupport: false,
                };
                break;
            case NginxConfigLocationType.REDIRECT:
                newLocation = {
                    type: NginxConfigLocationType.REDIRECT,
                    path: '/',
                    target: '',
                };
                break;
            case NginxConfigLocationType.CUSTOM:
                newLocation = {
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

    const handleRemoveLocation = (serverIndex: number, locationIndex: number) => {
        setConfig((prevConfig) => ({
            ...prevConfig,
            servers: prevConfig.servers.map((srv, idx) => (idx === serverIndex ? { ...srv, locations: srv.locations.filter((_, locIdx) => locIdx !== locationIndex) } : srv)),
        }));
    };

    const handleRemoveServer = (serverIndex: number) => {
        setConfig((prevConfig) => ({
            ...prevConfig,
            servers: prevConfig.servers.filter((_, idx) => idx !== serverIndex),
        }));
    };

    const MenuItems = {
        [NginxConfigLocationType.CUSTOM]: { icon: MdOutlineCode, desc: 'Custom location block', title: 'Custom NGINX Block' },
        [NginxConfigLocationType.REDIRECT]: { icon: MdOutlineLink, desc: 'Redirect requests to another URL', title: 'Redirect Link' },
        [NginxConfigLocationType.PROXY]: { icon: MdOutlineHttp, desc: 'Proxy requests to another server', title: 'API Service' },
        [NginxConfigLocationType.STATIC]: { icon: MdOutlineNewspaper, desc: 'Serve static files from a directory', title: 'Static Page' },
    };

    const duplicateDomain = config.servers.map((srv) => srv.domain).find((domain, idx, arr) => arr.indexOf(domain) !== idx);
    return (
        <Stack>
            {config.servers.map((server, serverIndex) => {
                const duplicatePath = server.locations.map((loc) => loc.path).find((path, idx, arr) => arr.indexOf(path) !== idx);
                return (
                    <Fieldset key={serverIndex}>
                        <Group
                            align="flex-end"
                            gap="xl"
                        >
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
                            <Tooltip label="Remove Server Block">
                                <ActionIcon
                                    onClick={() => handleRemoveServer(serverIndex)}
                                    variant="subtle"
                                    color="red"
                                    size={'input-sm'}
                                >
                                    <MdOutlineDelete />
                                </ActionIcon>
                            </Tooltip>
                            <Switch
                                label="Wildcard"
                                description={`Route all subdomains to this server? ( *.${server.domain} ==> ${server.domain} )`}
                                checked={server.wildcardSubdomain}
                                onChange={(event) => {
                                    const newServers = [...config.servers];
                                    newServers[serverIndex].wildcardSubdomain = event.currentTarget.checked;
                                    setConfig({ ...config, servers: newServers });
                                }}
                            />
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
                                    <Fieldset key={locationIndex}>
                                        <Stack
                                            w="300px"
                                            gap="xs"
                                        >
                                            <Group>
                                                <Title order={6}>{MenuItems[location.type].title}</Title>
                                                <Tooltip label={`Remove ${MenuItems[location.type].title}`}>
                                                    <ActionIcon
                                                        onClick={() => handleRemoveLocation(serverIndex, locationIndex)}
                                                        variant="subtle"
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
                                                    const newLocations = [...server.locations];
                                                    newLocations[locationIndex] = updatedLocation;
                                                    const newServers = [...config.servers];
                                                    newServers[serverIndex].locations = newLocations;
                                                    setConfig({ ...config, servers: newServers });
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
            >
                Add a Domain
            </Button>
            <Button
                onClick={handleSave}
                w="min-content"
            >
                Save Configuration
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
                    placeholder="60000"
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
                    placeholder="10"
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
                <Switch
                    label="Support WebSocket"
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
                    error={props.duplicatePath}
                />
                <Textarea
                    required
                    value={props.location.content}
                    label="Content"
                    description="Location scope directives"
                    placeholder={`proxy_pass http://localhost:3000;`}
                    onChange={(e) => props.location.type === NginxConfigLocationType.CUSTOM && props.onChange({ ...props.location, content: e.currentTarget.value })}
                    error={props.duplicatePath ? 'Duplicate Path' : undefined}
                />
            </>
        );
    }
};

const pascalCase = (str: string) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toUpperCase() : match.toLowerCase())).replace(/\s+/g, '');
};

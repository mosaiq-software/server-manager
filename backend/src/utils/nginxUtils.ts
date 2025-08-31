import { execSafe } from './execUtils';
import * as fs from 'fs/promises';

// const getNginxConf = async (confPath: string): Promise<string> => {
//     // if (process.env.PRODUCTION !== 'true') {
//     //     console.log('Not in production mode, skipping Nginx config retrieval');
//     //     return '';
//     // }

//     try {
//         const fileContents = await fs.readFile(confPath, 'utf-8');
//         return fileContents;
//     } catch (error) {
//         console.error('Error reading Nginx config file:', error);
//         return '';
//     }
// };

// const listAllNginxConfs = async (nginxConfDir: string): Promise<string[]> => {
//     try {
//         const files = await fs.readdir(nginxConfDir);
//         return files.filter((file) => file.endsWith('.conf'));
//     } catch (error) {
//         console.error('Error reading Nginx config directory:', error);
//         return [];
//     }
// };

// interface NginxConfig {
//     servers: {
//         server_name: string[];
//         client_max_body_size: string | undefined;
//         listen: number;
//         ssl_certificate: string | undefined;
//         ssl_certificate_key: string | undefined;
//         include: string | undefined;
//         ssl_dhparam: string | undefined;
//         return: number | undefined;
//         locations: {
//             path: string;

//             // For static files
//             root: string;
//             index: string | undefined;
//             try_files: string | undefined;
//             expires: 0 | undefined;
//             add_header: { name: string; value: string; always: boolean }[];

//             // For proxy
//             proxy_pass: string | undefined;
//             proxy_set_header: { name: string; value: string }[];
//             proxy_connect_timeout: number | undefined;
//             proxy_send_timeout: number | undefined;
//             proxy_read_timeout: number | undefined;
//             send_timeout: number | undefined;
//             proxy_http_version: string | undefined;
//         }[];
//     }[];
// }

// interface NaiveBlock {
//     header: string;
//     lines: string[];
//     childBlocks: NaiveBlock[];
// }
// const parseNginxConf = (conf: string) => {
//     // Clean up the config
//     conf = conf.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
//     const lines = conf.split('\n');
//     const linesNoComments = lines.map((line) => line.split('#')[0]).filter((line) => line.trim() !== '');
//     const trimmedLines = linesNoComments.map((line) => line.trim());

//     // Parse the hierarchical structure
//     const blockStack: NaiveBlock[] = [{ header: '', lines: [], childBlocks: [] }];
//     for (let i = 0; i < trimmedLines.length; i++) {
//         const line = trimmedLines[i];
//         if (line.endsWith(';')) {
//             blockStack[blockStack.length - 1].lines.push(formatDirective(line));
//             continue;
//         }
//         if (line.endsWith('{')) {
//             blockStack.push({
//                 header: formatHeader(line.split('{')[0].trim()),
//                 lines: [],
//                 childBlocks: [],
//             });
//             continue;
//         }
//         if (line.endsWith('}')) {
//             const last = blockStack.pop();
//             if (last && blockStack.length > 0) {
//                 blockStack[blockStack.length - 1].childBlocks.push(last);
//             }
//             continue;
//         }
//         throw new Error(`Unexpected line: ${line}`);
//     }
//     const blocks = blockStack[0].childBlocks;

//     console.log('Parsed Nginx config:', JSON.stringify(blocks, null, 2));
// };

// const formatHeader = (header: string) => {
//     if (header.startsWith('server')) {
//         return {
//             type: 'server',
//         };
//     }
//     if (header.startsWith('location')) {
//         return {
//             type: 'location',
//             path: header.split(' ')[1],
//         };
//     }
//     if (header.startsWith('if')) {
//         return {
//             type: 'if',
//             condition: header
//                 .trim()
//                 .replace(/^if\s*\((.*)\)$/, '$1')
//                 .trim(),
//         };
//     }
//     return header;
// };

// const formatDirective = (directive: string) => {
//     directive = directive.replace(/;$/, '').trim();
//     // preserve any strings in '' or ""
//     const preserveStrings = (str: string) => {
//         return str.replace(/(['"])(.*?)\1/g, (match, p1, p2) => {
//             return p1 + p2.replace(/_/g, '-').toLowerCase() + p1;
//         });
//     };
//     return {
//         name: preserveStrings(directive.split(' ')[0]),
//         args: directive.split(' ').slice(1).map(preserveStrings),
//     };
// };

const getStaticLocation = (path: string, conf: StaticConfigLocation) => {
    const explicitCorsString = conf.explicitCors
        ? `
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;`
        : '';

    if (conf.spa) {
        return `
    location / {
        ${explicitCorsString}
        root ${conf.serveDir};
        index unresolvable-file-html.html;
        try_files $uri @index;
    }
    location @index {
        root ${conf.serveDir};
        add_header Cache-Control no-cache;
        expires 0;
        try_files /index.html =404;
    }`;
    } else {
        return `
    location ${path} {
        ${explicitCorsString}
        root ${conf.serveDir};
    }`;
    }
};

const getProxyLocation = (path: string, conf: ProxyConfigLocation) => {
    const timeoutString = conf.timeout
        ? `
        proxy_connect_timeout       ${conf.timeout};
        proxy_send_timeout          ${conf.timeout};
        proxy_read_timeout          ${conf.timeout};
        send_timeout                ${conf.timeout};`
        : '';

    const websocketSupportString = conf.websocketSupport
        ? `
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";`
        : '';

    const clientBodySizeString = conf.maxClientBodySizeMb ? `client_max_body_size ${conf.maxClientBodySizeMb}M;` : '';

    return `
    location ${path} {
        proxy_pass ${conf.proxyPass};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Scheme $scheme;
        ${timeoutString}
        ${websocketSupportString}
        ${clientBodySizeString}
    }`;
};

const getRedirectLocation = (path: string, conf: RedirectConfigLocation) => {
    return `
    location ${path} {
        return 302 ${conf.target};
    }`;
};

const getCustomLocation = (path: string, conf: CustomConfigLocation) => {
    return `
    location ${path} {
        ${conf.content}
    }`;
};

const get301Redirect = (host: string) => {
    return `
    if ($host = ${host}) {
        return 301 https://$host$request_uri;
    }`;
};

const getServerName = (hostnames: string[]) => {
    return `server_name ${hostnames.join(' ')};`;
};

const getSslDirectives = (hostname: string) => {
    return `
    ssl_certificate /etc/letsencrypt/live/${hostname}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${hostname}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;`;
};

const get80Server = (hostnames: string[]) => {
    return `
server {
    ${hostnames.map((h) => get301Redirect(h)).join('\n')}
    ${getServerName(hostnames)}
    listen 80;
    return 404;
}`;
};

const get443Server = (hostnames: string[], locations: string[]) => {
    return `
server {
    ${getServerName(hostnames)}
    listen 443 ssl;
    ${getSslDirectives(hostnames[0])}
    ${locations.join('\n')}
}`;
};

export interface StaticConfigLocation {
    type: 'static';
    path: string;
    serveDir: string;
    spa: boolean;
    explicitCors: boolean;
}
export interface ProxyConfigLocation {
    type: 'proxy';
    path: string;
    proxyPass: string;
    websocketSupport: boolean;
    timeout?: number;
    maxClientBodySizeMb?: string;
}
export interface RedirectConfigLocation {
    type: 'redirect';
    path: string;
    target: string;
}
export interface CustomConfigLocation {
    type: 'custom';
    path: string;
    content: string;
}
export interface ServerConfig {
    domain: string;
    wildcardSubdomain: boolean;
    locations: (StaticConfigLocation | ProxyConfigLocation | RedirectConfigLocation | CustomConfigLocation)[];
}

export interface ProjectNginxConfig {
    servers: ServerConfig[];
}

// https://www.digitalocean.com/community/tutorials/understanding-nginx-server-and-location-block-selection-algorithms#parsing-the-server_name-directive-to-choose-a-match
export const getConf = (project: ProjectNginxConfig) => {
    const servers: string[] = [];
    for (const server of project.servers) {
        const hostnames = server.wildcardSubdomain ? [server.domain, `*.${server.domain}`] : [server.domain];
        const server80 = get80Server(hostnames);
        servers.push(server80);
        const locations: string[] = [];
        for (const location of server.locations) {
            switch (location.type) {
                case 'static':
                    locations.push(getStaticLocation(location.path, location));
                    break;
                case 'proxy':
                    locations.push(getProxyLocation(location.path, location));
                    break;
                case 'redirect':
                    locations.push(getRedirectLocation(location.path, location));
                    break;
                case 'custom':
                    locations.push(getCustomLocation(location.path, location));
                    break;
                default:
                    throw new Error(`Unknown location type: ${(location as any).type}`);
            }
        }
        const server443 = get443Server(hostnames, locations);
        servers.push(server443);
    }

    return `
# Generated by the Node Server Manager ${new Date().toISOString()}
${servers.join('\n')}
`;
};

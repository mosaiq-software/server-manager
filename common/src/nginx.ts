import { StaticConfigLocation, ProxyConfigLocation, RedirectConfigLocation, CustomConfigLocation } from './types';

export const getStaticLocation = (conf: StaticConfigLocation) => {
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
    location ${conf.path} {
        ${explicitCorsString}
        root ${conf.serveDir};
    }`;
    }
};

export const getProxyLocation = (conf: ProxyConfigLocation) => {
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
    location ${conf.path} {
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

export const getRedirectLocation = (conf: RedirectConfigLocation) => {
    return `
    location ${conf.path} {
        return 302 ${conf.target};
    }`;
};

export const getCustomLocation = (conf: CustomConfigLocation) => {
    return `
    location ${conf.path} {
        ${conf.content}
    }`;
};

export const get301Redirect = (host: string) => {
    return `
    if ($host = ${host}) {
        return 301 https://$host$request_uri;
    }`;
};

export const getServerName = (hostnames: string[]) => {
    return `server_name ${hostnames.join(' ')};`;
};

export const getSslDirectives = (hostname: string) => {
    return `
    ssl_certificate /etc/letsencrypt/live/${hostname}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${hostname}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;`;
};

export const get80Server = (hostnames: string[]) => {
    return `
server {
    ${hostnames.map((h) => get301Redirect(h)).join('\n')}
    ${getServerName(hostnames)}
    listen 80;
    return 404;
}`;
};

export const get443Server = (hostnames: string[], locations: string[]) => {
    return `
server {
    ${getServerName(hostnames)}
    listen 443 ssl;
    ${getSslDirectives(hostnames[0])}
    ${locations.join('\n')}
}`;
};

export const getUpstreamServerBlock = (group: string, servers: string[]) => {
    return `
upstream ${group} {
    ${servers.map((s) => `server ${s};`).join('\n    ')}
}`;
};

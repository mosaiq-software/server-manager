export const setFavicon = (url: string) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        // @ts-expect-error - TypeScript doesn't recognize the 'rel' property on HTMLLinkElement
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    // @ts-expect-error - TypeScript doesn't recognize the 'href' property on HTMLLinkElement
    link.href = url;
};
export const resetFavicon = () => {
    setFavicon('/favicon.ico');
};

export const setTitle = (title: string) => {
    document.title = title;
};

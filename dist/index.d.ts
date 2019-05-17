interface ShareOptions {
    title?: string;
    desc?: string;
    link?: string;
    shareImg?: string;
}
declare const Share: (
    options: ShareOptions
) => Promise<{
    env?: string | undefined;
    errMsg: string;
}>;
export { ShareOptions, Share };

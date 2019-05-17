import { loadScript } from "./utils";

/**
 * 分享参数
 * @description 参数可以不填,但是不能未null
 */
interface ShareOptions {
    /**
     * 分享标题
     */
    title?: string;
    /**
     * 分享描述
     */
    desc?: string;
    /**
     * 分享链接
     */
    link?: string;
    /**
     * 分享图片url
     */
    shareImg?: string;
}
/**
 * 获取当前浏览器环境
 */
const UA: string = navigator.userAgent;
const isIpad: boolean = /(iPad).*OS\s([\d_]+)/.test(UA);
const isIpod: boolean = /(iPod)(.*OS\s([\d_]+))?/.test(UA);
const isIphone: boolean = !isIpad && /(iPhone\sOS)\s([\d_]+)/.test(UA);
const isIos: boolean = isIpad || isIpod || isIphone;
const isAndroid = /(Android);?[\s\/]+([\d.]+)?/.test(UA);
const isWechat = /micromessenger/i.test(UA);
const isQQ = /QQ\/([\d\.]+)/.test(UA);
const isQQMBrowser = /MQQBrowser/i.test(UA) && !isWechat && !isQQ;
const isUCMBrowser = /UCBrowser/i.test(UA);
const isBaiduMBrowser = /mobile.*baidubrowser/i.test(UA);
const isSogouMBrowser = /SogouMobileBrowser/i.test(UA);
/**
 * 移动端分享工具
 *
 * @description
 *  1. 重写navtiveShare,调用浏览器默认分享组件.(其他方法放弃)
 *  2. 会覆盖浏览器原生标签,如标题,<meta name='description'>,<link type='icon'>
 *  3. success() or fail() 回调不一定会执行,如果要执行Promise 回调的话,尝试调用 Promise.finally()
 * @param options
 */
const Share = (
    options: ShareOptions
): Promise<{
    env?: string;
    errMsg: string;
}> => {
    return new Promise((resolve, reject) => {
        // 合并分享内容(这一步是多余的,复制的完了才发觉,留着吧,影响不大.)
        let params = Object.assign({}, options, {
            success() {
                resolve({
                    errMsg: "分享成功"
                });
            },
            fail() {
                reject({
                    errMsg: "分享失败"
                });
            }
        });
        // update
        if (params.title) {
            document.title = params.title;
        }
        let descriptionTag = document.querySelector("meta[name=description]");
        if (params.desc) {
            if (descriptionTag && descriptionTag != null) {
                // change content
                descriptionTag.setAttribute("content", params.desc);
            } else {
                // add meta
                document.head.insertAdjacentHTML(
                    "beforeend",
                    `<meta name="description" content="${params.desc}">`
                );
            }
        } else if (descriptionTag && descriptionTag != null) {
            // 如果 入参没有 描述的话,尝试获取meta标签描述覆盖
            params.desc = `${descriptionTag.getAttribute("content")}`;
        }
        let iconTag = document.querySelector("link[rel*=icon]");
        if (params.shareImg) {
            if (iconTag && iconTag != null) {
                // change icon
                iconTag.setAttribute("href", params.shareImg);
            } else {
                // add icon link
                document.head.insertAdjacentHTML(
                    "beforeend",
                    `<link rel="shortcut icon" href="${params.shareImg}">`
                );
            }
        } else if (iconTag && iconTag != null) {
            // 如果没有分享图标,尝试使用icon标签覆盖
            params.shareImg = `${iconTag.getAttribute("href")}`;
        }
        // 检查并补全分享链接,(此处为避免参数中没有传预留)
        if (!params.link) {
            params.link = location.href;
        }
        // 判断当前浏览器环境,调用分享组件
        switch (true) {
            case isQQMBrowser: // qq浏览器环境
                loadScript("https://jsapi.qq.com/get?api=app.share")
                    .then(() => {
                        let browserQQ = (<any>window).browser;
                        if (browserQQ) {
                            browserQQ.app.share({
                                title: params.title,
                                description: params.desc,
                                url: params.link,
                                img_url: params.shareImg
                            });
                            resolve({
                                env: "qq-brower.all",
                                errMsg: "qq浏览器分享成功"
                            });
                        } else {
                            reject({
                                env: "qq-brower.all",
                                errMsg: "qq浏览器分享失败"
                            });
                        }
                    })
                    .catch(() => {
                        reject({
                            env: "qq-brower",
                            errMsg: "qq-brower 分享调用失败,网络异常"
                        });
                    });
                break;
            case isUCMBrowser && isIos: // UC浏览器环境(IOS版)
                let ucbrowser = (<any>window).ucbrowser;
                if (ucbrowser) {
                    if (ucbrowser.web_shareEX) {
                        ucbrowser.web_shareEX(
                            JSON.stringify({
                                title: params.title,
                                content: params.desc,
                                sourceUrl: params.link,
                                imageUrl: params.shareImg
                            })
                        );
                    } else {
                        ucbrowser.web_share(
                            params.title,
                            params.desc,
                            params.link,
                            "",
                            "",
                            "",
                            params.shareImg
                        );
                    }
                    resolve({
                        env: "UC-brower.ios",
                        errMsg: "UC分享成功"
                    });
                } else {
                    reject({
                        env: "UC-brower.ios",
                        errMsg: "UC分享失败,API.ucbrowser未成功调起"
                    });
                }
                break;
            case isUCMBrowser && isAndroid: // UC浏览器环境(Android版)
                let ucwebAndroid = (<any>window).ucweb;
                if (ucwebAndroid) {
                    resolve({
                        env: "UC-brower.android",
                        errMsg: "UC分享成功"
                    });
                    ucwebAndroid.startRequest("shell.page_share", [
                        params.title,
                        params.desc,
                        params.link,
                        "",
                        "",
                        "",
                        params.shareImg
                    ]);
                } else {
                    reject({
                        env: "UC-brower.android",
                        errMsg: "UC分享失败,API.ucweb未成功调起"
                    });
                }
                break;
            case isBaiduMBrowser && isAndroid: //百度浏览器环境(Android版)
                console.warn("注意:百度的分享是重定向分享,会跳出当前页面的");
                let _flyflowNative = (<any>window)._flyflowNative;
                if (_flyflowNative) {
                    resolve({
                        env: "baidu-brower.android",
                        errMsg: "百度分享成功,先执行回调,再调用分享接口"
                    });

                    _flyflowNative.exec(
                        "bd_utils",
                        "shareWebPage",
                        JSON.stringify({
                            title: params.title,
                            content: params.desc,
                            imageurl: params.shareImg,
                            landurl: params.link,
                            shareSource: ""
                        }),
                        ""
                    );
                } else {
                    reject({
                        env: "baidu-brower.android",
                        errMsg: "百度分享失败,API._flyflowNative 未成功调起"
                    });
                }
                break;
            case isBaiduMBrowser && isIos: //百度浏览器环境(IOS版)
                console.warn(
                    "注意:百度的分享是重定向分享,会跳出当前页面的,不确保是否分享成功"
                );
                // 先把回调走了,再调用百度的分享
                resolve({
                    env: "baidu-brower.ios",
                    errMsg: "百度分享成功,先执行回调,再调用分享接口"
                });
                location.href =
                    "baidubrowserapp://bd_utils?action=shareWebPage&params=" +
                    encodeURIComponent(
                        JSON.stringify({
                            title: params.title,
                            content: params.desc,
                            imageurl: params.shareImg,
                            landurl: params.link,
                            mediaType: 0,
                            share_type: "webpage"
                        })
                    );
                break;
            case isSogouMBrowser && isIos: // 搜狗浏览器环境(IOS版)
                let SogouMseIOS = (<any>window).SogouMse
                    ? (<any>window).SogouMse
                    : null;
                if (SogouMseIOS) {
                    resolve({
                        env: "sougou1-brower.ios",
                        errMsg: "搜狗分享成功,先执行回调,再调用分享接口"
                    });
                    SogouMseIOS.Utility.shareWithInfo({
                        shareTitle: params.title,
                        shareContent: params.desc,
                        shareImageUrl: params.shareImg,
                        shareUrl: params.link
                    });
                } else {
                    reject({
                        env: "sougou-brower.ios",
                        errMsg: "搜狗分享失败,SogouMse(API)调用失败"
                    });
                }
                break;
            case isSogouMBrowser && isAndroid: // 搜狗浏览器环境(Android版) 作者源码中未进行搜狗浏览器Android版本处理,不知道是否可以实现
                reject({
                    env: "sougou-borwer.android",
                    errMsg: "暂不支持搜狗浏览器Android版本分享"
                });
                break;
            case isWechat: // 微信
                console.warn("微信分享需要实现js-sdk,需要额外实现");
                reject({
                    env: "wechat",
                    errMsg: "暂不支持微信内置浏览器分享"
                });
                break;
            case isQQ: // QQ 内置浏览器
                loadScript("https://open.mobile.qq.com/sdk/qqapi.js")
                    .then(() => {
                        // 加载完成分享api后,执行分享操作
                        let mqq = (<any>window).mqq ? (<any>window).mqq : null;
                        if (mqq) {
                            mqq.ui.setOnShareHandler((share_type: any) => {
                                mqq.ui.shareMessage(
                                    {
                                        back: true,
                                        share_type,
                                        title: document.title,
                                        desc: params.desc,
                                        share_url: (() => {
                                            if (isAndroid) {
                                                console.warn(
                                                    "提示:Android 环境下,QQ内置浏览器分享,只能分享当前url,'options.link' 将被覆盖"
                                                );
                                            }
                                            return isAndroid
                                                ? location.href
                                                : params.link;
                                        })(),
                                        image_url: params.shareImg,
                                        sourceName: ""
                                    },
                                    (data: any) => {
                                        if (data.retCode === 0) {
                                            resolve();
                                        } else {
                                            reject({
                                                env: `qq-${
                                                    isAndroid
                                                        ? "android"
                                                        : isIos
                                                        ? "ios"
                                                        : "other"
                                                }`,
                                                errMsg: `QQ.${
                                                    isIos
                                                        ? "IOS"
                                                        : isAndroid
                                                        ? "Android"
                                                        : "pc or other"
                                                }分享调用失败,请求被拒绝.`
                                            });
                                        }
                                    }
                                );
                            });
                        } else {
                            reject({
                                env: `qq-${
                                    isAndroid
                                        ? "android"
                                        : isIos
                                        ? "ios"
                                        : "other"
                                }`,
                                errMsg: `QQ.${
                                    isIos
                                        ? "IOS"
                                        : isAndroid
                                        ? "Android"
                                        : "pc or other"
                                }分享调用失败,无法调起.`
                            });
                        }
                    })
                    .catch(() => {
                        reject({
                            env: `qq-${
                                isAndroid ? "android" : isIos ? "ios" : "other"
                            }`,
                            errMsg: `QQ.${
                                isIos
                                    ? "IOS"
                                    : isAndroid
                                    ? "Android"
                                    : "pc or other"
                            }分享调用失败,网络异常.`
                        });
                    });
                break;
            default:
                reject({
                    env: null,
                    errMsg: "分享调用失败，未识别当前浏览器环境。"
                });
        }
    });
};
export { ShareOptions, Share };

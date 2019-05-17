"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const UA = navigator.userAgent;
const isIpad = /(iPad).*OS\s([\d_]+)/.test(UA);
const isIpod = /(iPod)(.*OS\s([\d_]+))?/.test(UA);
const isIphone = !isIpad && /(iPhone\sOS)\s([\d_]+)/.test(UA);
const isIos = isIpad || isIpod || isIphone;
const isAndroid = /(Android);?[\s\/]+([\d.]+)?/.test(UA);
const isWechat = /micromessenger/i.test(UA);
const isQQ = /QQ\/([\d\.]+)/.test(UA);
const isQQMBrowser = /MQQBrowser/i.test(UA) && !isWechat && !isQQ;
const isUCMBrowser = /UCBrowser/i.test(UA);
const isBaiduMBrowser = /mobile.*baidubrowser/i.test(UA);
const isSogouMBrowser = /SogouMobileBrowser/i.test(UA);
const Share = options => {
    return new Promise((resolve, reject) => {
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
        if (params.title) {
            document.title = params.title;
        }
        let descriptionTag = document.querySelector("meta[name=description]");
        if (params.desc) {
            if (descriptionTag && descriptionTag != null) {
                descriptionTag.setAttribute("content", params.desc);
            } else {
                document.head.insertAdjacentHTML(
                    "beforeend",
                    `<meta name="description" content="${params.desc}">`
                );
            }
        } else if (descriptionTag && descriptionTag != null) {
            params.desc = `${descriptionTag.getAttribute("content")}`;
        }
        let iconTag = document.querySelector("link[rel*=icon]");
        if (params.shareImg) {
            if (iconTag && iconTag != null) {
                iconTag.setAttribute("href", params.shareImg);
            } else {
                document.head.insertAdjacentHTML(
                    "beforeend",
                    `<link rel="shortcut icon" href="${params.shareImg}">`
                );
            }
        } else if (iconTag && iconTag != null) {
            params.shareImg = `${iconTag.getAttribute("href")}`;
        }
        if (!params.link) {
            params.link = location.href;
        }
        switch (true) {
            case isQQMBrowser:
                utils_1
                    .loadScript("https://jsapi.qq.com/get?api=app.share")
                    .then(() => {
                        let browserQQ = window.browser;
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
            case isUCMBrowser && isIos:
                let ucbrowser = window.ucbrowser;
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
            case isUCMBrowser && isAndroid:
                let ucwebAndroid = window.ucweb;
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
            case isBaiduMBrowser && isAndroid:
                console.warn("注意:百度的分享是重定向分享,会跳出当前页面的");
                let _flyflowNative = window._flyflowNative;
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
            case isBaiduMBrowser && isIos:
                console.warn(
                    "注意:百度的分享是重定向分享,会跳出当前页面的,不确保是否分享成功"
                );
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
            case isSogouMBrowser && isIos:
                let SogouMseIOS = window.SogouMse ? window.SogouMse : null;
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
            case isSogouMBrowser && isAndroid:
                reject({
                    env: "sougou-borwer.android",
                    errMsg: "暂不支持搜狗浏览器Android版本分享"
                });
                break;
            case isWechat:
                console.warn("微信分享需要实现js-sdk,需要额外实现");
                reject({
                    env: "wechat",
                    errMsg: "暂不支持微信内置浏览器分享"
                });
                break;
            case isQQ:
                utils_1
                    .loadScript("https://open.mobile.qq.com/sdk/qqapi.js")
                    .then(() => {
                        let mqq = window.mqq ? window.mqq : null;
                        if (mqq) {
                            mqq.ui.setOnShareHandler(share_type => {
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
                                    data => {
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
exports.Share = Share;
//# sourceMappingURL=index.js.map

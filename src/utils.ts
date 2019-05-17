/**
 * 加载 script脚本
 * @param src 脚本url
 * @returns {Promise}
 */
export const loadScript = (src: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        let targetScriptTag = document.querySelector(`script[src='${src}']`);
        // 存在就返回,不存在创建
        if (targetScriptTag && targetScriptTag != null) {
            resolve();
        } else {
            let script = document.createElement("script");
            script.setAttribute("src", src);
            script.async = true;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject();
            };
        }
    });
};

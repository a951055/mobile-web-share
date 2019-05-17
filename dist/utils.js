"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadScript = (src) => {
    return new Promise((resolve, reject) => {
        let targetScriptTag = document.querySelector(`script[src='${src}']`);
        if (targetScriptTag && targetScriptTag != null) {
            resolve();
        }
        else {
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
//# sourceMappingURL=utils.js.map
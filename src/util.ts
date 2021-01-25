const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const loadJSON = (() => {
    if (isBrowser) {
        return async function loadJSON<T = any>(path: string): Promise<T> {
            const data = await fetch(path);
            return await data.json();
        }
    } else {
        const fs = require("fs");
        return async function loadJSON<T = any>(path: string): Promise<T> {
            return new Promise((resolve, reject) => {
                fs.readFile(path, { encoding: "utf-8" }, (err: NodeJS.ErrnoException, data: string) => {
                    if (err != null) reject(err)
                    resolve(JSON.parse(data));
                })
            });
        }
    }
})();

export {
    isBrowser,
    loadJSON
};

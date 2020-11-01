"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressRouter = void 0;
require("reflect-metadata");
const express = require("express");
const fs = require("fs");
class ExpressRouter {
    constructor() {
        this.server = undefined;
        this._router = undefined;
    }
    loadRouter() {
        this._router = express.Router();
        const apis = Reflect.getMetadata('xm:apis', Object.getPrototypeOf(this));
        apis && apis.forEach(api => api.registerAPI(() => this.server, this._router, this));
    }
    get Router() {
        if (!this._router) {
            this.loadRouter();
        }
        return this._router;
    }
    get Path() {
        return undefined;
    }
    static async loadDir(server, dir, opts) {
        opts = {};
        function loadRouter(srcFile) {
            try {
                const obj = require(srcFile);
                if (!obj)
                    return null;
                const router = obj.default || obj;
                if (router instanceof ExpressRouter) {
                    router.server = server;
                    return router;
                }
            }
            catch (err) {
                if (opts.log) {
                    opts.log(`Express Router cannot load file ${srcFile} due to error: `);
                    opts.log(err);
                }
                return null;
            }
            return null;
        }
        function path(file, router) {
            const path = router.Path || file.substring(0, file.length - 3);
            return path && (path.startsWith('/') ? path : `/${path}`);
        }
        function isImportable(file) {
            const filePart = file.slice(-3);
            return filePart === '.js' || (filePart === '.ts' && file.slice(-5) !== '.d.ts');
        }
        const dirFiles = await ExpressRouter.promisify(fs.readdir, dir);
        const jsFiles = dirFiles.filter(f => isImportable(f));
        const routers = jsFiles.map(f => ({
            file: f,
            er: loadRouter(`${dir}/${f}`)
        })).filter(r => r.er != null);
        for (const r of routers) {
            const _path = opts.path || r.file;
            server.use(`${path(_path, r.er)}`, r.er.Router);
        }
    }
    static promisify(cbFunc, ...args) {
        return new Promise((res, rej) => {
            cbFunc(...args, (err, results) => {
                if (err) {
                    rej(err);
                    return;
                }
                res(results);
            });
        });
    }
}
exports.ExpressRouter = ExpressRouter;
ExpressRouter.NEXT = Symbol("express:next");
ExpressRouter.ResponseHandler = (data, req, resp) => { resp.send(data); };
ExpressRouter.ErrorHandler = (err, req, resp) => { resp.status(500); resp.send(err); };
__exportStar(require("./decors"), exports);
//# sourceMappingURL=index.js.map
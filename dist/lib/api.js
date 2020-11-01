"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMiddlewareDecor = exports.updateAPIInfo = exports.updateAPI = exports.HEAD = exports.OPTIONS = exports.PATCH = exports.DELETE = exports.PUT = exports.POST = exports.GET = exports.API = exports.APIInfo = void 0;
const _1 = require(".");
class APIInfo {
    constructor(key, opts, apiFunc) {
        this.key = key;
        this.middlewares = [];
        this.argMappers = {};
        this.nArgs = 0;
        this.method = opts.method || 'GET';
        this.path = opts.path || '';
        this.apiFunc = apiFunc;
    }
    getRouterDefineMethod(router) {
        switch (this.method) {
            case 'GET': return router.get;
            case 'POST': return router.post;
            case 'PUT': return router.put;
            case 'OPTIONS': return router.options;
            case 'DELETE': return router.delete;
            case 'PATCH': return router.patch;
            case 'HEAD': return router.head;
        }
        return router.use;
    }
    registerAPI(server, router, caller) {
        const methodDefiner = this.getRouterDefineMethod(router);
        methodDefiner.call(router, this.path, (req, resp, next) => {
            const process = async () => {
                try {
                    for (const mw of this.middlewares) {
                        await mw(req);
                    }
                    const args = Array(this.nArgs).fill(undefined);
                    for (const idx in this.argMappers) {
                        args[idx] = this.argMappers[idx](req);
                    }
                    const data = await this.apiFunc.apply(caller, args);
                    const rspHandler = this.responseHandler || _1.ExpressRouter.ResponseHandler;
                    rspHandler && rspHandler.call(null, data, req, resp);
                }
                catch (err) {
                    if (err === _1.ExpressRouter.NEXT) {
                        next();
                        return;
                    }
                    server().emit('express_router:error', err, req);
                    if (APIInfo.Logging == true) {
                        console.log(err);
                    }
                    const errHandler = this.errorHandler || _1.ExpressRouter.ErrorHandler;
                    errHandler && errHandler.call(null, err, req, resp);
                }
            };
            process();
        });
    }
}
exports.APIInfo = APIInfo;
APIInfo.Logging = false;
function API(method, opts = {}) {
    return (target, key, desc) => {
        opts.method = method;
        defineAPI(target, key, desc, opts);
    };
}
exports.API = API;
function GET(opts) {
    return API('GET', opts);
}
exports.GET = GET;
function POST(opts) {
    return API('POST', opts);
}
exports.POST = POST;
function PUT(opts) {
    return API('PUT', opts);
}
exports.PUT = PUT;
function DELETE(opts) {
    return API('DELETE', opts);
}
exports.DELETE = DELETE;
function PATCH(opts) {
    return API('PATCH', opts);
}
exports.PATCH = PATCH;
function OPTIONS(opts) {
    return API('OPTIONS', opts);
}
exports.OPTIONS = OPTIONS;
function HEAD(opts) {
    return API('HEAD', opts);
}
exports.HEAD = HEAD;
function defineAPI(target, key, desc, opts) {
    opts.path = opts.path || `/${key}`;
    const apis = Reflect.getMetadata('xm:apis', target) || [];
    apis.push(new APIInfo(key, opts, desc.value));
    Reflect.defineMetadata('xm:apis', apis, target);
}
function updateAPI(target, key, updator) {
    setTimeout(() => {
        const apis = Reflect.getMetadata('xm:apis', target) || [];
        const api = apis.find(api => api.key == key);
        if (api) {
            updator(api);
            Reflect.defineMetadata('xm:apis', apis, target);
        }
    }, 0);
}
exports.updateAPI = updateAPI;
function updateAPIInfo(updator) {
    return (target, key, desc) => {
        updateAPI(target, key, updator);
    };
}
exports.updateAPIInfo = updateAPIInfo;
function addMiddlewareDecor(middleware) {
    return updateAPIInfo((api) => {
        api.middlewares.push(middleware);
    });
}
exports.addMiddlewareDecor = addMiddlewareDecor;
//# sourceMappingURL=api.js.map
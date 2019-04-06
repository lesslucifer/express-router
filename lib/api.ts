import * as express from 'express';
import * as _ from 'lodash';
import { ExpressRouter } from '.';

export type API_METHOD = 'GET' | 'POST' | 'PUT' | 'OPTIONS' | 'DELETE' | 'PATCH' | 'HEAD';

export interface APIDefineOpts {
    method?: API_METHOD,
    path?: string;
    args?: (string | ((req: express.Request) => any))[];
    logging?: boolean;
}

export class APIInfo {
    static Logging = false;

    method: API_METHOD;
    path: string;
    args?: ((req: express.Request) => any)[] = [];
    middlewares: IExpressRouterMiddleware[] = []
    apiFunc: IExpressAsyncRequestHandler;
    responseHandler: IExpressRouterResponseHandler;
    errorHandler: IExpressRouterErrorHandler;

    constructor(public key:string, opts: APIDefineOpts, apiFunc: IExpressAsyncRequestHandler) {
        this.method = opts.method || 'GET';
        this.path = opts.path || '';
        this.setArgs(opts.args);
        this.apiFunc = apiFunc;
    }

    private getRouterDefineMethod(router: express.Router) {
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

    registerAPI(server: () => express.Express, router: express.Router, caller: any) {
        const methodDefiner = this.getRouterDefineMethod(router);
        methodDefiner.call(router, this.path, (req, resp, next) => {
            const process = async () => {
                try {
                    for (const mw of this.middlewares) {
                        await mw(req);
                    }
        
                    const args = this.args.map(arg => arg(req));
                    const data = await this.apiFunc.apply(caller, args);

                    const rspHandler = this.responseHandler || ExpressRouter.ResponseHandler;
                    rspHandler && rspHandler.call(null, data, req, resp)
                }
                catch (err) {
                    if (err === ExpressRouter.NEXT) next();
                    server().emit('express_router:error', err, req);
                    if (APIInfo.Logging == true) {
                        console.log(err);
                    }
                    const errHandler = this.errorHandler || ExpressRouter.ErrorHandler;
                    errHandler && errHandler.call(null, err, req, resp)
                }
            }

            process()
        });
    }

    setArgs(args: (string | ((req: express.Request) => any))[]) {
        this.args = (args || []).map(arg => {
            if (_.isString(arg)) return (req) => {
                return _.get(req, arg);
            }
            if (_.isFunction(arg)) return arg;

            return () => undefined;
        });
    }
}

export function API(method: API_METHOD, opts: APIDefineOpts = {}) {
    return (target: any, key: string, desc: PropertyDescriptor) => {
        opts.method = method;
        defineAPI(target, key, desc, opts);
    }
}

export function GET(opts?: APIDefineOpts) {
    return API('GET', opts);
}

export function POST(opts?: APIDefineOpts) {
    return API('POST', opts);
}

export function PUT(opts?: APIDefineOpts) {
    return API('PUT', opts);
}

export function DELETE(opts?: APIDefineOpts) {
    return API('DELETE', opts);
}

export function PATCH(opts?: APIDefineOpts) {
    return API('PATCH', opts);
}

export function OPTIONS(opts?: APIDefineOpts) {
    return API('OPTIONS', opts);
}

export function HEAD(opts?: APIDefineOpts) {
    return API('HEAD', opts);
}

function defineAPI(target: any, key: string, desc: PropertyDescriptor, opts: APIDefineOpts) {
    opts.path = opts.path || `/${key}`;
    const apis: any[] = Reflect.getMetadata('xm:apis', target) || [];
    apis.push(new APIInfo(key, opts, desc.value));
    Reflect.defineMetadata('xm:apis', apis, target);
}

export function updateAPIInfo(updator: (api: APIInfo) => void) {
    return (target: any, key: string, desc: PropertyDescriptor) => {
        setTimeout(() => {
            const apis: APIInfo[] = Reflect.getMetadata('xm:apis', target) || [];
            const api = apis.find(api => api.key == key);
            if (api) {
                updator(api);
                Reflect.defineMetadata('xm:apis', apis, target);
            }
        }, 0)
    }
}

export interface IExpressRouterMiddleware {
    (req: express.Request): Promise<void>;
}

export interface IExpressRouterMiddleware {
    (req: express.Request): Promise<void>;
}

export interface IExpressAsyncRequestHandler {
    (req: express.Request, resp: express.Response): Promise<any>;
}

export interface IExpressRouterResponseHandler {
    (data: any, req: express.Request, resp: express.Response): void;
}

export interface IExpressRouterErrorHandler {
    (err: Error, req: express.Request, resp: express.Response): void;
}

export function addMiddlewareDecor(middleware: IExpressRouterMiddleware) {
    return updateAPIInfo((api) => {
        api.middlewares.push(middleware);
    });
}
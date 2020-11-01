import * as express from 'express';
export declare type API_METHOD = 'GET' | 'POST' | 'PUT' | 'OPTIONS' | 'DELETE' | 'PATCH' | 'HEAD';
export interface APIDefineOpts {
    method?: API_METHOD;
    path?: string;
    logging?: boolean;
}
export declare class APIInfo {
    key: string;
    static Logging: boolean;
    method: API_METHOD;
    path: string;
    middlewares: IExpressRouterMiddleware[];
    apiFunc: IExpressAsyncRequestHandler;
    responseHandler: IExpressRouterResponseHandler;
    errorHandler: IExpressRouterErrorHandler;
    argMappers: {
        [index: number]: (req: express.Request) => any;
    };
    nArgs: number;
    constructor(key: string, opts: APIDefineOpts, apiFunc: IExpressAsyncRequestHandler);
    private getRouterDefineMethod;
    registerAPI(server: () => express.Express, router: express.Router, caller: any): void;
}
export declare function API(method: API_METHOD, opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function GET(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function POST(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function PUT(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function DELETE(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function PATCH(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function OPTIONS(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function HEAD(opts?: APIDefineOpts): (target: any, key: string, desc: PropertyDescriptor) => void;
export declare function updateAPI(target: any, key: string | symbol, updator: (api: APIInfo) => void): void;
export declare function updateAPIInfo(updator: (api: APIInfo) => void): (target: any, key: string, desc: PropertyDescriptor) => void;
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
export declare function addMiddlewareDecor(middleware: IExpressRouterMiddleware): (target: any, key: string, desc: PropertyDescriptor) => void;

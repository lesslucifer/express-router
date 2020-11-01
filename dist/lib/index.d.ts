import 'reflect-metadata';
import * as express from 'express';
import { IExpressRouterErrorHandler, IExpressRouterResponseHandler } from './api';
export interface IExpressRouterLoadDirOptions {
    log?: Function;
    path?: string;
}
export declare class ExpressRouter {
    static readonly NEXT: unique symbol;
    static ResponseHandler: IExpressRouterResponseHandler;
    static ErrorHandler: IExpressRouterErrorHandler;
    server: express.Express;
    private _router;
    private loadRouter;
    get Router(): express.Router;
    get Path(): string;
    static loadDir(server: express.Express, dir: string, opts?: IExpressRouterLoadDirOptions): Promise<void>;
    static promisify(cbFunc: Function, ...args: any[]): Promise<string[]>;
}
export * from './decors';

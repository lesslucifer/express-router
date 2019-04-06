import { addMiddlewareDecor, updateAPIInfo, IExpressRouterResponseHandler, IExpressRouterErrorHandler } from "./api";
import * as _ from "lodash";
import express = require("express");

export * from './api'
export * from './decors'

export type ArgParser = string | ((req: express.Request) => any);
export function Args(...args: ArgParser[]) {
    return updateAPIInfo(api => {
        api.setArgs(args);
    })
}

export class ArgParsers {
    static UniqIntArrs = (key: string, sep: string = ',') => (req: express.Request) => {
        const data = _.get(req, key);
        const arr: string[] = _.isArray(data) ? data : (_.isString(data) ? data.split(sep) : []); 
        if (!arr) return [];
    
        return _.uniq(arr.map(i => Number(i)).filter(i => i != null));
    }
}

export function BodyArgs(...args: (string | ((body: any) => any))[]) {
    return updateAPIInfo(api => {
        api.args = args.map(arg => {
            if (_.isString(arg)) return (req: express.Request) => _.get(req.body, arg);
            if (_.isFunction(arg)) return (req: express.Request) => (arg as Function)(req.body);

            return () => undefined;
        })
    })
}

export function ResponseHandler(handler: IExpressRouterResponseHandler) {
    return updateAPIInfo(api => {
        api.responseHandler = handler
    })
}

export function ErrorHandler(handler: IExpressRouterErrorHandler) {
    return updateAPIInfo(api => {
        api.errorHandler = handler
    })
}
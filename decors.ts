import { addMiddlewareDecor, updateAPIInfo, IExpressRouterResponseHandler, IExpressRouterErrorHandler, updateAPI } from "./api";
import * as _ from "lodash";
import express = require("express");

export * from './api'
export * from './decors'

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

// Args
export function argMapperDecor(arg: (req: express.Request) => any) {
    return (target: Object, key: string | symbol, index: number) => {
        updateAPI(target, key, (api) => {
            api.argMappers[index] = arg;
            if (index > api.nArgs) {
                api.nArgs = index;
            }
        })
    }
}

export function Req(arg?: (string | ((body: any) => any))[]) {
    const mapper = _.isString(arg) ? req => _.get(req, arg) : (_.isFunction(arg) ? req => (arg as Function)(req) : req => req);
    return argMapperDecor(mapper);
}

export function Body(arg?: (string | ((body: any) => any))[]) {
    const mapper = _.isString(arg) ? req => _.get(req.body, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.body) : req => req.body);
    return argMapperDecor(mapper);
}

export function Params(arg?: (string | ((params: any) => any))[]) {
    const mapper = _.isString(arg) ? req => _.get(req.params, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.params) : req => req.params);
    return argMapperDecor(mapper);
}

export function Query(arg?: (string | ((query: any) => any))[]) {
    const mapper = _.isString(arg) ? req => _.get(req.query, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.query) : req => req.query);
    return argMapperDecor(mapper);
}
import { updateAPIInfo, IExpressRouterResponseHandler, IExpressRouterErrorHandler, updateAPI, IExpressRouterAPIDocumentFunction, IExpressRouterMiddleware } from "./api";
import * as _ from "lodash";
import express = require("express");

export * from './api'
export * from './decors'

export function updateDocument(docUpdator: IExpressRouterAPIDocumentFunction) {
    return updateAPIInfo((api) => docUpdator(api.document))
}

export function addMiddlewareDecor(middleware: IExpressRouterMiddleware, document?: IExpressRouterAPIDocumentFunction) {
    return updateAPIInfo((api) => {
        api.middlewares.push(middleware);
        document?.(api.document)
    });
}

export function ResponseHandler(handler: IExpressRouterResponseHandler, document?: IExpressRouterAPIDocumentFunction) {
    return updateAPIInfo(api => {
        api.responseHandler = handler
        document?.(api.document)
    })
}

export function ErrorHandler(handler: IExpressRouterErrorHandler, document?: IExpressRouterAPIDocumentFunction) {
    return updateAPIInfo(api => {
        api.errorHandler = handler
        document?.(api.document)
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

export function Req(arg?: (string | ((body: any) => any))) {
    const mapper = _.isString(arg) ? req => _.get(req, arg) : (_.isFunction(arg) ? req => (arg as Function)(req) : req => req);
    return argMapperDecor(mapper);
}

export function Body(arg?: (string | ((body: any) => any))) {
    const mapper = _.isString(arg) ? req => _.get(req.body, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.body) : req => req.body);
    return argMapperDecor(mapper);
}

export function Params(arg?: (string | ((params: any) => any))) {
    const mapper = _.isString(arg) ? req => _.get(req.params, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.params) : req => req.params);
    return argMapperDecor(mapper);
}

export function Query(arg?: (string | ((query: any) => any))) {
    const mapper = _.isString(arg) ? req => _.get(req.query, arg) : (_.isFunction(arg) ? req => (arg as Function)(req.query) : req => req.query);
    return argMapperDecor(mapper);
}

// Doc
export function pushDoc(f: _.PropertyPath, ...vals: any[]) {
    return (doc: object) => {
        if (_.get(doc, f) === undefined) {
            return _.set(doc, f, [...vals])
        }
    
        if (_.isArray(_.get(doc, f))) {
            return _.get(doc, f).push(...vals)
        }
    }
}

export function setDoc(f: _.PropertyPath, val: any) {
    return (doc: object) => _.set(doc, f, val)
}

export function SetDoc(f: _.PropertyPath, val: any) {
    return updateDocument(setDoc(f, val))
}

export function PushDoc(f: _.PropertyPath, val: any) {
    return updateDocument(pushDoc(f, val))
}

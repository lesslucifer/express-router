import { addMiddlewareDecor, updateAPIInfo } from "./api";
import _ from "lodash";
import express = require("express");

export type ArgParser = string | ((req: express.Request) => any);
export function Args(...args: ArgParser[]) {
    return updateAPIInfo(api => {
        api.setArgs(args);
    })
}

export class ArgParsers {
    static UniqIntArrs = (key: string, sep: string = ',') => (req: express.Request) => {
        const data = _.get(req, key);
        const arr: string[] = _.isArray(data) ? data : (_.isString(data) ? data.split(sep) : null); 
        if (!arr) return [];
    
        return _.uniq(arr.map(i => Number(i)).filter(i => i != null));
    }
}

export function BodyArgs(...args: (string | ((body: any) => any))[]) {
    return updateAPIInfo(api => {
        api.args = args.map(arg => {
            if (_.isString(arg)) return req => _.get(req.body, arg);
            if (_.isFunction(arg)) return req => (arg as Function)(req.body);

            return () => undefined;
        })
    })
}
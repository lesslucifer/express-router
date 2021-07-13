import 'reflect-metadata';
import * as express from 'express';
import * as _ from 'lodash';
import { APIInfo, IExpressRouterErrorHandler, IExpressRouterResponseHandler } from './api';
import * as fs from 'fs';

export interface IExpressRouterLoadDirOptions {
    log?: Function
    path?: string
}

export class ExpressRouter {
    public static readonly NEXT = Symbol("express:next");
    
    public static ResponseHandler: IExpressRouterResponseHandler = (data: any, req: express.Request, resp: express.Response) => { resp.send(data); }
    public static ErrorHandler: IExpressRouterErrorHandler = (err: Error, req: express.Request, resp: express.Response) => { resp.status(_.isNumber(err && err['code']) ? err['code'] : 500); resp.send(err); }

    public server: express.Express = undefined;
    private _router: express.Router = undefined;

    public document: object = {}

    private loadRouter() {
        this._router = express.Router();

        this.APIInfos?.forEach(api => api.registerAPI(() => this.server, this._router, this));
    }

    get APIInfos(): APIInfo[] {
        return Reflect.getMetadata('xm:apis', Object.getPrototypeOf(this)) ?? []
    }

    get Router() {
        if (!this._router) {
            this.loadRouter();
        }

        return this._router;
    }

    get Path(): string {
        return undefined;
    }

    static async loadRoutersInDir(dir: string, opts?: IExpressRouterLoadDirOptions) {
        function loadRouter(srcFile: string) {
            try {
                const obj = require(srcFile);
                if (!obj) return null;

                const router = obj.default || obj;
                if (router instanceof ExpressRouter) return router
            }
            catch (err) {
                opts?.log?.(`Express Router cannot load file ${srcFile} due to error: `)
                opts?.log?.(err)
                return null;
            }

            return null;
        }
        function isImportable(file: string): boolean {
            const filePart = file.slice(-3);
            return filePart === '.js' || (filePart === '.ts' && file.slice(-5) !== '.d.ts');
        }

        function path(file: string, router: ExpressRouter) {
            let prefix = router.Path || file.substring(0, file.length - 3);
            return (prefix && (prefix.startsWith('/') ? prefix : `/${prefix}`)) || '';
        }

        const dirFiles = await ExpressRouter.promisify(fs.readdir, dir);
        const jsFiles = dirFiles.filter(f => isImportable(f));
        const routers = jsFiles.map(f => ({
            path: '',
            file: f,
            er: loadRouter(`${dir}/${f}`)
        })).filter(r => r.er != null);
        routers.forEach(r => r.path = path(r.file, r.er))
        return routers
    }

    static async loadDir(server: express.Express, dir: string, opts?: IExpressRouterLoadDirOptions) {
        const routers = await this.loadRoutersInDir(dir, opts)

        for (const r of routers) {
            r.er.server = server
            server.use(r.path, r.er.Router);
        }
    }

    private static promisify(cbFunc: Function, ...args: any[]) {
        return new Promise<string[]>((res, rej) => {
            cbFunc(...args, (err, results) => {
                if (err) {
                    rej(err);
                    return;
                }

                res(results);
            })
        });
    }
}

export * from './decors';
export * from './openapi.document';
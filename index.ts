import 'reflect-metadata';
import * as express from 'express';
import * as _ from 'lodash';
import { APIInfo, IExpressRouterErrorHandler, IExpressRouterResponseHandler } from './api';
import * as fs from 'fs';

export class ExpressRouter {
    public static readonly NEXT = Symbol("express:next");
    public static readonly MSG_ERR = 'express_router:error';
    
    public static ResponseHandler: IExpressRouterResponseHandler = (data: any, req: express.Request, resp: express.Response) => { resp.send(data); }
    public static ErrorHandler: IExpressRouterErrorHandler = (err: Error, req: express.Request, resp: express.Response) => { resp.status(500); resp.send(err); }

    public server: express.Express = undefined;
    private _router: express.Router = undefined;

    private loadRouter() {
        this._router = express.Router();

        const apis: APIInfo[] = Reflect.getMetadata('xm:apis', Object.getPrototypeOf(this));
        apis && apis.forEach(api => api.registerAPI(() => this.server, this._router, this));
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

    static async loadDir(server: express.Express, dir: string) {
        function loadRouter(srcFile: string) {
            try {
                const obj = require(srcFile);
                if (!obj) return null;

                const router = obj.default || obj;
                if (router instanceof ExpressRouter) {
                    router.server = server;
                    return router;
                }
            }
            catch (err) {
                console.error(`Express Router cannot load file ${srcFile} due to error: `);
                console.error(err);
                return null;
            }

            return null;
        }

        function path(file: string, router: ExpressRouter) {
            const path = router.Path || file.substring(0, file.length - 3);
            return path && (path.startsWith('/') ? path : `/${path}`);
        }

        function isImportable(file: string): boolean {
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
            server.use(`${path(r.file, r.er)}`, r.er.Router);
        }
    }

    static promisify(cbFunc: Function, ...args: any[]) {
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
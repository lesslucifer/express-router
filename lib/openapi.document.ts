import _ = require("lodash")
import { ExpressRouter, IExpressRouterLoadDirOptions } from "."

export interface IEROpenAPIComponents {
    schemas?: _.Dictionary<any>,
    securitySchemes?: _.Dictionary<any>,
    parameters?: _.Dictionary<any>,
    requestBodies?: _.Dictionary<any>,
    responses?: _.Dictionary<any>,
    headers?: _.Dictionary<any>,
    examples?: _.Dictionary<any>,
    links?: _.Dictionary<any>,
    callbacks?: _.Dictionary<any>,
    [extraComp: string]: any
}

export class EROpenAPIDocument {
    static COMPONENTS: IEROpenAPIComponents = {
        schemas: {},
        securitySchemes: {},
        parameters: {},
        requestBodies: {},
        responses: {},
        headers: {},
        examples: {},
        links: {},
        callbacks: {}
    }

    openapi = '3.0.0'
    info = {
        title: 'Sample Swagger API',
        version: '1.0.0'
    }
    servers: string[] = []
    components: IEROpenAPIComponents = {}
    paths: {[path: string]: object} = {};
    [x: string]: any;

    addRouter(router: ExpressRouter, defaultDocument?: object, path?: string) {
        router.APIInfos?.forEach(api => {
            let apiPath = [path ?? router.Path ?? '', api.path].join('/')
            while (apiPath.includes('//')) apiPath = apiPath.replace(/\/\//g, '/')

            _.set(this.paths, `${apiPath}.${api.method.toLowerCase()}`, {
                ...defaultDocument,
                ...router.document,
                ...api.document
            })
        })
    }

    async loadDir(dir: string, opts?: IExpressRouterLoadDirOptions, defaultDocument?: object) {
        const routers = await ExpressRouter.loadRoutersInDir(dir, opts)
        return routers.map(r => this.addRouter(r.er, defaultDocument, r.path))
    }
}
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
    servers: object[] = []
    components: IEROpenAPIComponents = {}
    paths: { [path: string]: object } = {};
    [x: string]: any;

    addRouter(router: ExpressRouter, defaultDocument?: object, path?: string) {
        router.APIInfos?.forEach(api => {
            let apiPath = [path ?? router.Path ?? '', api.path].join('/')
            while (apiPath.includes('//')) apiPath = apiPath.replace(/\/\//g, '/')

            const pathParamMatches = execAll(apiPath, /:(\w+)/g)
            pathParamMatches.forEach(m => apiPath = apiPath.replace(m[0], `{${m[1]}}`))
            const pathParams = pathParamMatches.map(m => m[1])

            const key = `${apiPath}.${api.method.toLowerCase()}`
            _.set(this.paths, key, {
                ...defaultDocument,
                ...router.document,
                ...api.document
            })

            // Customize for struture
            const doc = _.get(this.paths, key)
            if (!_.get(doc, 'responses')) {
                _.set(doc, 'responses', {
                    '200': {}
                })
            }

            const responses = _.get(doc, 'responses')
            for (const stt in responses) {
                if (_.isNumber(_.parseInt(stt)) && !_.get(responses, `${stt}.description`)) {
                    _.set(responses, `${stt}.description`, '')
                }
            }

            if (pathParams.length > 0) {
                let params = _.get(doc, 'parameters') ?? []
                if (_.isEmpty(params)) _.set(doc, 'parameters', params)
                
                pathParams.forEach(p => {
                    if (params.find(pp => _.get(pp, 'name') == p && _.get(pp, 'in') == 'path')) return
                    params.push({
                        name: p,
                        schema: {type: 'string'},
                        in: 'path',
                        required: true
                    })
                })
            }

            router.postProcessDocument(api, doc)
        })
    }

    async loadDir(dir: string, opts?: IExpressRouterLoadDirOptions, defaultDocument?: object) {
        const routers = await ExpressRouter.loadRoutersInDir(dir, opts)
        await new Promise<void>((res) => setTimeout(res, 0));
        return routers.map(r => this.addRouter(r.er, defaultDocument, r.path))
    }
}

function execAll(str, regex) {
    const matches = []
    let match = regex.exec(str);
    while (match) {
        matches.push(match)
        match = regex.exec(str);
    }
    return matches
}

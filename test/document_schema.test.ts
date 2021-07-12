import * as _ from 'lodash';
import { expect } from 'chai';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import chaiHttp = require('chai-http');
import sinon = require('sinon');
import 'mocha';
import { addMiddlewareDecor, ExpressRouter, GET, POST, pushDoc, PUT, Query, SetDoc, setDoc, updateDocument } from '../lib';
import { EROpenAPIDocument } from '../lib/openapi.document';
import deepEqualInAnyOrder = require('deep-equal-in-any-order');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(deepEqualInAnyOrder)

interface IUser {
    _id: string;
    username: string;
    age: number;
    createdAt: number;
}

const UserSchema = {
    'type': 'object',
    'properties': {
        '_id': {
            'type': 'string'
        },
        'username': {
            'type': 'string'
        },
        'age': {
            'type': 'number'
        },
        'createdAt': {
            'type': 'string'
        },
    }
}

EROpenAPIDocument.COMPONENTS.schemas['User'] = UserSchema

interface IDocResponseOptions {
    status?: number
    contentType?: string
    fields: any
}
function DocResponse(schema: any, opts?: IDocResponseOptions) {
    const status = opts?.status ?? 200
    const contentType = opts?.status ?? 'application/json'
    const extra = opts?.fields ?? {}

    return updateDocument(doc => _.setWith(doc, ['responses', status.toString(), 'content', contentType], {
        schema,
        ...extra
    }, Object))
}

function RequireQueries(...fields: string[]) {
    return addMiddlewareDecor(async req => {
        console.log('Require query to have fields')
    }, pushDoc('parameters', ...fields.map(f => ({
        in: 'query',
        name: f,
        schema: {
            'type': 'string'
        },
        required: true
    }))))
}

class DocSchemaTestRouter extends ExpressRouter {
    @GET({path : '/'})
    @RequireQueries('text')
    @DocResponse({'$ref': '#/components/schemas/User'})
    async echo(@Query('text') data: string) {
        return {data}
    }
}

describe("# Document", () => {
    let sandbox: sinon.SinonSandbox;
    const DocTestRouterDoc = {

    }

    before(() => {
    })

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
    })

    afterEach(async () => {
        sandbox.restore();
    })

    it('Ref Schema', async () => {
        const doc = new EROpenAPIDocument()
        doc.info.title = 'Test Title'
        doc.info.version = '1.0.0'
        doc.servers.push('http://localhost')
        doc.components = EROpenAPIDocument.COMPONENTS
        doc.addRouter(new DocSchemaTestRouter(), undefined, '/test')

        expect(doc).to.deep.equalInAnyOrder({
            openapi: '3.0.0',
            info: {
                title: 'Test Title',
                version: '1.0.0'
            },
            servers: ['http://localhost'],
            paths: {
                '/test/': {
                    get: {
                        parameters: [{
                            in: 'query',
                            name: 'text',
                            schema: {
                                type: 'string'
                            },
                            required: true
                        }],
                        responses: {
                            '200': {
                                'content': {
                                    'application/json': {
                                        schema: {
                                            '$ref': '#/components/schemas/User'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    User: UserSchema
                },
                callbacks: {},
                examples: {},
                headers: {},
                links: {},
                parameters: {},
                requestBodies: {},
                responses: {},
                securitySchemes: {}
            }
        })
    })
});
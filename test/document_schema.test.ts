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
    fields?: object;
    statusFields?: object;
}
function DocResponse(schema: any, opts?: IDocResponseOptions) {
    const status = opts?.status ?? 200
    const contentType = opts?.status ?? 'application/json'

    return updateDocument(doc => {
        _.setWith(doc, ['responses', status.toString(), 'content', contentType], {
            schema,
            ...opts?.fields
        }, Object)
        _.setWith(doc, ['responses', status.toString()], {
            ..._.get(doc, ['responses', status.toString()]),
            ...opts?.statusFields
        }, Object)
    })
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
    @DocResponse({'$ref': '#/components/schemas/User'}, {fields: {description: 'hello'}, statusFields: {description: 'hello2'}})
    async echo(@Query('text') data: string) {
        return {data}
    }
}

describe("# Document", () => {
    let sandbox: sinon.SinonSandbox;

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
        doc.components = EROpenAPIDocument.COMPONENTS
        doc.addRouter(new DocSchemaTestRouter(), undefined, '/test')

        expect(doc).to.deep.equalInAnyOrder({
            openapi: '3.0.0',
            info: {
                title: 'Test Title',
                version: '1.0.0'
            },
            servers: [],
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
                                        description: 'hello',
                                        schema: {
                                            '$ref': '#/components/schemas/User'
                                        }
                                    }
                                },
                                description: 'hello2',
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
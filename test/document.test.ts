import * as _ from 'lodash';
import { expect } from 'chai';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import chaiHttp = require('chai-http');
import sinon = require('sinon');
import 'mocha';
import { addMiddlewareDecor, ExpressRouter, GET, POST, PushDoc, pushDoc, PUT, Query, SetDoc, setDoc, updateDocument } from '../lib';
import { EROpenAPIDocument } from '../lib/openapi.document';
import deepEqualInAnyOrder = require('deep-equal-in-any-order');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(deepEqualInAnyOrder)

function AuthAPIKey() {
    return addMiddlewareDecor(async req => {
        console.log('Valid API Key')
    }, pushDoc('security', { ServiceKeyHeader: [] }))
}

function AuthBearer() {
    return addMiddlewareDecor(async req => {
        console.log('Valid Bearer')
    }, pushDoc('security', { bearerAuth: [] }))
}

function ValidBody(schema: object) {
    return addMiddlewareDecor(async req => {
        console.log('Validate body with schema', schema)
    }, setDoc('requestBody', {
        content: {
            'application/json': schema
        }
    }))
}

class DocTestRouter extends ExpressRouter {
    document = {
        'tags': 'DocTestRouter'
    }

    @GET({ path: '/' })
    @SetDoc('description', 'Echo response')
    @AuthAPIKey()
    async echo(@Query('text') data: string) {
        return { data }
    }

    @POST({ path: '/' })
    @AuthBearer()
    @SetDoc('description', 'POST Echo response')
    async postEcho(@Query('text') data: string) {
        return { data }
    }

    @POST({ path: '/:id/:xyz/hello' })
    @AuthBearer()
    @SetDoc('description', 'Test params')
    @PushDoc('parameters', {
        name: 'id',
        description: 'Hello',
        required: false,
        in: 'path'
    })
    async testParams(@Query('text') data: string) {
        return { data }
    }

    @PUT()
    @ValidBody({
        'properties': {
            'a': {
                'type': 'string'
            },
            'b': {
                'type': 'number'
            }
        },
        'requiredProperties': ['a']
    })
    async putEcho() {
        return ''
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

    it('Document of one router', async () => {
        expect(new DocTestRouter().APIInfos.map(api => api.document)).to.deep.equalInAnyOrder([
            {
                description: 'Echo response',
                security: [
                    { ServiceKeyHeader: [] }
                ]
            },
            {
                description: 'POST Echo response',
                security: [
                    { bearerAuth: [] }
                ]
            },
            {
                description: 'Test params',
                security: [
                    { bearerAuth: [] }
                ],
                parameters: [
                    {
                        name: 'id',
                        description: 'Hello',
                        required: false,
                        in: 'path'
                    }
                ]
            },
            {
                requestBody: {
                    content: {
                        'application/json': {
                            'properties': {
                                'a': {
                                    'type': 'string'
                                },
                                'b': {
                                    'type': 'number'
                                }
                            },
                            'requiredProperties': ['a']
                        }
                    }
                }
            }
        ])
    })

    it('Full API Doc', async () => {
        const doc = new EROpenAPIDocument()
        doc.info.title = 'Test Title'
        doc.info.version = '1.0.0'
        doc.servers.push({url: 'http://localhost'})
        doc.addRouter(new DocTestRouter(), undefined, '/test')

        expect(doc).to.deep.equalInAnyOrder({
            openapi: '3.0.0',
            info: {
                title: 'Test Title',
                version: '1.0.0'
            },
            servers: [{url: 'http://localhost'}],
            paths: {
                '/test/': {
                    get: {
                        tags: 'DocTestRouter',
                        description: 'Echo response',
                        security: [
                            { ServiceKeyHeader: [] }
                        ],
                        responses: { '200': { 'description': '' } }
                    },
                    post: {
                        tags: 'DocTestRouter',
                        description: 'POST Echo response',
                        security: [
                            { bearerAuth: [] }
                        ],
                        responses: { '200': { 'description': '' } }
                    }
                },
                '/test/{id}/{xyz}/hello': {
                    post: {
                        tags: 'DocTestRouter',
                        description: 'Test params',
                        security: [
                            { bearerAuth: [] }
                        ],
                        parameters: [
                            {
                                name: 'id',
                                description: 'Hello',
                                required: false,
                                in: 'path'
                            },
                            {
                                name: 'xyz',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: { '200': { 'description': '' } }
                    }
                },
                '/test/putEcho': {
                    put: {
                        tags: 'DocTestRouter',
                        requestBody: {
                            content: {
                                'application/json': {
                                    'properties': {
                                        'a': {
                                            'type': 'string'
                                        },
                                        'b': {
                                            'type': 'number'
                                        }
                                    },
                                    'requiredProperties': ['a']
                                }
                            }
                        },
                        responses: { '200': { 'description': '' } }
                    }
                }
            },
            components: {}
        })
    })
});
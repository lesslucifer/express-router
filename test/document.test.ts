import * as _ from 'lodash';
import { expect } from 'chai';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import chaiHttp = require('chai-http');
import sinon = require('sinon');
import 'mocha';
import { Test } from 'mocha';
import { addMiddlewareDecor, ExpressRouter, GET, Query } from '../lib';
import express = require('express');

chai.use(chaiAsPromised);
chai.use(chaiHttp);

function MiddlewareWithDoc() {
    return addMiddlewareDecor(async (req) => {
        console.log(req.body)
    }, (doc) => _.set(doc, 'body', {
        'hello': 'world'
    }))
}

class DocTestRouter extends ExpressRouter {
    @GET({path : '/'})
    @MiddlewareWithDoc()
    async echo(@Query('text') data: string) {
        return {data}
    }
}

describe("# Arg decor", () => {
    let sandbox: sinon.SinonSandbox;

    before(() => {
    })

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
    })

    afterEach(async () => {
        sandbox.restore();
    })

    it('test argument', async () => {
        expect(new DocTestRouter().document()).to.deep.equal([{
            body: {
                hello: 'world'
            }
        }])
    })
});
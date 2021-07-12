import * as _ from 'lodash';
import { expect } from 'chai';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import chaiHttp = require('chai-http');
import sinon = require('sinon');
import 'mocha';
import { Test } from 'mocha';
import { ExpressRouter, GET, Query } from '../lib';
import express = require('express');

chai.use(chaiAsPromised);
chai.use(chaiHttp);

class ArgTestRouter extends ExpressRouter {
    @GET({path : '/'})
    async echo(@Query('text') data: string) {
        return {data}
    }
}

describe("# Arg decor", () => {
    let sandbox: sinon.SinonSandbox;
    let server: express.Express

    before(() => {
        server = express()
        server.use('/test', new ArgTestRouter().Router)
    })

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
    })

    afterEach(async () => {
        sandbox.restore();
    })

    it('test argument', async () => {
        const resp = await chai.request(server).get('/test?text=123123')
        expect(resp.body).to.deep.equal({data: '123123'})
    })
});
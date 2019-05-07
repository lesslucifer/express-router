import * as _ from 'lodash';
import { expect } from 'chai';
import chai = require('chai');
import sinon = require('sinon');
import 'mocha';
import { Test } from 'mocha';

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

    it('test argument', () => {
    })
});
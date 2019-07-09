/**
 * Copyright 2019 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const proxyquire = require('proxyquire').noPreserveCache();
const Promise = require('bluebird');
const sinon = require('sinon');
const chai = require('chai');

const { expect } = chai;
const should = chai.should();

// fake util send response call
const FakeUtil = {
  sendResponse: (res, jsonRes) => { }
};
const pingCtrl = proxyquire('../../server/controllers/ping', {
  '../helpers/util': FakeUtil
});

describe('controllers - ping', () => {
  let res, req;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(FakeUtil);
    req = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully invoke transaction Health', async() => {
    const fakePingCC = sandbox.stub().returns(Promise.resolve('successfully pinged chaincode'));
    res = { locals: { defaultchannel: { pingcc: { submitTransaction: fakePingCC } } } };
    await pingCtrl.pingCC(req, res);

    sinon.assert.calledWith(FakeUtil.sendResponse, res, {statusCode: 200, success: true, result: 'successfully pinged chaincode'});
  });

  it('should catch Health tx error and return error', async() => {
    const fakePingCC = sandbox.stub().returns(Promise.reject(new Error('error in Health chaincode')));
    res = { locals: { defaultchannel: { pingcc: { submitTransaction: fakePingCC } } } };
    await pingCtrl.pingCC(req, res);

    sinon.assert.calledWith(FakeUtil.sendResponse, res, {statusCode: 500, success: false, message: 'error in Health chaincode'});
  });
});

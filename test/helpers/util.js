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

const Promise = require('bluebird');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rewire = require('rewire');

const ECDSAKey = require('fabric-client/lib/impl/ecdsa/key');

const util = rewire('../../server/helpers/util');

const { expect } = chai;
const should = chai.should();
chai.use(chaiAsPromised);

describe('helpers - util', () => {

  const FabricCAServices = util.__get__('FabricCAServices');
  let sandbox;
  util.__set__('ccpPath', `${__dirname}/../mocks/config/fabric-connection-profile.json`);

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#sendResponse', () => {
    const res = {
      setHeader: (name, value) => {},
      json: (response) => {}
    };
    const msg = {
      statusCode: 200,
      success: true,
      result: 'success'
    };
    it('should parse message and send appropriate response', () => {
      sandbox.stub(res);
      util.sendResponse(res, msg);

      sinon.assert.calledWith(res.setHeader, 'Content-Type', 'application/json');
      sinon.assert.calledWith(res.json, {success: true, result: 'success'});
    });
  });

  describe('#userEnroll', () => {
    it('should fail to enroll with invalid org name', async () => {
      return util.userEnroll('invalidorg', 'app1', 'app1pw').should.be.rejectedWith(Error);
    });

    it('should throw error when fabric ca enroll fails', async () => {
      sandbox.stub(FabricCAServices.prototype, 'enroll').callsFake(() => Promise.reject(new Error('error from fabric ca'))); // mock out call to FabricCA

      return util.userEnroll('org1msp', 'app1', 'app1pw').should.be.rejectedWith(Error);
    });

    it('should successfully enroll user and return credentials', async () => {
      const keyStub = sandbox.createStubInstance(ECDSAKey);
      sandbox.stub(FabricCAServices.prototype, 'enroll').callsFake(() => Promise.resolve({certificate: 'cert', key: keyStub})); // mock out call to FabricCA

      const response = await util.userEnroll('org1msp', 'app1', 'app1pw');
      expect(response.certificate).to.be.equal('cert');
    });
  });
});

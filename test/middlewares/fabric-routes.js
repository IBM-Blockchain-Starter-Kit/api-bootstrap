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
const express = require('express');
const request = require('supertest');
const fs = require('fs');
const rewire = require('rewire');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('config');
const rimraf = require('rimraf');
const { FileSystemWallet } = require('fabric-network');

const ccp = require(`${__dirname}/../mocks/config/fabric-connection-profile.json`);
const fabricConfig = require(`${__dirname}/../mocks/config/fabric-connections.json`);
const FabricRoutesMod = rewire('../../server/middlewares/fabric-routes');
const Gateway = FabricRoutesMod.__get__('Gateway');
FabricRoutesMod.__set__('ccp', ccp);
FabricRoutesMod.__set__('fabricConfig', fabricConfig);
const { FabricRoutes } = FabricRoutesMod;

// fake cert and key for enrollment
const cert = fs.readFileSync(`${__dirname}/../mocks/cert`, 'utf8');
const key = fs.readFileSync(`${__dirname}/../mocks/key`, 'utf8');
const { orgName } = config;
const { mspid } = ccp.organizations[orgName];

const { expect } = chai;
const should = chai.should();
chai.use(chaiAsPromised);

describe('middleware - fabric-routes', () => {
  let fabricRoutes, router, fakeUtilReset;

  before(() => {
    // delete test wallet before starting
    rimraf.sync(config.fsWalletPath);
  });
  after(() => {
    // delete test wallet after tests
    rimraf.sync(config.fsWalletPath);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // set fake util.userEnroll call for fabricRoutes.setup()
    const fakeUserEnroll = sandbox.stub().returns(Promise.resolve({certificate: cert, key, mspid}));
    const fakeSendResponse = sandbox.stub();
    fakeUtilReset = FabricRoutesMod.__set__('util', {
      sendResponse: fakeSendResponse,
      userEnroll: fakeUserEnroll
    });

    router = express.Router();
    fabricRoutes = new FabricRoutes(router);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should fail to connect to gateway', async() => {
    // stub Gateway calls
    sandbox.stub(Gateway.prototype, 'connect').callsFake(() => Promise.reject(new Error('error connecting to gateway')));

    await fabricRoutes.setup().should.be.rejectedWith(Error);
    fakeUtilReset(); // reset util so util.sendResponse is called properly
  });

  it('should fail to get channel that does not exist', async() => {
    // stub Gateway calls
    sandbox.stub(Gateway.prototype, 'connect').callsFake(() => Promise.resolve('ok!'));
    sandbox.stub(Gateway.prototype, 'getNetwork').callsFake(() => Promise.reject(new Error('network does not exist')));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, {success: false, message: 'network does not exist'});
  });

  it('should fail to get chaincode that does not exist', async() => {
    // stub Gateway calls
    sandbox.stub(Gateway.prototype, 'connect').callsFake(() => Promise.resolve('ok!'));
    const fakeGetContract = sandbox.stub().callsFake(() => Promise.reject(new Error('contract does not exist')));
    sandbox.stub(Gateway.prototype, 'getNetwork').callsFake(() => Promise.resolve({
      getContract: fakeGetContract
    }));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, {success: false, message: 'contract does not exist'});
  });

  it('should set up gateway and middleware and ping chaincode successfully', async() => {
    // stub Gateway calls
    const fakePingCC = sandbox.stub().callsFake(() => Promise.resolve('successfully pinged chaincode'));
    const fakeGetContract = sandbox.stub().callsFake(() => Promise.resolve({
      submitTransaction: fakePingCC
    }));
    const connect = sandbox.stub(Gateway.prototype, 'connect').callsFake(() => Promise.resolve('ok!'));
    sandbox.stub(Gateway.prototype, 'getNetwork').callsFake(() => Promise.resolve({
      getContract: fakeGetContract
    }));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    // assert gateway.connect is called with correct args
    sinon.assert.calledWith(connect, ccp, sinon.match({ 
      identity: process.env.FABRIC_ENROLL_ID,
      discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled }}));
    connect.getCall(0).args[1].wallet.should.be.an.instanceof(FileSystemWallet);

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(200, {success: true, result: 'successfully pinged chaincode'});
  });

  it('should get unauthorized error when calling secure route without token', async() => {
    // stub Gateway calls
    const fakePingCC = sandbox.stub().callsFake(() => Promise.resolve('successfully pinged chaincode'));
    const fakeGetContract = sandbox.stub().callsFake(() => Promise.resolve({
      submitTransaction: fakePingCC
    }));
    const connect = sandbox.stub(Gateway.prototype, 'connect').callsFake(() => Promise.resolve('ok!'));
    sandbox.stub(Gateway.prototype, 'getNetwork').callsFake(() => Promise.resolve({
      getContract: fakeGetContract
    }));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    // assert gateway.connect is called with correct args
    sinon.assert.calledWith(connect, ccp, sinon.match({ 
      identity: process.env.FABRIC_ENROLL_ID,
      discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled }}));
    connect.getCall(0).args[1].wallet.should.be.an.instanceof(FileSystemWallet);

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/securedPing')
      .expect(401);
  });
});

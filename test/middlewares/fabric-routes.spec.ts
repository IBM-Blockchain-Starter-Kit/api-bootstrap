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

import * as express from 'express';
import { Gateway } from 'fabric-network';
import * as request from 'supertest';
// tslint:disable-next-line
Promise = require('bluebird');

import * as util from '../../server/helpers/util';
import * as walletHelper from '../../server/helpers/wallet';
jest.mock('../../server/helpers/wallet');

import * as ccp from '../mocks/config/fabric-connection-profile.json';
import * as fabricConfig from '../mocks/config/fabric-connections.json';
jest.mock('../../server/config/fabric-connection-profile.json', () => (ccp));
jest.mock('../../server/config/fabric-connections.json', () => (fabricConfig));

import FabricRoutes from '../../server/middlewares/fabric-routes';

describe('middleware - fabric-routes', () => {
  let fabricRoutes;
  let router: any;
  let fakeUtilReset;

  beforeAll(() => {
    // mock walletHelper functions
    (walletHelper.initWallet as any) = jest.fn(() => true);
    (walletHelper.identityExists as any) = jest.fn()
    .mockReturnValueOnce(true)
    .mockReturnValue(false);
    (walletHelper.importIdentity as any) = jest.fn(() => true);
    (walletHelper.getWallet as any) = jest.fn(() => true);
  });

  beforeEach(() => {
    (util.userEnroll as any) = jest.fn(() => true );
    fakeUtilReset = jest.fn();
    router = express.Router();
    fabricRoutes = new FabricRoutes(router);
  });

  test('should fail to connect to gateway', async () => {
    // stub Gateway calls
    (Gateway.prototype.connect) = jest.fn(() => Promise.reject(new Error('error connecting to gateway')));

    await expect(fabricRoutes.setup()).rejects.toThrowError(Error);
    fakeUtilReset(); // reset util so util.sendResponse is called properly
  });

  test('should fail to get channel that does not exist', async () => {

    // stub Gateway calls
    (Gateway.prototype.connect as any) = jest.fn(() => Promise.resolve('ok!'));
    (Gateway.prototype.getNetwork) = jest.fn(() => Promise.reject(new Error('network does not exist')));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, { success: false, message: 'network does not exist' });
  });

  test('should fail to get chaincode that does not exist', async () => {
    // stub Gateway calls
    (Gateway.prototype.connect as any) = jest.fn(() => Promise.resolve('ok!'));
    const fakeGetContract = jest.fn(() => Promise.reject(new Error('contract does not exist')));
    jest.spyOn(Gateway.prototype, 'getNetwork' as any).mockReturnValue(Promise.resolve('ok!'));
    (Gateway.prototype.getNetwork as any) = jest.fn(() => Promise.resolve({
      getContract: fakeGetContract,
    }));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, { success: false, message: 'contract does not exist' });
  });

  test('should set up gateway and middleware and ping chaincode successfully', async () => {
    // stub Gateway calls
    const fakePingCC = jest.fn(() => Promise.resolve('successfully pinged chaincode'));
    const fakeGetContract = jest.fn(() => Promise.resolve({
      submitTransaction: fakePingCC,
    }));
    const connect = jest.spyOn(Gateway.prototype, 'connect' as any);
    (Gateway.prototype.getNetwork as any) = jest.fn(() => Promise.resolve({
      getContract: fakeGetContract,
    }));

    await fabricRoutes.setup();
    fakeUtilReset();

    expect(connect.mock.calls[0][0]).toBe(ccp);
    expect(connect.mock.calls[0][1]).toMatchObject({
      identity: process.env.FABRIC_ENROLL_ID,
      discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled }});

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(200, { success: true, result: 'successfully pinged chaincode' });
  });

  test('should get unauthorized error when calling secure route without token', async () => {
    // stub Gateway calls
    const fakePingCC = jest.fn(() => Promise.resolve('successfully pinged chaincode'));
    const fakeGetContract = jest.fn(() => Promise.resolve({
      submitTransaction: fakePingCC,
    }));
    const connect = jest.spyOn(Gateway.prototype, 'connect' as any).mockReturnValue(Promise.resolve('ok!'));
    (Gateway.prototype.getNetwork as any) = jest.fn(() => Promise.resolve({
      getContract: fakeGetContract,
    }));

    await fabricRoutes.setup();
    fakeUtilReset(); // reset util so util.sendResponse is called properly

    // assert gateway.connect is called with correct args
    expect(connect.mock.calls[0][0]).toBe(ccp);
    expect(connect.mock.calls[0][1]).toMatchObject({
      identity: process.env.FABRIC_ENROLL_ID,
      discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled }});

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/securedPing')
      .expect(401);
  });
});

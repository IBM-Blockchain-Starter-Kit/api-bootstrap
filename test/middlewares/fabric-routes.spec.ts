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

import * as config from 'config';
import * as express from 'express';
import { FileSystemWallet } from 'fabric-network';
import { Gateway } from 'fabric-network';
import * as fs from 'fs';
import { getLogger } from 'log4js';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as request from 'supertest';
// tslint:disable-next-line
Promise = require('bluebird');
import * as util from '../../server/helpers/util';

import * as ccp from '../mocks/config/fabric-connection-profile.json';
import * as fabricConfig from '../mocks/config/fabric-connections.json';

jest.mock('../../server/config/fabric-connection-profile.json', () => (ccp));
jest.mock('../../server/config/fabric-connections.json', () => (fabricConfig));

import FabricRoutes from '../../server/middlewares/fabric-routes';

// fake cert and key for enrollment
const cert = fs.readFileSync(`${__dirname}/../mocks/cert`, 'utf8');
const key = fs.readFileSync(`${__dirname}/../mocks/key`, 'utf8');
const orgName: string = config.get('orgName');
const { mspid } = ccp.organizations[orgName];

describe('middleware - fabric-routes', () => {
  let fabricRoutes;
  let router;
  let fakeUtilReset;

  beforeAll(() => {
    // delete test wallet before starting
    rimraf.sync(config.get('fsWalletPath'));
  });
  afterAll(() => {
    // delete test wallet after tests
    rimraf.sync(config.get('fsWalletPath'));
  });

  beforeEach(() => {
    // set fake util.userEnroll call for fabricRoutes.setup()
    // const fakeUserEnroll = () => Promise.resolve({ certificate: cert, key, mspid });
    // const fakeSendResponse = jest.fn();
    // jest.mock('../../server/helpers/util', () => (({sendResponse: fakeSendResponse, userEnroll: fakeUserEnroll })));
    // stub util calls
    // const FakeUtil = {
    //   // tslint:disable-next-line: no-empty
    //   sendResponse: (res, jsonRes) => { },
    // };
    (util.userEnroll as any) = jest.fn(() => Promise.resolve({ certificate: cert, key, mspid }));
    fakeUtilReset = (util.sendResponse as any) = jest.fn(() => Promise.resolve());
    router = express.Router();
    fabricRoutes = new FabricRoutes(router);
  });

  test('should fail to connect to gateway', async () => {
    // stub Gateway calls
    (Gateway.prototype.connect) = jest.fn(() => Promise.reject(new Error('error connecting to gateway')));

    await expect(fabricRoutes.setup()).rejects.toThrowError(Error);
  });

  test('should fail to get channel that does not exist', async () => {

    // stub Gateway calls
    (Gateway.prototype.getNetwork) = jest.fn(() => Promise.reject(new Error('network does not exist')));
    (Gateway.prototype.connect as any) = jest.fn(() => Promise.resolve('ok!'));

    await fabricRoutes.setup();
    fakeUtilReset.mockReset(); // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, { success: false, message: 'network does not exist' });
  });

  test('should fail to get chaincode that does not exist', async () => {
    // stub Gateway calls
    (Gateway.prototype.connect) = jest.fn(() => Promise.resolve());
    const fakeGetContract = () => Promise.reject(new Error('contract does not exist'));
    (Gateway.prototype.getNetwork as any) = jest.fn(() => Promise.resolve({
      getContract: fakeGetContract,
    }));

    await fabricRoutes.setup();
    fakeUtilReset.mockReset(); ; // reset util so util.sendResponse is called properly

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/ping')
      .expect(500, { success: false, message: 'contract does not exist' });
  });

  test.only('should set up gateway and middleware and ping chaincode successfully', async () => {
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
    // fakeUtilReset.mockReset();; // reset util so util.sendResponse is called properly

    // assert gateway.connect is called with correct args
    //expect(connect).toEqual(ccp, {
    //   identity: process.env.FABRIC_ENROLL_ID,
    //   discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled },
    // });

    //expect(connect.mock.calls[0][0]).toEqual(ccp);
   // expect(mockFn.mock.calls[0][1]).toEqual('second argument');

    expect(connect.mock.calls[0][1]).toHaveProperty('wallet');

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
    // fakeUtilReset.mockReset();; // reset util so util.sendResponse is called properly

    // assert gateway.connect is called with correct args
    expect(connect).toHaveBeenCalledWith(ccp, {
      identity: process.env.FABRIC_ENROLL_ID,
      discovery: { asLocalhost: fabricConfig.serviceDiscovery.asLocalhost, enabled: fabricConfig.serviceDiscovery.enabled },
    });

    expect(connect.mock.calls[0][1]).toBeInstanceOf(FileSystemWallet);

    const app = express();
    app.use(router);

    // test actual router with supertest server
    await request(app)
      .get('/securedPing')
      .expect(401);
  });
});

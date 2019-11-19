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

// tslint:disable-next-line
Promise = require('bluebird');

describe('controllers - ping', () => {

  // fake util send response call
  const FakeUtil = {
    // tslint:disable-next-line: no-empty
    sendResponse: (res, jsonRes) => { },
  };

  let res: any;
  // tslint:disable-next-line: prefer-const
  let req: any;
  let spy: jest.SpyInstance<void, [any, any]>;

  jest.mock('../../server/helpers/util', () => (FakeUtil));
  const pingCtrl = require('../../server/controllers/ping');

  beforeEach(() => {
    spy = jest.spyOn(FakeUtil, 'sendResponse');
  });

  afterEach(() => {
    spy.mockRestore();
  });
  
  test('should successfully invoke transaction ping', async () => {
    const fakePingCC = jest.fn(() => Promise.resolve('successfully pinged chaincode'));
    res = { locals: { defaultchannel: { mycontract: { submitTransaction: fakePingCC } } } };
    await pingCtrl.default(req, res);

    expect(FakeUtil.sendResponse).toBeCalledWith(res, { statusCode: 200, success: true, result: 'successfully pinged chaincode' });
  });

  test('should catch Health tx error and return error', async () => {
    const fakePingCC = jest.fn(() => Promise.reject(new Error('error in Health chaincode')));
    res = { locals: { defaultchannel: { mycontract: { submitTransaction: fakePingCC } } } };
    await pingCtrl.default(req, res);

    expect(FakeUtil.sendResponse).toBeCalledWith(res, { statusCode: 500, success: false, message: 'error in Health chaincode' });
  });
});

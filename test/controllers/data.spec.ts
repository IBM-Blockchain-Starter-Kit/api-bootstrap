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
import { getLogger } from 'log4js';

// fake util send response call
const FakeUtil = {
  // tslint:disable-next-line: no-empty
  sendResponse: (res, jsonRes) => { },
}; 

describe('controllers - data', () => {

  jest.mock('../../server/helpers/util', () => (FakeUtil));
  const dataCtrl = require('../../server/controllers/data');

  let res: any;
  // tslint:disable-next-line: prefer-const
  let req: any;
  let spy: jest.SpyInstance<void, [any, any]>;

  beforeEach(() => {
    spy = jest.spyOn(FakeUtil, 'sendResponse');
  });

  afterEach(() => {
    spy.mockRestore();
  });
  test('should successfully call dataCtrl', async () => {
    await dataCtrl.default(req, res);
    expect(FakeUtil.sendResponse).toBeCalledWith(res, { statusCode: 200, success: true, result: 'data has been validated successfully' });
  });

});

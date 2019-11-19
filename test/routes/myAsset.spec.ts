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
import * as request from 'supertest';

describe('routes - myAsset', () => {

  const jsonResp = { success: true, result: { value: "value1" } };
  const deleteResp = { success: true, result: "key1" };

  // Create mock/stub handlers for myAsset
  const CreateMyAssetCtrlStub = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json(jsonResp);
    },
  };

  const GetMyAssetCtrlStub = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json(jsonResp);
    },
  };

  const UpdateMyAssetCtrlStub = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json(jsonResp);
    },
  };

  const DeleteMyAssetCtrlStub = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json(deleteResp);
    },
  };

  // Assign mock/stub objects to corresponding controller
  jest.mock('../../server/controllers/createMyAsset', () => (CreateMyAssetCtrlStub));
  jest.mock('../../server/controllers/getMyAsset', () => (GetMyAssetCtrlStub));
  jest.mock('../../server/controllers/updateMyAsset', () => (UpdateMyAssetCtrlStub));
  jest.mock('../../server/controllers/deleteMyAsset', () => (DeleteMyAssetCtrlStub));

  // Load module to be tested
  const myAsset = require('../../server/routes/myAsset');

  // Set up app object
  const app = express();
  app.use(myAsset);

  test('should add createMyAsset route successfully', async () => {
    await request(app)
      .post('/')
      .expect(200, jsonResp);
  });

  test('should add getMyAsset route successfully', async () => {
    await request(app)
      .get('/')
      .expect(200, jsonResp);
  });

  test('should add updateMyAsset route successfully', async () => {
    await request(app)
      .put('/')
      .expect(200, jsonResp);
  });

  test('should add deleteMyAsset route successfully', async () => {
    await request(app)
      .delete('/')
      .expect(200, deleteResp);
  });

});

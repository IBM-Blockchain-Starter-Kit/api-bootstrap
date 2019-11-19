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

describe('routes - myAssetExists', () => {

  const jsonResp = { success: true, result: true };

  // Create mock/stub handlers for myAsset
  const myAssetExistsCrtlStub = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json(jsonResp);
    },
  };

  // Assign mock/stub objects to corresponding controller
  jest.mock('../../server/controllers/myAssetExists', () => (myAssetExistsCrtlStub));

  // Load module to be tested
  const myAssetExists = require('../../server/routes/myAssetExists');

  // Set up app/express object
  const app = express();
  app.use(myAssetExists);

  test('should add myAssetExists route successfully', async () => {
    await request(app)
      .get('/')
      .expect(200, jsonResp);
  });

});

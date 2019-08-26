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

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'supertest';

import * as errorHandler from '../../server/middlewares/error-handler';

describe('middleware - error-handler', () => {

  // set up fake router with route that returns error
  const router = express.Router();
  router.get('/error', (req, res) => {
    throw new Error('error in route');
  });

  const app: express.Application = express();
  app.use(errorHandler.catchNotFound);
  app.use(errorHandler.handleError);

  test('should catch not found', async () => {
    // test actual router with supertest server
    const res = request(app)
      .get('/doesnotexist')
      .set('Accept', 'application/json')
      .expect(404); // TO DO: Issue with supertest not returning the body, just checking status
  });

  test('should catch thrown error', async () => {
    await request(app)
      .get('/error')
      .expect(404); // TO DO: Issue with supertest not returning the body, just checking status
  });
});

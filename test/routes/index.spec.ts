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
import * as express from 'express';
import * as request from 'supertest';
import FabricRoutes from '../../server/middlewares/fabric-routes';
import setupRoutes from '../../server/routes/index';

describe('routes - index', () => {

  describe('setupRoutes', () => {
    test('should set up routes successfully', async () => {
      (FabricRoutes.prototype.setup) = jest.fn(() => {
        return Promise.resolve();
      });

      const router = await setupRoutes();
      expect(Object.getPrototypeOf(router) === express.Router).toBe(true);

      // test actual router with supertest server
      const app = express();
      app.use(router);
      await request(app)
        .get('/')
        .expect(302); // test redirect route
    });

    test('should fail to setup routes', async () => {
      (FabricRoutes.prototype.setup) = jest.fn(() => {
        return Promise.reject(new Error('error setting up routes'));
      });
      try {
        await setupRoutes();
      } catch (e) {
        expect(e.message).toMatch('error setting up routes');
      }
    });
  });
});

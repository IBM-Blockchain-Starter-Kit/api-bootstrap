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
import * as proxyquire from 'proxyquire';
import * as sinon from 'sinon';
import * as request from 'supertest';
import * as server from '../server/server';
// tslint:disable-next-line
Promise = require('bluebird');

const host = process.env.HOST || config.get('host');
const port = process.env.PORT || config.get('port');
const url = `http://${host}:${port}`;

// set up fake router to return for setupRoutes()
const router = express.Router();
router.get('/', (req, res) => {
  res.redirect('/api-docs');
});

describe('server start up', () => {

  describe('startup fail', () => {
    test('should gracefully handle error', async () => {
      // const server = proxyquire.noCallThru().load('../server/server.ts', {
      //   './routes/index.ts': jest.fn(() => Promise.reject(new Error('failed to set up routes'))),
      // });
      const server1 = jest.mock('../server/routes/index', () => Promise.resolve(router));
    });
  });
  describe('startup success', () => {
    // const server = proxyquire('../server/server.ts', {
    //   './routes/index.ts': sinon.stub().returns(Promise.resolve(router)),
    // });

    describe('/doesnotexist', () => {
      test('should return 404', async () => {
        const res = await request(url).get('/doesnotexist');
        expect(res.status).toBe(404);
        expect(res.body).resolves.toBe('object');
        expect(res.body.success).toBe(false);
      });
    });

    describe('/', () => {
      test('should redirect to /api-docs', async () => {
        const res = await request(url).get('/');
        expect(res).toHaveProperty(`${url}/api-docs`);
        expect(res.status).toBe(301);
      });
    });
  });
});

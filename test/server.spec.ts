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
import * as request from 'supertest';

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

  let server;
  beforeEach(() => {
    server = require('../server/server');
  });

  afterAll(() => {
    server.close();
  });

  describe('startup fail', () => {
    test('should gracefully handle error', () => {
      jest.mock('../server/routes/index', () => ({ default: jest.fn(() => Promise.reject(new Error('failed to set up routes'))) }));
    });
  });
  describe('startup success', () => {
    jest.mock('../server/routes/index', () => ({ default: jest.fn(() => Promise.resolve(router)) }));
    describe('/doesnotexist', () => {
      test('should return 404', async () => {
        const res = await request(url).get('/doesnotexist')
        expect(res.status).toBe(404);
        expect(typeof res.body).toBe('object');
        expect(res.body.success).toBe(false);
      });
    });

    describe('/', () => {
      test('should redirect to /api-docs', async () => {
        const res = await request(url).get('/').set('Content-Type', 'application/json');
        expect(res.header.location).toBe(`/api-docs`);
        expect(res.status).toBe(302);
      });
    });
  });
});

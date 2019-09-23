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

describe('routes - data', () => {

  // mock route handler since it requires a call out to blockchain network
  const FakeDataCtrl = {
    default: (req, res) => {
      res.statusCode = 200;
      res.json({success: true, result: 'Success'});
    },
  };

  jest.mock('../../server/controllers/data', () => (FakeDataCtrl));
  const data = require('../../server/routes/data');

  test('should post data route successfully', async () => {
    // test actual router with supertest server
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(data);

    const valueIn = {
        id: 'validId',
        stringValue: 'validstring',
        numValue: 100,
        dateValue: '10-19-2019',
        emailValue: 'valid@email.com',
    };

    await request(app)
      .post('/')
      .type('form')
      .send(valueIn)
      .expect(200, {success: true, result: 'Success'});
  });

  test('should fail validation with missing "id" on post data route', async () => {
    // test actual router with supertest server
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(data);

    const valueIn = {
        stringValue: 'validstring',
        numValue: 100,
        dateValue: '10-19-2019',
        emailValue: 'valid@email.com',
    };

    await request(app)
      .post('/')
      .type('form')
      .send(valueIn)
      .expect(400);
  });

  test('should fail validation with invalid "email" on post data route', async () => {
    // test actual router with supertest server
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(data);

    const valueIn = {
        id: 'validId',
        stringValue: 'validstring',
        numValue: 100,
        dateValue: '10-19-2019',
        emailValue: 'invalidemail.com',
    };

    await request(app)
      .post('/')
      .type('form')
      .send(valueIn)
      .expect(400);
  });

});

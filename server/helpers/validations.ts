/**
 * Copyright 2018 IBM Corporation. All Rights Reserved.
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
 *
 */

import * as Joi from '@hapi/joi';
import * as config from 'config';
import { getLogger } from 'log4js';

/**
 * Set up logging
 */
const logger = getLogger('helpers - util');
logger.level = config.get('logLevel');

const dataKeys = {
    id: Joi.string().trim().max(100).required().label('id'),
    stringValue: Joi.string().trim().required().label('stringValue'),
    numValue: Joi.number().required().label('numValue'),
    dateValue: Joi.date().required().label('dateValue'),
    emailValue: Joi.string().email({ minDomainSegments: 2 }).required().label('emailValue'),
};

export async function addData(req, res, next): Promise<any> {

    const schema = Joi.object({
        id: dataKeys.id,
        stringValue: dataKeys.stringValue,
        numValue: dataKeys.numValue,
        dateValue: dataKeys.dateValue,
        emailValue: dataKeys.emailValue,
      }, {
        convert: true,
      });

    try {
      const value = await schema.validateAsync(req.body);
      req.body = value;
      next();
    } catch (err) {
      logger.error(err.message);
      res.status(400).send(err.message);
    }

}

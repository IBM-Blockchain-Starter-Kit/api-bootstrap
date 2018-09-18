[![Build Status](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap.svg?branch=master)](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap)

**NOTE: This is WIP!**
<br>This component does not have the plumbing code required to connect to a Fabric network yet. The project does not have any of the Fabric client dependencies required, but we will be adding the fabric-helper code soon to aid with that.

# REST API Scaffold for use in Blockchain Starter Kit

## Running the server
```
$ npm install
$ npm start
```

Navigate to http://localhost:3000/health/ to ensure server is up and running

Navigate to the Swagger UI at: http://localhost:3000/api-docs/

## Running tests
```
$ npm run test
```

## Development
This app is built using node.js and the [express.js framework](https://expressjs.com/). The entire backend application is found within the *server* directory. The *public* directory contains the swagger.yaml used by the Swagger UI to display API definitions. Note that we use the [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) npm package to serve and render the Swagger UI, instead of directly including the ui source code.

To start the server in development mode, run `npm run dev`. This will start the server with [nodemon](https://github.com/remy/nodemon), which automatically restarts the node app when you make file changes. It simplifies testing when making changes and adding functionality.

The server is configured and started from the *server/server.js* file. Routers that contain all the routes of your app are added in the *routes* directory. The corresponding controllers/handlers (the logic performed when those apis are called) of those routes are found in the *controllers* directory. When adding a new route to the api, you will first create a new router (or add to an existing router) in the *routes* directory, and also include it in *routes/index.js*. Then you will add the logic function in the *controllers* directory. For example, if I wanted to add a new `/ping` route, you would create a *routes/ping.js* file. The file's contents would look like this:

```
const express = require('express');
const log4js = require('log4js');
const config = require('config');

// controller logic for this route
const pingCtrl = require('../controllers/ping');

const router = express.Router(); // create new router

/**
 * Set up logging
 */
const logger = log4js.getLogger('routes - ping');
logger.setLevel(config.logLevel);

logger.debug('setting up /ping route');

/**
 * Add routes
 */
router.get('/', ping.pingCC); // specify path and controller function for this route

module.exports = router; // export router
```

Routes are registered to the server by taking the exported router in *routes/index.js*, which basically takes all of the routers in the directory and combines them to pass to the express.js app. At this point, we've created the new router, but it won't be registered with the express app. To do that, we need to open *routes/index.js* and add the following lines:

```
const ping = require('./ping');
router.use('/ping', ping);
```

Now all we need to add is the logic. Create a *controllers/ping.js* file. Remember our function name needs to match what we specified when adding the route to the router. The file's contents would look something like this:

```
const log4js = require('log4js');
const config = require('config');

const util = require('../helpers/util');

const logger = log4js.getLogger('controllers - ping');
logger.setLevel(config.logLevel);

/**
 * Controller object
 */
const ping = {};

ping.pingCC = (req, res) => {
  logger.debug('inside pingCC()...');
  
  // ping chaincode

  const jsonRes = {
    statusCode: 200,
    success: true,
    message: 'Pinged chaincode successfully!',
  };

  util.sendRespone(res, jsonRes);
};

module.exports = ping;
```

That's it, you now have a new route in your server! Remember it's important to keep your *swagger.yaml* up to date when you add new endpoints or make changes to existing ones.

The *middlewares* directory contains any middleware that is used in the app, such as error handling in *error-handler.js*.

The *helpers* directory contains any helper functions used in the app, such as a send response helper in *util.js* to send a request response back.

For full API Reference and Documentation, start the server and navigate to http://localhost:3000/api-docs/.

## Testing
The [mocha framework](https://mochajs.org/) along with the [chai library](http://www.chaijs.com/) is used for testing in this project. [nyc (istanbul)](https://github.com/istanbuljs/nyc) is used to display test coverage. All test files are found in the *test* directory. Ensure you update and add tests as you make changes to the app. Always aim for 100% test coverage. There are, of course, other test options that can be used. [Postman](http://blog.getpostman.com/2017/10/25/writing-tests-in-postman/) is another popular choice.

## To be added...
- fabric-helper
  - call to ping chaincode function
- rest api authentication

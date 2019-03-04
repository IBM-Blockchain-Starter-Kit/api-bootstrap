[![Build Status](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap.svg?branch=master)](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap)

**NOTE: This is WIP!**

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

## Fabric Network Getting Started
The app has boilerplate code to make a call out to a chaincode running on a Fabric network. It uses the new [fabric-network](https://www.npmjs.com/package/fabric-network) package. Some changes to default config files and values need to be made in order to hook up to **your** Fabric network.

- Download one of your 'common connection profile' json files and copy it into the *fabric-network* directory, naming it *network-config-\<orgname>.json*. For instructions on how to do that on the IBM Blockchain Platform, see [here](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-app#ibp-console-app-profile).

- In *server/controllers/ping.js*, you will see a `default user and org` section. Update the org and then ensure that the *FABRIC_ENROLL_ID* and *FABRIC_ENROLL_SECRET* environment variables are set with a user that has been registered to that org. **Hint:** For instructions on how to register an application user/identity on the IBM Blockchain Platform, see [here](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-app#ibp-console-app-identities).

- *server/controllers/ping.js* also has two calls out to the chaincode. There are two calls for demonstrative purposes. The first is to invoke a transaction that will actually be endorsed and committed to the ledger (submitTransaction). The second is to do a simple query to the ledger (evaluateTransaction). You can find more information for those two calls [here](https://fabric-sdk-node.github.io/Contract.html).
<br>A few changes to call out to your specific chaincode are required. 1) Update `Health` in `const queryResponse = await contract.evaluateTransaction('Health');` to whatever your chaincode function name is, and add any additional parameters needed 2) Update `chaincodeName` and `channelName` in *server/config/default.json* to the channel name and chaincode name on your network.

- **Important Note:** If you are taking advantage of Service Discovery, which is enabled by default on IBP 2.0, make note of updating the `discovery.enabled` field of the `gateway.connect` call in *server/controllers/ping.js* to *true*. Otherwise, you will need to add the `channels` field in your connection profile to explicitly give the peer endpoints for endorsement. For example, something like:

```
"channels": {
  "channel1": {
    "orderers": ["<orderer endpoint>"],
    "peers": {
      "<peer1 endpoint>": {},
      "<peer2 endpoint": {}
    }
  }
},
```

After making those changes, you can `GET http://localhost:3000/ping` to see the result.

### Under the covers
You should have a good understanding of how a Hyperledger Fabric network and its SDK to interact with it works, but there are some high level concepts outlined here to understand the flow.

A *FileSystemWallet* is used to manage identities for interacting with the network. More information can be found in the [Hyperledger Fabric SDK for node.js doc](https://fabric-sdk-node.github.io/FileSystemWallet.html). Look in *server/helpers/wallet.js* for some wallet helper functions.

A gateway to talk to the network is established with the [*Gateway*](https://fabric-sdk-node.github.io/Gateway.html) class, by passing the common connection profile, a specified identity, and the wallet that contains that identity.
```
// gateway and contract connection
await gateway.connect(ccp, {
  identity: user,
  wallet: walletHelper.getWallet(),
});
```

Once the gateway is established, you connect to the channel by a [*getNetwork*](https://fabric-sdk-node.github.io/Gateway.html#getNetwork__anchor) call to the gateway.
```
const network = await gateway.getNetwork(config.channelName);
```

Then make a call to get the chaincode with a [*getContract*](https://fabric-sdk-node.github.io/Network.html#getContract__anchor) call.
```
const contract = await network.getContract(config.chaincodeName);
```

Once you have the contract object, you can start invoking and querying the chaincode!
```
// invoke transaction
const invokeResponse = await contract.submitTransaction('Health');

// query
const queryResponse = await contract.evaluateTransaction('Health');
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
- rest api authentication

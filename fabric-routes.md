# Fabric Routes Custom Middleware

As mentioned in some sections above, this application uses a custom module that will dynamically create and mount middleware functions that connect to a Fabric gateway. It is used for any routes in your application that need to connect to the Fabric network. In a nutshell, this module allows you to specify in a config file which routes in your application need to connect to which channels and chaincodes in your Fabric network. The module then parses that file, and dynamically creates middleware functions that create a Gateway instance, connect to it, get and store the specified channel and chaincode instances for use in the route handler function. The middleware functions are then mounted to the routes specified in the config file.

Let's go through the config file in detail to fully understand what happens under the covers and to fully understand how to configure our file.

## Config File
The module is found at *server/middlewares/fabric-routes.js* and searches for the config file at *server/config/fabric-connections.json*. There is already an example file there. Below is an example to follow along with as you read through the rest of this section.

```
{
  "fabric-connections": {
    "serviceDiscovery": {
      "enabled": true,
      "asLocalhost": false
    },
    "conn1": [
      {
        "channel": "defaultchannel",
        "chaincodes": [
          "pingcc"
        ]
      }
    ],
    "conn2": [
      {
        "channel": "channel2",
        "chaincodes": [
          "pingcc",
          "chaincode2"
        ]
      }, {
        "channel": "channel3",
        "chaincodes": [
          "pingcc",
          "chaincode3"
        ]
      }
    ]
  },
  "routes": [
    {
      "path": "/ping",
      "fabric-connection": "conn1",
      "modulePath": "routes/ping"
    },
    {
      "path": "/securedPing",
      "fabric-connection": "conn1",
      "modulePath": "routes/securedPing", 
      "protected" : {
        "enabled": true, 
        "allowedClients": [
          "<clientIds>"
        ]
      }
    }
  ]
}
```

The *fabric-connections* JSON file has two main keys: `fabric-connections` and `routes`. The `fabric-connections` object defines the different Fabric connections you will need in your application. For example, in the example you see two connections specified: `conn1` and `conn2`. `conn1` is the simplest connection you can define; you connect to 1 channel and 1 chaincode on that channel. `conn2` shows something a little more complex; you connect to 2 different channels and 2 different chaincodes on each channel. Each connection defines what you will need in order to do your invokes and queries in a specific route handler. `fabric-connections` also has configuration for enabling Service Discovery, which is the default in IBM Blockchain Platform 2.0. For Service Discovery, you must add anchor peers to your channel. Without Service Discovery enabled, you will need to add the `channels` field in your connection profile to explicitly give the peer endpoints for endorsement. For example, something like:

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

In the second key, `routes`, you add all the routes in your app that need to connect to the Fabric network. For each route, you specify the route path, the fabric-connection the handler for that route will need and the path to the router module where you have defined this route and its handler function. The router module path should be relative to the root of your server app, aka from within the *server* directory. For this example, we have one route defined that uses the `conn1` connection and whose router module is defined at *routes/ping.js* (read the Development section above if you need further clarification on the router). Each route can have only a single fabric-connection, but a fabric-connection can be mapped to multiple routes. Inside of `routes` you have the ability to enable authentication with [IBM App ID](https://cloud.ibm.com/docs/services/appid?topic=appid-about#about) by providing the `protected` object with the `allowedClients` array of client id's that are allowed to access the endpoint. See the `securedPing` route example in the snippet above. 


## What does this configuration give you?
Following the example file, when it comes time to implement our ping route handler, we already have a ready-to-use fabric-network Gateway instance where we can invoke and query the chaincode(s) we need. To invoke or query the chaincode(s) defined in the fabric-connection for this route, you simply need to do the following call: `await res.locals.<channelName>.<chaincode>.submitTransaction()` or `await res.locals.<channelName>.<chaincode>.evaluateTransaction()`.

## How does it all come together?
Everything is configured and defined, but how does it all come together and how is it all registered to our Express app? In order to register these routes and mount their dynamically created fabric-connection middleware functions, you have to add the following in the *routes/index.js* file:

```
const { FabricRoutes } = require('../middlewares/fabric-routes');

// Hyperledger Fabric routes
// add specified routes and create their middleware functions to connect to the fabric network
const fabricRoutes = new FabricRoutes(router);
fabricRoutes.setup();
```

This will wrap all of our routes in our config file with middleware that creates the Fabric gateway instance and middleware that disconnects from that gateway instance. This is what happens under the covers of the `fabricRoutes.setup()` call:

1) A middleware function for each connection in the config file is created
   * Config file is parsed
   * For each fabric-connection in config file, a middleware function is created that:
     * Creates a Gateway instance and connects to it with default values. Stores the gateway instance at `res.locals.gateway`
     * Gets a Network instance for each channel specified in the connection. Stores the network instance at `res.local.<channelName>`
     * Gets the Contract instance for each chaincode specified in the channel. Stores the contract instance at `res.local.<channelName>.<chaincodeName>`
2) A middleware function that disconnects from `res.local.gateway` is created
3) For each route, the middleware to connect to Fabric is mounted, then the router module for that path is registered, and finally the middleware to disconnect from the gateway is mounted. The final flow of the route is: Fabric connect middleware -> other middleware specified in the router module -> route handler -> Fabric disconnect middleware.

To deep dive into this module, take a look at the source code and its comments: *server/middlewares/fabric-routes.js*

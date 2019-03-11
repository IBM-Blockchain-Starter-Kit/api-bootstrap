const BluePromise = require('bluebird');

const SwaggerExpress = BluePromise.promisifyAll(require('swagger-express-mw'));
const SwaggerParser = require('swagger-parser');
const swaggerUi = require('swagger-ui-express');
const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const log4js = require('log4js');
const config = require('config');
const yaml = require('js-yaml');


const logger = log4js.getLogger('server');
logger.setLevel(config.logLevel);

const { authenticate } = require('./middlewares/authenticate');

const swaggerFile = {
  source: './public/swagger.yaml',
  destination: './api/swagger-v1.yml',
  nodeConfig: './config/swagger-node.yml',
  json: 'swagger-v1.json',
};
const PORT = process.env.port || '3000';

const initialize = () => {
  const swaggerConfig = {
    appRoot: __dirname,
    swaggerSecurityHandlers: {
      ApiKeyAuth: authenticate,
    },
  };


  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({
    limit: '50mb',
    type: 'application/json',
  }));
  app.use(cors({
    origin: '*',
  }));
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'IBM');
    res.setHeader('X-Version', '1.0');
    next();
  });

  // Validate the swagger file definition
  SwaggerParser.validate(swaggerFile.source)
    .catch(err => logger.error(`Swagger Error: ${err}`));

  // Read the swagger-node config
  const swaggerNodeConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, swaggerFile.nodeConfig), 'utf8'));

  Object.assign(swaggerConfig, swaggerNodeConfig.swagger);
  const onReady = SwaggerParser.bundle(swaggerFile.source)
    .then((api) => {
      swaggerConfig.swagger = api;

      app.get('/api/v1/swagger-v1.json', (req, res) => {
        res.json(swaggerConfig.swagger);
      });

      const port = PORT ? `:${PORT}` : '';
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
        swaggerUrl: `http://${swaggerConfig.swagger.host}${port}${swaggerConfig.swagger.basePath}/${swaggerFile.json}`,
      }));


      return SwaggerExpress.createAsync(swaggerConfig);
    })
    .then((swaggerExpress) => {
      logger.info('Initialize blockchain service');
      return swaggerExpress;
    })
    .then((swaggerExpress) => {
      logger.info('Registering swagger express application');
      swaggerExpress.register(app);
      return app;
    })
    .then((instance) => {
      instance.listen(PORT, '0.0.0.0', () => { });
      logger.info(`Success! API Server started. Listening on port: ${PORT}`);
    });
  module.exports = onReady;
};

initialize();

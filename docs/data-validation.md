# Data Validation

In this application, we demonstratrate an example of data validation to verify a request body for an endpoint.  <b>For blockchain applications, the developer should make sure to place the business logic and rules in the chaincode itself</b>.  This validation logic is added here as an example in case that there is a need to perform some validation up-front before reaching the chaincode. Other cases includes if validation cannot be performed on the chaincode side, such as when using an external blockchain storage service (i.e. BDS). 

This api-bootstrap provides validation on a data schema for a `POST` endpoint. This is done by creating middleware which validates the request body, to ensure that the required fields are provided with correct data format, before passing the request to a controller function.  This validation makes use of the [@hapi/joi](https://www.npmjs.com/package/@hapi/joi) npm package which provides simple syntax to create requriements for the data fields and objects.

This api-bootstrap contains an example route `/data` that leverages the data validation middleware.  This route details are provided in the `public/swagger.yaml` which presents the endpoint on the swagger api when the app is launched. The request body prompted by the endpoint looks like:
```
{
  "id": "string",
  "stringValue": "string",
  "numValue": 0,
  "date": "2019-09-18T22:21:45.226Z",
  "email": "user@example.com"
}
```

When the `POST /data` endpoint is exectued, this data schema is routed through the `server/routes/data.ts` file.  The router provides the schema validation middleware and the controller functioon to land on once validatied:
```
router.post('/', schemaValidations.addData, dataCtrl.default);
```

This `schemaValidations.addData` calls the validation for this call in the `server/helpers/validation.ts` module.  Here the schema for the req.body object is defined as thus:
```
const schema = Joi.object({
    id: Joi.string().trim().max(100).required().label('id'),
    stringValue: Joi.string().trim().required().label('stringValue'),
    numValue: Joi.number().required().label('numValue'),
    dateValue: Joi.date().required().label('dateValue'),
    emailValue: Joi.string().email({ minDomainSegments: 2 }).required().label('emailValue'),
});
```

This shows the <b>Joi</b> syntax for defining particular fields such as object, string, number, date and email.  It marks each field in the object as required for the data body.  [Joi](https://github.com/hapijs/joi)'s data validation library provides validation for multiple type of data attributes. It also allows creating custom validation and updating fields along the way.

This example eventually leads the data to a controller function in `server/controllers/data.ts`. This function <b>does not</b> make any calls to the blockchain network and returns with `statusCode: 200`. The developer can add logic here to invoking this data on the blockchain network as they see fit for their application.

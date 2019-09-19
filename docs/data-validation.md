# Data Validation

This api-bootstrap provides an example of providing validation on a data schema for a `POST ` endpoint.  This is done by creating middleware which validates the request body, to ensure that the required fields are provided with correct data format, before passing the request to a controller function.  This validation makes use of the [@hapi/joi](https://www.npmjs.com/package/@hapi/joi) npm package which provides simple syntax to create requriements for the data fields and objects.

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
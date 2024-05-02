const Joi = require("joi");
const { objectId } = require("./custom.validation");

/**
 * Example url: `/v1/users/:userId`
 * Validate the "userId" url *params* field. "userId" value should be a
 * - string
 * - valid Mongo id -> Use the helper function in src/validations/custom.validation.js
 */
const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

// TODO: CRIO_TASK_MODULE_CART - Implement request validation for "/v1/users/:userId" endpoint
/**
 * Validate the "userId" url *params* field for the "/v1/users/:userId" endpoint.
 * "userId" value should be a valid Mongo id -> Use the helper function in src/validations/custom.validation.js
 * Additionally, validate the "address" in the *body* field.
 * "address" should be a string and required with a minimum length of 20 characters.
 */
const setAddress = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    address: Joi.string().required().min(20),
  }),
};

module.exports = {
  getUser,
  setAddress,
};

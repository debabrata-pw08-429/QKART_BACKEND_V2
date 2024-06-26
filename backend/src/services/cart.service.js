const httpStatus = require("http-status");
const { Cart, Product, User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const productService = require("../services/product.service");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const { email } = user;
  const result = await Cart.findOne({ email: email });
  if (result) {
    return result;
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    try {
      const newCartDocument = new Cart({
        email: user.email,
        cartItems: [],
      });
      userCart = await newCartDocument.save();
    } catch (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  const productExistsInCart = userCart.cartItems.find(
    (ele) => ele.product._id.toString() === productId
  );
  console.log(productExistsInCart);
  if (productExistsInCart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  }

  const productExistsInDatabase = await productService.getProductById(
    productId
  );
  console.log(productExistsInCart);
  if (!productExistsInDatabase) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  // await Cart.updateOne(
  //   { email: user.email },
  //   {
  //     $push: {
  //       cartItems: {
  //         product: productExistsInDatabase,
  //         quantity: quantity,
  //       },
  //     },
  //   },
  //   {new: true}
  // );
  userCart.cartItems.push({
    product: productExistsInDatabase,
    quantity: quantity,
  });
  // let res = await Cart.findOne({ email: user.email });
  let res = await userCart.save();
  return res;
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  const newProduct = await Product.findById(productId);
  if (!newProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  const productExistsInUsersCart = userCart.cartItems.find(
    (ele) => ele.product._id.toString() === productId
  );
  if (!productExistsInUsersCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  userCart.cartItems.forEach((ele) => {
    if (ele.product._id.toString() === productId) {
      ele.quantity = quantity;
    }
  });

  let res = await userCart.save();
  return res;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  let productToUpdate = userCart.cartItems.find(
    (ele) => ele.product._id.toString() === productId
  );
  if (!productToUpdate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  let index = -1;

  userCart.cartItems.forEach((ele, i) => {
    if (ele.product._id.toString() === productId) {
      index = i;
    }
  });

  userCart.cartItems.splice(index, 1);
  let res = await userCart.save();
  return res;
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (userCart === null) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }

  if (userCart.cartItems.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }

  const isAddressSet = await user.hasSetNonDefaultAddress();
  if (!isAddressSet) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User has no default address set"
    );
  }

  let userCartTotal = userCart.cartItems.reduce((acc, ele) => {
    return acc+(ele.product.cost*ele.quantity);
  }, 0);

  if(userCartTotal > user.walletMoney){
    throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient Balance");
  }

  user.walletMoney -= userCartTotal;
  await user.save();
  userCart.cartItems = [];
  await userCart.save();

};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};

const express = require('express');
const router = express.Router();
const apiController = require('../controller/api/apiController');
const userAuthController = require('../controller/api/userAuthController')
const cartController = require('../controller/api/cartController');
const { authenticateToken } = require('../middleware/auth.middleware');
const orderController = require('../controller/api/orderController');
const contactUsController = require('../controller/api/contactUsController')
const offerController = require('../controller/api/offerController')

/**
 * @swagger
 * /api/home:
 *   get:
 *     summary: Home Data
 *     description: Fetch API home data.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: Successfully retrieved API home data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error.
 */
router.get("/home", apiController.home);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get All Categories
 *     description: Fetch all available categories.
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Successfully retrieved categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error.
 */
router.get('/categories', apiController.categoryAll);

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get All Blogs (Paginated)
 *     description: Fetch all available blogs with pagination support.
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (default is 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of blogs per page (default is 12).
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated blogs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array                 
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalRecord:
 *                   type: integer
 *                   example: 50
 *                 message:
 *                   type: string
 *                   example: "Get blogs list successfully."
 *       400:
 *         description: Invalid request parameters.
 *       500:
 *         description: Server error.
 */
router.get('/blogs', apiController.blogAll);

/**
 * @swagger
 * /api/blogs/{slug}:
 *   get:
 *     summary: Get a Single Blog
 *     description: Fetch a blog by its slug.
 *     tags:
 *       - Blogs
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: The slug of the blog to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved blog.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Blog not found.
 *       500:
 *         description: Server error.
 */
router.get('/blogs/:slug', apiController.blogSingle);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get All Products (Paginated)
 *     description: Fetch all available products with pagination, sorting, and filtering.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (default is 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of products per page (default is 12).
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_low_to_high, price_high_to_low, best_selling]
 *         description: Sorting options.
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [in_stock, out_stock]
 *         description: Filter by availability status.
 *       - in: query
 *         name: low_price
 *         schema:
 *           type: number
 *         description: Minimum price filter.
 *       - in: query
 *         name: high_price
 *         schema:
 *           type: number
 *         description: Maximum price filter.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Category or Subcategory name to filter products.
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalRecord:
 *                   type: integer
 *                   example: 50
 *                 message:
 *                   type: string
 *                   example: "Products fetched successfully."
 *       400:
 *         description: Invalid request parameters.
 *       404:
 *         description: Category or subcategory not found.
 *       500:
 *         description: Server error.
 */
router.get('/products', apiController.productAll);

/**
 * @swagger
 * /api/products/{slug}:
 *   get:
 *     summary: Get a Single products
 *     description: Fetch a products by its slug.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: The slug of the products to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Products not found.
 *       500:
 *         description: Server error.
 */
router.get('/products/:slug', apiController.productSingle);

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for products
 *     description: Retrieve products that match a search query.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term for filtering products.
 *     responses:
 *       200:
 *         description: Successfully retrieved search results.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                 message:
 *                   type: string
 *                   example: "Search results fetched successfully."
 *       400:
 *         description: Missing search query.
 *       404:
 *         description: No products found matching the search.
 *       500:
 *         description: Server error.
 */
router.get("/search", apiController.searchProducts);

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with a hashed password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully!"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       400:
 *         description: Validation error or email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 */
router.post("/auth", userAuthController.auth);

// /**
//  * @swagger
//  * /api/login:
//  *   post:
//  *     summary: User login
//  *     description: Authenticate user and return a JWT token.
//  *     tags:
//  *       - Authentication
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: "test@example.com"
//  *               password:
//  *                 type: string
//  *                 example: "12345678"
//  *     responses:
//  *       200:
//  *         description: Login successful
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: "Login successful"
//  *                 token:
//  *                   type: string
//  *                   example: "eyJhbGciOiJIUzI1..."
//  *                 user:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: integer
//  *                     email:
//  *                       type: string
//  *                     role:
//  *                       type: string
//  *       400:
//  *         description: Invalid credentials
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Server error
//  */
// router.post("/login", userAuthController.login);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves the profile details of the authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", authenticateToken, userAuthController.getProfile);

/**
 * @swagger
 * /api/update-profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               phone:
 *                 type: string
 *                 description: Phone number of the user
 *               country:
 *                 type: string
 *                 description: Country of the user
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     country:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid input
 *       401:
 *         description: Unauthorized - Token is missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/update-profile", authenticateToken, userAuthController.updateProfile);

/**
 * @swagger
 * /api/get-cart:
 *   get:
 *     summary: Fetch user's cart
 *     description: Retrieves all cart items for the authenticated user or based on IP if no user ID is provided.
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID of the user whose cart needs to be fetched (optional).
 *     responses:
 *       200:
 *         description: Cart items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 123
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           title:
 *                             type: string
 *                             example: "Product Name"
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "image1.jpg"
 *                           slug:
 *                             type: string
 *                             example: "product-slug"
 *                 subtotal:
 *                   type: number
 *                   example: 100.00
 *                 total:
 *                   type: number
 *                   example: 100.00
 *                 promocode_discount:
 *                   type: number
 *                   example: 10.00
 *                 promocode:
 *                   type: object
 *                   nullable: true
 *                 message:
 *                   type: string
 *                   example: "Cart fetched successfully."
 *       401:
 *         description: Unauthorized - Token required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error - Error fetching cart items
 */
router.get("/get-cart", cartController.getCart);

/**
 * @swagger
 * /api/add-or-update-cart:
 *   post:
 *     summary: Add Or Update a product to the cart
 *     description: Adds a product to the cart for an authenticated user.
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItems
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the user (optional).
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: "John Doe"
 *                 description: User's full name (optional).
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *                 description: User's email (must be a valid email format).
 *               country:
 *                 type: string
 *                 example: "USA"
 *                 maxLength: 255
 *                 description: Country name (optional).
 *               state:
 *                 type: string
 *                 example: "California"
 *                 maxLength: 255
 *                 description: State name (optional).
 *               city:
 *                 type: string
 *                 example: "Los Angeles"
 *                 maxLength: 255
 *                 description: City name (optional).
 *               phone:
 *                 type: string
 *                 pattern: "^[0-9]+$"
 *                 example: "1234567890"
 *                 description: Phone number (digits only, optional).
 *               shipping_address:
 *                 type: string
 *                 example: "123 Main Street"
 *                 description: Shipping address (optional).
 *               zip_code:
 *                 type: string
 *                 maxLength: 20
 *                 example: "90001"
 *                 description: ZIP code (optional).
 *               cartItems:
 *                 type: array
 *                 minItems: 1
 *                 description: List of items to add to the cart.
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - packsize_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       example: 1
 *                       description: ID of the product (required).
 *                     packsize_id:
 *                       type: integer
 *                       example: 5
 *                       description: ID of the pack size (required).
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                       description: Quantity of the product (must be at least 1).
 *     responses:
 *       200:
 *         description: Product added to cart successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product added to cart successfully."
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Product ID is required."
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "PromoCode not found."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error adding product to cart."
 */
router.post("/add-or-update-cart", cartController.addOrUpdateCart);

/**
 * @swagger
 * /api/remove-cart:
 *   post:
 *     summary: Remove an item from the cart
 *     description: Deletes a specific cart item for an authenticated user or guest based on IP.
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 123
 *                 description: User ID (optional, required if authenticated)
 *               product_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the product to be removed
 *               packsize_id:
 *                 type: integer
 *                 example: 2
 *                 description: ID of the pack size of the product
 *     responses:
 *       200:
 *         description: Cart item removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cart item removed successfully."
 *       400:
 *         description: Validation Error (Invalid request parameters)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Cart or cart item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cart item not found."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error removing cart item."
 */
router.post("/remove-cart", cartController.removeFromCart);

/**
 * @swagger
 * /api/clear-cart:
 *   delete:
 *     summary: Clear the entire cart
 *     description: Removes all items from the cart for an authenticated user or guest based on IP.
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *           nullable: true
 *           example: 123
 *         description: User ID (optional, required if authenticated)
 *     responses:
 *       200:
 *         description: Cart cleared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cart cleared successfully."
 *       404:
 *         description: Cart not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cart not found."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error clearing cart."
 */
router.delete("/clear-cart", cartController.clearCart);

/**
 * @swagger
 * /api/create-order:
 *   post:
 *     summary: Create a new order
 *     description: Allows users to create an order with their details and items.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - country
 *               - state
 *               - city
 *               - phone
 *               - shipping_address
 *               - zip_code
 *               - total_amount
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               state:
 *                 type: string
 *                 example: "California"
 *               city:
 *                 type: string
 *                 example: "Los Angeles"
 *               phone:
 *                 type: string
 *                 pattern: "^[0-9]+$"
 *                 example: "1234567890"
 *               shipping_address:
 *                 type: string
 *                 example: "123 Main St, Apt 4B"
 *               zip_code:
 *                 type: string
 *                 example: "90001"
 *               total_amount:
 *                 type: number
 *                 format: float
 *                 example: 150.75
 *               status:
 *                 type: string
 *                 enum: ["Pending", "Processing", "Confirmed", "Delivered", "Cancelled"]
 *                 default: "Pending"
 *               payment_status:
 *                 type: string
 *                 enum: ["Pending", "Paid", "Cancelled"]
 *                 default: "Pending"
 *               payment_detail:
 *                 type: string
 *                 nullable: true
 *                 example: ""
 *               promocode:
 *                 type: string
 *                 nullable: true
 *                 example: "DISCOUNT10"
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - packsize_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       example: 101
 *                     packsize_id:
 *                       type: integer
 *                       example: 3
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       default: 1
 *                       example: 2
 *                     price:
 *                       type: number
 *                       format: float
 *                       example: 150.75
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *                 order:
 *                   type: object
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/create-order", authenticateToken, orderController.createOrder);

/**
 * @swagger
 * /api/get-orders:
 *   get:
 *     summary: Retrieve all orders for the authenticated user
 *     tags: 
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       total_amount:
 *                         type: number
 *                         format: float
 *                         example: 150.75
 *                       status:
 *                         type: string
 *                         enum: [Pending, Processing, Confirmed, Delivered, Cancelled]
 *                         example: Pending
 *                       orderItems:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product_id:
 *                               type: integer
 *                               example: 5
 *                             packsize_id:
 *                               type: integer
 *                               example: 2
 *                             quantity:
 *                               type: integer
 *                               example: 3
 *                             price:
 *                               type: number
 *                               format: float
 *                               example: 50.25
 *                       orderPromoCode:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           code:
 *                             type: string
 *                             example: "DISCOUNT10"
 *                           discount:
 *                             type: number
 *                             format: float
 *                             example: 10.00
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Server error while fetching orders
 */
router.get("/get-orders", authenticateToken, orderController.getOrders);

/**
 * @swagger
 * /api/get-order-details/{id}:
 *   get:
 *     summary: Retrieve details of a specific order
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     total_amount:
 *                       type: number
 *                       format: float
 *                       example: 150.75
 *                     status:
 *                       type: string
 *                       enum: [Pending, Processing, Confirmed, Delivered, Cancelled]
 *                       example: Pending
 *                     orderItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           product_id:
 *                             type: integer
 *                             example: 5
 *                           packsize_id:
 *                             type: integer
 *                             example: 2
 *                           quantity:
 *                             type: integer
 *                             example: 3
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 50.25
 *                           productDetail:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 5
 *                               title:
 *                                 type: string
 *                                 example: "Painkiller Medicine"
 *                               images:
 *                                 type: string
 *                                 example: "https://example.com/image.jpg"
 *                               availability:
 *                                 type: boolean
 *                                 example: true
 *                     orderPromoCode:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         code:
 *                           type: string
 *                           example: "DISCOUNT10"
 *                         discount:
 *                           type: number
 *                           format: float
 *                           example: 10.00
 *       400:
 *         description: Invalid request (missing or incorrect parameters)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while fetching order details
 */
router.get("/get-order-details/:id", authenticateToken, orderController.getOrderById);

/**
 * @swagger
 * /api/update-order-status/{id}/status:
 *   put:
 *     summary: Update Order Status (Only "Cancelled" Allowed)
 *     description: Updates the order status to "Cancelled". Optionally updates `payment_detail` and `payment_status` if provided.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["Cancelled"]
 *                 description: "Only 'Cancelled' is allowed"
 *                 example: "Cancelled"
 *               payment_detail:
 *                 type: object
 *                 nullable: true
 *                 description: "Optional JSON object containing payment details"
 *                 example: { "transaction_id": "12345ABC", "method": "Credit Card" }
 *               payment_status:
 *                 type: string
 *                 enum: ["Pending", "Paid", "Cancelled"]
 *                 nullable: true
 *                 description: "Optional payment status update"
 *                 example: "Paid"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order status updated successfully"
 *       400:
 *         description: Only "Cancelled" status updates are allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Only 'Cancelled' status updates are allowed."
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Error updating order status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating order status"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.put("/update-order-status/:id/status", authenticateToken, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/create-product-review:
 *   post:
 *     summary: Create a product review
 *     description: Submit a review for a product.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               note:
 *                 type: string
 *                 example: "Great product!"
 *     responses:
 *       200:
 *         description: Product review added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product review added successfully."
 *       400:
 *         description: Validation error.
 *       500:
 *         description: Internal server error.
 */
router.post("/create-product-review", apiController.productReview);

/**
 * @swagger
 * /api/apply-promocode:
 *   post:
 *     summary: Apply a promo code
 *     description: Validates and applies a promo code if it is active within the specified date range.
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "DISCOUNT10"
 *                 description: The promo code to be applied
 *               user_id:
 *                 type: integer
 *                 example: 123
 *                 description: The ID of the user applying the promo code (optional, falls back to IP-based cart if not provided)
 *     responses:
 *       200:
 *         description: Promo code applied successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Promo code applied successfully."
 *       400:
 *         description: Invalid or expired promo code, or subtotal too low for an amount-based discount.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired promo code."
 *       404:
 *         description: User or cart not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User cart detail not found."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error applying promo code."
 */
router.post("/apply-promocode", cartController.applyPromoCode);

/**
 * @swagger
 * /api/remove-promocode:
 *   post:
 *     summary: Remove applied promo code
 *     description: Removes the currently applied promo code from the user's cart.
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 123
 *                 description: The ID of the user removing the promo code (optional, falls back to IP-based cart if not provided)
 *     responses:
 *       200:
 *         description: Promo code removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Promo code removed successfully."
 *       404:
 *         description: No applied promo code found for the user or cart.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No applied promo code found for you."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error removing promo code."
 */
router.post("/remove-promocode", cartController.removePromoCode);

/**
 * @swagger
 * /api/contact-us:
 *   post:
 *     summary: Submit a contact form
 *     description: Users can submit their contact details and a message.
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone
 *               - message
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               message:
 *                 type: string
 *                 example: "I need more information about your services."
 *     responses:
 *       201:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Contact form submitted successfully!"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Something went wrong!"
 */
router.post("/contact-us", contactUsController.AddContactUs);

/**
 * @swagger
 * /api/add-email-for-offer:
 *   post:
 *     summary: Subscribe to offer emails
 *     description: Allows users to submit their email to receive special offers.
 *     tags:
 *       - Offers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: Email added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email added successfully!"
 *       400:
 *         description: Invalid request (email missing or already exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email is required!"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Something went wrong!"
 */
router.post("/add-email-for-offer", offerController.AddEmailForOffer);

module.exports = router;
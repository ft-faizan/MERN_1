const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/auth.controller.js');
const { loginUser } = require('../controllers/auth.controller.js');
const { verifyToken } = require("../middlewares/auth.middleware.js");
const { getCurrentUser } = require("../controllers/auth.controller.js");
const { logoutUser } = require("../controllers/auth.controller.js");
const { updateUserName } = require("../controllers/auth.controller.js");




// Post http://localhost:5000/api/auth/register

//  test with json format

// {
//   "name": "John Doe",
//   "email": "2xjyV@example.com",
//   "password": "password123",
//   "role": "user"
// }

router.post('/register', registerUser);

// Post http://localhost:5000/api/auth/login

// test with json format

// {
//   "email": "2xjyV@example.com",
//   "password": "password123"
// }

router.post('/login', loginUser);

// Get http://localhost:5000/api/auth/get-me

// after login, use the token from cookie to access this route

router.get("/me", verifyToken, getCurrentUser);


// POST http://localhost:5000/api/auth/logout

//  after login, and  test
// and test the get-me route again, the token should be cleared and you should get an error

router.post("/logout", logoutUser);

// PUT http://localhost:5000/api/auth/update-name

// after login, use the token from cookie to access this route
// test with json format

router.put("/update-name", verifyToken, updateUserName);


module.exports = router;


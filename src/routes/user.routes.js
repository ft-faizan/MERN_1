const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware.js");
const { authorizeRoles } = require("../middlewares/authorizeRoles.js");

const {
  getAllUsers,
  getUserStats,
} = require("../controllers/auth.controller.js");

// 🔥 GET ALL USERS
router.get(
  "/",
  verifyToken,
  authorizeRoles("superadmin"),
  getAllUsers
);

// 🔥 USER STATS
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("superadmin"),
  getUserStats
);

module.exports = router;
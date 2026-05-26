const express = require("express");
const router  = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware.js");
const {
  getDashboardStats,
  getDashboardActivity,
} = require("../controllers/dashboard.controller.js");

router.get("/stats",    verifyToken, getDashboardStats);
router.get("/activity", verifyToken, getDashboardActivity);

module.exports = router;
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { getDashboardStats } = require("../controllers/admin.controller");

router.get("/dashboard", verifyToken, getDashboardStats);

module.exports = router;
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware.js");
const { authorizeRoles } = require("../middlewares/authorizeRoles.js");

const {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getCategoryStats,
} = require("../controllers/category.controller.js");

// ✅ public
router.get("/", verifyToken, getCategories);

router.get(
  "/stats",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  getCategoryStats
);



router.post("/", verifyToken, authorizeRoles("admin", "superadmin"), createCategory); //perfectly working

router.put("/:id", verifyToken, authorizeRoles("admin", "superadmin"), updateCategory);

router.delete("/:id", verifyToken, authorizeRoles("superadmin"), deleteCategory);



module.exports = router;
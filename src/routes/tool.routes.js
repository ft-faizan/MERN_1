const express = require("express");
const router = express.Router();

const { verifyToken,isAdmin } = require("../middlewares/auth.middleware.js");
const { authorizeRoles } = require("../middlewares/authorizeRoles.js");
const upload = require("../middlewares/upload.middleware.js");

const {
  createTool,
  getTools,
  deleteTool,
  updateTool,
  getToolById,
  getCategoryPreviewTools,
  getAdminStats
} = require("../controllers/tool.controller.js");

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  upload.single("image"), // 🔥 IMPORTANT
  createTool
);

// 🟢 PUBLIC (for users)
router.get("/", getTools);

// 🔴 ADMIN PANEL
router.get("/admin", verifyToken, getTools);
console.log("verifyToken:", typeof verifyToken);
console.log("isAdmin:", typeof isAdmin);
console.log("getAdminStats:", typeof getAdminStats);
 router.get("/admin-stats", verifyToken, isAdmin, getAdminStats);

router.get("/category/:id/preview", getCategoryPreviewTools);

router.get("/:id", getToolById);

// router.get("/admin-stats", verifyToken, isAdmin, toolController.getAdminStats);

router.delete("/:id", verifyToken, authorizeRoles("admin", "superadmin"), deleteTool);



router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  upload.single("image"), // 🔥 IMPORTANT
  updateTool
);

module.exports = router;


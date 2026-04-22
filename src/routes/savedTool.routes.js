const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js");

const {
  saveTool,
  getSavedTools,
  deleteSavedTool,
  moveSavedTool,
  updateCustomTool
} = require("../controllers/savedTool.controller.js");

router.get("/", verifyToken, getSavedTools);
router.delete("/:id", verifyToken, deleteSavedTool);
router.put("/:id/move", verifyToken, moveSavedTool);
router.post(
  "/",
  verifyToken,
  upload.single("image"), // 🔥 important
  saveTool
);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"),
  updateCustomTool
);

module.exports = router;
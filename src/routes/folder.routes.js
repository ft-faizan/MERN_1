const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware.js");

const {
  createFolder,
  getFolders,
  deleteFolder,
  renameFolder
} = require("../controllers/folder.controller.js");

router.post("/", verifyToken, createFolder);
router.get("/", verifyToken, getFolders);
router.put("/:id", verifyToken, renameFolder);
router.delete("/:id", verifyToken, deleteFolder);

module.exports = router;
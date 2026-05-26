
// v2
const mongoose = require("mongoose");

const savedToolSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      // required: true,
            required: false,
            default: null

    },

    type: {
      type: String,
      enum: ["platform", "custom"],
      required: true,
    },

    // Used only for platform tools
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: function () {
        return this.type === "platform";
      },
    },

    // Used only for custom tools
    toolname: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "custom";
      },
    },

    toollink: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "custom";
      },
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      url: {
        type: String,
        required: true,
      },
      fileId: {
        type: String,
        default: null, // Only populated for custom ImageKit uploads
      },
    },
  },
  { timestamps: true }
);

// --- INDEXES ---

// 1. Basic index for faster queries by user
savedToolSchema.index({ userId: 1 });

// 2. PLATFORM TOOL UNIQUE INDEX
// Prevents a user from saving the same platform tool twice in the same folder.
// It IGNORES custom tools because they don't have a toolId.
savedToolSchema.index(
  { userId: 1, toolId: 1, folderId: 1 },
  {
    unique: true,
    partialFilterExpression: { toolId: { $exists: true, $ne: null } },
  }
);

// 3. CUSTOM TOOL UNIQUE INDEX
// Prevents a user from saving the same custom link twice in the same folder.
// It IGNORES platform tools because they have a null/undefined toollink.
savedToolSchema.index(
  { userId: 1, toollink: 1, folderId: 1 },
  {
    unique: true,
    partialFilterExpression: { toollink: { $exists: true, $ne: null } },
  }
);

module.exports = mongoose.model("SavedTool", savedToolSchema);
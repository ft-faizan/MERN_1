const mongoose = require("mongoose");

const savedToolSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    trim: true,
    lowercase: true
  },

  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true
  },

  type: {
    type: String,
    enum: ["platform", "custom"],
    required: true
  },


  toolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tool",
    required: function () {
      return this.type === "platform";
    }
  },

  // toolname: {
  //   type: String,
  //   trim: true,
  //   required: function () {
  //     return this.type === "custom";
  //   }
  // },

  // toollink: {
  //   type: String,
  //   trim: true,
  //   required: function () {
  //     return this.type === "custom";
  //   }
  // },


  toolname: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "custom";
    }
  },
  description: {
    type: String,
    required: true,
    trim: true
  },

  toollink: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "custom";
    }
  },
  image: {
    url: {
      type: String,
      required: true
    },
    fileId: {
      type: String,
      default: null // for ImageKit only
    }
  }
}, { timestamps: true });

savedToolSchema.index({ userId: 1 });



savedToolSchema.index(
  { userId: 1, toolId: 1, folderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      toolId: { $exists: true, $ne: null }
    }
  }
);

savedToolSchema.index(
  { userId: 1, toollink: 1, folderId: 1 },
  { unique: true, sparse: true }
);



module.exports = mongoose.model("SavedTool", savedToolSchema);
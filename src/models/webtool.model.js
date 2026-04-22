const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  description: {
  type: String,
  required: true,
  trim: true
},

  link: {
    type: String,
    required: true
  },

  image: {
    url: {
      type: String,
      required: true
    },
    fileId: {
      type: String,
      required: true
    }
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  saveCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

toolSchema.index({ name: 1, link: 1 }, { unique: true });
toolSchema.index({ category: 1 });
toolSchema.index({ saveCount: -1 });

module.exports = mongoose.model("Tool", toolSchema);
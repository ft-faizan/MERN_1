


const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, { timestamps: true });

// ✅ Single clean index
categorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);



const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },

  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);




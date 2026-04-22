const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true,
    trim:true,
    lowercase:true
  },

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  type:{
    type:String,
    enum:["default","custom"],
    default:"custom"
  }

},{timestamps:true});

folderSchema.index({ userId:1 });

folderSchema.index(
  { userId:1, name:1 },
  { unique:true }
);

module.exports = mongoose.model("Folder",folderSchema);
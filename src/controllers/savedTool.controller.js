const mongoose = require("mongoose");
const SavedTool = require("../models/usertool.model.js");

const Folder = require("../models/folder.model.js");

const Tool = require("../models/webtool.model.js");

const imagekit = require("../services/imagekit.service.js");

// ✅ SAVE TOOL

// // // v1
// exports.saveTool = async (req, res) => {
//   try {
//     const {
//       type,
//       toolId,
//       folderId,
//       newFolderName,
//       toolname,
//       toollink,
//       description,
//       image,
//     } = req.body;

//     let finalImage = null;

//     if (type === "custom") {
//       // ✅ Validate text fields FIRST

//       if (!toolname || !toollink || !description) {
//         return res.status(400).json({
//           message: "Tool name and link are required",
//         });
//       }

//       // 🔥 Case 1: ImageKit upload

//       if (req.file) {
//         const response = await imagekit.upload({
//           file: req.file.buffer,

//           fileName: req.file.originalname,

//           folder: "custom-tools",
//         });

//         finalImage = {
//           url: response.url,

//           fileId: response.fileId,
//         };
//       }

//       // 🔥 Case 2: Image URL (from raw JSON)
//       else if (image && image.url) {
//         finalImage = image;
//       }

//       // ❌ No image provided
//       else {
//         return res.status(400).json({
//           message: "Image is required (upload or URL)",
//         });
//       }
//     }

//     let finalFolderId;

//     // 🔥 1. HANDLE FOLDER LOGIC

//     if (folderId) {
//       finalFolderId = folderId;
//     } else if (newFolderName) {
//       const normalizedName = newFolderName.trim().toLowerCase();

//       let folder = await Folder.findOne({
//         userId: req.user.id,

//         name: normalizedName,
//       });

//       if (!folder) {
//         folder = await Folder.create({
//           name: normalizedName,

//           userId: req.user.id,
//         });
//       }

//       finalFolderId = folder._id;
//     } else {
//       // 🔥 default folder

//       let defaultFolder = await Folder.findOne({
//         userId: req.user.id,

//         type: "default",
//       });

//       if (!defaultFolder) {
//         defaultFolder = await Folder.create({
//           name: "default",

//           userId: req.user.id,

//           type: "default",
//         });
//       }

//       finalFolderId = defaultFolder._id;
//     }

//     // 🔥 2. PREVENT DUPLICATE

//     if (type === "platform") {
//       const toolData = await Tool.findById(toolId);

//       if (!toolData) {
//         return res.status(400).json({
//           message: "Tool not found",
//         });
//       }

//       // 🔥 SET IMAGE FROM TOOL DB

//       finalImage = {
//         url: toolData.image.url,

//         fileId: toolData.image.fileId || null,
//       };

//       const exists = await SavedTool.findOne({
//         userId: req.user.id,

//         toolId,

//         folderId: finalFolderId,
//       });

//       if (exists) {
//         return res.status(400).json({
//           message: "Tool already saved in this folder",
//         });
//       }

//       // 🔥 increase saveCount

//       await Tool.findByIdAndUpdate(toolId, {
//         $inc: { saveCount: 1 },
//       });
//     } else {
//       // 🔥 prevent saving platform tool as custom

//       const existingPlatform = await Tool.findOne({
//         link: toollink,
//       });

//       if (existingPlatform) {
//         return res.status(400).json({
//           message:
//             "This tool already exists in platform. Save it from platform tools.",
//         });
//       }

//       const exists = await SavedTool.findOne({
//         userId: req.user.id,

//         toollink,

//         folderId: finalFolderId,
//       });

//       if (exists) {
//         return res.status(400).json({
//           message: "Custom tool already saved in this folder",
//         });
//       }
//     }

//     // 🔥 3. CREATE SAVED TOOL

//     const savedTool = await SavedTool.create({
//       userId: req.user.id,

//       folderId: finalFolderId,

//       type,

//       // toolId: type === "platform" ? toolId : null,

//       toolId: type === "platform" ? toolId : undefined,

//       // toolname: type === "custom" ? toolname : null,

//       toolname: type === "custom" ? toolname?.trim().toLowerCase() : null,

//       toollink: type === "custom" ? toollink : null,

//       description: type === "custom" ? description : toolData.description,

//       // image

//       image: finalImage,
//     });

//     res.status(201).json({
//       success: true,

//       savedTool,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({ message: "Server error" });
//   }
// };

// // v2 fixed
// exports.saveTool = async (req, res) => {
//   try {
//     const {
//       type,
//       toolId,
//       folderId,
//       newFolderName,
//       toolname,
//       toollink,
//       description,
//       image,
//     } = req.body;

//     let finalImage = null;
//     let finalDescription = description;

//     // 1. HANDLE FOLDER LOGIC (Find existing, create new, or use default)
//     let finalFolderId;
//     if (folderId) {
//       finalFolderId = folderId;
//     } else {
//       const normalizedName = newFolderName
//         ? newFolderName.trim().toLowerCase()
//         : "default";
//       let folder = await Folder.findOne({
//         userId: req.user.id,
//         name: normalizedName,
//       });

//       if (!folder) {
//         folder = await Folder.create({
//           name: normalizedName,
//           userId: req.user.id,
//           type: newFolderName ? "custom" : "default",
//         });
//       }
//       finalFolderId = folder._id;
//     }

//     // 2. HANDLE PLATFORM TOOLS
//     if (type === "platform") {
//       const platformTool = await Tool.findById(toolId);
//       if (!platformTool) {
//         return res.status(404).json({ message: "Tool not found on platform" });
//       }

//       // Sync image and description from the original tool
//       finalImage = {
//         url: platformTool.image.url,
//         fileId: platformTool.image.fileId || null,
//       };
//       finalDescription = platformTool.description;

//       // Duplicate Check
//       const exists = await SavedTool.findOne({
//         userId: req.user.id,
//         toolId,
//         folderId: finalFolderId,
//       });
//       if (exists)
//         return res
//           .status(400)
//           .json({ message: "Tool already saved in this folder" });

//       // Increase save count
//       await Tool.findByIdAndUpdate(toolId, { $inc: { saveCount: 1 } });
//     } else {
//       // 3. HANDLE CUSTOM TOOLS
//       if (!toolname || !toollink || !description) {
//         return res.status(400).json({
//           message: "Name, link, and description are required for custom tools",
//         });
//       }

//       // Check for link duplication with platform
//       const existingPlatform = await Tool.findOne({ link: toollink });
//       if (existingPlatform) {
//         return res.status(400).json({
//           message: "This tool already exists. Save it from platform tools.",
//         });
//       }

//       // Image Logic
//       // if (req.file) {
//       //   const response = await imagekit.upload({
//       //     file: req.file.buffer,
//       //     fileName: req.file.originalname,
//       //     folder: "custom-tools",
//       //   });
//       //   finalImage = { url: response.url, fileId: response.fileId };
//       // }
//       // else if (image && image.url) {
//       //   finalImage = image;
//       // } else {
//       //   return res.status(400).json({ message: "Image is required" });
//       // }
//       // Image Logic
//       if (req.file) {
//         const response = await imagekit.upload({
//           file: req.file.buffer,
//           fileName: req.file.originalname,
//           folder: "custom-tools",
//         });
//         finalImage = { url: response.url, fileId: response.fileId };
//       } else if (req.body.imageUrl) {
//         // 🔥 ADD THIS
//         finalImage = { url: req.body.imageUrl, fileId: null };
//       } else if (image && image.url) {
//         finalImage = image;
//       } else {
//         return res.status(400).json({ message: "Image is required" });
//       }
//     }

//     // 4. FINAL SAVE
//     const savedTool = await SavedTool.create({
//       userId: req.user.id,
//       folderId: finalFolderId,
//       type,
//       toolId: type === "platform" ? toolId : undefined,
//       toolname: type === "custom" ? toolname?.trim().toLowerCase() : undefined,
//       toollink: type === "custom" ? toollink : undefined,
//       description: finalDescription, // 🔥 FIXED: This variable now exists for both cases
//       image: finalImage,
//     });

//     // res.status(201).json({ success: true, savedTool });
//     const fullyPopulatedTool = await SavedTool.findById(savedTool._id)
//       .populate({
//         path: "toolId",
//         populate: { path: "category", select: "name" },
//       })
//       .populate("folderId", "name");

//     res.status(201).json({ success: true, savedTool: fullyPopulatedTool });
//   } catch (error) {
//     console.error("SAVING FAILED:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
//  v3

exports.saveTool = async (req, res) => {
  try {
    const {
      type,
      toolId,
      folderId,
      newFolderName,
      toolname,
      toollink,
      description,
      image,
    } = req.body;

    let finalImage = null;
    let finalDescription = description;

    // 1. HANDLE FOLDER LOGIC
    let finalFolderId;
    if (folderId) {
      finalFolderId = folderId;
    } else {
      const normalizedName = newFolderName ? newFolderName.trim().toLowerCase() : "default";
      let folder = await Folder.findOne({ userId: req.user.id, name: normalizedName });

      if (!folder) {
        folder = await Folder.create({
          name: normalizedName,
          userId: req.user.id,
          type: newFolderName ? "custom" : "default",
        });
      }
      finalFolderId = folder._id;
    }

    // 2. HANDLE PLATFORM TOOLS
    if (type === "platform") {
      const platformTool = await Tool.findById(toolId);
      if (!platformTool) return res.status(404).json({ message: "Tool not found on platform" });

      finalImage = { url: platformTool.image.url, fileId: platformTool.image.fileId || null };
      finalDescription = platformTool.description;

      // Platform Duplicate Check (Already account-wide if we ignore folderId)
      const exists = await SavedTool.findOne({ userId: req.user.id, toolId });
      if (exists) return res.status(400).json({ message: "This platform tool is already saved in your account" });

      await Tool.findByIdAndUpdate(toolId, { $inc: { saveCount: 1 } });
    } 
    
    // 3. HANDLE CUSTOM TOOLS
    else {
      if (!toolname || !toollink || !description) {
        return res.status(400).json({ message: "Name, link, and description are required for custom tools" });
      }

      const cleanLink = toollink.trim();
      const cleanName = toolname.trim().toLowerCase();

      // 🔥 BUG FIX: Global Account Duplicate Check
      // We check if this user has saved this link OR name ANYWHERE in their account
      const globalExists = await SavedTool.findOne({
        userId: req.user.id,
        $or: [
          { toollink: cleanLink },
          { toolname: cleanName }
        ]
      });

      if (globalExists) {
        return res.status(400).json({ 
          message: "You have already saved a tool with this name or link in another folder." 
        });
      }

      // Check for link duplication with platform database
      const existingPlatform = await Tool.findOne({ link: cleanLink });
      if (existingPlatform) {
        return res.status(400).json({ message: "This tool already exists on the platform. Save it from there." });
      }

      // Image Logic
      if (req.file) {
        const response = await imagekit.upload({
          file: req.file.buffer,
          fileName: req.file.originalname,
          folder: "custom-tools",
        });
        finalImage = { url: response.url, fileId: response.fileId };
      } else if (req.body.imageUrl) {
        finalImage = { url: req.body.imageUrl, fileId: null };
      } else if (image && image.url) {
        finalImage = image;
      } else {
        return res.status(400).json({ message: "Image is required" });
      }
    }

    // 4. FINAL SAVE
    const savedTool = await SavedTool.create({
      userId: req.user.id,
      folderId: finalFolderId,
      type,
      toolId: type === "platform" ? toolId : undefined,
      toolname: type === "custom" ? toolname?.trim().toLowerCase() : undefined,
      toollink: type === "custom" ? toollink : undefined,
      description: finalDescription,
      image: finalImage,
    });

    const fullyPopulatedTool = await SavedTool.findById(savedTool._id)
      .populate({
        path: "toolId",
        populate: { path: "category", select: "name" },
      })
      .populate("folderId", "name");

    res.status(201).json({ success: true, savedTool: fullyPopulatedTool });
  } catch (error) {
    console.error("SAVING FAILED:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// getsaveed tool logic
//  v1
// exports.getSavedTools = async (req, res) => {
//   try {
//     const page = Number(req.query.page) || 1;

//     const limit = 50;

//     const skip = (page - 1) * limit;

//     const keyword = req.query.search
//       ? {
//           $or: [
//             { toolname: { $regex: req.query.search, $options: "i" } },

//             { toollink: { $regex: req.query.search, $options: "i" } },
//           ],
//         }
//       : {};

//     const tools = await SavedTool.find({
//       userId: req.user.id,

//       ...keyword,
//     })

//       .populate("toolId")

//       .populate("folderId", "name")

//       .sort({ createdAt: -1 })

//       .skip(skip)

//       .limit(limit);

//     const total = await SavedTool.countDocuments({
//       userId: req.user.id,

//       ...keyword,
//     });

//     res.json({
//       success: true,

//       total,

//       page,

//       pages: Math.ceil(total / limit),

//       tools,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// v1
// exports.deleteSavedTool = async (req, res) => {
//   try {
//     const tool = await SavedTool.findOne({
//       _id: req.params.id,

//       userId: req.user.id,
//     });

//     if (!tool) {
//       return res.status(404).json({
//         message: "Saved tool not found",
//       });
//     }

//     // 🔥 delete image if from ImageKit

//     if (tool.image?.fileId) {
//       await imagekit.deleteFile(tool.image.fileId);
//     }

//     // 🔥 decrease saveCount (platform)

//     if (tool.type === "platform") {
//       await Tool.findByIdAndUpdate(tool.toolId, {
//         $inc: { saveCount: -1 },
//       });
//     }

//     await SavedTool.findByIdAndDelete(tool._id);

//     res.json({
//       success: true,

//       message: "Tool removed",
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({ message: "Server error" });
//   }
// };

// v2
// v2
exports.getSavedTools = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const keyword = req.query.search
      ? {
          $or: [
            { toolname: { $regex: req.query.search, $options: "i" } },
            { toollink: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const tools = await SavedTool.find({
      userId: req.user.id,
      ...keyword,
    })
      // 🔥 UPDATED: Deep populate to get Category name from within toolId
      .populate({
        path: "toolId",
        populate: {
          path: "category",
          select: "name", // Only fetch the name to keep it fast
        },
      })
      .populate("folderId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SavedTool.countDocuments({
      userId: req.user.id,
      ...keyword,
    });

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      tools,
    });
  } catch (error) {
    console.error("GET SAVED TOOLS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSavedTool = async (req, res) => {
  try {
    const tool = await SavedTool.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!tool) return res.status(404).json({ message: "Saved tool not found" });

    // 🔥 FIX: Only delete from ImageKit if it's a CUSTOM tool with a fileId
    // If it's a platform tool, WE DO NOT delete the image (it belongs to the platform)
    if (tool.type === "custom" && tool.image?.fileId) {
      try {
        await imagekit.deleteFile(tool.image.fileId);
      } catch (err) {
        console.log("ImageKit error ignored to prevent crash");
      }
    }

    // 🔥 FIX: Decrease save count only if platform tool exists
    if (tool.type === "platform" && tool.toolId) {
      await Tool.findByIdAndUpdate(tool.toolId, { $inc: { saveCount: -1 } });
    }

    await SavedTool.findByIdAndDelete(tool._id);
    res.json({ success: true, message: "Removed" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// move tools folder to folder

// exports.moveSavedTool = async (req, res) => {
//   try {
//     const { folderId } = req.body;

//     const tool = await SavedTool.findOne({
//       _id: req.params.id,

//       userId: req.user.id,
//     });

//     if (!tool) {
//       return res.status(404).json({
//         message: "Saved tool not found",
//       });
//     }

//     // ❌ prevent duplicate in target folder

//     const exists = await SavedTool.findOne({
//       userId: req.user.id,

//       folderId,

//       toolId: tool.toolId,

//       toollink: tool.toollink,
//     });

//     if (exists) {
//       return res.status(400).json({
//         message: "Tool already exists in target folder",
//       });
//     }

//     tool.folderId = folderId;

//     await tool.save();

//     res.json({
//       success: true,

//       tool,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// v2

// exports.moveSavedTool = async (req, res) => {
//   try {
//     const { folderId } = req.body;
//     const savedItemId = req.params.id;

//     // 1. Find the specific record belonging to this user
//     const tool = await SavedTool.findOne({
//       _id: savedItemId,
//       userId: req.user.id,
//     });

//     if (!tool) {
//       return res.status(404).json({
//         success: false,
//         message: "Saved tool not found"
//       });
//     }

//     // 2. Normalize folderId (The "Null" Fix)
//     // We check if it's a valid MongoDB ID. If it's "null", "", or undefined,
//     // we set it to null so it appears in the "Saved Tools" (Default) tab.
//     let targetFolderId = null;
//     if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
//       targetFolderId = folderId;
//     }

//     // 3. Prevent Duplicates in the destination folder
//     // Checks if the user already has this specific tool in the target folder
//     const exists = await SavedTool.findOne({
//       _id: { $ne: tool._id }, // Don't count the current tool itself
//       userId: req.user.id,
//       folderId: targetFolderId,
//       $or: [
//         { toolId: tool.toolId, toolId: { $ne: null } },
//         { toollink: tool.toollink, toollink: { $ne: null } }
//       ]
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "This tool is already in that folder",
//       });
//     }

//     // 4. Update the folder and Save
//     tool.folderId = targetFolderId;
//     await tool.save();

//     // 5. Populate and Return
//     // We populate folderId and toolId so the Frontend Redux state
//     // has all the info it needs to display the tool correctly.
//     const updatedTool = await SavedTool.findById(tool._id)
//       .populate("toolId")
//       .populate("folderId", "name");

//     res.json({
//       success: true,
//       message: "Tool moved successfully",
//       tool: updatedTool,
//     });

//   } catch (error) {
//     console.error("CRITICAL MOVE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error during move",
//       error: error.message
//     });
//   }
// };

// v3

exports.moveSavedTool = async (req, res) => {
  try {
    const { folderId, newFolderName } = req.body; // 🔥 Add newFolderName here
    const savedItemId = req.params.id;

    const tool = await SavedTool.findOne({
      _id: savedItemId,
      userId: req.user.id,
    });
    if (!tool) return res.status(404).json({ message: "Saved tool not found" });

    let targetFolderId = null;

    // 🔥 NEW LOGIC: Handle New Folder Creation during MOVE
    if (newFolderName) {
      const normalizedName = newFolderName.trim().toLowerCase();
      let folder = await Folder.findOne({
        userId: req.user.id,
        name: normalizedName,
      });

      if (!folder) {
        folder = await Folder.create({
          name: normalizedName,
          userId: req.user.id,
          type: "custom",
        });
      }
      targetFolderId = folder._id;
    } else if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      targetFolderId = folderId;
    }

    // Duplicate Check
    const exists = await SavedTool.findOne({
      _id: { $ne: tool._id },
      userId: req.user.id,
      folderId: targetFolderId,
      $or: [
        // { toolId: tool.toolId, toolId: { $ne: null } },
        // { toollink: tool.toollink, toollink: { $ne: null } }
        ...(tool.toolId ? [{ toolId: tool.toolId }] : []),
        ...(tool.toollink ? [{ toollink: tool.toollink }] : []),
      ],
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: "Tool already exists in that folder" });
    }

    tool.folderId = targetFolderId;
    await tool.save();

    const updatedTool = await SavedTool.findById(tool._id)
      .populate("toolId")
      .populate("folderId", "name");

    res.json({ success: true, tool: updatedTool });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// updateing the custom tool only

exports.updateCustomTool = async (req, res) => {
  try {
    const { toolname, toollink, description } = req.body;

    const tool = await SavedTool.findOne({
      _id: req.params.id,

      userId: req.user.id,

      type: "custom",
    });

    if (!tool) {
      return res.status(404).json({
        message: "Custom tool not found",
      });
    }

    // 🔥 check if updating to platform tool

    if (toollink) {
      const existingPlatform = await Tool.findOne({
        link: toollink,
      });

      if (existingPlatform) {
        return res.status(400).json({
          message:
            "This tool already exists in platform. Save it from platform tools.",
        });
      }
    }

    // 🔥 DUPLICATE CHECK

    const existing = await SavedTool.findOne({
      _id: { $ne: req.params.id },

      userId: req.user.id,

      $or: [{ toolname: toolname?.toLowerCase() }, { toollink }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Tool with same name or link already exists",
      });
    }

    // 🔥 IMAGE UPDATE

    // if (req.file) {
    //   // delete old image (if from ImageKit)

    //   if (tool.image?.fileId) {
    //     await imagekit.deleteFile(tool.image.fileId);
    //   }

    //   const response = await imagekit.upload({
    //     file: req.file.buffer,

    //     fileName: req.file.originalname,

    //     folder: "custom-tools",
    //   });

    //   tool.image = {
    //     url: response.url,

    //     fileId: response.fileId,
    //   };
    // }
    // 🔥 IMAGE UPDATE
    if (req.file) {
      if (tool.image?.fileId) {
        await imagekit.deleteFile(tool.image.fileId);
      }
      const response = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: "custom-tools",
      });
      tool.image = {
        url: response.url,
        fileId: response.fileId,
      };
    } else if (req.body.imageUrl) {
      // 🔥 ADD THIS BLOCK
      if (tool.image?.fileId) {
        await imagekit.deleteFile(tool.image.fileId);
      }
      tool.image = { url: req.body.imageUrl, fileId: null };
    }

    // update fields

    if (toolname) tool.toolname = toolname.toLowerCase();

    if (toollink) tool.toollink = toollink;

    if (description !== undefined) tool.description = description;

    // await tool.save();

    // res.json({
    //   success: true,

    //   tool,
    // });
    await tool.save();

    // 🔥 Get updated tool with folder info
    const updatedTool = await SavedTool.findById(tool._id).populate(
      "folderId",
      "name",
    );

    // 🔥 Return this
    res.json({
      success: true,
      tool: updatedTool,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Server error" });
  }
};

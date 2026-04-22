const SavedTool = require("../models/usertool.model.js");
const Folder = require("../models/folder.model.js");
const Tool = require("../models/webtool.model.js");
const imagekit = require("../services/imagekit.service.js");

// ✅ SAVE TOOL
exports.saveTool = async (req, res) => {
    try {

        const { type, toolId, folderId, newFolderName, toolname, toollink, description, image } = req.body;

       

        let finalImage = null;

        if (type === "custom") {

            // ✅ Validate text fields FIRST
            if (!toolname || !toollink || !description) {
                return res.status(400).json({
                    message: "Tool name and link are required"
                });
            }

            // 🔥 Case 1: ImageKit upload
            if (req.file) {
                const response = await imagekit.upload({
                    file: req.file.buffer,
                    fileName: req.file.originalname,
                    folder: "custom-tools"
                });

                finalImage = {
                    url: response.url,
                    fileId: response.fileId
                };
            }

            // 🔥 Case 2: Image URL (from raw JSON)
            else if (image && image.url) {
                finalImage = image;
            }

            // ❌ No image provided
            else {
                return res.status(400).json({
                    message: "Image is required (upload or URL)"
                });
            }
        }


        let finalFolderId;

        // 🔥 1. HANDLE FOLDER LOGIC

        if (folderId) {
            finalFolderId = folderId;

        } else if (newFolderName) {

            const normalizedName = newFolderName.trim().toLowerCase();

            let folder = await Folder.findOne({
                userId: req.user.id,
                name: normalizedName
            });

            if (!folder) {
                folder = await Folder.create({
                    name: normalizedName,
                    userId: req.user.id
                });
            }

            finalFolderId = folder._id;

        } else {
            // 🔥 default folder
            let defaultFolder = await Folder.findOne({
                userId: req.user.id,
                type: "default"
            });

            if (!defaultFolder) {
                defaultFolder = await Folder.create({
                    name: "default",
                    userId: req.user.id,
                    type: "default"
                });
            }

            finalFolderId = defaultFolder._id;
        }

        
        // 🔥 2. PREVENT DUPLICATE

        if (type === "platform") {

            const toolData = await Tool.findById(toolId);

            if (!toolData) {
                return res.status(400).json({
                    message: "Tool not found"
                });
            }

            // 🔥 SET IMAGE FROM TOOL DB
            finalImage = {
                url: toolData.image.url,
                fileId: toolData.image.fileId || null
            };

            const exists = await SavedTool.findOne({
                userId: req.user.id,
                toolId,
                folderId: finalFolderId
            });

            if (exists) {
                return res.status(400).json({
                    message: "Tool already saved in this folder"
                });
            }

            // 🔥 increase saveCount
            await Tool.findByIdAndUpdate(toolId, {
                $inc: { saveCount: 1 }
            });

        } else {

            // 🔥 prevent saving platform tool as custom
            const existingPlatform = await Tool.findOne({
                link: toollink
            });

            if (existingPlatform) {
                return res.status(400).json({
                    message: "This tool already exists in platform. Save it from platform tools."
                });
            }

            const exists = await SavedTool.findOne({
                userId: req.user.id,
                toollink,
                folderId: finalFolderId
            });

            if (exists) {
                return res.status(400).json({
                    message: "Custom tool already saved in this folder"
                });
            }
        }

        // 🔥 3. CREATE SAVED TOOL

        const savedTool = await SavedTool.create({
            userId: req.user.id,
            folderId: finalFolderId,
            type,
            // toolId: type === "platform" ? toolId : null,
            toolId: type === "platform" ? toolId : undefined,
            // toolname: type === "custom" ? toolname : null,
            toolname: type === "custom" ? toolname?.trim().toLowerCase() : null,
            toollink: type === "custom" ? toollink : null,
            description: type === "custom" ? description : toolData.description,
            // image
            image: finalImage
        });

        res.status(201).json({
            success: true,
            savedTool
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// getsaveed tool logic
exports.getSavedTools = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = 50;

        const skip = (page - 1) * limit;

        const keyword = req.query.search
            ? {
                $or: [
                    { toolname: { $regex: req.query.search, $options: "i" } },
                    { toollink: { $regex: req.query.search, $options: "i" } }
                ]
            }
            : {};

        const tools = await SavedTool.find({
            userId: req.user.id,
            ...keyword
        })
            .populate("toolId")
            .populate("folderId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SavedTool.countDocuments({
            userId: req.user.id,
            ...keyword
        });

        res.json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            tools
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteSavedTool = async (req, res) => {
    try {

        const tool = await SavedTool.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!tool) {
            return res.status(404).json({
                message: "Saved tool not found"
            });
        }

        // 🔥 delete image if from ImageKit
        if (tool.image?.fileId) {
            await imagekit.deleteFile(tool.image.fileId);
        }

        // 🔥 decrease saveCount (platform)
        if (tool.type === "platform") {
            await Tool.findByIdAndUpdate(tool.toolId, {
                $inc: { saveCount: -1 }
            });
        }

        await SavedTool.findByIdAndDelete(tool._id);

        res.json({
            success: true,
            message: "Tool removed"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// move tools folder to folder
exports.moveSavedTool = async (req, res) => {
    try {

        const { folderId } = req.body;

        const tool = await SavedTool.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!tool) {
            return res.status(404).json({
                message: "Saved tool not found"
            });
        }

        // ❌ prevent duplicate in target folder
        const exists = await SavedTool.findOne({
            userId: req.user.id,
            folderId,
            toolId: tool.toolId,
            toollink: tool.toollink
        });

        if (exists) {
            return res.status(400).json({
                message: "Tool already exists in target folder"
            });
        }

        tool.folderId = folderId;

        await tool.save();

        res.json({
            success: true,
            tool
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// updateing the custom tool only
exports.updateCustomTool = async (req, res) => {
    try {

        const { toolname, toollink, description } = req.body;

        const tool = await SavedTool.findOne({
            _id: req.params.id,
            userId: req.user.id,
            type: "custom"
        });

        if (!tool) {
            return res.status(404).json({
                message: "Custom tool not found"
            });
        }

        // 🔥 check if updating to platform tool
        if (toollink) {
            const existingPlatform = await Tool.findOne({
                link: toollink
            });

            if (existingPlatform) {
                return res.status(400).json({
                    message: "This tool already exists in platform. Save it from platform tools."
                });
            }
        }

        // 🔥 DUPLICATE CHECK
        const existing = await SavedTool.findOne({
            _id: { $ne: req.params.id },
            userId: req.user.id,
            $or: [
                { toolname: toolname?.toLowerCase() },
                { toollink }
            ]
        });

        if (existing) {
            return res.status(400).json({
                message: "Tool with same name or link already exists"
            });
        }

        // 🔥 IMAGE UPDATE
        if (req.file) {

            // delete old image (if from ImageKit)
            if (tool.image?.fileId) {
                await imagekit.deleteFile(tool.image.fileId);
            }

            const response = await imagekit.upload({
                file: req.file.buffer,
                fileName: req.file.originalname,
                folder: "custom-tools"
            });

            tool.image = {
                url: response.url,
                fileId: response.fileId
            };
        }

        // update fields
        if (toolname) tool.toolname = toolname.toLowerCase();
        if (toollink) tool.toollink = toollink;
        if (description !== undefined) tool.description = description;

        await tool.save();

        res.json({
            success: true,
            tool
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


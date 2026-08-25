const Folder = require("../models/folder.model.js");
const SavedTool = require("../models/usertool.model.js");

// ✅ Create Folder
exports.createFolder = async (req, res) => {
    try {

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Folder name required"
            });
        }

        const normalizedName = name.trim().toLowerCase();

        // ✅ Prevent duplicate folder per user
        const existing = await Folder.findOne({
            userId: req.user.id,
            name: normalizedName
        });

        if (existing) {
            return res.status(400).json({
                message: "Folder already exists"
            });
        }

        const folder = await Folder.create({
            name: normalizedName,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            folder
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
// // getFolders
// exports.getFolders = async (req, res) => {
//     try {

//         const page = Number(req.query.page) || 1;
//         const limit = 10;

//         const skip = (page - 1) * limit;

//         // 🔥 SEARCH
//         const keyword = req.query.search
//             ? {
//                 name: {
//                     $regex: req.query.search.toLowerCase(),
//                     $options: "i"
//                 }
//             }
//             : {};

//         const folders = await Folder.find({
//             userId: req.user.id,
//             ...keyword
//         })
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit);

//         const total = await Folder.countDocuments({
//             userId: req.user.id,
//             ...keyword
//         });

//         res.json({
//             success: true,
//             total,
//             page,
//             pages: Math.ceil(total / limit),
//             folders
//         });

//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// };

// ✅ Get or Ensure Default Folder for authenticated user (Independent of pagination)
exports.getDefaultFolder = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        let defaultFolder = await Folder.findOne({
            userId,
            $or: [{ type: "default" }, { name: "default" }]
        });

        if (!defaultFolder) {
            defaultFolder = await Folder.create({
                name: "default",
                userId,
                type: "default"
            });
        }

        res.json({
            success: true,
            defaultFolder
        });
    } catch (error) {
        console.error("Get default folder error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Updated getFolders inside folder.controller.js
exports.getFolders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const keyword = req.query.search
            ? {
                name: {
                    $regex: req.query.search.toLowerCase(),
                    $options: "i"
                }
              }
            : {};

        // Find match criteria base
        const matchQuery = {
            userId: req.user._id || req.user.id, // Handles both payload fallback keys
            ...keyword
        };

        // Fetch folders matching requirements
        const foldersRaw = await Folder.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Lean for faster payload handling execution

        // 🔥 DYNAMIC STEP: Populate tools inside each folder for the frontend preview marquee
        const foldersWithPreview = await Promise.all(
            foldersRaw.map(async (folder) => {
                // Find tools explicitly assigned to this folder
                const tools = await SavedTool.find({ folderId: folder._id })
                    .populate("toolId", "name image link") // Populate platform tool fields if exist
                    .limit(6) // Only grab the top 6 items to keep payload data light
                    .lean();

                // Format tools data structurally so the frontend handles it uniformly
                const formattedTools = tools.map(item => ({
                    _id: item._id,
                    name: item.type === "platform" ? item.toolId?.name : item.toolname,
                    link: item.type === "platform" ? item.toolId?.link : item.toollink,
                    image: item.type === "platform" ? item.toolId?.image?.url : item.image?.url
                }));

                return {
                    ...folder,
                    tools: formattedTools,
                    toolCount: await SavedTool.countDocuments({ folderId: folder._id })
                };
            })
        );

        const total = await Folder.countDocuments(matchQuery);

        res.json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            folders: foldersWithPreview
        });

    } catch (error) {
        console.error("Aggregation lookup error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// delete folder logic
exports.deleteFolder = async (req, res) => {
    try {

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!folder) {
            return res.status(404).json({
                message: "Folder not found"
            });
        }

        // ❌ Prevent deleting default folder
        if (folder.type === "default") {
            return res.status(400).json({
                message: "Default folder cannot be deleted"
            });
        }

        // 🔥 Find default folder
        let defaultFolder = await Folder.findOne({
            userId: req.user.id,
            type: "default"
        });

        // 🔥 If not exist → create it
        if (!defaultFolder) {
            defaultFolder = await Folder.create({
                name: "default",
                userId: req.user.id,
                type: "default"
            });
        }

        // 🔥 Move all tools → default folder
        await SavedTool.updateMany(
            { folderId: folder._id },
            { folderId: defaultFolder._id }
        );

        // 🔥 Delete folder
        await Folder.findByIdAndDelete(folder._id);

        res.json({
            success: true,
            message: "Folder deleted and tools moved to default"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
// edit folder logic
exports.renameFolder = async (req, res) => {
    try {

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Folder name required"
            });
        }

        const normalizedName = name.trim().toLowerCase();

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!folder) {
            return res.status(404).json({
                message: "Folder not found"
            });
        }

        // 🔥 CHECK DUPLICATE (exclude current folder)
        const existing = await Folder.findOne({
            userId: req.user.id,
            name: normalizedName,
            _id: { $ne: req.params.id }
        });

        if (existing) {
            return res.status(400).json({
                message: "You already created a folder with this name"
            });
        }

        folder.name = normalizedName;

        await folder.save();

        res.json({
            success: true,
            folder
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
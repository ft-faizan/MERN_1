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
// getFolders
exports.getFolders = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = 10;

        const skip = (page - 1) * limit;

        // 🔥 SEARCH
        const keyword = req.query.search
            ? {
                name: {
                    $regex: req.query.search.toLowerCase(),
                    $options: "i"
                }
            }
            : {};

        const folders = await Folder.find({
            userId: req.user.id,
            ...keyword
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Folder.countDocuments({
            userId: req.user.id,
            ...keyword
        });

        res.json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            folders
        });

    } catch (error) {
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
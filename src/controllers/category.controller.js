const Category = require("../models/category.model.js");
const Tool = require("../models/webtool.model.js");
const User = require("../models/user.model.js");
const mongoose = require("mongoose");


// creating a category
exports.createCategory = async (req, res) => {
    try {

        // ✅ 1. Clean input
        const name = req.body.name?.trim();

        // ✅ 2. Validate
        if (!name) {
            return res.status(400).json({
                message: "Category name required"
            });
        }

        // ✅ 3. Check duplicate (before DB insert)
        const existing = await Category.findOne({ name });

        if (existing) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        // ✅ 4. Create category
        const category = await Category.create({
            name,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            category
        });

    } catch (error) {

        // fallback safety (in case index catches duplicate)
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        res.status(500).json({ message: "Server error" });
    }
};




exports.getCategories = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const mode = req.query.mode;

        const keyword = req.query.search
            ? { name: { $regex: req.query.search, $options: "i" } }
            : {};

        let filter = { ...keyword };

        // 🔥 SAFE CHECK
        if (mode === "admin" && req.user) {
            // filter.createdBy = req.user.id;
            filter.createdBy = new mongoose.Types.ObjectId(req.user.id);
        }

        // 🔥 NEW: filter by email (SUPER ADMIN)
        const userEmail = req.query.email;

        if (userEmail) {
            const user = await User.findOne({ email: userEmail });

            if (user) {
                filter.createdBy = user._id;
            }
        }

        const categories = await Category.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Category.countDocuments(filter);

        res.json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            categories
        });

    } catch (error) {
        console.error("GET CATEGORY ERROR:", error); // 🔥 ADD THIS
        res.status(500).json({ message: "Server error" });
    }
};


exports.deleteCategory = async (req, res) => {
    try {

        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        // 🔥 ONLY SUPERADMIN
        if (req.user.role !== "superadmin") {
            return res.status(403).json({
                message: "Only superadmin can delete categories"
            });
        }

        // delete tools
        await Tool.deleteMany({ category: categoryId });

        // delete category
        await Category.findByIdAndDelete(categoryId);

        res.json({
            success: true,
            message: "Category and its tools deleted"
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//  update v3
exports.updateCategory = async (req, res) => {
    try {

        const { name } = req.body;

        // 1. validate name
        if (!name) {
            return res.status(400).json({
                message: "Category name required"
            });
        }

        // 2. validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        // 3. find category FIRST
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        // 🔐 4. SECURITY CHECK (VERY IMPORTANT)
        if (
            req.user.role !== "superadmin" &&
            category.createdBy.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "Not allowed"
            });
        }

        // 5. normalize name
        const normalizedName = name.trim().toLowerCase();

        // 6. check duplicate (exclude current)
        const existing = await Category.findOne({
            name: normalizedName,
            _id: { $ne: req.params.id }
        });

        if (existing) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        // 7. update
        category.name = normalizedName;

        await category.save();

        res.json({
            success: true,
            category
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        res.status(500).json({ message: "Server error" });
    }
};

// 🔥 CATEGORY STATS
exports.getCategoryStats = async (req, res) => {
    try {
        console.log("🔥 stats API hit");
        console.log("USER:", req.user);

        const totalCategories = await Category.countDocuments();

        const myCategories = await Category.countDocuments({
            createdBy: new mongoose.Types.ObjectId(req.user.id),
        });

        console.log("TOTAL:", totalCategories);
        console.log("MY:", myCategories);

        res.json({
            success: true,
            totalCategories,
            myCategories,
        });
    } catch (error) {
        console.error("CATEGORY STATS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
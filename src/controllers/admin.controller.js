const Tool = require("../models/webtool.model");
const Category = require("../models/category.model");

exports.getDashboardStats = async (req, res) => {
    try {
        const mode = req.query.mode;

        let toolFilter = {};
        let categoryFilter = {};

        // 🟢 Admin mode → only own
        if (mode === "admin") {
            toolFilter.addedBy = req.user.id;
            categoryFilter.addedBy = req.user.id;
        }

        const totalTools = await Tool.countDocuments(toolFilter);
        const totalCategories = await Category.countDocuments(categoryFilter);

        res.json({
            success: true,
            totalTools,
            totalCategories
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
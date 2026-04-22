const Tool = require("../models/webtool.model.js");
const Category = require("../models/category.model.js");
const imagekit = require("../services/imagekit.service.js");
const SavedTool = require("../models/usertool.model.js");
const User = require("../models/user.model.js");

// create a tool
exports.createTool = async (req, res) => {
  try {
    const { name, link, category, description } = req.body;

    if (!name || !link || !category || !description) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // ✅ check category exists
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(400).json({
        message: "Sorry, this category does not exist",
      });
    }

    const normalizedName = name.trim().toLowerCase();

    // ✅ check duplicate tool (same name)
    const existingTool = await Tool.findOne({
      name: normalizedName,
    });

    if (existingTool) {
      return res.status(400).json({
        message: `Tool "${name}" already exists`,
      });
    }
    // ❗ check file
    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    // 🔥 Upload to ImageKit
    const response = await imagekit.upload({
      file: req.file.buffer, // file buffer
      fileName: req.file.originalname,
      folder: "tools",
    });

    // 🔥 Save in DB
    const tool = await Tool.create({
      // name,
      name: normalizedName,
      link,
      category,
      description,
      image: {
        url: response.url,
        fileId: response.fileId,
      },
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      tool,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (
      req.user.role !== "superadmin" &&
      tool.addedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not allowed to update this tool",
      });
    }

    if (!tool) {
      return res.status(404).json({
        message: "Tool not found",
      });
    }

    // 🔥 1. delete from ImageKit
    if (tool.image?.fileId) {
      await imagekit.deleteFile(tool.image.fileId);
    }

    // 🔥 2. remove from ALL users
    await SavedTool.deleteMany({
      toolId: tool._id,
    });

    // 🔥 3. delete tool
    await Tool.findByIdAndDelete(tool._id);

    res.json({
      success: true,
      message: "Tool deleted and removed from all users",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// get all tools
exports.getTools = async (req, res) => {
  try {
    const isAdminRoute = req.originalUrl.includes("/admin");
    const mode = req.query.mode;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // const keyword = req.query.search
    //     ? { name: { $regex: req.query.search, $options: "i" } }
    //     : {};

    const keyword = req.query.search
      ? { name: { $regex: req.query.search.toLowerCase(), $options: "i" } }
      : {};

    const categoryFilter = req.query.category
      ? { category: req.query.category }
      : {};

    // const tools = await Tool.find({
    //     ...keyword,
    //     ...categoryFilter
    // })
    //     .populate("category", "name")
    //     .sort({ saveCount: -1 })
    //     .skip(skip)
    //     .limit(limit);

    let filter = {
      ...keyword,
      ...categoryFilter,
    };

    console.log("QUERY:", req.query);

    // 🔥 EMAIL FILTER
    if (req.query.email) {
      const user = await User.findOne({ email: req.query.email });

      if (user) {
        filter.addedBy = user._id;
      }
    }

    // 🔥 ADMIN FILTER
    if (isAdminRoute && !req.query.email) {
      if (mode === "admin") {
        filter.addedBy = req.user.id;
      }
    }

    console.log("FINAL FILTER:", filter);
    // 🔥 FILTER BY EMAIL (SUPER ADMIN)
    if (req.query.email) {
      const user = await User.findOne({ email: req.query.email });

      if (user) {
        filter.addedBy = user._id;
      }
    }

    // 🔥 APPLY FILTER ONLY FOR ADMIN ROUTE
    if (isAdminRoute) {
      if (mode === "admin") {
        filter.addedBy = req.user.id;
      }
      // superadmin → no filter (see all)
    }

    const tools = await Tool.find(filter)
      .populate("category", "name")
      .populate("addedBy", "name email")
      .sort({ saveCount: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tool.countDocuments({
      ...keyword,
      ...categoryFilter,
    });

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      tools,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// get single tool
exports.getToolById = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id).populate(
      "category",
      "name",
    );

    if (!tool) {
      return res.status(404).json({
        message: "Tool not found",
      });
    }

    res.json({
      success: true,
      tool,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// update a tool
exports.updateTool = async (req, res) => {
  try {
    const { name, link, category, description } = req.body;

    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({
        message: "Tool not found",
      });
    }

    // 🔥 ADD HERE (IMPORTANT)
    let existing = null;

    const normalizedName = name?.trim().toLowerCase();

    // check name change
    if (normalizedName && normalizedName !== tool.name) {
      existing = await Tool.findOne({ name: normalizedName });
    }

    // check link change
    if (!existing && link && link !== tool.link) {
      existing = await Tool.findOne({ link: link.trim() });
    }

    if (existing) {
      return res.status(400).json({
        message: "Tool with same name or link already exists",
      });
    }

    // 🔥 IMAGE UPDATE LOGIC
    if (req.file) {
      // 1️⃣ delete old image
      if (tool.image?.fileId) {
        await imagekit.deleteFile(tool.image.fileId);
      }

      // 2️⃣ upload new image
      const response = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: "tools",
      });

      // 3️⃣ update image
      tool.image = {
        url: response.url,
        fileId: response.fileId,
      };
    }

    // ✅ update other fields
    tool.name = normalizedName || tool.name;
    tool.link = link || tool.link;
    tool.category = category || tool.category;
    tool.description = description || tool.description;

    await tool.save();

    res.json({
      success: true,
      tool,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getCategoryPreviewTools = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // 🔥 Step 1: check if category exists
    const categoryExists = await Category.findById(categoryId);

    if (!categoryExists) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // 🔥 Step 2: get top saved tools
    let tools = await Tool.find({ category: categoryId })
      .sort({ saveCount: -1 })
      .limit(20);

    // 🔥 Step 3: check if all saveCount = 0
    const allZero = tools.every((tool) => tool.saveCount === 0);

    // 🔥 Step 4: fallback → recent tools
    if (allZero) {
      tools = await Tool.find({ category: categoryId })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    res.json({
      success: true,
      tools,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

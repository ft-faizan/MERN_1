const mongoose = require("mongoose");
const SavedTool = require("../models/usertool.model");
const Folder = require("../models/folder.model");



// ─── GET /api/dashboard/stats ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    // middleware sets req.user = decoded JWT — token uses "id" not "_id"
    const userId = new mongoose.Types.ObjectId(req.user.id);
 
    const [toolCounts, folderCount] = await Promise.all([
      SavedTool.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total:    { $sum: 1 },
            platform: { $sum: { $cond: [{ $eq: ["$type", "platform"] }, 1, 0] } },
            custom:   { $sum: { $cond: [{ $eq: ["$type", "custom"]   }, 1, 0] } },
          },
        },
      ]),
      Folder.countDocuments({ userId }),
    ]);
 
    const counts = toolCounts[0] || { total: 0, platform: 0, custom: 0 };
 
    res.status(200).json({
      total:    counts.total,
      platform: counts.platform,
      custom:   counts.custom,
      folders:  folderCount,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
 
// ─── GET /api/dashboard/activity?days=7 ──────────────────────────────────
const getDashboardActivity = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const days   = parseInt(req.query.days) || 7;
 
    // build list of last N days oldest → newest
    const dateList = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dateList.push(d);
    }
 
    const raw = await SavedTool.aggregate([
      { $match: { userId, createdAt: { $gte: dateList[0] } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
    ]);
 
    // lookup map: "YYYY-MM-DD|type" → count
    const lookup = {};
    raw.forEach(({ _id, count }) => {
      lookup[`${_id.date}|${_id.type}`] = count;
    });
 
    const DAY_NAMES    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels       = [];
    const platformData = [];
    const customData   = [];
 
    dateList.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      labels.push(DAY_NAMES[d.getDay()]);
      platformData.push(lookup[`${key}|platform`] || 0);
      customData.push(lookup[`${key}|custom`]     || 0);
    });
 
    res.status(200).json({
      labels,
      platform: platformData,
      custom:   customData,
    });
  } catch (error) {
    console.error("getDashboardActivity error:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
};
 
module.exports = { getDashboardStats, getDashboardActivity };

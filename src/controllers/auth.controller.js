
// const User = require("../models/user.model.js");
// const Category = require("../models/category.model.js");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const config = require("../configs/config.js");

// // signup
// exports.registerUser = async function registerUser(req, res) {

//     const { name, email, password, role } = req.body;

//     // 1️⃣ Validate fields
//     if (!name || !email || !password) {
//         return res.status(400).json({ message: "All fields are required" });
//     }

//     try {

//         // 2️⃣ Check if email already exists
//         const existingUser = await User.findOne({ email });

//         if (existingUser) {
//             return res.status(400).json({ message: "Email already exists" });
//         }

//         // 3️⃣ Hash password
//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//         // 4️⃣ Create user
//         const newUser = new User({
//             name,
//             email,
//             password: hashedPassword,
//             role: role || "user" // default role
//         });

//         await newUser.save();

//         // 5️⃣ Create JWT token
//         const token = jwt.sign(
//             { id: newUser._id,
//                  role: newUser.role },
           
//             config.jwtSecret,
//             { expiresIn: "30d" }
//         );

//         res.cookie("token", token, {
//             httpOnly: true, // JS cannot access cookie
//             secure: false, // true in production (https)
//             sameSite: "lax", // CSRF protection
//             domain: "localhost", // 🔥 ADD THIS
//             path: "/",           // 🔥 ADD THIS
//             maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
//         });

//         res.status(201).json({
//             message: "User registered successfully",
//             user: {
//                 id: newUser._id,
//                 name: newUser.name,
//                 email: newUser.email,
//                 role: newUser.role
//             }
//         });

//     } catch (error) {

//         console.error("Error registering user:", error);

//         res.status(500).json({
//             message: "Error registering user"
//         });

//     }
// };

// // signin
// exports.loginUser = async function loginUser(req, res) {
//     const { email, password } = req.body;

//     // 1️⃣ Validate fields
//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: "Email and password are required"
//         });
//     }

//     try {
//         // 2️⃣ Check if user exists
//         const user = await User.findOne({ email }).select("+password");

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid email "
//             });
//         }

//         // 3️⃣ Compare password
//         const isPasswordValid = await bcrypt.compare(password, user.password);

//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid password"
//             });
//         }

//         // 4️⃣ Generate JWT token
//         const token = jwt.sign(
//             {
//                 id: user._id,
//                 role: user.role
//             },
            
//             config.jwtSecret,
//             { expiresIn: "30d" }
//         );

//         // 5️⃣ Send response
//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: false,
//             sameSite: "lax",
//             domain: "localhost", // 🔥 ADD THIS
//             path: "/",           // 🔥 ADD THIS
//             maxAge: 30 * 24 * 60 * 60 * 1000
//         });

//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role
//             }
//         });
//     } catch (error) {
//         console.error("Login error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// // get-me
// exports.getCurrentUser = async function getCurrentUser(req, res) {

//     try {

//      const user = await User.findById(req.user.id).select("-password");
        

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             user
//         });

//     } catch (error) {

//         console.error("Error fetching user:", error);

//         res.status(500).json({
//             message: "Server error"
//         });

//     }

// };

// // signout
// exports.logoutUser = function logoutUser(req, res) {
//     try {
//         res.cookie("token", "", {
//             httpOnly: true,
//             secure: false, // true in production
//             sameSite: "lax",
//             domain: "localhost", // 🔥 ADD THIS
//             path: "/",           // 🔥 ADD THIS
//             expires: new Date(0) // expire immediately
//         });

//         res.status(200).json({
//             success: true,
//             message: "Logged out successfully"
//         });

//     } catch (error) {
//         console.error("Logout error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Logout failed"
//         });
//     }
// };

// // update name
// exports.updateUserName = async function updateUserName(req, res) {
//     try {
//         const { name } = req.body;

//         // 1️⃣ Validate
//         if (!name || name.trim() === "") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Name is required"
//             });
//         }

//         // 2️⃣ Update user
//         const updatedUser = await User.findByIdAndUpdate(
//              req.user.id, // from token
//             { name: name.trim() },
//             { new: true, runValidators: true }
//         ).select("-password");

//         // 3️⃣ Check user
//         if (!updatedUser) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         // 4️⃣ Response
//         res.status(200).json({
//             success: true,
//             message: "Name updated successfully",
//             user: updatedUser
//         });

//     } catch (error) {
//         console.error("Update name error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

// // 🔥 GET ALL USERS (for dropdown)
// // exports.getAllUsers = async (req, res) => {
// //   try {
// //     const users = await User.find()
// //       .select("name email role")
// //       .sort({ createdAt: -1 });

// //     res.json({
// //       success: true,
// //       users,
// //     });
// //   } catch (error) {
// //     console.error("GET USERS ERROR:", error);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // };  


// // 🔥 GET USERS WHO CREATED CATEGORIES ONLY
// exports.getAllUsers = async (req, res) => {
//   try {
//     console.log("🔥 getAllUsers API hit");

//     const users = await Category.find()
//       .populate("createdBy", "name email")
//       .select("createdBy");

//     console.log("RAW USERS:", users);

//     const uniqueUsersMap = new Map();

//     users.forEach((item) => {
//       if (item.createdBy) {
//         uniqueUsersMap.set(
//           item.createdBy._id.toString(),
//           item.createdBy
//         );
//       }
//     });

//     const uniqueUsers = Array.from(uniqueUsersMap.values());

//     console.log("FINAL USERS:", uniqueUsers);

//     res.json({
//       success: true,
//       users: uniqueUsers,
//     });
//   } catch (error) {
//     console.error("GET USERS ERROR:", error); // 🔥 THIS WILL SHOW REAL ERROR
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // 🔥 USER STATS (for super admin dashboard)
// exports.getUserStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();

//     const totalAdmins = await User.countDocuments({
//       role: "admin",
//     });

//     const totalSuperAdmins = await User.countDocuments({
//       role: "superadmin",
//     });

//     res.json({
//       success: true,
//       totalUsers,
//       totalAdmins,
//       totalSuperAdmins,
//     });
//   } catch (error) {
//     console.error("USER STATS ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../configs/config.js");

// Dynamic check for environment configuration flags
const isProduction = process.env.NODE_ENV === "production";

// signup
exports.registerUser = async function registerUser(req, res) {
    const { name, email, password, role } = req.body;

    // 1️⃣ Validate fields
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // 2️⃣ Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // 3️⃣ Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4️⃣ Create user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "user" // default role
        });

        await newUser.save();

        // 5️⃣ Create JWT token - normalized payload token identifier properties
        const token = jwt.sign(
            { 
                _id: newUser._id,
                role: newUser.role 
            },
            config.jwtSecret,
            { expiresIn: "30d" }
        );

        // 6️⃣ Send cross-origin safe cookie attributes 
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction, 
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({
            message: "Error registering user"
        });
    }
};

// signin
exports.loginUser = async function loginUser(req, res) {
    const { email, password } = req.body;

    // 1️⃣ Validate fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        // 2️⃣ Check if user exists
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email "
            });
        }

        // 3️⃣ Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        // 4️⃣ Generate JWT token - normalized payload token identifier properties
        const token = jwt.sign(
            {
                _id: user._id,
                role: user.role
            },
            config.jwtSecret,
            { expiresIn: "30d" }
        );

        // 5️⃣ Send cross-origin safe cookie attributes
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// get-me
exports.getCurrentUser = async function getCurrentUser(req, res) {
    try {
        // Updated pointer targets req.user._id properties instead of legacy root identifier strings
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

// signout
exports.logoutUser = function logoutUser(req, res) {
    try {
        // Flush auth parameters using proper cross-origin safe clearing parameters
        res.cookie("token", "", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            expires: new Date(0)
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
};

// update name
exports.updateUserName = async function updateUserName(req, res) {
    try {
        const { name } = req.body;

        // 1️⃣ Validate
        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        // 2️⃣ Update user matching updated authentication token structures
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select("-password");

        // 3️⃣ Check user
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 4️⃣ Response
        res.status(200).json({
            success: true,
            message: "Name updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update name error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// 🔥 GET USERS WHO CREATED CATEGORIES ONLY
exports.getAllUsers = async (req, res) => {
    try {
        console.log("🔥 getAllUsers API hit");

        const users = await Category.find()
            .populate("createdBy", "name email")
            .select("createdBy");

        console.log("RAW USERS:", users);

        const uniqueUsersMap = new Map();

        users.forEach((item) => {
            if (item.createdBy) {
                uniqueUsersMap.set(
                    item.createdBy._id.toString(),
                    item.createdBy
                );
            }
        });

        const uniqueUsers = Array.from(uniqueUsersMap.values());
        console.log("FINAL USERS:", uniqueUsers);

        res.json({
            success: true,
            users: uniqueUsers,
        });
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔥 USER STATS (for super admin dashboard)
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: "admin" });
        const totalSuperAdmins = await User.countDocuments({ role: "superadmin" });

        res.json({
            success: true,
            totalUsers,
            totalAdmins,
            totalSuperAdmins,
        });
    } catch (error) {
        console.error("USER STATS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
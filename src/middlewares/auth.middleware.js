

// const jwt = require("jsonwebtoken");
// const config = require("../configs/config.js");

// exports.verifyToken = (req, res, next) => {
//     const token = req.cookies.token;

//     if (!token) {
//         return res.status(401).json({
//             success: false,
//             message: "Not authenticated"
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, config.jwtSecret);
        
//         // Ensure the token actually contains the _id
//         if (!decoded._id) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User ID missing from token"
//             });
//         }

//         req.user = decoded; 
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             success: false,
//             message: "Invalid or expired token"
//         });
//     }
// };

// exports.isAdmin = (req, res, next) => {
//     if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
//         next();
//     } else {
//         return res.status(403).json({
//             success: false,
//             message: "Access denied: Admins only"
//         });
//     }
// };



const jwt = require("jsonwebtoken");
const config = require("../configs/config.js");

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        // ✅ FIXED
        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "User ID missing from token"
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

exports.isAdmin = (req, res, next) => {
    if (
        req.user &&
        (req.user.role === "admin" ||
         req.user.role === "superadmin")
    ) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admins only"
        });
    }
};
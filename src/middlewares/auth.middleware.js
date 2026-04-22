const jwt = require("jsonwebtoken");
const config = require("../configs/config.js");

exports.verifyToken = (req, res, next) => {

    const token = req.cookies.token;

    // check token
    if (!token) {
        return res.status(401).json({
            message: "Not authenticated"
        });
    }

    try {

        const decoded = jwt.verify(token, config.jwtSecret);

        req.user = decoded; // store user info in request

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }
};
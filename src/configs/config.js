const dotenv = require('dotenv');

dotenv.config();

// ONE: CHECKING MONGO URI
if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}

// TWO: CHECKING JWT SECRET
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

//  SAVEING ALL config in one object
const config = {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET
};

module.exports = config;
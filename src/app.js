



const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

const authRoutes = require('./routes/auth.route.js');
const categoryRoutes = require('./routes/category.routes.js');
const toolRoutes = require('./routes/tool.routes.js');
const folderRoutes = require("./routes/folder.routes.js");
const savedToolRoutes = require("./routes/savedTool.routes.js");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");


app.use(
  cors({
    origin: "https://frontend-xi-flame-18.vercel.app",
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// test route
app.post("/test", (req, res) => {
    res.json({ message: "Test route working", body: req.body });
});

// auth routes
app.use('/api/auth', authRoutes);

// category routes
app.use('/api/categories', categoryRoutes);

app.use("/api/users", userRoutes);

// tool routes
app.use('/api/tools', toolRoutes);

// folder routes
app.use("/api/folders", folderRoutes);

// saved tool routes
app.use("/api/saved-tools", savedToolRoutes);

// admin routes
app.use("/api/admin", adminRoutes);

// place it with your other app.use() route lines:
app.use("/api/dashboard", dashboardRoutes);


module.exports = app;


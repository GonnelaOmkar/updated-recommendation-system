require("dotenv").config()
const express = require("express")
const sequelize = require('./config/database');
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const app = express()

// --- MIDDLEWARE ---

// THIS IS THE FIX: Use a simpler CORS setup that allows all local connections
app.use(cors())

app.disable("x-powered-by")
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(express.json())

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("SQLite connected successfully!");
    // Sync models to the database (creates table if not exists)
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized.");
  } catch (err) {
    console.error("WARNING: SQLite connection error:", err.message);
  }
}
connectDB()

// --- ROUTES ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { msg: "Too many requests, please try again later." },
})

app.use("/api/auth", authLimiter, require("./routes/auth"))

// --- START SERVER ---
const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`)
})

console.log("MONGODB_URI ->", process.env.MONGODB_URI);
// ========================================================
// QUIZITO BACKEND - COMPLETE & WORKING VERSION (CLEAN FIX)
// ========================================================

// Core dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

// ========================================================
// 1. INITIALIZE APP
// ========================================================

const app = express();
const server = http.createServer(app);

// ========================================================
// 2. SOCKET.IO CONFIG
// ========================================================

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'https://quizito-frontend.netlify.app'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// ========================================================
// 3. RATE LIMITING
// ========================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: "Too many requests" }
});

// ========================================================
// 4. MIDDLEWARE
// ========================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'https://quizito-frontend.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(limiter);

// ========================================================
// 5. FILE UPLOAD
// ========================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ========================================================
// 6. MONGODB CONNECTION
// ========================================================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ Mongo Error:", err.message));

// ========================================================
// 7. DATABASE MODELS
// ========================================================

/* -------------------- User Model -------------------- */

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'educator', 'admin'], default: 'user' },
  profileImage: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  stats: {
    quizzesTaken: { default: 0, type: Number },
    correctAnswers: { default: 0, type: Number },
    totalAnswers: { default: 0, type: Number },
    averageScore: { default: 0, type: Number },
    bestScore: { default: 0, type: Number },
    streak: { default: 0, type: Number },
    lastActive: { type: Date, default: Date.now }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

const User = mongoose.model("User", userSchema);

/* -------------------- Quiz Model -------------------- */

const questionSchema = new mongoose.Schema({
  question: String,
  type: { type: String, default: "multiple-choice" },
  options: [{ text: String, isCorrect: Boolean }],
  correctAnswer: mongoose.Schema.Types.Mixed,
  points: { type: Number, default: 100 },
  timeLimit: { type: Number, default: 30 }
});

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  difficulty: String,
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  public: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model("Quiz", quizSchema);

/* -------------------- Session Model -------------------- */

const participantSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  score: Number,
  answers: []
});

const sessionSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  hostId: mongoose.Schema.Types.ObjectId,
  roomCode: { type: String, unique: true },
  participants: [participantSchema],
  currentQuestion: { type: Number, default: 0 },
  status: { type: String, default: "waiting" }
});

const Session = mongoose.model("Session", sessionSchema);

// ========================================================
// 8. AUTH MIDDLEWARE
// ========================================================

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET || "quizito-secret", (err, user) => {
    if (err)
      return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ========================================================
// 9. ROOT ROUTES
// ========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Quizito Backend Running",
    endpoints: { auth: "/api/auth/*", quizzes: "/api/quizzes/*" }
  });
});

// HEALTH
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ========================================================
// 10. AUTH ROUTES
// ========================================================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email exists" });

    const user = await User.create({
      username,
      email,
      password,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "quizito-secret",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!(await user.comparePassword(req.body.password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "quizito-secret",
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Login error" });
  }
});

// VERIFY TOKEN
app.get("/api/auth/verify", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user)
    return res.status(401).json({ success: false, message: "User not found" });

  res.json({ success: true, user });
});

// REFRESH TOKEN
app.get("/api/auth/refresh", authenticateToken, (req, res) => {
  const newToken = jwt.sign(
    { id: req.user.id, email: req.user.email },
    process.env.JWT_SECRET || "quizito-secret",
    { expiresIn: "7d" }
  );
  res.json({ success: true, token: newToken });
});

// CURRENT USER
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ success: true, user });
});

// ========================================================
// 11. QUIZ ROUTES
// ========================================================

app.get("/api/quizzes", async (req, res) => {
  const quizzes = await Quiz.find({ isActive: true });
  res.json({ success: true, count: quizzes.length, quizzes });
});

app.post("/api/quizzes", authenticateToken, async (req, res) => {
  const quiz = await Quiz.create({
    ...req.body,
    createdBy: req.user.id
  });
  res.json({ success: true, quiz });
});

// ========================================================
// 12. SESSION ROUTES
// ========================================================

app.post("/api/sessions", authenticateToken, async (req, res) => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const session = await Session.create({
    quizId: req.body.quizId,
    hostId: req.user.id,
    roomCode
  });

  res.json({ success: true, session });
});

// ========================================================
// 13. SOCKET.IO LOGIC
// ========================================================

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});

// ========================================================
// 14. ERROR HANDLING
// ========================================================

app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// ========================================================
// 15. START SERVER
// ========================================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = { app, server };

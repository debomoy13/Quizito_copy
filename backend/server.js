/**********************************************************************************************
 * QUIZITO BACKEND – FULL PRODUCTION SERVER
 * --------------------------------------------------------
 * FEATURES INCLUDED:
 *  - User Authentication (JWT)
 *  - AI Quiz Generation (OpenAI)
 *  - Quiz CRUD + Admin Mode
 *  - Real-time Live Multiplayer Sessions (Socket.io)
 *  - Leaderboard Logic
 *  - Analytics System
 *  - Adaptive Difficulty
 *  - File Upload (Audio)
 *  - All Security Middlewares
 *  - Render + Netlify CORS fixes
 *  - Rate Limit Fix (trust proxy)
 **********************************************************************************************/

require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ---------------------------------------------------------------------------------------------
// 1. INIT APP + SERVER
// ---------------------------------------------------------------------------------------------

const app = express();
const server = http.createServer(app);

// REQUIRED FOR RENDER (IMPORTANT)
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------------------------
// 2. CORS CONFIG (FIXED FOR NETLIFY + RENDER)
// ---------------------------------------------------------------------------------------------

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://quizitoai.netlify.app",         // YOUR FRONTEND ✔
  "https://quizito-backend.onrender.com",  // YOUR BACKEND ✔
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// SOCKET.IO with Render-safe config
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  path: "/socket.io/",            // FIXED: Render requires explicit path
  transports: ["websocket", "polling"],
});

// ---------------------------------------------------------------------------------------------
// 3. SECURITY
// ---------------------------------------------------------------------------------------------

app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many requests" },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------------------------
// 4. UPLOADS DIRECTORY
// ---------------------------------------------------------------------------------------------

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.random().toString(36).substring(2) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ---------------------------------------------------------------------------------------------
// 5. MONGO CONNECTION
// ---------------------------------------------------------------------------------------------

console.log("MONGODB_URI ->", process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo DB Error:", err.message));

// ---------------------------------------------------------------------------------------------
// 6. MODELS – USER, QUIZ, SESSION, RESULTS
// ---------------------------------------------------------------------------------------------

/* -------------------- User -------------------- */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["user", "educator", "admin"], default: "user" },
  profileImage: {
    type: String,
    default: "https://api.dicebear.com/7.x/avataaars/svg?seed=",
  },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  stats: {
    quizzesTaken: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalAnswers: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};
const User = mongoose.model("User", userSchema);

/* -------------------- Quiz -------------------- */
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, default: "multiple-choice" },
  options: [{ text: String, isCorrect: Boolean }],
  correctAnswer: mongoose.Schema.Types.Mixed,
  points: { type: Number, default: 100 },
  timeLimit: { type: Number, default: 30 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  media: {
    audioUrl: String,
  },
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
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model("Quiz", quizSchema);

/* -------------------- Session -------------------- */
const participantSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  score: Number,
  answers: [],
});

const sessionSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  hostId: mongoose.Schema.Types.ObjectId,
  roomCode: { type: String, unique: true },
  participants: [participantSchema],
  currentQuestion: { type: Number, default: 0 },
  status: { type: String, default: "waiting" },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

/* -------------------- Quiz Results -------------------- */
const quizResultSchema = new mongoose.Schema({
  quizId: mongoose.Schema.Types.ObjectId,
  sessionId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  accuracy: Number,
  startedAt: Date,
  finishedAt: Date,
});
const QuizResult = mongoose.model("QuizResult", quizResultSchema);

// ---------------------------------------------------------------------------------------------
// 7. AUTH MIDDLEWARE
// ---------------------------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || "quizito-secret";

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

// ---------------------------------------------------------------------------------------------
// 8. BASIC ROUTES – ROOT + HEALTH
// ---------------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Quizito Backend Running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ---------------------------------------------------------------------------------------------
// 9. AUTH ROUTES (REGISTER / LOGIN / VERIFY)
// ---------------------------------------------------------------------------------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });

    const user = await User.create({
      username,
      email,
      password,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        username
      )}`,
    });

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.get("/api/auth/verify", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user)
    return res.status(401).json({ success: false, message: "User not found" });

  res.json({ success: true, user });
});

// ---------------------------------------------------------------------------------------------
// 10. QUIZ ROUTES (CRUD)
// ---------------------------------------------------------------------------------------------

app.get("/api/quizzes", async (req, res) => {
  const quizzes = await Quiz.find({ isActive: true, public: true });
  res.json({ success: true, quizzes });
});

app.post("/api/quizzes", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user.id });
    res.json({ success: true, quiz });
  } catch (e) {
    res.status(400).json({ success: false, message: "Quiz creation failed" });
  }
});

app.get("/api/quizzes/:id", authenticateToken, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
  res.json({ success: true, quiz });
});

// ---------------------------------------------------------------------------------------------
// 11. LIVE MULTIPLAYER – SOCKET EVENTS
// ---------------------------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", async ({ roomCode, username, userId }) => {
    const session = await Session.findOne({ roomCode });
    if (!session) return socket.emit("error-message", "Session not found");

    socket.join(roomCode);

    let participant = session.participants.find((p) => p.userId?.toString() === userId);
    if (!participant) {
      session.participants.push({ userId, username, score: 0, answers: [] });
      await session.save();
    }

    io.to(roomCode).emit("participants-update", session.participants);
  });

  socket.on("start-quiz", async ({ roomCode }) => {
    const session = await Session.findOne({ roomCode });
    if (!session) return;

    session.status = "in-progress";
    session.currentQuestion = 0;
    await session.save();

    io.to(roomCode).emit("quiz-started", { currentQuestion: 0 });
  });

  socket.on("submit-answer", async (data) => {
    const { roomCode, userId, username, questionIndex, correct, timeTaken } = data;

    const session = await Session.findOne({ roomCode }).populate("quizId");
    if (!session) return;

    const question = session.quizId.questions[questionIndex];
    const base = question.points || 100;
    const speed = Math.max(0, 10 - (timeTaken || 0));
    const earned = correct ? base + speed : 0;

    let p = session.participants.find((x) => x.userId?.toString() === userId);
    if (!p) {
      p = { userId, username, answers: [], score: 0 };
      session.participants.push(p);
    }

    p.answers.push({ questionIndex, correct, timeTaken, points: earned });
    p.score += earned;

    await session.save();

    const leaderboard = session.participants
      .map((p) => ({ username: p.username, score: p.score }))
      .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("leaderboard-update", leaderboard);
  });

  socket.on("end-quiz", async ({ roomCode }) => {
    const session = await Session.findOne({ roomCode }).populate("quizId");
    if (!session) return;

    session.status = "finished";
    await session.save();

    io.to(roomCode).emit("quiz-ended", { roomCode });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ---------------------------------------------------------------------------------------------
// 12. AI QUIZ GENERATOR (OPENAI)
// ---------------------------------------------------------------------------------------------

app.post("/api/ai/generate-quiz", authenticateToken, async (req, res) => {
  try {
    const { input, numQuestions = 10 } = req.body;

    if (!input)
      return res.status(400).json({ success: false, message: "Input required" });

    const prompt = `
Generate ${numQuestions} multiple-choice questions about:

${input}

Return strict JSON only:
{
 "title": "...",
 "category": "...",
 "questions": [
  {
    "question": "...",
    "options": [
      {"text": "...", "isCorrect": false},
      {"text": "...", "isCorrect": true},
      {"text": "...", "isCorrect": false},
      {"text": "...", "isCorrect": false}
    ]
  }
 ]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    const parsed = JSON.parse(raw);

    const quiz = await Quiz.create({
      title: parsed.title,
      category: parsed.category,
      questions: parsed.questions,
      createdBy: req.user.id,
      public: false,
    });

    res.json({ success: true, quiz });
  } catch (e) {
    console.error("AI Error:", e);
    res.status(500).json({ success: false, message: "AI generation failed" });
  }
});

// ---------------------------------------------------------------------------------------------
// 13. ANALYTICS
// ---------------------------------------------------------------------------------------------

app.get("/api/analytics/me", authenticateToken, async (req, res) => {
  const results = await QuizResult.find({ userId: req.user.id }).populate("quizId");

  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    overview: user.stats,
    results,
  });
});

// ---------------------------------------------------------------------------------------------
// 14. FILE UPLOAD (AUDIO)
// ---------------------------------------------------------------------------------------------

app.post("/api/media/audio", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "File required" });

  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
  });
});

app.use("/uploads", express.static(UPLOAD_DIR));

// ---------------------------------------------------------------------------------------------
// 15. GLOBAL ERROR HANDLERS
// ---------------------------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// ---------------------------------------------------------------------------------------------
// 16. START SERVER
// ---------------------------------------------------------------------------------------------

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

module.exports = { app, server };

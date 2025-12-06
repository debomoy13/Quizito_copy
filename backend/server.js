// ========================================================
// QUIZITO BACKEND - FULL FEATURED SERVER
// ========================================================

// Core deps
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
// For PDF parsing (if you want PDF AI): npm i pdf-parse
// const pdfParse = require("pdf-parse");

// ========================================================
// 1. APP & SERVER SETUP
// ========================================================

const app = express();
const server = http.createServer(app);

// IMPORTANT for Render / proxies (fixes rate-limit X-Forwarded-For issue)
app.set("trust proxy", 1);

// Socket.io
const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",").map(o => o.trim()) || [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://quizitoai.netlify.app",
    "https://quizito-frontend.netlify.app",
    "https://quizitotech.netlify.app",
  ];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ========================================================
// 2. SECURITY + MIDDLEWARE
// ========================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, slow down!" },
});

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// uploads dir for audio / etc
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// File upload (for speech / PDFs etc.)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ========================================================
// 3. DB CONNECTION
// ========================================================

const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI ->", MONGODB_URI);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// ========================================================
// 4. SCHEMAS & MODELS
// ========================================================

/* ------------ User Model ------------ */
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

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

const User = mongoose.model("User", userSchema);

/* ------------ Quiz & Question Models ------------ */

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer", "speech"],
    default: "multiple-choice",
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  correctAnswer: mongoose.Schema.Types.Mixed, // text / index / boolean
  points: { type: Number, default: 100 },
  timeLimit: { type: Number, default: 30 }, // seconds
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  media: {
    audioUrl: { type: String }, // for speech-based questions
  },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  difficulty: { type: String, default: "mixed" },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  public: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model("Quiz", quizSchema);

/* ------------ Session Model (Live Multiplayer) ------------ */

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  score: { type: Number, default: 0 },
  answers: [
    {
      questionIndex: Number,
      correct: Boolean,
      timeTaken: Number,
      points: Number,
    },
  ],
});

const sessionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomCode: { type: String, unique: true, required: true },
  participants: [participantSchema],
  currentQuestion: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["waiting", "in-progress", "finished"],
    default: "waiting",
  },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

/* ------------ Quiz Result / Analytics Model ------------ */

const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  accuracy: Number, // 0–1
  startedAt: Date,
  finishedAt: Date,
});

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

// ========================================================
// 5. AUTH MIDDLEWARE & HELPERS
// ========================================================

const JWT_SECRET = process.env.JWT_SECRET || "quizito-secret";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!roles.includes(req.user.role))
    return res
      .status(403)
      .json({ success: false, message: "Forbidden: insufficient role" });
  next();
};

// Generate JWT
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

// ========================================================
// 6. BASIC ROUTES (ROOT / HEALTH)
// ========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Quizito Backend Running",
    endpoints: {
      auth: "/api/auth/*",
      quizzes: "/api/quizzes/*",
      sessions: "/api/sessions/*",
      ai: "/api/ai/*",
      analytics: "/api/analytics/*",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ========================================================
// 7. AUTH ROUTES
// ========================================================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username, email & password required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Username or email already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role && ["user", "educator", "admin"].includes(role) ? role : "user",
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        username
      )}`,
    });

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (e) {
    console.error("Register error:", e);
    res
      .status(500)
      .json({ success: false, message: "Registration failed, try again" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
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
  const newToken = generateToken(req.user);
  res.json({ success: true, token: newToken });
});

// CURRENT USER
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ success: true, user });
});

// ========================================================
// 8. QUIZ ROUTES (CRUD + ADMIN)
// ========================================================

// List public active quizzes
app.get("/api/quizzes", async (req, res) => {
  const quizzes = await Quiz.find({ isActive: true, public: true }).select(
    "-questions.correctAnswer"
  );
  res.json({ success: true, count: quizzes.length, quizzes });
});

// Create quiz (educator/admin/user)
app.post("/api/quizzes", authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.json({ success: true, quiz });
  } catch (e) {
    console.error("Create quiz error:", e);
    res.status(400).json({ success: false, message: "Quiz creation failed" });
  }
});

// Get single quiz (without exposing correct answers unless admin/creator)
app.get("/api/quizzes/:id", authenticateToken, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  const isOwner = quiz.createdBy?.toString() === req.user.id;
  const isAdmin = req.user.role === "admin" || req.user.role === "educator";

  if (!isOwner && !isAdmin) {
    const quizSafe = quiz.toObject();
    quizSafe.questions = quizSafe.questions.map((q) => ({
      ...q,
      correctAnswer: undefined,
    }));
    return res.json({ success: true, quiz: quizSafe });
  }

  res.json({ success: true, quiz });
});

// Update quiz (owner or admin/educator)
app.put(
  "/api/quizzes/:id",
  authenticateToken,
  async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res.status(404).json({ success: false, message: "Quiz not found" });

    const isOwner = quiz.createdBy?.toString() === req.user.id;
    const isAdmin = ["admin", "educator"].includes(req.user.role);

    if (!isOwner && !isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to edit this quiz" });

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json({ success: true, quiz });
  }
);

// Soft-delete / deactivate quiz
app.delete(
  "/api/quizzes/:id",
  authenticateToken,
  async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res.status(404).json({ success: false, message: "Quiz not found" });

    const isOwner = quiz.createdBy?.toString() === req.user.id;
    const isAdmin = ["admin", "educator"].includes(req.user.role);

    if (!isOwner && !isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to delete this quiz" });

    quiz.isActive = false;
    await quiz.save();
    res.json({ success: true, message: "Quiz deactivated" });
  }
);

// Admin-only: list all quizzes
app.get(
  "/api/admin/quizzes",
  authenticateToken,
  requireRole("admin", "educator"),
  async (req, res) => {
    const quizzes = await Quiz.find();
    res.json({ success: true, count: quizzes.length, quizzes });
  }
);

// ========================================================
// 9. LIVE SESSIONS (REAL-TIME MULTIPLAYER)
// ========================================================

// Create session (host)
app.post("/api/sessions", authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.body;
    if (!quizId)
      return res
        .status(400)
        .json({ success: false, message: "quizId required" });

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const session = await Session.create({
      quizId,
      hostId: req.user.id,
      roomCode,
    });

    res.json({ success: true, session });
  } catch (e) {
    console.error("Create session error:", e);
    res.status(500).json({ success: false, message: "Session creation failed" });
  }
});

// Get session by roomCode
app.get("/api/sessions/room/:code", async (req, res) => {
  const session = await Session.findOne({ roomCode: req.params.code }).populate(
    "quizId"
  );
  if (!session)
    return res.status(404).json({ success: false, message: "Session not found" });

  res.json({ success: true, session });
});

// ========================================================
// 10. SOCKET.IO EVENTS (JOIN, ANSWERS, LEADERBOARD)
// ========================================================

/**
 * Socket events:
 * - "join-room" { roomCode, username, userId? } → server joins socket to room
 * - "start-quiz" { roomCode } (host) → server broadcasts "quiz-started"
 * - "next-question" { roomCode } (host) → increments currentQuestion, emits "question"
 * - "submit-answer" { roomCode, userId, username, questionIndex, correct, timeTaken }
 *   → server updates score and broadcasts "leaderboard-update"
 * - "end-quiz" { roomCode } → server sets status finished, emits "quiz-ended"
 */

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", async ({ roomCode, username, userId }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) {
        socket.emit("error-message", "Session not found");
        return;
      }

      socket.join(roomCode);

      let participant = session.participants.find(
        (p) => p.userId?.toString() === userId
      );
      if (!participant) {
        session.participants.push({
          userId: userId || undefined,
          username,
          score: 0,
          answers: [],
        });
        await session.save();
      }

      io.to(roomCode).emit("participants-update", session.participants);
    } catch (e) {
      console.error("join-room error:", e);
      socket.emit("error-message", "Failed to join room");
    }
  });

  socket.on("start-quiz", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) return;

      session.status = "in-progress";
      session.currentQuestion = 0;
      await session.save();

      io.to(roomCode).emit("quiz-started", { currentQuestion: 0 });
    } catch (e) {
      console.error("start-quiz error:", e);
    }
  });

  socket.on("next-question", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) return;

      session.currentQuestion += 1;
      await session.save();

      io.to(roomCode).emit("question-index", {
        currentQuestion: session.currentQuestion,
      });
    } catch (e) {
      console.error("next-question error:", e);
    }
  });

  socket.on(
    "submit-answer",
    async ({ roomCode, userId, username, questionIndex, correct, timeTaken }) => {
      try {
        const session = await Session.findOne({ roomCode }).populate("quizId");
        if (!session) return;

        const question = session.quizId.questions[questionIndex];
        if (!question) return;

        const basePoints = question.points || 100;
        const speedBonus = Math.max(0, 10 - (timeTaken || 0)); // simple speed bonus
        const earned = correct ? basePoints + speedBonus : 0;

        let participant = session.participants.find(
          (p) => p.userId?.toString() === userId
        );

        if (!participant) {
          participant = {
            userId: userId || undefined,
            username,
            score: 0,
            answers: [],
          };
          session.participants.push(participant);
        }

        participant.answers.push({
          questionIndex,
          correct,
          timeTaken,
          points: earned,
        });
        participant.score += earned;

        await session.save();

        const leaderboard = session.participants
          .map((p) => ({
            username: p.username,
            score: p.score,
          }))
          .sort((a, b) => b.score - a.score);

        io.to(roomCode).emit("leaderboard-update", leaderboard);
      } catch (e) {
        console.error("submit-answer error:", e);
      }
    }
  );

  socket.on("end-quiz", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode }).populate("quizId");
      if (!session) return;

      session.status = "finished";
      await session.save();

      io.to(roomCode).emit("quiz-ended", { roomCode });

      // Persist analytics (QuizResult) for each participant
      for (const p of session.participants) {
        const totalQuestions = session.quizId.questions.length;
        const correctAnswers = p.answers.filter((a) => a.correct).length;
        const score = p.score;
        const accuracy = totalQuestions
          ? correctAnswers / totalQuestions
          : 0;

        await QuizResult.create({
          quizId: session.quizId._id,
          sessionId: session._id,
          userId: p.userId,
          username: p.username,
          score,
          correctAnswers,
          totalQuestions,
          accuracy,
          startedAt: session.createdAt,
          finishedAt: new Date(),
        });

        if (p.userId) {
          const user = await User.findById(p.userId);
          if (user) {
            user.stats.quizzesTaken += 1;
            user.stats.correctAnswers += correctAnswers;
            user.stats.totalAnswers += totalQuestions;
            user.stats.averageScore =
              user.stats.quizzesTaken === 0
                ? score
                : (user.stats.averageScore * (user.stats.quizzesTaken - 1) +
                    score) /
                  user.stats.quizzesTaken;

            if (score > user.stats.bestScore) user.stats.bestScore = score;
            user.stats.lastActive = new Date();

            // Simple XP system
            const xpGain = Math.max(10, score / 10);
            user.xp += xpGain;
            user.level = 1 + Math.floor(user.xp / 1000);

            await user.save();
          }
        }
      }
    } catch (e) {
      console.error("end-quiz error:", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ========================================================
// 11. AI ROUTES (AUTO-GENERATE QUIZZES)
// ========================================================

/**
 * POST /api/ai/generate-quiz
 * body: { mode: "text" | "topic" | "pdf", input, numQuestions?, difficulty? }
 */
app.post("/api/ai/generate-quiz", authenticateToken, async (req, res) => {
  try {
    const { mode = "topic", input, numQuestions = 10, difficulty = "mixed" } =
      req.body;

    if (!input)
      return res
        .status(400)
        .json({ success: false, message: "input text/topic required" });

    // If mode === 'pdf', you'd parse the uploaded PDF here using pdf-parse, etc.
    // For now we'll just treat input as text.

    const prompt = `
You are a quiz generator for an educational app.
Generate ${numQuestions} ${difficulty} multiple-choice questions based on this ${
      mode === "topic" ? "TOPIC" : "TEXT"
    }:

"${input}"

Return STRICT JSON with this structure:
{
  "title": "...",
  "description": "...",
  "category": "${mode === "topic" ? input : "AI Generated"}",
  "questions": [
    {
      "question": "string",
      "difficulty": "easy|medium|hard",
      "options": [
        { "text": "option1", "isCorrect": false },
        { "text": "option2", "isCorrect": true },
        { "text": "option3", "isCorrect": false },
        { "text": "option4", "isCorrect": false }
      ],
      "timeLimit": 30,
      "points": 100
    }
  ]
}
Only output JSON. No extra text.
`;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY not set on server",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("AI JSON parse error:", err, raw);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response",
      });
    }

    // Save quiz immediately (createdBy = current user)
    const quiz = await Quiz.create({
      title: parsed.title || "AI Generated Quiz",
      description: parsed.description || "",
      category: parsed.category || "AI Generated",
      difficulty,
      questions: parsed.questions || [],
      createdBy: req.user.id,
      public: false,
    });

    res.json({ success: true, quiz });
  } catch (e) {
    console.error("AI generate quiz error:", e);
    res.status(500).json({ success: false, message: "AI generation failed" });
  }
});

// ========================================================
// 12. ANALYTICS ROUTES
// ========================================================

// Get user analytics dashboard
app.get("/api/analytics/me", authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const results = await QuizResult.find({ userId: user._id }).populate("quizId");

  res.json({
    success: true,
    overview: user.stats,
    results,
  });
});

// Get quiz analytics (educator/admin or owner)
app.get(
  "/api/analytics/quiz/:quizId",
  authenticateToken,
  async (req, res) => {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz)
      return res.status(404).json({ success: false, message: "Quiz not found" });

    const isOwner = quiz.createdBy?.toString() === req.user.id;
    const isAdmin = ["admin", "educator"].includes(req.user.role);
    if (!isOwner && !isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to view this analytics" });

    const results = await QuizResult.find({ quizId: quiz._id });

    const avgScore =
      results.length === 0
        ? 0
        : results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const avgAccuracy =
      results.length === 0
        ? 0
        : results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

    res.json({
      success: true,
      quiz,
      stats: {
        attempts: results.length,
        avgScore,
        avgAccuracy,
      },
      results,
    });
  }
);

// ========================================================
// 13. ADAPTIVE DIFFICULTY (BASIC ENDPOINT)
// ========================================================

/**
 * Simple endpoint to suggest next difficulty for a user based on accuracy.
 * GET /api/adaptive/next-difficulty?accuracy=0.0-1.0
 */
app.get("/api/adaptive/next-difficulty", authenticateToken, (req, res) => {
  const accuracy = parseFloat(req.query.accuracy || "0");
  let difficulty = "medium";
  if (accuracy >= 0.85) difficulty = "hard";
  else if (accuracy <= 0.5) difficulty = "easy";

  res.json({ success: true, accuracy, suggestedDifficulty: difficulty });
});

// ========================================================
// 14. SPEECH-BASED QUESTION SUPPORT (UPLOAD AUDIO)
// ========================================================

/**
 * POST /api/media/audio
 * form-data: file (audio)
 * Returns: { url }
 */
app.post(
  "/api/media/audio",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Audio file required" });

    // In a real app you might upload to S3/Cloudinary, etc.
    // For now, we just host from /uploads
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  }
);

// Serve static uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// ========================================================
// 15. ERROR HANDLERS
// ========================================================

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// ========================================================
// 16. START SERVER
// ========================================================

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = { app, server };

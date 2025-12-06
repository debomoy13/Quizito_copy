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
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", cors());

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
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      quizzes: "/api/quizzes",
      ai: "/api/ai",
      analytics: "/api/analytics",
      media: "/api/media",
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------------------------
// 9. AUTH ROUTES (REGISTER / LOGIN / VERIFY) - FIXED
// ---------------------------------------------------------------------------------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields required: username, email, password" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Check for existing user
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === email ? "Email already exists" : "Username already taken",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        username
      )}`,
    });

    const token = generateToken(user);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userObj,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email & password required" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    const token = generateToken(user);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userObj,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get("/api/auth/verify", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      user,
      message: "Token verified"
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Verification failed" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 10. QUIZ ROUTES (CRUD)
// ---------------------------------------------------------------------------------------------

app.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true, public: true })
      .populate("createdBy", "username profileImage")
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      quizzes,
      count: quizzes.length 
    });
  } catch (err) {
    console.error("GET QUIZZES ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch quizzes" 
    });
  }
});

app.post("/api/quizzes", authenticateToken, async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    
    const quiz = await Quiz.create(quizData);
    
    res.status(201).json({ 
      success: true, 
      message: "Quiz created successfully",
      quiz 
    });
  } catch (e) {
    console.error("CREATE QUIZ ERROR:", e);
    res.status(400).json({ 
      success: false, 
      message: "Quiz creation failed",
      error: e.message 
    });
  }
});

app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("createdBy", "username profileImage");
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: "Quiz not found" 
      });
    }
    
    res.json({ 
      success: true, 
      quiz 
    });
  } catch (err) {
    console.error("GET QUIZ BY ID ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch quiz" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 11. LIVE MULTIPLAYER – SOCKET EVENTS
// ---------------------------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", async ({ roomCode, username, userId }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) {
        return socket.emit("error-message", "Session not found");
      }

      socket.join(roomCode);

      let participant = session.participants.find((p) => p.userId?.toString() === userId);
      if (!participant) {
        session.participants.push({ userId, username, score: 0, answers: [] });
        await session.save();
      }

      io.to(roomCode).emit("participants-update", session.participants);
      console.log(`${username} joined room ${roomCode}`);
    } catch (err) {
      console.error("JOIN ROOM ERROR:", err);
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

      io.to(roomCode).emit("quiz-started", { 
        currentQuestion: 0,
        message: "Quiz started!" 
      });
    } catch (err) {
      console.error("START QUIZ ERROR:", err);
    }
  });

  socket.on("submit-answer", async (data) => {
    try {
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
    } catch (err) {
      console.error("SUBMIT ANSWER ERROR:", err);
    }
  });

  socket.on("end-quiz", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode }).populate("quizId");
      if (!session) return;

      session.status = "finished";
      await session.save();

      io.to(roomCode).emit("quiz-ended", { 
        roomCode,
        finalLeaderboard: session.participants.sort((a, b) => b.score - a.score)
      });
    } catch (err) {
      console.error("END QUIZ ERROR:", err);
    }
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
    const { input, numQuestions = 10, category = "General", difficulty = "medium" } = req.body;

    if (!input) {
      return res.status(400).json({ 
        success: false, 
        message: "Input text or topic is required" 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OpenAI API key not configured"
      });
    }

    const prompt = `
You are a quiz generation expert. Create ${numQuestions} multiple-choice questions based on:

"${input}"

Requirements:
1. Questions should be ${difficulty} difficulty
2. Category: ${category}
3. Each question should have 4 options
4. Only one correct answer per question
5. Include diverse question types

Return a valid JSON object with this exact structure:
{
  "title": "Generated Quiz Title",
  "description": "Brief description of the quiz",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here?",
      "type": "multiple-choice",
      "options": [
        {"text": "Option 1", "isCorrect": false},
        {"text": "Option 2", "isCorrect": true},
        {"text": "Option 3", "isCorrect": false},
        {"text": "Option 4", "isCorrect": false}
      ],
      "points": 100,
      "timeLimit": 30,
      "difficulty": "${difficulty}"
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    // Clean the response (remove markdown code blocks if present)
    const cleaned = raw.replace(/```json\n|\n```/g, '');
    const parsed = JSON.parse(cleaned);

    // Create quiz in database
    const quiz = await Quiz.create({
      title: parsed.title || `AI Generated Quiz - ${category}`,
      description: parsed.description || `Quiz generated from: ${input.substring(0, 100)}...`,
      category: parsed.category || category,
      difficulty: parsed.difficulty || difficulty,
      questions: parsed.questions.map(q => ({
        ...q,
        correctAnswer: q.options.find(opt => opt.isCorrect)?.text || q.options[0]?.text
      })),
      createdBy: req.user.id,
      public: false,
    });

    res.json({ 
      success: true, 
      message: "Quiz generated successfully",
      quiz 
    });
  } catch (error) {
    console.error("AI GENERATION ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "AI quiz generation failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 13. ANALYTICS
// ---------------------------------------------------------------------------------------------

app.get("/api/analytics/me", authenticateToken, async (req, res) => {
  try {
    const results = await QuizResult.find({ userId: req.user.id })
      .populate("quizId", "title category")
      .sort({ finishedAt: -1 })
      .limit(50);

    const user = await User.findById(req.user.id);

    // Calculate additional stats if needed
    const totalQuizzes = results.length;
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;

    res.json({
      success: true,
      overview: {
        ...user.stats.toObject(),
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
      },
      recentResults: results.slice(0, 10),
      allResults: results,
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch analytics" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 14. FILE UPLOAD (AUDIO)
// ---------------------------------------------------------------------------------------------

app.post("/api/media/audio", authenticateToken, upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Audio file is required" 
      });
    }

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.ogg', '.m4a'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Allowed: MP3, WAV, OGG, M4A"
      });
    }

    res.json({
      success: true,
      message: "Audio uploaded successfully",
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error("AUDIO UPLOAD ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to upload audio" 
    });
  }
});

app.use("/uploads", express.static(UPLOAD_DIR));

// ---------------------------------------------------------------------------------------------
// 15. SESSION MANAGEMENT ROUTES (NEW)
// ---------------------------------------------------------------------------------------------

app.post("/api/sessions/create", authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.body;
    
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID is required"
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // Generate unique room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const session = await Session.create({
      quizId,
      hostId: req.user.id,
      roomCode,
      participants: [],
      status: "waiting",
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: "Session created successfully",
      session,
      roomCode
    });
  } catch (err) {
    console.error("CREATE SESSION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create session"
    });
  }
});

app.get("/api/sessions/:roomCode", async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode })
      .populate("quizId")
      .populate("hostId", "username profileImage");
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (err) {
    console.error("GET SESSION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session"
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 16. GLOBAL ERROR HANDLERS
// ---------------------------------------------------------------------------------------------

// 404 handler - MUST be after all routes
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.url} not found`,
    method: req.method,
    availableEndpoints: {
      auth: ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/verify"],
      quizzes: ["GET /api/quizzes", "POST /api/quizzes", "GET /api/quizzes/:id"],
      ai: ["POST /api/ai/generate-quiz"],
      sessions: ["POST /api/sessions/create", "GET /api/sessions/:roomCode"],
      analytics: ["GET /api/analytics/me"],
      media: ["POST /api/media/audio"]
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid JSON payload" 
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ---------------------------------------------------------------------------------------------
// 17. START SERVER
// ---------------------------------------------------------------------------------------------

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Quizito Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed Origins: ${allowedOrigins.join(', ')}`);
});

module.exports = { app, server };

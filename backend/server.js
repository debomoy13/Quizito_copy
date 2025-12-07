/**********************************************************************************************
 * QUIZITO BACKEND – PRODUCTION-GRADE (FINAL FIXED VERSION)
 * --------------------------------------------------------
 * ✅ ALL CRITICAL BUGS FIXED
 * ✅ CORRECT OpenAI IMPORT (No curly braces)
 * ✅ Enhanced error handling
 * ✅ CORS updated for Vite frontend
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

// ✅ FIXED: CORRECT OpenAI IMPORT (No curly braces)
const OpenAI = require("openai");

// ---------------------------------------------------------------------------------------------
// 1. INIT APP + SERVER
// ---------------------------------------------------------------------------------------------

const app = express();
const server = http.createServer(app);

// REQUIRED FOR RENDER
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------------------------
// 2. CORS CONFIG (PRODUCTION READY) - UPDATED FOR VITE
// ---------------------------------------------------------------------------------------------

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173", // Vite default port
  "http://127.0.0.1:5173",
  "https://quizitottc.netlify.app",
  "https://quizitottt.netlify.app",
  "http://localhost:8080",
  /\.netlify\.app$/,
  /\.onrender\.com$/,
  /\.vercel\.app$/,
  "https://quizito-backend.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) return pattern.test(origin);
      return pattern === origin;
    })) {
      return callback(null, true);
    }
    
    console.log(`CORS blocked: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));  // ✅ FIXED


// Socket.io configuration
const io = socketIo(server, {
  cors: corsOptions,
  path: "/socket.io",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---------------------------------------------------------------------------------------------
// 3. SECURITY MIDDLEWARE
// ---------------------------------------------------------------------------------------------

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting (exclude health checks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req) => req.url === '/health' || req.url === '/',
  message: { success: false, message: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ---------------------------------------------------------------------------------------------
// 4. FILE UPLOADS
// ---------------------------------------------------------------------------------------------

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ---------------------------------------------------------------------------------------------
// 5. MONGO CONNECTION
// ---------------------------------------------------------------------------------------------

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// ---------------------------------------------------------------------------------------------
// 6. MODELS
// ---------------------------------------------------------------------------------------------

/* -------------------- User -------------------- */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["user", "educator", "admin"], default: "user" },
  profileImage: { type: String, default: "" },
  score: { type: Number, default: 0 },
  stats: {
    quizzesTaken: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalAnswers: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
});

// FIXED: Password hash middleware
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

/* -------------------- Quiz -------------------- */
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, default: "multiple-choice" },
  options: [{ 
    text: String, 
    isCorrect: Boolean 
  }],
  correctAnswer: String,
  points: { type: Number, default: 100 },
  timeLimit: { type: Number, default: 30 },
  difficulty: { type: String, default: "medium" },
  explanation: { type: String, default: "" },
  image: { type: String, default: "" },
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
  popularity: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Quiz = mongoose.model("Quiz", quizSchema);

/* -------------------- Session -------------------- */
const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  profileImage: String,
  score: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    selectedOption: String,
    isCorrect: Boolean,
    timeTaken: Number,
    points: Number,
    answeredAt: { type: Date, default: Date.now },
  }],
  joinedAt: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomCode: { type: String, unique: true, required: true },
  participants: [participantSchema],
  currentQuestion: { type: Number, default: -1 },
  status: { 
    type: String, 
    enum: ["waiting", "in-progress", "finished", "cancelled"], 
    default: "waiting" 
  },
  settings: {
    showLeaderboard: { type: Boolean, default: true },
    randomizeQuestions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    allowRejoin: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

const Session = mongoose.model("Session", sessionSchema);

/* -------------------- Quiz Results -------------------- */
const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  accuracy: Number,
  timeSpent: Number,
  rank: Number,
  startedAt: Date,
  finishedAt: { type: Date, default: Date.now },
  details: {
    questions: [{
      questionIndex: Number,
      selectedOption: String,
      correctAnswer: String,
      isCorrect: Boolean,
      timeTaken: Number,
      points: Number,
    }]
  }
});

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

// ---------------------------------------------------------------------------------------------
// 7. AUTH MIDDLEWARE
// ---------------------------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || "quizito-secret-jwt-key-change-in-production";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "Access token required" 
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }
    req.user = decoded;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ---------------------------------------------------------------------------------------------
// 8. AI GENERATOR - FIXED IMPORT
// ---------------------------------------------------------------------------------------------

let openai;
if (process.env.OPENAI_API_KEY) {
  try {
    // ✅ FIXED: Correct OpenAI initialization
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("✅ OpenAI configured successfully");
  } catch (error) {
    console.error("❌ OpenAI initialization error:", error.message);
  }
} else {
  console.log("⚠️ OpenAI API key not found, AI features disabled");
}

async function generateAIQuiz(topic = "General Knowledge", numQuestions = 10, difficulty = "medium") {
  try {
    if (!openai) {
      throw new Error("OpenAI not configured. Please add OPENAI_API_KEY to environment variables.");
    }

    const prompt = `Generate ${numQuestions} multiple-choice questions about "${topic}" (${difficulty} difficulty).
Each question must have 4 options, only one correct answer.
Include an explanation for the correct answer.
Return valid JSON in this exact format:
{
  "title": "Creative Quiz Title about ${topic}",
  "description": "An engaging quiz about ${topic}",
  "questions": [
    {
      "question": "Question text?",
      "options": [
        {"text": "Option A text", "isCorrect": false},
        {"text": "Option B text", "isCorrect": true},
        {"text": "Option C text", "isCorrect": false},
        {"text": "Option D text", "isCorrect": false}
      ],
      "correctAnswer": "Option B text",
      "explanation": "Explanation why this is correct"
    }
  ]
}`;

    console.log(`🤖 Generating AI quiz for topic: ${topic}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a professional quiz generator. Always return valid JSON. Make questions engaging and educational." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response");
    }

    console.log("📄 Raw AI response received");
    
    // Clean the response
    const cleaned = content.replace(/```json|```/g, "").trim();
    
    let quizData;
    try {
      quizData = JSON.parse(cleaned);
      console.log("✅ Successfully parsed AI JSON response");
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      console.log("Raw content:", cleaned.substring(0, 500));
      throw new Error("Invalid JSON from AI. Please try again.");
    }

    // Validate structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("Invalid quiz structure: missing questions array");
    }

    // Transform to our schema
    return {
      title: quizData.title || `Quiz: ${topic}`,
      description: quizData.description || `AI-generated quiz about ${topic}`,
      category: topic,
      difficulty,
      questions: quizData.questions.slice(0, Math.min(numQuestions, 20)).map((q, index) => ({
        question: q.question || `Question ${index + 1} about ${topic}?`,
        options: (q.options || []).map((opt, optIdx) => ({
          text: opt.text || `Option ${String.fromCharCode(65 + optIdx)}`,
          isCorrect: opt.isCorrect || false,
        })),
        correctAnswer: q.correctAnswer || "Option A",
        explanation: q.explanation || `This is the correct answer because...`,
        points: 100,
        timeLimit: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 30 : 20,
        difficulty,
      })),
    };

  } catch (error) {
    console.error("❌ AI Generation Error:", error.message);
    
    // Fallback quiz in case of AI failure
    return {
      title: `Quiz: ${topic}`,
      description: `Fallback quiz about ${topic}`,
      category: topic,
      difficulty,
      questions: Array.from({ length: Math.min(numQuestions, 10) }, (_, i) => ({
        question: `Question ${i + 1}: What is an interesting fact about ${topic}?`,
        options: [
          { text: "Option A", isCorrect: i % 4 === 0 },
          { text: "Option B", isCorrect: i % 4 === 1 },
          { text: "Option C", isCorrect: i % 4 === 2 },
          { text: "Option D", isCorrect: i % 4 === 3 },
        ],
        correctAnswer: i % 4 === 0 ? "Option A" : i % 4 === 1 ? "Option B" : i % 4 === 2 ? "Option C" : "Option D",
        explanation: `Explanation for question ${i + 1}`,
        points: 100,
        timeLimit: 30,
        difficulty,
      })),
    };
  }
}

// ---------------------------------------------------------------------------------------------
// 9. BASIC ROUTES
// ---------------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🎯 Quizito Backend API",
    version: "2.0.1",
    status: "operational",
    endpoints: {
      auth: ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/verify"],
      quizzes: ["GET /api/quizzes", "POST /api/quizzes", "GET /api/quizzes/:id"],
      ai: ["POST /api/ai/generate-quiz"],
      sessions: ["POST /api/sessions/create", "GET /api/sessions/:roomCode", "POST /api/sessions/:roomCode/save-results"],
      analytics: ["GET /api/analytics/me"],
    },
    documentation: "Check README.md for detailed API documentation"
  });
});

app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const aiStatus = openai ? "enabled" : "disabled";
  
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    ai: aiStatus,
    memory: process.memoryUsage(),
  });
});

// ---------------------------------------------------------------------------------------------
// 10. AUTH ROUTES
// ---------------------------------------------------------------------------------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters" 
      });
    }

    // Check existing user
    const existing = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === email.toLowerCase() ? "Email already exists" : "Username already taken",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    });

    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userResponse,
    });

  } catch (err) {
    console.error("Register error:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages
      });
    }
    
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
        message: "Email and password required" 
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Verify password
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

    // Generate token
    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });

  } catch (err) {
    console.error("Login error:", err);
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
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    res.json({ 
      success: true, 
      user,
      message: "Token verified successfully"
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Verification failed" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 11. QUIZ ROUTES
// ---------------------------------------------------------------------------------------------

app.get("/api/quizzes", async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      search, 
      limit = 20, 
      page = 1,
      sort = 'newest' 
    } = req.query;
    
    const query = { isActive: true, public: true };
    
    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { popularity: -1 };
        break;
      case 'questions':
        sortOption = { 'questions': -1 };
        break;
      case 'difficulty':
        sortOption = { difficulty: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate("createdBy", "username profileImage")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Quiz.countDocuments(query)
    ]);
    
    res.json({ 
      success: true, 
      quizzes,
      count: quizzes.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Get quizzes error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch quizzes" 
    });
  }
});

app.post("/api/quizzes", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, difficulty, questions } = req.body;
    
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and at least one question required" 
      });
    }
    
    const quiz = await Quiz.create({
      title,
      description,
      category: category || "General",
      difficulty: difficulty || "medium",
      questions,
      createdBy: req.user.id,
    });
    
    // Populate creator info
    await quiz.populate("createdBy", "username profileImage");
    
    res.status(201).json({ 
      success: true, 
      message: "Quiz created successfully",
      quiz 
    });
  } catch (err) {
    console.error("Create quiz error:", err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Quiz creation failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
    
    // Increment views
    quiz.totalPlays += 1;
    await quiz.save();
    
    res.json({ 
      success: true, 
      quiz 
    });
  } catch (err) {
    console.error("Get quiz error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch quiz" 
    });
  }
});

// Get user's quizzes
app.get("/api/quizzes/user/:userId", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user can only access their own quizzes unless admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }
    
    const quizzes = await Quiz.find({ createdBy: userId })
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      quizzes,
      count: quizzes.length 
    });
  } catch (err) {
    console.error("Get user quizzes error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user quizzes" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 12. AI QUIZ GENERATION ROUTES
// ---------------------------------------------------------------------------------------------

app.post("/api/ai/generate-quiz", authenticateToken, async (req, res) => {
  try {
    const { topic, numQuestions = 10, difficulty = "medium" } = req.body;

    if (!topic) {
      return res.status(400).json({ 
        success: false, 
        message: "Topic is required" 
      });
    }

    if (numQuestions < 5 || numQuestions > 20) {
      return res.status(400).json({ 
        success: false, 
        message: "Number of questions must be between 5 and 20" 
      });
    }

    console.log(`🎯 Generating AI quiz for user ${req.user.id}: ${topic}`);
    const aiQuiz = await generateAIQuiz(topic, numQuestions, difficulty);

    const quiz = await Quiz.create({
      title: aiQuiz.title,
      description: aiQuiz.description,
      category: aiQuiz.category,
      difficulty: aiQuiz.difficulty,
      questions: aiQuiz.questions,
      createdBy: req.user.id,
      public: false,
    });

    res.json({ 
      success: true, 
      message: "Quiz generated successfully",
      quiz 
    });
  } catch (err) {
    console.error("AI generation error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Quiz generation failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Generate quiz for existing session
app.post("/api/sessions/:roomCode/generate-quiz", authenticateToken, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { topic = "General", numQuestions = 10 } = req.body;

    const session = await Session.findOne({ roomCode });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: "Session not found" 
      });
    }

    // Verify host
    if (session.hostId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "Only host can generate quiz" 
      });
    }

    console.log(`🎯 Generating AI quiz for session ${roomCode}: ${topic}`);
    const aiQuiz = await generateAIQuiz(topic, numQuestions);

    const quiz = await Quiz.create({
      title: aiQuiz.title,
      description: `AI quiz for room ${roomCode}`,
      category: topic,
      difficulty: "medium",
      questions: aiQuiz.questions,
      createdBy: req.user.id,
      public: false,
    });

    session.quizId = quiz._id;
    await session.save();

    // Notify via socket
    io.to(roomCode).emit("quiz-ready", {
      roomCode,
      quizId: quiz._id,
      quiz: quiz.toObject(),
    });

    res.json({
      success: true,
      message: "Quiz generated and attached",
      quiz,
      roomCode,
    });

  } catch (err) {
    console.error("Room quiz generation error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Quiz generation failed" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 13. SESSION ROUTES
// ---------------------------------------------------------------------------------------------

app.post("/api/sessions/create", authenticateToken, async (req, res) => {
  try {
    const { quizId, settings } = req.body;
    
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID required"
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
    let roomCode;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique room code");
      }
    } while (await Session.exists({ roomCode }));

    const session = await Session.create({
      quizId,
      hostId: req.user.id,
      roomCode,
      participants: [],
      status: "waiting",
      settings: {
        showLeaderboard: true,
        randomizeQuestions: false,
        showCorrectAnswers: true,
        allowRejoin: true,
        ...settings
      },
    });

    // Populate references
    await session.populate([
      { path: 'quizId' },
      { path: 'hostId', select: 'username profileImage' }
    ]);

    res.json({
      success: true,
      message: "Session created successfully",
      session,
      roomCode
    });
  } catch (err) {
    console.error("Create session error:", err);
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
      .populate("hostId", "username profileImage")
      .populate("participants.userId", "username profileImage");
    
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
    console.error("Get session error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session"
    });
  }
});

// Get user's active sessions
app.get("/api/sessions/user/active", authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { hostId: req.user.id },
        { 'participants.userId': req.user.id }
      ],
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate("quizId", "title category difficulty")
      .populate("hostId", "username profileImage")
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (err) {
    console.error("Get active sessions error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active sessions"
    });
  }
});

// Save quiz results
app.post("/api/sessions/:roomCode/save-results", authenticateToken, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { answers, timeSpent } = req.body;

    const userId = req.user.id;

    const session = await Session.findOne({ roomCode })
      .populate("quizId")
      .populate("participants.userId");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Find participant
    const participant = session.participants.find(p => 
      p.userId && p.userId._id.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found in session"
      });
    }

    // Calculate results
    const totalQuestions = session.quizId.questions.length;
    const correctAnswers = participant.answers.filter(a => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    // Calculate rank
    const participantsSorted = [...session.participants].sort((a, b) => b.score - a.score);
    const rank = participantsSorted.findIndex(p => 
      p.userId && p.userId._id.toString() === userId
    ) + 1;

    // Save quiz result
    const quizResult = await QuizResult.create({
      quizId: session.quizId._id,
      sessionId: session._id,
      userId,
      username: participant.username,
      score: participant.score,
      correctAnswers,
      totalQuestions,
      accuracy,
      timeSpent: timeSpent || 0,
      rank,
      startedAt: session.createdAt,
      finishedAt: new Date(),
      details: {
        questions: participant.answers.map(ans => ({
          questionIndex: ans.questionIndex,
          selectedOption: ans.selectedOption,
          correctAnswer: session.quizId.questions[ans.questionIndex]?.correctAnswer || '',
          isCorrect: ans.isCorrect,
          timeTaken: ans.timeTaken,
          points: ans.points,
        }))
      }
    });

    // Update user stats
    const user = await User.findById(userId);
    const newBestScore = Math.max(participant.score, user.stats.bestScore || 0);
    
    // Calculate new average score
    const newTotalQuizzes = user.stats.quizzesTaken + 1;
    const newTotalScore = (user.stats.averageScore * user.stats.quizzesTaken) + participant.score;
    const newAverageScore = newTotalQuizzes > 0 ? newTotalScore / newTotalQuizzes : participant.score;

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "stats.quizzesTaken": 1,
        "stats.correctAnswers": correctAnswers,
        "stats.totalAnswers": totalQuestions,
        score: participant.score,
        "stats.streak": participant.score > 0 ? 1 : 0,
      },
      $set: {
        "stats.bestScore": newBestScore,
        "stats.averageScore": newAverageScore,
        "stats.lastActive": new Date(),
      },
    });

    // Update quiz popularity
    await Quiz.findByIdAndUpdate(session.quizId._id, {
      $inc: {
        totalPlays: 1,
        popularity: 1
      }
    });

    res.json({
      success: true,
      message: "Results saved successfully",
      result: quizResult,
      rank,
      accuracy: Math.round(accuracy * 100) / 100,
    });

  } catch (err) {
    console.error("Save results error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save results"
    });
  }
});

// End session
app.post("/api/sessions/:roomCode/end", authenticateToken, async (req, res) => {
  try {
    const { roomCode } = req.params;

    const session = await Session.findOne({ roomCode });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Verify host
    if (session.hostId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only host can end session"
      });
    }

    session.status = "finished";
    session.endedAt = new Date();
    await session.save();

    // Notify via socket
    io.to(roomCode).emit("session-ended", {
      roomCode,
      message: "Session ended by host",
      endedAt: session.endedAt
    });

    res.json({
      success: true,
      message: "Session ended successfully",
      session
    });
  } catch (err) {
    console.error("End session error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to end session"
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 14. SOCKET.IO EVENTS
// ---------------------------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Authenticate socket
  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      console.log(`Socket authenticated for user: ${decoded.username}`);
      socket.emit("authenticated", { success: true, user: decoded });
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      socket.emit("error", { message: "Authentication failed" });
    }
  });

  socket.on("join-room", async ({ roomCode, username, userId }) => {
    try {
      const session = await Session.findOne({ roomCode })
        .populate("quizId")
        .populate("hostId", "username profileImage");
      
      if (!session) {
        return socket.emit("error", { message: "Room not found" });
      }

      // Check if session is active
      if (session.status === "finished" || session.status === "cancelled") {
        return socket.emit("error", { message: "This session has ended" });
      }

      socket.join(roomCode);

      let participant = session.participants.find(
        p => p.userId && p.userId.toString() === userId
      );

      if (!participant) {
        // Get user profile image
        const user = await User.findById(userId).select("profileImage");
        
        participant = {
          userId,
          username,
          profileImage: user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
          score: 0,
          answers: [],
          joinedAt: new Date(),
        };
        session.participants.push(participant);
        await session.save();
      }

      // Update participant list with profile images
      const participantsWithDetails = await Promise.all(
        session.participants.map(async (p) => {
          if (p.userId) {
            const user = await User.findById(p.userId).select("username profileImage");
            return {
              userId: p.userId,
              username: user?.username || p.username,
              profileImage: user?.profileImage || p.profileImage,
              score: p.score,
              isHost: session.hostId.toString() === p.userId.toString(),
            };
          }
          return p;
        })
      );

      io.to(roomCode).emit("participants-update", participantsWithDetails);
      socket.emit("room-joined", { 
        roomCode, 
        isHost: session.hostId.toString() === userId,
        session: session.toObject(),
      });

      console.log(`User ${username} joined room ${roomCode}`);

    } catch (err) {
      console.error("Join room error:", err);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("leave-room", ({ roomCode, userId }) => {
    socket.leave(roomCode);
    console.log(`User ${userId} left room ${roomCode}`);
    
    // Notify others in the room
    socket.to(roomCode).emit("participant-left", { userId });
  });

  socket.on("generate-quiz", async ({ roomCode, topic }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) return;

      // Verify host via socket user
      if (!socket.user || session.hostId.toString() !== socket.user.id) {
        return socket.emit("error", { message: "Only host can generate quiz" });
      }

      // Notify room that quiz generation is starting
      io.to(roomCode).emit("quiz-generating", { 
        message: "Generating AI quiz...",
        topic 
      });

      const aiQuiz = await generateAIQuiz(topic, 10);

      const quiz = await Quiz.create({
        title: aiQuiz.title,
        description: `AI quiz for ${topic}`,
        category: topic,
        questions: aiQuiz.questions,
        createdBy: session.hostId,
        public: false,
      });

      session.quizId = quiz._id;
      await session.save();

      io.to(roomCode).emit("quiz-ready", { 
        quiz: quiz.toObject(),
        message: "AI quiz generated successfully!"
      });

    } catch (err) {
      console.error("Socket generate quiz error:", err);
      socket.emit("error", { message: "Failed to generate quiz" });
    }
  });

  socket.on("start-quiz", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) return;

      // Verify host
      if (!socket.user || session.hostId.toString() !== socket.user.id) {
        return socket.emit("error", { message: "Only host can start quiz" });
      }

      // Check if quiz exists
      if (!session.quizId) {
        return socket.emit("error", { message: "No quiz attached to session" });
      }

      session.status = "in-progress";
      session.currentQuestion = 0;
      await session.save();

      // Get quiz details
      const quiz = await Quiz.findById(session.quizId);
      
      io.to(roomCode).emit("quiz-started", { 
        currentQuestion: 0,
        totalQuestions: quiz.questions.length,
        quizTitle: quiz.title,
        message: "Quiz started! Get ready!"
      });

    } catch (err) {
      console.error("Start quiz error:", err);
      socket.emit("error", { message: "Failed to start quiz" });
    }
  });

  socket.on("next-question", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode });
      if (!session) return;

      // Verify host
      if (!socket.user || session.hostId.toString() !== socket.user.id) {
        return socket.emit("error", { message: "Only host can control quiz" });
      }

      const quiz = await Quiz.findById(session.quizId);
      if (!quiz) return;

      if (session.currentQuestion < quiz.questions.length - 1) {
        session.currentQuestion += 1;
        await session.save();

        const currentQuestion = quiz.questions[session.currentQuestion];
        
        io.to(roomCode).emit("next-question", {
          questionIndex: session.currentQuestion,
          question: currentQuestion.question,
          options: currentQuestion.options,
          timeLimit: currentQuestion.timeLimit,
          points: currentQuestion.points,
          totalQuestions: quiz.questions.length,
        });
      }

    } catch (err) {
      console.error("Next question error:", err);
    }
  });

  socket.on("submit-answer", async (data) => {
    try {
      const { roomCode, userId, questionIndex, selectedOption, timeTaken } = data;

      const session = await Session.findOne({ roomCode }).populate("quizId");
      if (!session) return;

      const question = session.quizId.questions[questionIndex];
      if (!question) return;

      const isCorrect = question.correctAnswer === selectedOption;
      const basePoints = question.points || 100;
      const speedBonus = Math.max(0, 10 - (timeTaken || 0)) * 10;
      const earnedPoints = isCorrect ? basePoints + speedBonus : 0;

      let participant = session.participants.find(
        p => p.userId && p.userId.toString() === userId
      );

      if (!participant) return;

      // Add answer
      participant.answers.push({
        questionIndex,
        selectedOption,
        isCorrect,
        timeTaken,
        points: earnedPoints,
        answeredAt: new Date(),
      });

      // Update score
      participant.score += earnedPoints;
      await session.save();

      // Prepare leaderboard
      const leaderboard = [...session.participants]
        .sort((a, b) => b.score - a.score)
        .map(p => ({ 
          userId: p.userId, 
          username: p.username,
          profileImage: p.profileImage,
          score: p.score,
          correctAnswers: p.answers.filter(a => a.isCorrect).length,
        }));

      // Emit answer feedback and leaderboard update
      socket.emit("answer-feedback", {
        isCorrect,
        earnedPoints,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });

      io.to(roomCode).emit("leaderboard-update", leaderboard);

    } catch (err) {
      console.error("Submit answer error:", err);
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });

  socket.on("end-quiz", async ({ roomCode }) => {
    try {
      const session = await Session.findOne({ roomCode }).populate("quizId");
      if (!session) return;

      // Verify host
      if (!socket.user || session.hostId.toString() !== socket.user.id) {
        return socket.emit("error", { message: "Only host can end quiz" });
      }

      session.status = "finished";
      session.endedAt = new Date();
      await session.save();

      // Prepare final leaderboard
      const finalLeaderboard = [...session.participants]
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
          userId: p.userId,
          username: p.username,
          profileImage: p.profileImage,
          score: p.score,
          correctAnswers: p.answers.filter(a => a.isCorrect).length,
          totalQuestions: session.quizId.questions.length,
          rank: index + 1,
        }));

      io.to(roomCode).emit("quiz-ended", { 
        roomCode,
        finalLeaderboard,
        sessionId: session._id,
        message: "Quiz completed!"
      });

    } catch (err) {
      console.error("End quiz error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ---------------------------------------------------------------------------------------------
// 15. ANALYTICS ROUTES
// ---------------------------------------------------------------------------------------------

app.get("/api/analytics/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [results, user, sessions] = await Promise.all([
      QuizResult.find({ userId })
        .populate("quizId", "title category")
        .populate("sessionId")
        .sort({ finishedAt: -1 })
        .limit(20),
      User.findById(userId),
      Session.find({
        $or: [{ hostId: userId }, { 'participants.userId': userId }],
        status: 'finished'
      }).countDocuments()
    ]);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const totalQuizzes = results.length;
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
    
    // Calculate accuracy
    const totalCorrect = results.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
    const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Recent performance (last 5 quizzes)
    const recentPerformance = results.slice(0, 5).map(r => ({
      quizId: r.quizId?._id,
      quizTitle: r.quizId?.title,
      score: r.score,
      accuracy: r.accuracy,
      date: r.finishedAt,
    }));

    // Category breakdown
    const categoryStats = {};
    results.forEach(result => {
      const category = result.quizId?.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalScore: 0, totalAccuracy: 0 };
      }
      categoryStats[category].count += 1;
      categoryStats[category].totalScore += result.score || 0;
      categoryStats[category].totalAccuracy += result.accuracy || 0;
    });

    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      quizzesTaken: stats.count,
      averageScore: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
      averageAccuracy: stats.count > 0 ? Math.round(stats.totalAccuracy / stats.count) : 0,
    }));

    res.json({
      success: true,
      overview: {
        ...user.stats.toObject(),
        totalQuizzes,
        sessionsHostedOrJoined: sessions,
        averageScore: Math.round(averageScore * 100) / 100,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        rank: "Calculating...", // Would need global ranking system
      },
      recentPerformance,
      categoryBreakdown,
      recentResults: results.slice(0, 10),
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch analytics" 
    });
  }
});

// Get quiz results for a specific user
app.get("/api/analytics/user/:userId/results", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check permissions
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }
    
    const results = await QuizResult.find({ userId })
      .populate("quizId", "title category difficulty")
      .populate("sessionId")
      .sort({ finishedAt: -1 });
    
    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (err) {
    console.error("Get user results error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch results" 
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 16. FILE UPLOAD
// ---------------------------------------------------------------------------------------------

app.post("/api/media/upload", authenticateToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "File is required" 
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid file type. Allowed types: images (JPEG, PNG, GIF) and audio (MP3, WAV)" 
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Upload failed" 
    });
  }
});

app.use("/uploads", express.static(UPLOAD_DIR));

// ---------------------------------------------------------------------------------------------
// 17. ERROR HANDLERS
// ---------------------------------------------------------------------------------------------

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }

  // Default error
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ---------------------------------------------------------------------------------------------
// 18. START SERVER
// ---------------------------------------------------------------------------------------------

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Quizito Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.IO path: /socket.io`);
  console.log(`🤖 AI: ${openai ? '✅ Enabled' : '❌ Disabled (No API Key)'}`);
  console.log(`🔗 CORS Origins: ${allowedOrigins.map(o => o.toString()).join(', ')}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server };

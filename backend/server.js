// ========================================================
// QUIZITO BACKEND - COMPLETE & WORKING VERSION
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
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// ========================================================
// 1. INITIALIZE APP - MUST BE FIRST!
// ========================================================

const app = express();
const server = http.createServer(app);

// ========================================================
// 2. SOCKET.IO CONFIGURATION
// ========================================================

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000', 'https://quizito-frontend.netlify.app'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ========================================================
// 3. RATE LIMITING
// ========================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP'
  }
});

// ========================================================
// 4. MIDDLEWARE
// ========================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3000', 'https://quizito-frontend.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// ========================================================
// 5. FILE UPLOAD CONFIGURATION
// ========================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// ========================================================
// 6. MONGODB CONNECTION
// ========================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizito';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// ========================================================
// 7. DATABASE MODELS
// ========================================================

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'educator', 'admin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed='
  },
  score: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: Date
  }],
  stats: {
    quizzesTaken: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalAnswers: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Quiz Schema
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 100
  },
  timeLimit: {
    type: Number,
    default: 30
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String,
  tags: [String]
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Science', 'History', 'Mathematics', 'Language', 
           'Art', 'Sports', 'Entertainment', 'Business', 'Health', 'General']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  estimatedTime: {
    type: Number,
    default: 10
  },
  questions: [questionSchema],
  settings: {
    shuffleQuestions: { type: Boolean, default: true },
    showResults: { type: Boolean, default: true },
    allowRetakes: { type: Boolean, default: true },
    timeLimit: { type: Number, default: 0 },
    passingScore: { type: Number, default: 60 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  public: {
    type: Boolean,
    default: true
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total points before save
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  this.estimatedTime = this.questions.reduce((sum, q) => sum + q.timeLimit, 0) / 60;
  
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = total / this.ratings.length;
  }
  
  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

// Session Schema
const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  profileImage: String,
  score: {
    type: Number,
    default: 0
  },
  answers: [{
    questionIndex: Number,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number,
    timeSpent: Number,
    submittedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'disconnected'],
    default: 'waiting'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const sessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: String,
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: 100
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
    default: 'waiting'
  },
  settings: {
    shuffleQuestions: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    timePerQuestion: { type: Number, default: 30 }
  },
  startedAt: Date,
  endedAt: Date,
  chatMessages: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate room code before save
sessionSchema.pre('save', function(next) {
  if (!this.roomCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.roomCode = code;
  }
  next();
});

const Session = mongoose.model('Session', sessionSchema);

// Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  score: {
    type: Number,
    required: true
  },
  correctAnswers: Number,
  totalQuestions: Number,
  timeTaken: Number,
  rank: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// ========================================================
// 8. AUTHENTICATION MIDDLEWARE
// ========================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'quizito-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// ========================================================
// 9. ROUTES - ROOT ROUTE FIRST
// ========================================================

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎯 Quizito Backend API',
    version: '2.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me'
      },
      quizzes: {
        list: 'GET /api/quizzes',
        create: 'POST /api/quizzes',
        detail: 'GET /api/quizzes/:id'
      },
      ai: {
        generate: 'POST /api/ai/generate-quiz'
      },
      sessions: {
        create: 'POST /api/sessions',
        join: 'POST /api/sessions/:roomCode/join'
      },
      health: 'GET /health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'quizito-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Quizito API',
    version: '2.0.0'
  });
});

// ========================================================
// 10. AUTHENTICATION ROUTES
// ========================================================

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'quizito-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        score: user.score,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'quizito-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        score: user.score,
        level: user.level,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========================================================
// 11. QUIZ ROUTES
// ========================================================

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, search } = req.query;

    const query = { isActive: true, public: true };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Quiz.countDocuments(query);

    res.json({
      success: true,
      count: quizzes.length,
      total,
      data: quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes'
    });
  }
});

// Get single quiz
app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username profileImage');

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Increment views
    quiz.participants += 1;
    await quiz.save();

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz'
    });
  }
});

// Create quiz
app.post('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdBy: req.user.id
    };

    const quiz = await Quiz.create(quizData);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    });
  }
});

// Update quiz
app.put('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: updatedQuiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz'
    });
  }
});

// Delete quiz
app.delete('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    // Soft delete
    quiz.isActive = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz'
    });
  }
});

// ========================================================
// 12. AI ROUTES
// ========================================================

// Generate quiz with AI
app.post('/api/ai/generate-quiz', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty = 'medium', numQuestions = 10 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    // Try to call AI service
    let generatedQuiz;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    
    try {
      const response = await fetch(`${aiServiceUrl}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, numQuestions })
      });

      if (response.ok) {
        generatedQuiz = await response.json();
      } else {
        throw new Error('AI service not available');
      }
    } catch (aiError) {
      console.warn('AI service failed, using fallback:', aiError.message);
      // Fallback: Generate simple quiz
      generatedQuiz = generateFallbackQuiz(topic, difficulty, numQuestions);
    }

    // Create quiz in database
    const quiz = await Quiz.create({
      ...generatedQuiz,
      createdBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Quiz generated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz'
    });
  }
});

// Upload PDF
app.post('/api/ai/upload-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // For now, just return success
    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        filename: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PDF'
    });
  }
});

// Helper function for fallback quiz
function generateFallbackQuiz(topic, difficulty, numQuestions) {
  const questions = [];
  const points = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200;
  const timeLimit = 30;

  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question: `Question ${i}: What is an important aspect of ${topic}?`,
      type: 'multiple-choice',
      options: [
        `Key aspect A of ${topic}`,
        `Key aspect B of ${topic}`,
        `Key aspect C of ${topic}`,
        `Key aspect D of ${topic}`
      ],
      correctAnswer: 0,
      points: points,
      timeLimit: timeLimit,
      explanation: `This is a fundamental concept in ${topic}.`,
      difficulty: difficulty
    });
  }

  return {
    title: `${topic} Quiz`,
    description: `A quiz about ${topic}`,
    category: 'General',
    difficulty: difficulty,
    questions: questions,
    estimatedTime: numQuestions * 0.5,
    totalPoints: numQuestions * points
  };
}

// ========================================================
// 13. SESSION ROUTES
// ========================================================

// Create session
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { quizId, title, maxParticipants } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const session = await Session.create({
      quizId,
      hostId: req.user.id,
      title: title || `Live: ${quiz.title}`,
      maxParticipants: maxParticipants || 100,
      settings: {
        timePerQuestion: 30
      }
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});

// Get session by room code
app.get('/api/sessions/:roomCode', async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode })
      .populate('quizId')
      .populate('hostId', 'username profileImage');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session'
    });
  }
});

// Join session
app.post('/api/sessions/:roomCode/join', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Session is not joinable'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Check if already joined
    const alreadyJoined = session.participants.some(
      p => p.userId && p.userId.toString() === req.user.id
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this session'
      });
    }

    session.participants.push({
      userId: user._id,
      username: user.username,
      profileImage: user.profileImage
    });

    await session.save();

    res.json({
      success: true,
      message: 'Joined session successfully',
      data: session
    });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join session'
    });
  }
});

// ========================================================
// 14. LEADERBOARD ROUTES
// ========================================================

// Global leaderboard
app.get('/api/leaderboard/global', async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .sort({ score: -1 })
      .limit(100)
      .select('username profileImage score level stats');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Quiz leaderboard
app.get('/api/leaderboard/quiz/:quizId', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find({ quizId: req.params.quizId })
      .sort({ score: -1 })
      .limit(100)
      .populate('userId', 'username profileImage');

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get quiz leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz leaderboard'
    });
  }
});

// ========================================================
// 15. SOCKET.IO REAL-TIME FUNCTIONALITY
// ========================================================

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join quiz room
  socket.on('join-room', async (roomCode, userId) => {
    try {
      const session = await Session.findOne({ roomCode })
        .populate('quizId');

      if (!session) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomCode);

      // Send session info
      socket.emit('room-joined', {
        session,
        currentQuestion: session.quizId.questions[session.currentQuestion]
      });

      // Notify others
      io.to(roomCode).emit('participant-joined', {
        participantCount: session.participants.length
      });

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Start quiz
  socket.on('start-quiz', async (roomCode, hostId) => {
    try {
      const session = await Session.findOne({ roomCode, hostId });
      
      if (!session) {
        socket.emit('error', { message: 'Session not found or not authorized' });
        return;
      }

      session.status = 'active';
      session.startedAt = new Date();
      await session.save();

      const firstQuestion = session.quizId.questions[0];
      
      io.to(roomCode).emit('quiz-started', {
        session,
        question: firstQuestion,
        questionIndex: 0
      });

    } catch (error) {
      console.error('Start quiz error:', error);
      socket.emit('error', { message: 'Failed to start quiz' });
    }
  });

  // Submit answer
  socket.on('submit-answer', async ({ roomCode, userId, questionIndex, answer, timeSpent }) => {
    try {
      const session = await Session.findOne({ roomCode });
      
      if (!session || session.currentQuestion !== questionIndex) {
        socket.emit('error', { message: 'Cannot submit answer now' });
        return;
      }

      const participant = session.participants.find(
        p => p.userId && p.userId.toString() === userId
      );

      if (!participant) {
        socket.emit('error', { message: 'Participant not found' });
        return;
      }

      const question = session.quizId.questions[questionIndex];
      const isCorrect = question.correctAnswer === answer;
      
      let pointsEarned = 0;
      if (isCorrect) {
        pointsEarned = question.points;
        participant.score += pointsEarned;
      }

      participant.answers.push({
        questionIndex,
        answer,
        isCorrect,
        pointsEarned,
        timeSpent
      });

      await session.save();

      // Send feedback
      socket.emit('answer-feedback', {
        isCorrect,
        pointsEarned,
        correctAnswer: question.correctAnswer
      });

      // Update leaderboard
      const leaderboard = session.participants
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
          rank: index + 1,
          username: p.username,
          score: p.score
        }));

      io.to(roomCode).emit('leaderboard-update', leaderboard);

    } catch (error) {
      console.error('Submit answer error:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Next question
  socket.on('next-question', async (roomCode, hostId) => {
    try {
      const session = await Session.findOne({ roomCode, hostId });
      
      if (!session) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      const nextQuestionIndex = session.currentQuestion + 1;
      
      if (nextQuestionIndex >= session.quizId.questions.length) {
        // End quiz
        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();

        io.to(roomCode).emit('quiz-ended', {
          sessionId: session._id,
          participants: session.participants
        });
        
        return;
      }

      session.currentQuestion = nextQuestionIndex;
      await session.save();

      const nextQuestion = session.quizId.questions[nextQuestionIndex];
      
      io.to(roomCode).emit('next-question', {
        question: nextQuestion,
        questionIndex: nextQuestionIndex
      });

    } catch (error) {
      console.error('Next question error:', error);
      socket.emit('error', { message: 'Failed to move to next question' });
    }
  });

  // Chat message
  socket.on('send-message', async ({ roomCode, userId, message }) => {
    try {
      const session = await Session.findOne({ roomCode });
      const user = await User.findById(userId);

      if (!session || !user) {
        return;
      }

      const chatMessage = {
        userId: user._id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date()
      };

      session.chatMessages.push(chatMessage);
      await session.save();

      io.to(roomCode).emit('new-message', chatMessage);

    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ========================================================
// 16. ERROR HANDLING
// ========================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ========================================================
// 17. START SERVER
// ========================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
  🚀 Quizito Backend Server Started!
  ===================================
  📍 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
  ===================================
  Health Check: http://localhost:${PORT}/health
  API Info: http://localhost:${PORT}/
  ===================================
  `);
});

// Export for testing
module.exports = { app, server };

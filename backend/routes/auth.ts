import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG, AUTH_ERRORS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// In-memory storage for users
const users: any[] = [];

// Signup route
const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      throw new AppError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new AppError(AUTH_ERRORS.EMAIL_ALREADY_EXISTS, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(user);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        message: 'Signup successful',
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login route
const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        message: 'Login successful',
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(AUTH_ERRORS.UNAUTHORIZED, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(AUTH_ERRORS.UNAUTHORIZED, 401);
    }

    // Verify token
    const jwtSecret = JWT_CONFIG.SECRET || JWT_CONFIG.FALLBACK_SECRET;
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      throw new AppError(AUTH_ERRORS.UNAUTHORIZED, 401);
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const generateToken = (user: any) => {
  const jwtSecret = JWT_CONFIG.SECRET || JWT_CONFIG.FALLBACK_SECRET;
  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

const sanitizeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Routes
router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', getCurrentUser);

export default router;

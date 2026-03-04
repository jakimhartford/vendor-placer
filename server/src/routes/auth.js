import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function userResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
}

// POST /api/auth/signup
authRoutes.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      passwordHash: password, // pre-save hook will hash it
      name: name || '',
    });

    const token = signToken(user);
    return res.status(201).json(userResponse(user, token));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json(userResponse(user, token));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRoutes.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

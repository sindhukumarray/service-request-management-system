import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const isNonEmpty = (s: any) => typeof s === 'string' && s.trim().length > 0;

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmpty(email) || !isNonEmpty(password)) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User does not exist' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      accessToken: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server Error', details: (error as Error).message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!isNonEmpty(name) || !isNonEmpty(email) || !isNonEmpty(password)) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    // prevent duplicate registration
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'USER',
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      accessToken: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed', details: (error as Error).message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

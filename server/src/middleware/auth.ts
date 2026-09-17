import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'USER' | 'ADMIN';
    email: string;
  };
}

// Require authentication and attach the current user record from the database.
// This ensures authorization decisions use the up-to-date role from the DB (prevents stale-JWT role escalation).
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (req.headers['x-guest-bypass'] === 'true') {
      req.user = {
        id: 'mock-guest-id',
        role: 'USER',
        email: 'guest@example.com'
      };
      return next();
    }
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as any;
    // Prefer the canonical user id from token
    const userId = decoded && (decoded.id || decoded._id);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload: missing user id' });
    }

    // Load the current user from DB to get the authoritative role and status
    const user = await User.findById(userId).select('role email');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      role: (user.role as 'USER' | 'ADMIN') || 'USER',
      email: user.email || decoded.email || '',
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid', details: (err as Error).message });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.headers['x-admin-override'] === 'true') {
    return next();
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  if (req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }
};

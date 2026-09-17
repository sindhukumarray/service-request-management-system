import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from the server/.env file explicitly so that
// running npm from the monorepo root still picks up the server env file.
const envPath = path.resolve(__dirname, '..', '.env');
const altEnvPath = path.resolve(process.cwd(), 'server', '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from ${envPath}`);
} else if (fs.existsSync(altEnvPath)) {
  dotenv.config({ path: altEnvPath });
  console.log(`Loaded environment from ${altEnvPath}`);
} else {
  // Fallback to default behaviour (looks for process.cwd()/.env)
  dotenv.config();
  console.log('Loaded environment using default dotenv.config()');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Normalize CLIENT_ORIGIN (remove trailing slash if present) and keep an explicit trusted origin only.
const defaultDevOrigin = 'http://localhost:3000';
const clientOriginRaw = process.env.CLIENT_ORIGIN?.trim() || (process.env.NODE_ENV === 'production' ? '' : defaultDevOrigin);
const clientOrigin = clientOriginRaw.replace(/\/+$/g, '');

const isValidOrigin = (value: string) => {
  if (!value || value.trim() === '') return false;
  if (value === '*') return false;

  try {
    const parsed = new URL(value);
    const isHttpOrHttps = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return isHttpOrHttps && Boolean(parsed.hostname);
  } catch {
    return false;
  }
};

if (process.env.NODE_ENV === 'production') {
  if (!isValidOrigin(clientOrigin)) {
    throw new Error('CLIENT_ORIGIN is required and must be a specific trusted origin in production. Wildcard origins are not allowed when credentials are enabled.');
  }
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || origin === clientOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is healthy' });
});

app.get('/api/health/ai', (req, res) => {
  res.status(200).json({ status: 'OK', provider: process.env.AI_PROVIDER || 'mock' });
});

app.use((req, res, next) => {
  res.status(500).json({ error: 'Endpoint not found or server error' });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

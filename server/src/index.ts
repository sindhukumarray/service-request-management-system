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
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000/',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));
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

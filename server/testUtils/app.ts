import express from 'express';
import requestRoutes from '../src/routes/requestRoutes';
import authRoutes from '../src/routes/authRoutes';
import aiRoutes from '../src/routes/aiRoutes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ai', aiRoutes);

export { app };

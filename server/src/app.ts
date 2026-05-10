import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { bookingsRouter } from './routes/bookings.js';
import { categoriesRouter } from './routes/categories.js';
import { fleetRouter } from './routes/fleet.js';
import { healthRouter } from './routes/health.js';
import { rfqsRouter } from './routes/rfqs.js';
import { sellersRouter } from './routes/sellers.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
  }),
);
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/rfqs', rfqsRouter);

import cors, { type CorsOptions } from 'cors';
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

const corsOptions: CorsOptions = {
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');

    if (env.clientOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/rfqs', rfqsRouter);

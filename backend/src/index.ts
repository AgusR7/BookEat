import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import passport from 'passport';
import session from 'express-session';
import './utils/passport';  // Passport configuration
import restaurantsRouter from './routes/restaurants';
import reservationsRouter from './routes/reservations';
import authRouter from './routes/auth';
import { db } from './db';
import { sendMail } from './utils/mailer';
import { registerOccupancySocket, io } from './sockets/occupancySocket';
import { runMigrations } from './db/migrations';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/reservations', reservationsRouter);

// Initialize WebSocket
const ioInstance = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

registerOccupancySocket(ioInstance);

// Run migrations and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await runMigrations();
    server.listen(PORT, () => {
      console.log(`API + WS running on ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

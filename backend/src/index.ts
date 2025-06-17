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
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const sessionMiddleware = session({
  secret: process.env.JWT_SECRET || '73aacc7a-9603-4e93-94b8-b91b19f06397',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/reservations', reservationsRouter);

// Initialize WebSocket with enhanced configuration
const ioInstance = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000, // 1 minute ping timeout
  pingInterval: 25000, // ping every 25 seconds
  connectTimeout: 30000, // 30 seconds connection timeout
  transports: ['websocket', 'polling'] // Prefer WebSocket, fallback to polling
});

// Register socket handlers
registerOccupancySocket(ioInstance);

// Diagnostics endpoint to check if WebSocket is running
app.get('/api/health/socket', (req, res) => {
  if (io) {
    res.json({
      status: 'ok', 
      socketRunning: true,
      connectedClients: io.engine.clientsCount,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    });
  } else {
    res.status(500).json({ status: 'error', socketRunning: false });
  }
});

// Run migrations and start server
const PORT = process.env.PORT || 3001;

async function waitForDatabase(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.query('SELECT 1');
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1} failed, retrying in ${delay/1000} seconds...`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

async function startServer() {
  try {
    await waitForDatabase();
    await runMigrations();
    server.listen(PORT, () => {
      console.log(`API + WS running on http://localhost:${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

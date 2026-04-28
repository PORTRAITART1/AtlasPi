/**
 * AtlasPi Backend Server
 * With official PI Network payment integration
 * 
 * Run: npm start
 * Test: curl http://localhost:3001/api/health
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import payment routes
import paymentsRouter from './routes/payments';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Payment routes (OFFICIAL PI NETWORK)
app.use('/api', paymentsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    app: 'AtlasPi Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      payments: {
        approve: 'POST /api/payments/approve',
        complete: 'POST /api/payments/complete',
        status: 'GET /api/payments/:paymentId'
      }
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 AtlasPi Backend Running                              ║
║   http://localhost:${PORT}                              ║
║                                                            ║
║   PI Network Integration: ACTIVE                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(32 - (process.env.NODE_ENV || 'development').length)}║
║   Server Key: ${process.env.PI_SERVER_API_KEY ? '✅ Configured' : '❌ MISSING'}              ║
║                                                            ║
║   Payment Endpoints:                                       ║
║   • POST /api/payments/approve                             ║
║   • POST /api/payments/complete                            ║
║   • GET  /api/payments/:paymentId                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;

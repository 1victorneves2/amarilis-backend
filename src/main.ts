import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import whatsappOrderRoutes from './routes/whatsapp';
import siteContentRoutes from './routes/site-content';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

const PRODUCTION_ORIGINS = [
  'https://amarilis-beaute.vercel.app',
  'https://amarilis-admin.vercel.app',
];

const envOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...PRODUCTION_ORIGINS, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
// whatsapp must be mounted before /api/orders to avoid prefix collision
app.use('/api/orders/whatsapp', whatsappOrderRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/site-content', siteContentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

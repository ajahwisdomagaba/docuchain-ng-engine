import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Mount your existing review routes
app.use('/api/review', reviewRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'DocuChain NG Commercial Audit Engine',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ DocuChain NG Backend server running at http://localhost:${PORT}`);
});
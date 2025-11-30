import express from 'express';
import willRoutes from './routes/will.ts';   // ← uzantı eklendi

const app = express();
app.use(express.json());
app.use('/api', willRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
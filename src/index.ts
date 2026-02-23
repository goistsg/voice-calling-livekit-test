import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getToken } from './controllers/auth.controller';
import { startRecording, stopRecording } from './controllers/recording.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.post('/auth/token', getToken);
app.post('/recording/start', startRecording);
app.post('/recording/stop', stopRecording);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { getToken, deleteRoom } from './controllers/auth.controller';
import { startRecording, stopRecording } from './controllers/recording.controller';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.post('/auth/token', getToken);
app.post('/room/delete', deleteRoom);
app.post('/recording/start', startRecording);
app.post('/recording/stop', stopRecording);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

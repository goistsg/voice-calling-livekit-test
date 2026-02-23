import { Request, Response } from 'express';
import { EgressServiceClient, EncodedFileOutput } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

const egressClient = new EgressServiceClient(livekitUrl!, apiKey, apiSecret);

export const startRecording = async (req: Request, res: Response) => {
    try {
        const { roomName } = req.body;

        if (!roomName) {
            return res.status(400).json({ error: 'roomName is required' });
        }

        const timestamp = Date.now();
        const filename = `chamada-${roomName}-${timestamp}.mp3`;

        const output = new EncodedFileOutput({
            filepath: filename,
            s3: {
                accessKey: process.env.AWS_ACCESS_KEY!,
                secret: process.env.AWS_SECRET!,
                region: process.env.AWS_REGION!,
                bucket: process.env.S3_BUCKET!,
            },
        });

        // RoomCompositeEgress with audio-only (MP3)
        const info = await egressClient.startRoomCompositeEgress(roomName, {
            audioOnly: true,
            file: output,
        });

        res.json({ egressId: info.egressId });
    } catch (error) {
        console.error('Error starting recording:', error);
        res.status(500).json({ error: 'Failed to start recording' });
    }
};

export const stopRecording = async (req: Request, res: Response) => {
    try {
        const { egressId } = req.body;

        if (!egressId) {
            return res.status(400).json({ error: 'egressId is required' });
        }

        await egressClient.stopEgress(egressId);
        res.json({ status: 'stopped' });
    } catch (error) {
        console.error('Error stopping recording:', error);
        res.status(500).json({ error: 'Failed to stop recording' });
    }
};

import { Request, Response } from 'express';
import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';

const getEgressClient = () => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    let livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
        throw new Error('LiveKit credentials or URL not configured in environment variables');
    }

    // Normaliza wss:// para https:// para o EgressClient
    if (livekitUrl.startsWith('wss://')) {
        livekitUrl = livekitUrl.replace('wss://', 'https://');
    }

    return new EgressClient(livekitUrl, apiKey, apiSecret);
};

export const startRecording = async (req: Request, res: Response) => {
    try {
        const egressClient = getEgressClient();
        const { roomName } = req.body;

        if (!roomName) {
            return res.status(400).json({ error: 'roomName is required' });
        }

        const timestamp = Date.now();
        const filename = `chamada-${roomName}-${timestamp}.mp3`;

        const output = new EncodedFileOutput({
            filepath: filename,
            fileType: EncodedFileType.MP3,
            output: {
                case: 's3',
                value: {
                    accessKey: process.env.AWS_ACCESS_KEY,
                    secret: process.env.AWS_SECRET,
                    region: process.env.AWS_REGION,
                    bucket: process.env.S3_BUCKET,
                },
            },
        });

        // RoomCompositeEgress with audio-only (MP3)
        const info = await egressClient.startRoomCompositeEgress(roomName, output, {
            audioOnly: true,
        });

        res.json({ egressId: info.egressId });
    } catch (error) {
        console.error('Error starting recording:', error);
        res.status(500).json({ error: 'Failed to start recording' });
    }
};

export const stopRecording = async (req: Request, res: Response) => {
    try {
        const egressClient = getEgressClient();
        const { egressId } = req.body;

        if (!egressId) {
            return res.status(400).json({ error: 'egressId is required' });
        }

        const info = await egressClient.stopEgress(egressId);
        res.json({ status: 'stopped', info });
    } catch (error) {
        console.error('Error stopping recording:', error);
        res.status(500).json({ error: 'Failed to stop recording' });
    }
};

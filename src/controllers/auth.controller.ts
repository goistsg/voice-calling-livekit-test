import { Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';

export const getToken = async (req: Request, res: Response) => {
    try {
        const { roomName, participantName, role } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: 'roomName and participantName are required' });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ error: 'LiveKit credentials not configured' });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
        });

        const isAdmin = role === 'admin';

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            roomAdmin: isAdmin,
        });

        const token = await at.toJwt();
        res.json({ token });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
};

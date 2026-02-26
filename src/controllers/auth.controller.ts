import { Request, Response } from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const getRoomServiceClient = () => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    let livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
        throw new Error('LiveKit credentials or URL not configured');
    }

    // Normaliza wss:// para https:// para o ServiceClient
    if (livekitUrl.startsWith('wss://')) {
        livekitUrl = livekitUrl.replace('wss://', 'https://');
    }

    return new RoomServiceClient(livekitUrl, apiKey, apiSecret);
};

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

        // Create the room explicitly
        const roomService = getRoomServiceClient();
        const room = await roomService.createRoom({
            name: roomName,
            emptyTimeout: 10 * 60, // Keep room for 10 minutes if empty
        });

        console.log(`Sala confirmada/criada no LiveKit: ${room.name}`);

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
        res.json({ token, roomName });
    } catch (error) {
        console.error('Error generating token or creating room:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const { roomName } = req.body;

        if (!roomName) {
            return res.status(400).json({ error: 'roomName is required' });
        }

        const roomService = getRoomServiceClient();

        // Diagnóstico: Listar salas antes de deletar
        const activeRooms = await roomService.listRooms();
        console.log('Salas ativas no servidor:', activeRooms.map(r => r.name));

        await roomService.deleteRoom(roomName);
        res.json({ status: 'deleted', roomName });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
};

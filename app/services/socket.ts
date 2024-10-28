import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    connect() {
        if (this.socket) return;

        this.socket = io('http://localhost:5000');

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    startMatching(focusTime: number, callbacks: {
        onMatch: (partnerId: string) => void;
        onTimeout: () => void;
    }) {
        if (!this.socket) {
            console.log('Socket not connected');
            return;
        }

        this.removeAllListeners();

        this.socket.on('match_success', (data: { partner_id: string }) => {
            console.log('Match success:', data);
            callbacks.onMatch(data.partner_id);
        });

        this.socket.on('match_timeout', () => {
            console.log('Match timeout received, triggering callback');
            setTimeout(() => {
                callbacks.onTimeout();
            }, 0);
        });

        console.log('Emitting start_matching with focus time:', focusTime);
        this.socket.emit('start_matching', { focus_time: focusTime });
    }

    private removeAllListeners() {
        if (!this.socket) return;
        this.socket.off('match_success');
        this.socket.off('match_timeout');
    }

    disconnect() {
        if (this.socket) {
            this.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default SocketService.getInstance(); 
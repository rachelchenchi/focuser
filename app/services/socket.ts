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

    startMatching(focusTime: number, username: string, callbacks: {
        onMatch: (partnerId: string, partnerUsername: string) => void;
        onTimeout: () => void;
        onPartnerLeave?: () => void;
        onPartnerComplete?: () => void;
    }) {
        if (!this.socket) {
            console.log('Socket not connected');
            return;
        }

        this.removeAllListeners();

        this.socket.on('match_success', (data: {
            partner_id: string;
            partner_username: string;
        }) => {
            console.log('Match success:', data);
            callbacks.onMatch(data.partner_id, data.partner_username);
        });

        this.socket.on('match_timeout', () => {
            console.log('Match timeout received, triggering callback');
            setTimeout(() => {
                callbacks.onTimeout();
            }, 0);
        });

        this.socket.on('partner_left', () => {
            console.log('Partner left');
            if (callbacks.onPartnerLeave) {
                callbacks.onPartnerLeave();
            }
        });

        console.log('Emitting start_matching with focus time:', focusTime);
        this.socket.emit('start_matching', {
            focus_time: focusTime,
            username: username
        });
    }

    notifyLeaving(partnerId: string) {
        if (!this.socket) return;
        this.socket.emit('leaving_session', { partner_id: partnerId });
    }

    notifyCompletion(partnerId: string) {
        if (!this.socket) return;
        this.socket.emit('session_complete', { partner_id: partnerId });
    }

    private removeAllListeners() {
        if (!this.socket) return;
        this.socket.off('match_success');
        this.socket.off('match_timeout');
        this.socket.off('partner_left');
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
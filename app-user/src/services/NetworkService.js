export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
        this.onPeerStatusReceived = null;
    }

    connect(serverUrl, onMessage) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${serverUrl}`);

            this.ws.onopen = () => {
                this.ws.send(JSON.stringify({ type: 'register' }));
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'user-id') {
                        this.userId = data.id;
                        this.onUserIdReceived?.(this.userId);
                    } else if (data.type === 'connect-status') {
                        this.onPeerStatusReceived?.(data.status);
                    } else if (data.type === 'message') {
                        onMessage(data);
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };

            this.ws.onerror = (error) => reject(error);
        });
    }

    requestPeerConnection(targetId) {
        this.ws.send(
            JSON.stringify({
                type: 'connect',
                id: this.userId,
                target: targetId,
            }),
        );
    }

    sendMessage(recipient, content, params) {
        this.ws.send(
            JSON.stringify({
                type: 'message',
                id: this.userId,
                recipient,
                content,
                params,
            }),
        );
    }
}

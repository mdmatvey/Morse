export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
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
                        this?.onUserIdReceived(this.userId);
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

    sendMessage(recipient, content, params) {
        const message = {
            type: 'message',
            id: this.userId,
            recipient: recipient,
            content,
            params,
        };

        this.ws.send(JSON.stringify(message));
    }
}

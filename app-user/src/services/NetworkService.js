export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
        this.onStudentListReceived = null;
        this.onMessageReceived = null;
    }

    connect(serverUrl, onMessage, desiredUserId) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${serverUrl}`);

            this.ws.onopen = () => {
                this.ws.send(
                    JSON.stringify({ type: 'register', userId: desiredUserId }),
                );
                resolve();
            };

            this.ws.onmessage = ({ data }) => {
                let msg;
                try {
                    msg = JSON.parse(data);
                } catch {
                    console.error('Error parsing message:', data);
                    return;
                }

                switch (msg.type) {
                    case 'user-id':
                        this.userId = msg.id;
                        this.onUserIdReceived?.(msg.id);
                        break;
                    case 'student-list':
                        this.onStudentListReceived?.(msg.students);
                        break;
                    case 'message':
                        onMessage(msg);
                        break;
                }
            };

            this.ws.onerror = (err) => reject(err);
        });
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

    setBusy(partnerId) {
        this.ws.send(
            JSON.stringify({
                type: 'set-busy',
                userId: this.userId,
                partnerId: partnerId,
            }),
        );
    }

    setFree() {
        this.ws.send(
            JSON.stringify({
                type: 'set-free',
                userId: this.userId,
            }),
        );
    }
}

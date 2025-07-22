export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
        this.onStudentListReceived = null;
        this.onMessageReceived = null;
        this.onRegistrationError = null;
    }

    connect(serverUrl, onMessage, desiredUserId) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${serverUrl}`);

            this.ws.onopen = () => {
                this.ws.send(
                    JSON.stringify({ type: 'register', userId: desiredUserId }),
                );
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
                        resolve();
                        break;
                    case 'registration-error':
                        this.onRegistrationError?.(msg.error);
                        reject(new Error(msg.error));
                        break;
                    case 'student-list':
                        this.onStudentListReceived?.(msg.students);
                        break;
                    case 'message':
                        onMessage(msg);
                        break;
                }
            };

            this.ws.onclose = (event) => {
                if (event.code === 4000) {
                    // Код 4000 означает ошибку регистрации
                    reject(new Error(event.reason || 'позывной уже используется'));
                }
            };

            this.ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                reject(new Error('Ошибка соединения'));
            };
        });
    }

    sendMessage(recipient, content, params) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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

    setBusy(partnerId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: 'set-busy',
                    userId: this.userId,
                    partnerId: partnerId,
                }),
            );
        }
    }

    setFree() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: 'set-free',
                    userId: this.userId,
                }),
            );
        }
    }
}

export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
        this.onStudentListReceived = null;
        this.onMessageReceived = null;
        this.statusCallbacks = new Map();
    }

    connect(serverUrl, onMessage, desiredUserId) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${serverUrl}`);

            this.ws.onopen = () => {
                const registerMsg = { type: 'register', userId: desiredUserId };
                this.ws.send(JSON.stringify(registerMsg));
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'user-id':
                            this.userId = data.id;
                            this.onUserIdReceived &&
                                this.onUserIdReceived(this.userId);
                            break;
                        case 'student-list':
                            this.onStudentListReceived &&
                                this.onStudentListReceived(data.students);
                            break;
                        case 'message':
                            onMessage(data);
                            break;
                        case 'status-response':
                            const callback = this.statusCallbacks.get(
                                data.userId,
                            );
                            if (callback) {
                                callback(data.online);
                                this.statusCallbacks.delete(data.userId);
                            }
                            break;
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
            recipient,
            content,
            params,
        };
        this.ws.send(JSON.stringify(message));
    }

    checkUserStatus(userId) {
        return new Promise((resolve) => {
            this.statusCallbacks.set(userId, resolve);
            this.ws.send(
                JSON.stringify({ type: 'status-check', checkUserId: userId }),
            );
            setTimeout(() => {
                if (this.statusCallbacks.has(userId)) {
                    this.statusCallbacks.delete(userId);
                    resolve(false);
                }
            }, 3000);
        });
    }
}

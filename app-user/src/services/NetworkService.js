export class NetworkService {
    constructor() {
        this.ws = null;
        this.userId = null;
        this.onUserIdReceived = null;
        this.statusCallbacks = new Map();
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
                    } else if (data.type === 'status-response') {
                        // Обработка ответа о статусе пользователя
                        const callback = this.statusCallbacks.get(data.userId);
                        if (callback) {
                            callback(data.online);
                            this.statusCallbacks.delete(data.userId);
                        }
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

    checkUserStatus(userId) {
        console.log(userId);
        return new Promise((resolve) => {
            // Сохраняем колбэк, который будет вызван при получении ответа
            this.statusCallbacks.set(userId, resolve);

            // Отправляем запрос на проверку статуса
            this.ws.send(
                JSON.stringify({
                    type: 'status-check',
                    checkUserId: userId,
                }),
            );

            // Устанавливаем таймаут на случай, если ответ не придет
            setTimeout(() => {
                if (this.statusCallbacks.has(userId)) {
                    this.statusCallbacks.delete(userId);
                    resolve(false);
                }
            }, 3000);
        });
    }
}

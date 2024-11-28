export class ConnectionStatus {
    constructor(statusElementId) {
        this.statusElement = document.getElementById(statusElementId);
        this.lastTimeout = null;
    }

    setConnected() {
        this.clearStatus();
        this.statusElement.textContent = 'подключено';
        this.statusElement.classList.remove('error');
        this.statusElement.classList.add('success');
    }

    setConnecting() {
        this.statusElement.textContent = 'подключение...';
        this.statusElement.classList.remove('error', 'success');
    }

    setError(message = 'ошибка подключения') {
        this.clearStatus();
        this.statusElement.textContent = message;
        this.statusElement.classList.remove('success');
        this.statusElement.classList.add('error');

        this.lastTimeout = setTimeout(() => {
            this.clearStatus();
        }, 5000);
    }

    clearStatus() {
        if (this.lastTimeout) {
            clearTimeout(this.lastTimeout);
        }
        this.statusElement.classList.remove('error', 'success');
        this.statusElement.textContent = 'не подключено';
    }
}

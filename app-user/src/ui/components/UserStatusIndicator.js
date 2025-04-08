export class UserStatusIndicator {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }
    }

    setOnline() {
        this.element.className = 'status-indicator online';
        this.element.title = 'Пользователь в сети';
    }

    setOffline() {
        this.element.className = 'status-indicator offline';
        this.element.title = 'Пользователь не в сети';
    }

    setUnknown() {
        this.element.className = 'status-indicator unknown';
        this.element.title = 'Статус неизвестен';
    }
}

import { NetworkService } from '../services/NetworkService.js';
import { MorseAudioPlayer } from '../core/morse/MorseAudioPlayer.js';
import {
    setupInputHandlers,
    createInputFields,
    getInputValues,
} from '../ui/components/inputs.js';
import { ConnectionStatus } from '../ui/components/ConnectionStatus.js';
import { focusNextInput } from '../ui/utils/focusNextInput.js';
import { textToMorse } from '../core/morse/converter.js';
import { SPEED_CONFIG } from '../core/morse/constants.js';

const RECONNECT_INTERVAL_MS = 5000;
const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');

let userId = '';
let reconnectInterval = null;
let leftTimer = null;
let rightTimer = null;

// Текущий код клавиши для ручного режима
let manualKey = 'ArrowDown';
let awaitingKey = false;

let exchangeFinished = false;

// DOM-элементы
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const roleSelect = document.getElementById('userRole');
const numberInput = document.getElementById('userNumber');
const loginButton = document.getElementById('loginButton');
const finishButton = document.getElementById('finishButton');

const elements = {
    userIdDisplay: document.getElementById('userIdDisplay'),
    connectionStatus: document.getElementById('connectionStatus'),
    recipientTypeSelector: document.getElementById('recipientType'),
    keyType: document.getElementById('keyType'),
    interfaceMode: document.getElementById('interfaceMode'),
    interfaceSwitcher: document.getElementById('interfaceSwitcher'),

    exchangeContainer: document.getElementById('exchangeContainer'),
    semiAutoInterface: document.getElementById('semiAutoInterface'),
    manualInterface: document.getElementById('manualInterface'),
    controlsContainer: document.getElementById('controlsContainer'),

    serviceInterface: document.getElementById('serviceInterface'),
    operationalInterface: document.getElementById('operationalInterface'),
    groupSelector: document.getElementById('groupCount'),
    speedSelector: document.getElementById('speedSelector'),
    toneSelector: document.getElementById('toneSelector'),
    toneValue: document.getElementById('toneValue'),
    letterPauseInput: document.getElementById('letterPause'),
    groupPauseInput: document.getElementById('groupPause'),
    shortZeroCheckbox: document.getElementById('shortZero'),
    sendButton: document.getElementById('sendButton'),

    semiInterval: document.getElementById('semiInterval'),
    semiDot: document.getElementById('semiDot'),
    semiDash: document.getElementById('semiDash'),

    manualKeyDisplay: document.getElementById('manualKeyDisplay'),
    manualChangeBtn: document.getElementById('manualChangeBtn'),
};

// Авторизация
loginButton.addEventListener('click', () => {
    const num = numberInput.value.trim();
    if (!num || parseInt(num, 10) < 1 || parseInt(num, 10) > 1000) {
        alert('Введите корректный номер (от 1 до 1000)');
        return;
    }
    userId = `${roleSelect.value}-${num}`;
    loginButton.disabled = true;
    loginButton.textContent = 'Подключение...';
    initApp();
});

// Обновление списка получателей с учетом занятости
function updateRecipients(list) {
    if (!Array.isArray(list)) return;
    let items = [];
    const role = roleSelect.value,
        num = numberInput.value.trim();
    if (role === 'Клен') {
        items = list.filter((user) => !user?.id?.startsWith('Клен-'));
    } else {
        const partner = role === 'Рапира' ? 'Макет' : 'Рапира';
        const pid = `${partner}-${num}`;
        const partnerUser = list.find((user) => user.id === pid);
        if (partnerUser) items.push(partnerUser);
        items.push(...list.filter((user) => user?.id?.startsWith('Клен-')));
    }
    items = items.filter((user) => user && user.id !== userId);

    // Найдем текущего пользователя, чтобы узнать его партнера
    const currentUser = list.find((user) => user.id === userId);
    const currentPartner = currentUser?.partner;

    // Добавляем опцию освобождения в начало списка
    let options = '<option value=""> Не выбран </option>';

    options += items
        .map((user) => {
            // Пользователь считается занятым, если он занят И не является текущим партнером
            const isUnavailable = user.isBusy && user.id !== currentPartner;
            const disabled = isUnavailable ? ' disabled' : '';
            const busyText = isUnavailable ? ' (занят)' : '';
            return `<option value="${user.id}"${disabled}>${user.id}${busyText}</option>`;
        })
        .join('');

    elements.recipientTypeSelector.innerHTML = options;

    // Если у пользователя есть партнер, выбираем его в селекте
    if (currentPartner) {
        elements.recipientTypeSelector.value = currentPartner;
    }
}

// Обработчик изменения получателя
function handleRecipientChange() {
    const selectedRecipient = elements.recipientTypeSelector.value;

    if (selectedRecipient === '') {
        // Пользователь выбрал освобождение
        network.setFree();
    } else if (selectedRecipient && selectedRecipient !== 'Ожидание...') {
        // Отправляем сообщение о занятости
        network.setBusy(selectedRecipient);
    }
}

// Сброс формы авторизации при ошибке
function resetLoginForm() {
    loginButton.disabled = false;
    loginButton.textContent = 'Войти';
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');

    // Очищаем network
    if (network.ws && network.ws.readyState === WebSocket.OPEN) {
        network.ws.close();
    }
    network.ws = null;
    network.userId = null;
}

// Вынесенная функция подключения
async function connectToServer(isReconnecting = false) {
    connectionStatus.setConnecting();
    const instance = new NetworkService();
    instance.onUserIdReceived = () => {
        connectionStatus.setConnected();
        elements.userIdDisplay.textContent = userId;
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        Object.assign(network, instance);
        // Успешное подключение, прекращаем попытки переподключения
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };
    instance.onStudentListReceived = updateRecipients;
    instance.onMessageReceived = handleIncomingMessage;

    try {
        const ws = __WS_SERVER__ || window.location.host;
        await instance.connect(ws, handleIncomingMessage, userId);
        // При неожиданном закрытии – запускаем переподключение
        instance.ws.onclose = () => {
            connectionStatus.clearStatus();
            startReconnecting();
        };
    } catch (err) {
        setTimeout(() => {
            connectionStatus.setError(err.message);

            if (!isReconnecting) {
                console.error(err);
                alert(`Ошибка подключения: ${err.message}`);
                resetLoginForm();
                throw err;
            }
        }, 1000);
    }
}

// Функция переподключения
function startReconnecting() {
    if (reconnectInterval) return;
    reconnectInterval = setInterval(() => {
        connectToServer(true);
    }, RECONNECT_INTERVAL_MS);
}

// Инициализация приложения
async function initApp() {
    connectToServer();

    elements.keyType.addEventListener('change', toggleKeyInterface);
    elements.interfaceMode.addEventListener('change', toggleExchangeInterface);
    elements.sendButton.addEventListener('click', handleSend);
    elements.toneSelector.addEventListener('input', updateToneValue);
    elements.recipientTypeSelector.addEventListener(
        'change',
        handleRecipientChange,
    );
    finishButton.addEventListener('click', () => {
        if (exchangeFinished) return;
        exchangeFinished = true;

        // заблокировать дальнейшую отправку
        sendButton.disabled = true;
        finishButton.disabled = true;
        finishButton.textContent = 'Обмен завершён';

        network.finishExchange();
    });
    updateToneValue();

    createInputFields('inputContainer', +elements.groupSelector.value);
    setupInputHandlers();
    elements.groupSelector.addEventListener('change', (e) =>
        createInputFields('inputContainer', +e.target.value),
    );

    // Полуавто
    document.addEventListener('keydown', handleSemiKeyDown);
    document.addEventListener('keyup', handleSemiKeyUp);

    function formatKeyDisplay(code) {
        if (code.startsWith('Key') && code.length > 3) {
            return code.slice(3);
        }
        const arrows = {
            ArrowUp: '▲',
            ArrowDown: '▼',
            ArrowLeft: '◀',
            ArrowRight: '▶',
        };
        if (arrows[code]) {
            return arrows[code];
        }
        return code;
    }

    // Ручной — клавиатурный
    elements.manualChangeBtn.addEventListener('click', () => {
        awaitingKey = true;
        elements.manualKeyDisplay.textContent = 'Нажмите новую кнопку...';
    });
    document.addEventListener('keydown', (e) => {
        if (awaitingKey) {
            manualKey = e.code;
            elements.manualKeyDisplay.textContent = formatKeyDisplay(manualKey);
            awaitingKey = false;
        }
        handleManualKeyDown(e);
    });
    document.addEventListener('keyup', handleManualKeyUp);

    document.addEventListener('keydown', (e) => {
        focusNextInput(e, elements.interfaceMode.value);
    });

    elements.manualKeyDisplay.textContent = formatKeyDisplay(manualKey);

    toggleKeyInterface();
    toggleExchangeInterface();
}

// Отправка по кнопке
function handleSend() {
    if (exchangeFinished) return;
    const rec = elements.recipientTypeSelector.value;
    if (!rec) {
        alert('Выберите получателя');
        return;
    }
    const txt = getInputValues(elements.interfaceMode.value);
    const shortZero = elements.shortZeroCheckbox.checked;
    const morse = textToMorse(txt, shortZero);
    const speed = +elements.speedSelector.value;
    const params = {
        baseDuration: SPEED_CONFIG.BASE_UNIT / speed,
        tone: +elements.toneSelector.value,
        letterPause: +elements.letterPauseInput.value,
        groupPause: +elements.groupPauseInput.value,
        shortZero,
    };
    network.sendMessage(rec, morse, params, elements.interfaceMode.value);
}

// Приём и проигрыш
function handleIncomingMessage(data) {
    const { baseDuration, tone, letterPause, groupPause } = data.params;
    if (data.content === 'start') {
        morseAudioPlayer.startContinuous(baseDuration, tone);
    } else if (data.content === 'stop') {
        morseAudioPlayer.stopContinuous();
    } else {
        morseAudioPlayer.playSequence(
            data.content,
            baseDuration,
            tone,
            letterPause,
            groupPause,
        );
    }
}

function updateToneValue() {
    elements.toneValue.textContent = `${elements.toneSelector.value} Гц`;
}

// UI: переключение режимов ключа
function toggleKeyInterface() {
    const mode = elements.keyType.value;
    elements.exchangeContainer.classList.toggle('hidden', mode !== 'auto');
    elements.controlsContainer.classList.toggle('hidden', mode !== 'auto');
    elements.interfaceSwitcher.classList.toggle('hidden', mode !== 'auto');
    elements.semiAutoInterface.classList.toggle('hidden', mode !== 'semi');
    elements.manualInterface.classList.toggle('hidden', mode !== 'manual');
}

// UI: служебный / оперативный
function toggleExchangeInterface() {
    if (elements.interfaceMode.value === 'service') {
        elements.serviceInterface.classList.remove('hidden');
        elements.operationalInterface.classList.add('hidden');
    } else {
        elements.serviceInterface.classList.add('hidden');
        elements.operationalInterface.classList.remove('hidden');
    }
}

// Полуавто клавиши
function handleSemiKeyDown(e) {
    if (elements.keyType.value !== 'semi') return;
    const rec = elements.recipientTypeSelector.value;
    if (!rec) return;
    const interval = +elements.semiInterval.value || 300;
    const baseDuration = interval / (SPEED_CONFIG.DASH_MULTIPLIER + 1);
    const params = {
        baseDuration,
        tone: +elements.toneSelector.value,
        letterPause: +elements.letterPauseInput.value,
        groupPause: +elements.groupPauseInput.value,
        shortZero: elements.shortZeroCheckbox.checked,
    };

    const sendAndPlay = (symbol) => {
        network.sendMessage(rec, symbol, params);
        morseAudioPlayer.playSequence(
            symbol,
            baseDuration,
            params.tone,
            params.letterPause,
            params.groupPause,
        );
    };

    if (e.code === 'ArrowLeft') {
        // Прекратить dash, если он активен
        if (rightTimer) {
            clearInterval(rightTimer);
            rightTimer = null;
            elements.semiDash.classList.remove('active');
        }
        if (!leftTimer) {
            elements.semiDot.classList.add('active');
            sendAndPlay('.');
            leftTimer = setInterval(() => sendAndPlay('.'), interval);
        }
    }

    if (e.code === 'ArrowRight') {
        // Прекратить dot, если он активен
        if (leftTimer) {
            clearInterval(leftTimer);
            leftTimer = null;
            elements.semiDot.classList.remove('active');
        }
        if (!rightTimer) {
            elements.semiDash.classList.add('active');
            sendAndPlay('-');
            rightTimer = setInterval(() => sendAndPlay('-'), interval);
        }
    }
}

function handleSemiKeyUp(e) {
    if (e.code === 'ArrowLeft' && leftTimer) {
        clearInterval(leftTimer);
        leftTimer = null;
        elements.semiDot.classList.remove('active');
    }
    if (e.code === 'ArrowRight' && rightTimer) {
        clearInterval(rightTimer);
        rightTimer = null;
        elements.semiDash.classList.remove('active');
    }
}

// Ручной режим по выбранной клавише
let manualActive = false;
function handleManualKeyDown(e) {
    if (
        elements.keyType.value !== 'manual' ||
        e.code !== manualKey ||
        manualActive
    )
        return;
    manualActive = true;
    const rec = elements.recipientTypeSelector.value;
    if (!rec) return;
    const speed = +elements.speedSelector.value;
    const params = {
        baseDuration: SPEED_CONFIG.BASE_UNIT / speed,
        tone: +elements.toneSelector.value,
        letterPause: +elements.letterPauseInput.value,
        groupPause: +elements.groupPauseInput.value,
        shortZero: elements.shortZeroCheckbox.checked,
    };
    network.sendMessage(rec, 'start', params);
    morseAudioPlayer.startContinuous(params.baseDuration, params.tone);
}
function handleManualKeyUp(e) {
    if (
        elements.keyType.value !== 'manual' ||
        e.code !== manualKey ||
        !manualActive
    )
        return;
    manualActive = false;
    const rec = elements.recipientTypeSelector.value;
    if (!rec) return;
    network.sendMessage(rec, 'stop', {}); // params можно не передавать
    morseAudioPlayer.stopContinuous();
}

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

// Управление темой
const themeKey = 'theme';
const themeSelector = document.getElementById('themeSelector');

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'contrast') {
        document.documentElement.setAttribute('data-theme', 'contrast');
    }
}

(function initTheme() {
    // системная тема
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    // сохранённая или system
    const saved = localStorage.getItem(themeKey) || system;
    applyTheme(saved);
    themeSelector.value = saved;
    themeSelector.addEventListener('change', (e) => {
        const t = e.target.value;
        localStorage.setItem(themeKey, t);
        applyTheme(t);
    });
})();

const RECONNECT_INTERVAL_MS = 5000;
const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');

let userId = '';
let reconnectInterval = null;
let leftTimer = null;
let rightTimer = null;
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
    operationalInterface: document.getElementById('operationalInterface'),
    serviceInterface: document.getElementById('serviceInterface'),
    serviceInput: document.getElementById('serviceInput'),
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

        network.setFree();
        network.finishExchange();

        exchangeFinished = true;

        // заблокировать дальнейшую отправку
        sendButton.disabled = true;
        finishButton.disabled = true;
        finishButton.textContent = 'Обмен завершён';

        // заблокировать выбор получателя
        elements.recipientTypeSelector.value = '';
        elements.recipientTypeSelector.disabled = true;
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

    const interfaceMode = elements.interfaceMode.value;
    const shortZero = elements.shortZeroCheckbox.checked;
    const tone = +elements.toneSelector.value;
    const letterPause = +elements.letterPauseInput.value;
    const groupPause = +elements.groupPauseInput.value;
    const speed = +elements.speedSelector.value; // скорость для ТЕЛА

    // params всегда содержит базовую длительность для ТЕЛА
    const params = {
        baseDuration: SPEED_CONFIG.BASE_UNIT / speed,
        tone,
        letterPause,
        groupPause,
        shortZero,
    };

    if (interfaceMode === 'operational') {
        const opInterface = document.getElementById('operationalInterface');
        if (!opInterface) {
            alert('Ошибка: не найден operationalInterface');
            return;
        }

        // конкретные контейнеры заголовков
        const header1Container =
            opInterface.querySelector('.operational-fields.row-1') ||
            opInterface.querySelector('.operational-fields');
        const header2Container = opInterface.querySelector(
            '.operational-fields.row-3',
        );

        const header1Inputs = header1Container
            ? Array.from(header1Container.querySelectorAll('.message-input'))
            : [];
        const header2Inputs = header2Container
            ? Array.from(header2Container.querySelectorAll('.message-input'))
            : [];

        const allInputs = Array.from(
            opInterface.querySelectorAll('.message-input'),
        );

        // тело — все inputs в operationalInterface, которые не в header1 и не в header2
        const bodyInputs = allInputs.filter(
            (inp) =>
                !header1Inputs.includes(inp) && !header2Inputs.includes(inp),
        );

        const header1Text = header1Inputs
            .map((i) => i.value.trim())
            .filter(Boolean)
            .join(' ');
        const bodyText = bodyInputs
            .map((i) => i.value.trim())
            .filter(Boolean)
            .join(' ');
        const header2Text = header2Inputs
            .map((i) => i.value.trim())
            .filter(Boolean)
            .join(' ');

        const header1Morse = header1Text
            ? textToMorse(header1Text, shortZero)
            : '';
        const bodyMorse = bodyText ? textToMorse(bodyText, shortZero) : '';
        const header2Morse = header2Text
            ? textToMorse(header2Text, shortZero)
            : '';

        const content = {
            header1: header1Morse,
            body: bodyMorse,
            header2: header2Morse,
            isOperational: true,
        };

        network.sendMessage(rec, content, params, interfaceMode);
    } else {
        // служебный интерфейс — старое поведение (одна строка)
        const txt = getInputValues(interfaceMode);
        const morse = textToMorse(txt, shortZero);
        network.sendMessage(rec, morse, params, interfaceMode);
    }
}

// Приём и проигрыш
function handleIncomingMessage(data) {
    const params = data.params || {};
    const baseDuration = params.baseDuration || 0; // базовая длительность для ТЕЛА
    const tone = params.tone || 700;
    const letterPause = params.letterPause || 0;
    const groupPause = params.groupPause || 0;

    if (data.content === 'start') {
        morseAudioPlayer.startContinuous(baseDuration, tone);
        return;
    }
    if (data.content === 'stop') {
        morseAudioPlayer.stopContinuous();
        return;
    }

    // старый режим: простая строка
    if (typeof data.content === 'string') {
        morseAudioPlayer.playSequence(
            data.content,
            baseDuration,
            tone,
            letterPause,
            groupPause,
        );
        return;
    }

    // новый режим: объект с header1/body/header2 помеченный isOperational
    if (data.content && typeof data.content === 'object') {
        const isOperational = !!data.content.isOperational;
        const header1 = data.content.header1 || '';
        const body = data.content.body || '';
        const header2 = data.content.header2 || '';

        if (isOperational) {
            // headerBase — для заголовков (в 2 раза медленнее)
            const headerBase = baseDuration * 2;

            // будем накапливать offset (ms) перед запуском следующей части
            let offset = 0;

            // header1
            if (header1) {
                morseAudioPlayer.playSequence(
                    header1,
                    headerBase,
                    tone,
                    letterPause,
                    groupPause,
                );
                // длительность заголовка + меж-групповая пауза после него
                let header1Ms = morseAudioPlayer.calcSequenceDuration(
                    header1,
                    headerBase,
                    letterPause,
                    groupPause,
                );
                header1Ms += groupPause;
                offset += header1Ms;
            }

            // body
            if (body) {
                // запланировать запуск тела через offset
                setTimeout(() => {
                    morseAudioPlayer.playSequence(
                        body,
                        baseDuration,
                        tone,
                        letterPause,
                        groupPause,
                    );
                }, offset);

                // прибавляем длительность тела + паузу после тела (чтобы header2 не стартовал сразу)
                let bodyMs = morseAudioPlayer.calcSequenceDuration(
                    body,
                    baseDuration,
                    letterPause,
                    groupPause,
                );
                bodyMs += groupPause;
                offset += bodyMs;
            }

            // header2 (после тела)
            if (header2) {
                setTimeout(() => {
                    morseAudioPlayer.playSequence(
                        header2,
                        headerBase,
                        tone,
                        letterPause,
                        groupPause,
                    );
                }, offset);
            }

            return;
        }

        // fallback: если пришёл объект, но без isOperational — старая обработка
        // если есть header/body — попробуем проиграть header, затем body (как раньше)
        if (data.content.header || data.content.body) {
            const header = data.content.header || '';
            const body = data.content.body || '';
            if (header) {
                const headerBase = baseDuration * 2;
                morseAudioPlayer.playSequence(
                    header,
                    headerBase,
                    tone,
                    letterPause,
                    groupPause,
                );
                let headerMs = morseAudioPlayer.calcSequenceDuration(
                    header,
                    headerBase,
                    letterPause,
                    groupPause,
                );
                headerMs += groupPause;
                if (body) {
                    setTimeout(() => {
                        morseAudioPlayer.playSequence(
                            body,
                            baseDuration,
                            tone,
                            letterPause,
                            groupPause,
                        );
                    }, headerMs);
                }
            } else if (body) {
                morseAudioPlayer.playSequence(
                    body,
                    baseDuration,
                    tone,
                    letterPause,
                    groupPause,
                );
            }
        }
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

elements.serviceInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^а-яё0-9 ]/gi, '');
});

// Полуавтоматические клавиши
function handleSemiKeyDown(e) {
    if (elements.keyType.value !== 'semi') return;
    e.preventDefault();
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
        network.sendMessage(rec, symbol, params, elements.interfaceMode.value);
        morseAudioPlayer.playSequence(
            symbol,
            baseDuration,
            params.tone,
            params.letterPause,
            params.groupPause,
        );
    };

    if (e.code === 'ArrowLeft') {
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

    const rec = elements.recipientTypeSelector.value;
    if (!rec) return;

    e.preventDefault();

    manualActive = true;
    elements.manualKeyDisplay.classList.add('active');

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
    elements.manualKeyDisplay.classList.remove('active');

    const rec = elements.recipientTypeSelector.value;
    if (!rec) return;

    network.sendMessage(rec, 'stop', {});
    morseAudioPlayer.stopContinuous();
}

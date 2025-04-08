import { NetworkService } from '../services/NetworkService.js';
import { MorseAudioPlayer } from '../core/morse/MorseAudioPlayer.js';
import {
    setupInputHandlers,
    createInputFields,
    getInputValues,
} from '../ui/components/inputs.js';
import { ConnectionStatus } from '../ui/components/connectionStatus.js';
import { UserStatusIndicator } from '../ui/components/UserStatusIndicator.js';
import { focusNextInput } from '../ui/utils/focusNextInput.js';
import { textToMorse } from '../core/morse/converter.js';
import { SPEED_CONFIG } from '../core/morse/constants.js';

const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');
const userStatusIndicator = new UserStatusIndicator('userStatusIndicator');
let userId = '';
let leftTimer = null;
let rightTimer = null;
let statusCheckInterval = null;
let currentRecipientId = null;

const elements = {
    userIdDisplay: document.getElementById('userIdDisplay'),
    connectionStatus: document.getElementById('connectionStatus'),
    recipientId: document.getElementById('recipientId'),
    keyType: document.getElementById('keyType'),
    interfaceMode: document.getElementById('interfaceMode'),
    interfaceSwitcher: document.getElementById('interfaceSwitcher'),

    exchangeContainer: document.getElementById('exchangeContainer'),
    semiAutoInterface: document.getElementById('semiAutoInterface'),
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
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        connectionStatus.setConnecting();
        network.onUserIdReceived = (id) => {
            userId = id;
            elements.userIdDisplay.textContent = `Студент-${userId}`;
            connectionStatus.setConnected();
        };
        const wsServer = __WS_SERVER__ || window.location.host;
        await network.connect(wsServer, handleIncomingMessage);
    } catch (error) {
        connectionStatus.setError(error.message);
        console.error('Ошибка подключения:', error);
    }

    elements.keyType.addEventListener('change', toggleKeyInterface);
    elements.interfaceMode.addEventListener('change', toggleExchangeInterface);

    elements.sendButton.addEventListener('click', handleSend);
    elements.toneSelector.addEventListener('input', updateToneValue);
    updateToneValue();

    createInputFields('inputContainer', parseInt(elements.groupSelector.value));
    setupInputHandlers();
    elements.groupSelector.addEventListener('change', (e) =>
        createInputFields('inputContainer', parseInt(e.target.value)),
    );

    elements.recipientId.addEventListener('input', handleRecipientChange);

    document.addEventListener('keydown', handleSemiKeyDown);
    document.addEventListener('keyup', handleSemiKeyUp);
    document.addEventListener('keydown', focusNextInput);

    toggleKeyInterface();
    toggleExchangeInterface();
});

function toggleKeyInterface() {
    const isAuto = elements.keyType.value === 'auto';
    elements.exchangeContainer.classList.toggle('hidden', !isAuto);
    elements.controlsContainer.classList.toggle('hidden', !isAuto);
    elements.interfaceSwitcher.classList.toggle('hidden', !isAuto);
    elements.semiAutoInterface.classList.toggle('hidden', isAuto);
}

function toggleExchangeInterface() {
    if (elements.interfaceMode.value === 'service') {
        elements.serviceInterface.classList.remove('hidden');
        elements.operationalInterface.classList.add('hidden');
        document.addEventListener('keydown', focusNextInput);
    } else {
        elements.serviceInterface.classList.add('hidden');
        elements.operationalInterface.classList.remove('hidden');
        document.removeEventListener('keydown', focusNextInput);
    }
}

function handleSend() {
    const recipient = elements.recipientId.value.match(/\d+/)?.[0] || '';
    if (!recipient) {
        alert('Укажите корректный ID получателя в формате "Студент-123"');
        return;
    }
    const content = getInputValues(elements.interfaceMode.value);
    const shortZero = elements.shortZeroCheckbox.checked;
    const morse = textToMorse(content, shortZero);

    const params = {
        speed: parseInt(elements.speedSelector.value),
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero,
    };

    network.sendMessage(recipient, morse, params);
}

function handleIncomingMessage(data) {
    const { speed, tone, letterPause, groupPause, shortZero } = data.params;
    const morseSequence = textToMorse(data.content, shortZero);

    // Логирование
    try {
        const dataArray = data.content.split(' ');
        const messageHeader = dataArray.slice(0, 7).join(' ');
        const messageText = dataArray.slice(8, -3).join(' ');
        const messageFooter = dataArray.slice(-3).join(' ');
        console.log('Сообщение:', data.content);
        console.log('------------------');
        console.log('Заголовок:', messageHeader);
        console.log('Сообщение:', messageText);
        console.log('Конец:', messageFooter);
    } catch {}

    morseAudioPlayer.playSequence(
        morseSequence,
        SPEED_CONFIG.BASE_UNIT / speed,
        tone,
        letterPause,
        groupPause,
    );
}

function updateToneValue() {
    elements.toneValue.textContent = `${elements.toneSelector.value} Гц`;
}

function handleSemiKeyDown(event) {
    if (elements.keyType.value !== 'semi') return;
    const recipient = elements.recipientId.value.match(/\d+/)?.[0] || '';
    if (!recipient) return;

    const interval = parseInt(elements.semiInterval.value) || 300;
    const baseDuration = interval / (SPEED_CONFIG.DASH_MULTIPLIER + 1);
    const params = {
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero: elements.shortZeroCheckbox.checked,
    };

    if (event.code === 'ArrowLeft' && !leftTimer) {
        elements.semiDot.classList.add('active');
        leftTimer = startSemiKey(
            '◀',
            '.',
            recipient,
            params,
            interval,
            baseDuration,
        );
    }
    if (event.code === 'ArrowRight' && !rightTimer) {
        elements.semiDash.classList.add('active');
        rightTimer = startSemiKey(
            '▶',
            '-',
            recipient,
            params,
            interval,
            baseDuration,
        );
    }
}

function handleSemiKeyUp(event) {
    if (event.code === 'ArrowLeft' && leftTimer) {
        clearInterval(leftTimer);
        leftTimer = null;
        elements.semiDot.classList.remove('active');
    }
    if (event.code === 'ArrowRight' && rightTimer) {
        clearInterval(rightTimer);
        rightTimer = null;
        elements.semiDash.classList.remove('active');
    }
}

function startSemiKey(
    symbolChar,
    symbolCode,
    recipient,
    params,
    interval,
    baseDuration,
) {
    sendAndPlay(symbolCode, recipient, params, baseDuration);
    return setInterval(
        () => sendAndPlay(symbolCode, recipient, params, baseDuration),
        interval,
    );
}

function sendAndPlay(symbol, recipient, params, baseDuration) {
    network.sendMessage(recipient, symbol, params);
    morseAudioPlayer.playSequence(
        symbol,
        baseDuration,
        params.tone,
        params.letterPause,
        params.groupPause,
    );
}

// === Индикатор статуса получателя ===
function handleRecipientChange(e) {
    const recipientInput = e.target.value;
    const recipientMatch = recipientInput.match(/\d+/);
    const recipientId = recipientMatch ? recipientMatch[0] : null;

    if (recipientId === currentRecipientId) return;

    currentRecipientId = recipientId;

    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }

    if (recipientId) {
        userStatusIndicator.setUnknown();
        checkRecipientStatus(recipientId);
        statusCheckInterval = setInterval(() => {
            checkRecipientStatus(recipientId);
        }, 5000);
    } else {
        userStatusIndicator.setUnknown();
    }
}

async function checkRecipientStatus(recipientId) {
    try {
        const isOnline = await network.checkUserStatus(recipientId);
        if (isOnline) {
            userStatusIndicator.setOnline();
        } else {
            userStatusIndicator.setOffline();
        }
    } catch (error) {
        console.error(
            `Ошибка проверки статуса корреспондента ${recipientId}`,
            error,
        );
        userStatusIndicator.setUnknown();
    }
}

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

const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');

let userId = '';
let userRole = '';
let userNumber = '';
let leftTimer = null;
let rightTimer = null;

// Elements
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const roleSelect = document.getElementById('userRole');
const numberInput = document.getElementById('userNumber');
const loginButton = document.getElementById('loginButton');

const elements = {
    userIdDisplay: document.getElementById('userIdDisplay'),
    connectionStatus: document.getElementById('connectionStatus'),
    recipientTypeSelector: document.getElementById('recipientType'),
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

// Login handler
loginButton.addEventListener('click', () => {
    userRole = roleSelect.value;
    userNumber = numberInput.value.trim();
    if (!userNumber || parseInt(userNumber, 10) < 1) {
        alert('Введите корректный номер (>=1)');
        return;
    }
    userId = `${userRole}-${userNumber}`;
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    elements.userIdDisplay.textContent = userId;
    initApp();
});

// Update recipients dropdown based on list from server
function updateRecipients(list) {
    if (!Array.isArray(list)) return;
    let items = [];

    if (userRole === 'Клен') {
        // все, кроме себя
        items = list;
    } else {
        // свой партнёр
        const partnerRole = userRole === 'Рапира' ? 'Макет' : 'Рапира';
        const partnerId = `${partnerRole}-${userNumber}`;
        if (list.includes(partnerId)) items.push(partnerId);
        // все клены
        items.push(...list.filter((id) => id?.startsWith('Клен-')));
    }

    // окончательный список без себя
    items = items.filter((id) => id && id !== userId);

    elements.recipientTypeSelector.innerHTML = items.length
        ? items.map((id) => `<option value="${id}">${id}</option>`).join('')
        : '<option disabled selected>Ожидание...</option>';
}

// Initialize WebSocket and UI handlers
async function initApp() {
    connectionStatus.setConnecting();
    network.onUserIdReceived = () => connectionStatus.setConnected();
    network.onStudentListReceived = updateRecipients;
    network.onMessageReceived = handleIncomingMessage;

    const wsServer = __WS_SERVER__ || window.location.host;
    try {
        await network.connect(wsServer, handleIncomingMessage, userId);
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

    document.addEventListener('keydown', handleSemiKeyDown);
    document.addEventListener('keyup', handleSemiKeyUp);
    document.addEventListener('keydown', focusNextInput);

    toggleKeyInterface();
    toggleExchangeInterface();
}

// Send message
function handleSend() {
    const recipientFull = elements.recipientTypeSelector.value;
    const content = getInputValues(elements.interfaceMode.value);
    const shortZero = elements.shortZeroCheckbox.checked;
    const morse = textToMorse(content, shortZero);
    const speed = parseInt(elements.speedSelector.value);
    const params = {
        baseDuration: SPEED_CONFIG.BASE_UNIT / speed,
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero,
    };
    network.sendMessage(recipientFull, morse, params);
}

// Incoming message handler
function handleIncomingMessage(data) {
    const { baseDuration, tone, letterPause, groupPause } = data.params;
    morseAudioPlayer.playSequence(
        data.content,
        baseDuration,
        tone,
        letterPause,
        groupPause,
    );
}

// UI toggles
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

function updateToneValue() {
    elements.toneValue.textContent = `${elements.toneSelector.value} Гц`;
}

// Semi-auto key handling
function handleSemiKeyDown(event) {
    if (elements.keyType.value !== 'semi') return;
    const recipientFull = elements.recipientTypeSelector.value;
    const interval = parseInt(elements.semiInterval.value) || 300;
    const baseDuration = interval / (SPEED_CONFIG.DASH_MULTIPLIER + 1);
    const params = {
        baseDuration,
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero: elements.shortZeroCheckbox.checked,
    };
    if (event.code === 'ArrowLeft' && !leftTimer) {
        elements.semiDot.classList.add('active');
        leftTimer = startSemiKey('.', params, interval);
    }
    if (event.code === 'ArrowRight' && !rightTimer) {
        elements.semiDash.classList.add('active');
        rightTimer = startSemiKey('-', params, interval);
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

function startSemiKey(symbol, params, interval) {
    sendAndPlay(symbol, params);
    return setInterval(() => sendAndPlay(symbol, params), interval);
}

function sendAndPlay(symbol, params) {
    const recipientFull = elements.recipientTypeSelector.value;
    network.sendMessage(recipientFull, symbol, params);
    morseAudioPlayer.playSequence(
        symbol,
        params.baseDuration,
        params.tone,
        params.letterPause,
        params.groupPause,
    );
}

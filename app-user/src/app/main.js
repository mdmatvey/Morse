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

const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();

const serverStatus = new ConnectionStatus('connectionStatus');
const peerStatus = new ConnectionStatus('peerStatus');

let userId = '';

const elements = {
    userIdDisplay: document.getElementById('userIdDisplay'),
    interfaceMode: document.getElementById('interfaceMode'),
    serviceInterface: document.getElementById('serviceInterface'),
    operationalInterface: document.getElementById('operationalInterface'),
    groupSelector: document.getElementById('groupCount'),
    speedSelector: document.getElementById('speedSelector'),
    toneSelector: document.getElementById('toneSelector'),
    toneValue: document.getElementById('toneValue'),
    letterPauseInput: document.getElementById('letterPause'),
    groupPauseInput: document.getElementById('groupPause'),
    shortZeroCheckbox: document.querySelector('input[type="checkbox"]'),
    sendButton: document.getElementById('sendSignal'),
    operationalInput: document.getElementById('operationalInput'),
    connectBtn: document.getElementById('connectBtn'),
    recipientInput: document.getElementById('recipientId'),
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1) Подключение к серверу
    try {
        serverStatus.setConnecting();
        network.onUserIdReceived = (id) => {
            userId = id;
            elements.userIdDisplay.textContent = `Студент-${userId}`;
            serverStatus.setConnected();
        };
        network.onPeerStatusReceived = (status) => {
            if (status === 'waiting') peerStatus.setConnecting();
            else if (status === 'connected') peerStatus.setConnected();
            else peerStatus.setError();
        };
        const wsServer = __WS_SERVER__ || window.location.host;
        await network.connect(wsServer, handleIncomingMessage);
    } catch (error) {
        serverStatus.setError(error.message);
        console.error('Ошибка подключения:', error);
    }

    // 2) Обработчики UI
    elements.interfaceMode.addEventListener('change', toggleInterface);
    elements.sendButton.addEventListener('click', handleSend);
    elements.toneSelector.addEventListener('input', updateToneValue);
    elements.connectBtn.addEventListener('click', handleConnect);
    updateToneValue();
    createInputFields('inputContainer', 10);
    setupInputHandlers();
    elements.groupSelector.addEventListener('change', (e) =>
        createInputFields('inputContainer', parseInt(e.target.value)),
    );
    document.addEventListener('keydown', focusNextInput);
});

function handleConnect() {
    const recipient = elements.recipientInput.value.match(/\d+/)?.[0] || '';
    if (!recipient) {
        alert('Укажите корректный ID корреспондента в формате "Студент-123"');
        return;
    }
    network.requestPeerConnection(recipient);
}

function handleSend() {
    const recipient = elements.recipientInput.value.match(/\d+/)?.[0] || '';
    if (!recipient) {
        alert('Укажите корректный ID получателя');
        return;
    }
    const content = getInputValues(elements.interfaceMode.value);
    const params = {
        speed: parseInt(elements.speedSelector.value),
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero: elements.shortZeroCheckbox.checked,
    };
    network.sendMessage(recipient, content, params);
}

function handleIncomingMessage(data) {
    if (data.type === 'message') {
        const { speed, tone, letterPause, groupPause, shortZero } = data.params;
        const morseSequence = textToMorse(data.content, shortZero);
        morseAudioPlayer.playSequence(
            morseSequence,
            speed,
            tone,
            letterPause,
            groupPause,
        );

        /* логирование */
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
        /* логирование */
    }
}

function toggleInterface() {
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

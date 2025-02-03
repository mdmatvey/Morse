import { NetworkService } from '../services/NetworkService.js';
import { MorseAudioPlayer } from '../core/morse/MorseAudioPlayer.js';
import { createInputFields, getInputValues } from '../ui/components/inputs.js';
import { ConnectionStatus } from '../ui/components/connectionStatus.js';
import { focusNextInput } from '../ui/utils/focusNextInput.js';
import { MESSAGE_PREFIX, MESSAGE_POSTFIX } from '../core/morse/constants.js';
import { textToMorse } from '../core/morse/converter.js';

const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');
let userId = '';

const elements = {
    connectButton: document.getElementById('connectServer'),
    sendButton: document.getElementById('sendSignal'),
    speedSelector: document.getElementById('speedSelector'),
    groupSelector: document.getElementById('groupCount'),
    userIdDisplay: document.getElementById('userIdDisplay'),
};

document.addEventListener('DOMContentLoaded', () => {
    createInputFields('inputContainer', 2);
    // createInputFields('inputContainer', 10);

    elements.connectButton.addEventListener('click', handleConnect);
    elements.sendButton.addEventListener('click', handleSend);
    elements.groupSelector.addEventListener('change', updateInputs);

    network.onUserIdReceived = (id) => {
        userId = id;
        elements.userIdDisplay.textContent = `Студент-${userId}`;
    };
});

document.addEventListener('keydown', focusNextInput);

async function handleConnect() {
    try {
        connectionStatus.setConnecting();
        await network.connect(
            document.getElementById('serverAddress').value,
            handleIncomingMessage,
        );
        connectionStatus.setConnected();
        elements.connectButton.disabled = true;
    } catch (error) {
        connectionStatus.setError(error.message);
        console.error('Connection error:', error);
    }
}

function handleSend() {
    // Получаем актуальное значение из поля ввода
    const recipientInput = document.getElementById('recipientId').value;
    const recipient = recipientInput.match(/\d+/)?.[0] || '';

    if (!recipient) {
        alert('Укажите корректный ID получателя в формате "Студент-123"');
        return;
    }

    // Формируем сообщение
    const content = `${MESSAGE_PREFIX} ${getInputValues()} ${MESSAGE_POSTFIX}`;

    // Получаем выбранную скорость
    const speed = parseInt(elements.speedSelector.value);

    // Отправляем с текущим recipientId
    network.sendMessage({
        recipient,
        content,
        speed,
    });
}

function handleIncomingMessage(data) {
    const morseSequence = textToMorse(data.content);

    morseAudioPlayer.playSequence(morseSequence, data.speed);
}

function updateInputs(e) {
    createInputFields('inputContainer', parseInt(e.target.value));
}

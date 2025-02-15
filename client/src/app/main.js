import { NetworkService } from '../services/NetworkService.js';
import { MorseAudioPlayer } from '../core/morse/MorseAudioPlayer.js';
import {
    setupServiceInputHandlers,
    createInputFields,
    getInputValues,
} from '../ui/components/inputs.js';
import { ConnectionStatus } from '../ui/components/connectionStatus.js';
import { focusNextInput } from '../ui/utils/focusNextInput.js';
import { textToMorse } from '../core/morse/converter.js';

const network = new NetworkService();
const morseAudioPlayer = new MorseAudioPlayer();
const connectionStatus = new ConnectionStatus('connectionStatus');
let userId = '';

const elements = {
    serverAddress: document.getElementById('serverAddress'),
    connectButton: document.getElementById('connectServer'),
    sendButton: document.getElementById('sendSignal'),
    speedSelector: document.getElementById('speedSelector'),
    groupSelector: document.getElementById('groupCount'),
    userIdDisplay: document.getElementById('userIdDisplay'),
};

document.addEventListener('DOMContentLoaded', () => {
    setupServiceInputHandlers();
    createInputFields('inputContainer', 10);
    // createInputFields('inputContainer', 2);

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
            elements.serverAddress.value,
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
    const content = getInputValues();

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

    /* логирование */
    const dataArray = data.content.split(' ');
    const messageHeader = dataArray.slice(0, 7).join(' ');
    const messageText = dataArray.slice(8, -3).join(' ');
    const messageFooter = dataArray.slice(-3).join(' ');
    console.log('Заголовок:', messageHeader);
    console.log('Сообщение:', messageText);
    console.log('Конец:', messageFooter);
    /* логирование */

    morseAudioPlayer.playSequence(morseSequence, data.speed);
}

function updateInputs(e) {
    createInputFields('inputContainer', parseInt(e.target.value));
}

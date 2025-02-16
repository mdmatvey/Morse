import { NetworkService } from '../services/NetworkService.js';
import { MorseAudioPlayer } from '../core/morse/MorseAudioPlayer.js';
import {
    setupInputHandlers,
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
    toneSelector: document.getElementById('toneSelector'),
    toneValue: document.getElementById('toneValue'),
    letterPauseInput: document.getElementById('letterPause'),
    groupPauseInput: document.getElementById('groupPause'),
};

document.addEventListener('DOMContentLoaded', () => {
    // Создание и настройка обработчиков инпутов
    createInputFields('inputContainer', 10);
    setupInputHandlers();

    // Обработчик для слайдера тональности
    elements.connectButton.addEventListener('click', handleConnect);
    elements.sendButton.addEventListener('click', handleSend);
    elements.groupSelector.addEventListener('change', updateInputs);

    // Обработчик для слайдера тональности
    elements.toneSelector.addEventListener('input', updateToneValue);

    // Обработчик получения айди юзера при регистрации
    network.onUserIdReceived = (id) => {
        userId = id;
        elements.userIdDisplay.textContent = `Студент-${userId}`;
    };

    // Инициализация начального значения тональности
    updateToneValue();
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
    // Получаем адресата отправки
    const recipientInput = document.getElementById('recipientId').value;
    const recipient = recipientInput.match(/\d+/)?.[0] || '';

    if (!recipient) {
        alert('Укажите корректный ID получателя в формате "Студент-123"');
        return;
    }

    // Формируем сообщение
    const content = getInputValues();

    // Получаем параметры
    const params = {
        speed: parseInt(elements.speedSelector.value),
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
    };

    // Отправляем с текущим recipientId
    network.sendMessage(recipient, content, params);
}

function handleIncomingMessage(data) {
    // Получаем закодированный в морзе текст и параметры воспроизведения
    const morseSequence = textToMorse(data.content);
    const { speed, tone, letterPause, groupPause } = data.params;

    /* логирование */
    const dataArray = data.content.split(' ');
    const messageHeader = dataArray.slice(0, 7).join(' ');
    const messageText = dataArray.slice(8, -3).join(' ');
    const messageFooter = dataArray.slice(-3).join(' ');
    console.log('Заголовок:', messageHeader);
    console.log('Сообщение:', messageText);
    console.log('Конец:', messageFooter);
    /* логирование */

    // Запускаем воспроизведение полученного сообщения с заданными параметрами
    morseAudioPlayer.playSequence(
        morseSequence,
        speed,
        tone,
        letterPause,
        groupPause,
    );
}

function updateInputs(e) {
    createInputFields('inputContainer', parseInt(e.target.value));
}

function updateToneValue() {
    // Обновляем отображаемое значение слайдера тональности
    const tone = elements.toneSelector.value;
    elements.toneValue.textContent = `${tone} Гц`;
}

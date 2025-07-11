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
};

document.addEventListener('DOMContentLoaded', async () => {
    // Подключение к серверу
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

    // Обработчики кнопок
    elements.interfaceMode.addEventListener('change', toggleInterface);
    elements.sendButton.addEventListener('click', handleSend);
    elements.toneSelector.addEventListener('input', updateToneValue);
    updateToneValue();

    // Обработчики полей ввода
    createInputFields('inputContainer', 10);
    setupInputHandlers();
    elements.groupSelector.addEventListener('change', updateInputs);
});

document.addEventListener('keydown', focusNextInput);

function handleSend() {
    // Получаем адресата отправки
    const recipientInput = document.getElementById('recipientId').value;
    const recipient = recipientInput.match(/\d+/)?.[0] || '';

    if (!recipient) {
        alert('Укажите корректный ID получателя в формате "Студент-123"');
        return;
    }

    // Формируем сообщение
    const content = getInputValues(elements.interfaceMode.value);

    // Получаем параметры
    const params = {
        speed: parseInt(elements.speedSelector.value),
        tone: parseInt(elements.toneSelector.value),
        letterPause: parseInt(elements.letterPauseInput.value),
        groupPause: parseInt(elements.groupPauseInput.value),
        shortZero: elements.shortZeroCheckbox.checked,
    };

    // Отправляем с текущим recipientId
    network.sendMessage(recipient, content, params);
}

function handleIncomingMessage(data) {
    // Получаем параметры воспроизведения и кодируем текст в морзе
    const { speed, tone, letterPause, groupPause, shortZero } = data.params;
    const morseSequence = textToMorse(data.content, shortZero);

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

    // Запускаем воспроизведение полученного сообщения с заданными параметрами
    morseAudioPlayer.playSequence(
        morseSequence,
        speed,
        tone,
        letterPause,
        groupPause,
    );
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

function updateInputs(e) {
    createInputFields('inputContainer', parseInt(e.target.value));
}

function updateToneValue() {
    // Обновляем отображаемое значение слайдера тональности
    const tone = elements.toneSelector.value;
    elements.toneValue.textContent = `${tone} Гц`;
}

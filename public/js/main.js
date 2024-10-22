import { setupWebSocket } from './websocket.js';
import { handleMorseInput, playMorseSound, playMorseSequence } from './morse.js';

const dotButton = document.getElementById('dot');
const dashButton = document.getElementById('dash');
const playButton = document.getElementById('play');
const sendSignalButton = document.getElementById('sendSignal');
const output = document.getElementById('output');

// Генерация уникального ID для пользователя
const userId = `user_${Math.floor(Math.random() * 1000)}`;

// Отображение собственного ID пользователя на странице
const userIdDisplay = document.getElementById('userIdDisplay');
userIdDisplay.textContent = userId;

// Получение ID получателя из текстового поля
const recipientIdInput = document.getElementById('recipientId');
let recipientId = recipientIdInput.value;

// Подключение события изменения текста в поле
recipientIdInput.addEventListener('input', () => {
    recipientId = recipientIdInput.value; // Обновляем recipientId при изменении
});

// Подключаемся к WebSocket-серверу
const ws = setupWebSocket(userId, recipientId, output, playMorseSequence);

// Обработка нажатия на кнопки
dotButton.addEventListener('click', () => {
    output.textContent += '.'; // Добавляем точку к выходному тексту
});

dashButton.addEventListener('click', () => {
    output.textContent += '-'; // Добавляем тире к выходному тексту
});

// Воспроизведение введенной последовательности
playButton.addEventListener('click', () => {
    playMorseSequence(output.textContent);
});

// Кнопка для отправки радиограммы
sendSignalButton.addEventListener('click', () => {
    const morseCode = output.textContent; // Получаем текст для отправки
    if (morseCode) {
        // Преобразование текста в морзянку
        const morseSequence = convertToMorse(morseCode);
        const message = JSON.stringify({
            type: 'message',
            id: userId,
            recipient: recipientId,
            content: morseSequence // Отправляем морзянку
        });
        ws.send(message); // Отправляем строку
        output.textContent += `\nSent: ${morseSequence}`; // Отображаем отправленное сообщение
    }
});

// Функция преобразования текста в морзянку
function convertToMorse(text) {
    const morseCodeMap = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-', ' ': '/'
    };

    return text.split('').map(char => morseCodeMap[char] || '').join(' ');
}

// Обработка ввода с клавиатуры для набора букв
document.addEventListener('keypress', (event) => {
    const char = event.key.toLowerCase();
    const morseCode = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
    };

    if (morseCode[char]) {
        output.textContent += char; // Добавляем букву к выходному тексту
    }
});

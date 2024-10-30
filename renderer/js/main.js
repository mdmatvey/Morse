import { setupWebSocket } from './websocket.js';
import { playMorseSequence } from './morse.js';

const dotButton = document.getElementById('dot');
const dashButton = document.getElementById('dash');
const playButton = document.getElementById('play');
const sendSignalButton = document.getElementById('sendSignal');
const output = document.getElementById('output');

const userId = `user_${Math.floor(Math.random() * 1000)}`;
const userIdDisplay = document.getElementById('userIdDisplay');
userIdDisplay.textContent = userId;

const recipientIdInput = document.getElementById('recipientId');
let recipientId = recipientIdInput.value;

recipientIdInput.addEventListener('input', () => {
    recipientId = recipientIdInput.value;
});

const ws = setupWebSocket(userId, recipientId, output, playMorseSequence);

dotButton.addEventListener('click', () => {
    output.textContent += '.';
});

dashButton.addEventListener('click', () => {
    output.textContent += '-';
});

playButton.addEventListener('click', () => {
    playMorseSequence(output.textContent);
});

sendSignalButton.addEventListener('click', () => {
    const morseCode = output.textContent;
    if (morseCode) {
        const morseSequence = convertToMorse(morseCode);
        const message = JSON.stringify({
            type: 'message',
            id: userId,
            recipient: recipientId,
            content: morseSequence
        });
        ws.send(message);
        output.textContent += `\nSent: ${morseSequence}`;
    }
});

function convertToMorse(text) {
    const morseCodeMap = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-', ' ': '/'
    };
    return text.split('').map(char => morseCodeMap[char] || '').join(' ');
}

document.addEventListener('keypress', (event) => {
    const char = event.key.toLowerCase();
    const morseCode = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
    };
    if (morseCode[char]) {
        output.textContent += char;
    }
});

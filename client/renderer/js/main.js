import { playMorseSequence } from './morse.js';

// const dotButton = document.getElementById('dot');
// const dashButton = document.getElementById('dash');
// const playButton = document.getElementById('play');
// const deleteButton = document.getElementById('delete');
const sendSignalButton = document.getElementById('sendSignal');
const output = document.getElementById('output');
const serverAddressInput = document.getElementById('serverAddress');
const connectServerButton = document.getElementById('connectServer');
const connectionStatus = document.getElementById('connectionStatus');

const userId = `Студент-${Math.floor(Math.random() * 1000)}`;
const userIdDisplay = document.getElementById('userIdDisplay');
userIdDisplay.textContent = userId;

const recipientIdInput = document.getElementById('recipientId');
let recipientId = recipientIdInput.value;

recipientIdInput.addEventListener('input', () => {
    recipientId = recipientIdInput.value;
});

let ws;

connectServerButton.addEventListener('click', () => {
    const serverAddress = `ws://${serverAddressInput.value}`;

    ws = new WebSocket(serverAddress);

    ws.onopen = () => {
        connectionStatus.textContent = 'подключено';
        connectionStatus.className = 'success';
        const registerMessage = JSON.stringify({ type: 'register', id: userId });
        ws.send(registerMessage);
    };

    ws.onmessage = (event) => {
        const receivedCode = event.data; // Получаем данные как текст
        output.textContent += `\nReceived: ${receivedCode}`;
        playMorseSequence(receivedCode); // Воспроизводим сигнал
    };

    ws.onerror = () => {
        connectionStatus.textContent = `ошибка`;
        connectionStatus.className = 'error';
    };
});

// dotButton.addEventListener('click', () => {
//     output.textContent += '.';
// });

// dashButton.addEventListener('click', () => {
//     output.textContent += '-';
// });

// playButton.addEventListener('click', () => {
//     playMorseSequence(output.textContent);
// });

sendSignalButton.addEventListener('click', () => {
    const morseCode = getMorseCodeFromInputs(); // Получаем код Морзе из инпутов
    
    // Проверка длины всех групп
    const inputs = document.querySelectorAll('.morse-input');
    for (const input of inputs) {
        if (input.value.trim().length !== 5) {
            alert('Каждая группа должна содержать ровно 5 символов.');
            return; // Останавливаем отправку, если условие не выполнено
        }
    }
    
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
        
        // Очищаем все инпуты после отправки
        inputs.forEach(input => {
            input.value = ''; // Устанавливаем значение инпута в пустую строку
        });
    }
});

// Удаляем последний символ из вывода
// deleteButton.addEventListener('click', () => {
//     output.textContent = output.textContent.slice(0, -1);
// });

document.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace') {
        output.textContent = output.textContent.slice(0, -1);
    }
});

function convertToMorse(text) {
    const morseCodeMap = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
    };
    return text.split('').map(char => morseCodeMap[char] || '').join(' ');
}

function getMorseCodeFromInputs() {
    let morseCode = '';
    const inputs = document.querySelectorAll('.morse-input');
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            morseCode += value + ' '; // Добавляем пробел между группами
        }
    });
    return morseCode.trim(); // Удаляем лишние пробелы в начале и в конце
}

function createInputs(groupCount) {
    const inputContainer = document.getElementById('inputContainer');
    inputContainer.innerHTML = ''; // Очистить контейнер

    for (let i = 0; i < groupCount; i++) {
        const inputWrapper = document.createElement('div'); // Обёртка для инпута и tooltip'а
        inputWrapper.className = 'input-wrapper';
        inputWrapper.style.position = 'relative'; // Для позиционирования tooltip'а

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'morse-input';
        input.placeholder = `Группа ${i + 1}`;
        input.maxLength = 5; // Ограничение на 5 символов

        // Элемент для вывода tooltip'а
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.top = '100%'; // Расположение tooltip'а под инпутом
        tooltip.style.left = '0';
        tooltip.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.display = 'none'; // Изначально скрыт
        tooltip.textContent = 'Допускаются только кириллические символы.';

        let timeoutId; // Переменная для хранения ID таймаута

        // Добавляем обработчик для проверки на кириллицу
        input.addEventListener('input', () => {
            const value = input.value;
            if (/[^а-яё]/i.test(value)) { // Проверка на наличие некириллических символов
                input.value = value.replace(/[^а-яё]/gi, ''); // Удаляем недопустимые символы
                tooltip.style.display = 'block'; // Показываем tooltip

                // Если таймаут уже установлен, очищаем его
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                // Устанавливаем новый таймаут на скрытие tooltip'а
                timeoutId = setTimeout(() => {
                    tooltip.style.display = 'none'; // Скрываем tooltip через 3 секунды
                }, 3000); // Время в миллисекундах
            } else {
                tooltip.style.display = 'none'; // Скрываем tooltip, если ввод корректен
                if (timeoutId) {
                    clearTimeout(timeoutId); // Очищаем таймаут, если ввод корректен
                }
            }
        });

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(tooltip);
        inputContainer.appendChild(inputWrapper);
    }
}

// Функция для перехода к следующему инпуту
function focusNextInput(event) {
    const inputs = document.querySelectorAll('.morse-input');
    const currentInput = document.activeElement;

    // Проверяем, нажата ли клавиша пробела
    if (event.code === 'Space') {
        event.preventDefault(); // Предотвращаем действие по умолчанию (прокрутка страницы)

        // Находим индекс текущего инпута и переходим к следующему
        const currentIndex = Array.from(inputs).indexOf(currentInput);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus(); // Переходим к следующему инпуту
        }
    }
}

// Обработчик события изменения количества групп
document.getElementById('groupCount').addEventListener('change', (event) => {
    const groupCount = parseInt(event.target.value);
    createInputs(groupCount);
});

// Добавляем обработчик события нажатия клавиш
document.addEventListener('keydown', focusNextInput);

// Инициализируем инпуты при загрузке
document.addEventListener('DOMContentLoaded', () => {
    createInputs(2); // По умолчанию 2 группы
});

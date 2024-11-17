import { playMorseSequence } from './morse.js';
import { setSpeed } from './consts.js';

const sendSignalButton = document.getElementById('sendSignal');
const serverAddressInput = document.getElementById('serverAddress');
const connectServerButton = document.getElementById('connectServer');
const connectionStatus = document.getElementById('connectionStatus');

// Переменная для хранения уникального ID
let userId = '';

const userIdDisplay = document.getElementById('userIdDisplay');
userIdDisplay.textContent = 'Не подключен';  // По умолчанию текст

const recipientIdInput = document.getElementById('recipientId');
let recipientId = recipientIdInput.value;

recipientIdInput.addEventListener('input', () => {
    const match = recipientIdInput.value.match(/\d+/);  // Ищем первое число в строке
    recipientId = match ? match[0] : '';  // Если число найдено, то присваиваем его, иначе оставляем пустое значение
});

let ws;

connectServerButton.addEventListener('click', () => {
    const serverAddress = `ws://${serverAddressInput.value}`;

    ws = new WebSocket(serverAddress);

    ws.onopen = () => {
        connectionStatus.textContent = 'подключено';
        connectionStatus.className = 'success';

        // Отключаем кнопку "Подключиться" после установления соединения
        connectServerButton.disabled = true;
        connectServerButton.style.backgroundColor = '#cccccc';  // Изменяем цвет, чтобы визуально показать, что кнопка недоступна

        const registerMessage = JSON.stringify({ type: 'register', id: userId });
        ws.send(registerMessage);
    };

    ws.onmessage = (event) => {
        try {
            const receivedData = JSON.parse(event.data);

            // Если это сообщение с ID пользователя, сохраняем его
            if (receivedData.type === 'user-id') {
                userId = receivedData.id;
                userIdDisplay.textContent = `Студент-${userId}`;  // Отображаем ID на странице
            }

            // Если это сигнал в формате Морзе
            if (receivedData.type === 'message') {
                playMorseSequence(receivedData.content); // Воспроизводим сигнал
            }
        } catch (e) {
            // Если данные не JSON, предполагаем, что это просто строка с сообщением Морзе
            playMorseSequence(event.data); // Воспроизводим сигнал Морзе
        }
    };

    ws.onerror = () => {
        connectionStatus.textContent = `ошибка`;
        connectionStatus.className = 'error';
    };
});

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
        // Добавляем «ЖЖЖ –» в начало и «К» в конец
        const modifiedCode = `ЖЖЖ– ${morseCode} К`;

        const morseSequence = convertToMorseWithTimings(modifiedCode); // Преобразование в Морзе
        const message = JSON.stringify({
            type: 'message',
            id: userId,
            recipient: recipientId,
            content: morseSequence
        });

        ws.send(message);

        // Очищаем все инпуты после отправки
        inputs.forEach(input => {
            input.value = ''; // Устанавливаем значение инпута в пустую строку
        });
    }
});

const morseCodeMap = {
    'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
    'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
    'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
    'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
};

const morseCodeNumbers = {
    '0': '-----',
    '1': '.----',
    '2': '..---',
    '3': '...--',
    '4': '....-',
    '5': '.....',
    '6': '-....',
    '7': '--...',
    '8': '---..',
    '9': '----.'
};

const additionalMorseSymbols = {
    '–': '-...-'
};

// Конкатенация основного и нового алфавита
const fullMorseCodeMap = {
    ...morseCodeMap, // Основной алфавит
    ...morseCodeNumbers,
    ...additionalMorseSymbols // Новый алфавит
};

function convertToMorseWithTimings(text) {
    return text
        .trim()
        .toLowerCase()
        .split(' ') // Разделяем текст на слова
        .map(word =>
            word.split('').map(char => fullMorseCodeMap[char] || '').join(' ') // Преобразуем буквы в Морзе
        )
        .join(' / '); // Разделение слов через "/"
}

// Инициализация скорости
const speedSelector = document.getElementById('speedSelector');
speedSelector.addEventListener('change', (event) => {
    const selectedSpeed = parseInt(event.target.value, 10);
    setSpeed(selectedSpeed);
});

// Устанавливаем начальную скорость
setSpeed(parseInt(speedSelector.value, 10));

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
        tooltip.textContent = 'Допускаются только кириллические символы и цифры.';

        let timeoutId; // Переменная для хранения ID таймаута

        // Добавляем обработчик для проверки на кириллицу и цифры
        input.addEventListener('input', () => {
            const value = input.value;
            if (/[^а-яё0-9]/i.test(value)) { // Проверка на наличие некириллических и нецифровых символов
                input.value = value.replace(/[^а-яё0-9]/gi, ''); // Удаляем недопустимые символы
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
        event.preventDefault(); // Предотвращаем стандартное поведение пробела

        // Переход к следующему инпуту
        const currentIndex = Array.from(inputs).indexOf(currentInput);
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus(); // Фокус на следующий инпут
        }
    }
}

// Добавляем слушатель события для перехода на следующий инпут
document.addEventListener('keydown', focusNextInput);

// Инициализация инпутов
createInputs(2);

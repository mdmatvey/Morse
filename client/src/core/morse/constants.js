// Алфавит
const CHARS_CODE_MAP = {
    а: '.-',
    б: '-...',
    в: '.--',
    г: '--.',
    д: '-..',
    е: '.',
    ё: '.',
    ж: '...-',
    з: '--..',
    и: '..',
    й: '.---',
    к: '-.-',
    л: '.-..',
    м: '--',
    н: '-.',
    о: '---',
    п: '.--.',
    р: '.-.',
    с: '...',
    т: '-',
    у: '..-',
    ф: '..-.',
    х: '....',
    ц: '-.-.',
    ч: '---.',
    ш: '----',
    щ: '--.-',
    ъ: '.--.-.',
    ы: '-.--',
    ь: '-..-',
    э: '..-..',
    ю: '..--',
    я: '.-.-',
};

const NUMBERS_CODE_MAP = {
    0: '-----',
    1: '.----',
    2: '..---',
    3: '...--',
    4: '....-',
    5: '.....',
    6: '-....',
    7: '--...',
    8: '---..',
    9: '----.',
};

const SYMBOLS_CODE_MAP = {
    '-': '-...-',
};

export const TO_MORSE_DICT = {
    ...CHARS_CODE_MAP,
    ...NUMBERS_CODE_MAP,
    ...SYMBOLS_CODE_MAP,
};

export const FROM_MORSE_DICT = Object.fromEntries(
    Object.entries(TO_MORSE_DICT).map(([key, value]) => [
        value,
        key.toUpperCase(),
    ]),
);

// Настройки скорости
export const SPEED_CONFIG = {
    BASE_UNIT: 700,
    DASH_MULTIPLIER: 3,
};

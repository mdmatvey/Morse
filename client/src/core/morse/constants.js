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

// Префиксы и постфиксы
export const MESSAGE_PREFIX = 'ЖЖЖ-';
export const MESSAGE_POSTFIX = 'К';

// Настройки скорости
export const SPEED_CONFIG = {
    BASE_UNIT: 700, // Формула расчета: BASE_UNIT / speedGroupsPerMinute
    DOT_DURATION: 100,
    DASH_MULTIPLIER: 3,
    PAUSE_MULTIPLIERS: {
        INTRA_LETTER: 1,
        INTER_LETTER: 3,
        INTER_WORD: 7,
    },
};

export const MORSE_TIMINGS = {
    '.': () => SPEED_CONFIG.DOT_DURATION,
    '-': () => SPEED_CONFIG.DOT_DURATION * SPEED_CONFIG.DASH_MULTIPLIER,
    ' ': () =>
        SPEED_CONFIG.DOT_DURATION * SPEED_CONFIG.PAUSE_MULTIPLIERS.INTER_LETTER,
    '/': () =>
        SPEED_CONFIG.DOT_DURATION * SPEED_CONFIG.PAUSE_MULTIPLIERS.INTER_WORD,
};

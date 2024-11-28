// Алфавит
const CHARS_CODE_MAP = {
    'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
    'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
    'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
    'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
};

const NUMBERS_CODE_MAP = {
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

const SYMBOLS_CODE_MAP = {
    '-': '-...-'
};

export const TO_MORSE_DICT = { ...CHARS_CODE_MAP, ...NUMBERS_CODE_MAP, ...SYMBOLS_CODE_MAP };

export const FROM_MORSE_DICT = Object.fromEntries(
    Object.entries(TO_MORSE_DICT).map(([key, value]) => [value, key.toUpperCase()])
);

export const MESSAGE_PREFIX = 'ЖЖЖ-';
export const MESSAGE_POSTFIX = 'К';


// Длительности
export let DOT_DURATION = 100; // По умолчанию

export const DASH_DURATION_MULTIPLIER = 3;
export const INTRA_LETTER_PAUSE_MULTIPLIER = 1;
export const INTER_LETTER_PAUSE_MULTIPLIER = 3;
export const INTER_WORD_PAUSE_MULTIPLIER = 7;

export function setSpeed(speedGroupsPerMinute) {
    // Расчет длительности точки: 700 / групп в минуту
    DOT_DURATION = Math.round(700 / speedGroupsPerMinute);
}

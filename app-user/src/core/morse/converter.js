import { TO_MORSE_DICT } from './constants.js';

export function textToMorse(text, shortZero) {
    return text
        .toLowerCase()
        .split('')
        .map((char) => {
            if (shortZero && char === '0') {
                return '-';
            }
            return TO_MORSE_DICT[char] || '';
        })
        .join(' ');
}

function morseToText(morse) {
    return morse
        .split(' ')
        .map((code) => {
            const entry = Object.entries(MORSE_CODE_MAP).find(
                ([, morseCode]) => morseCode === code,
            );
            return entry ? entry[0].toUpperCase() : '';
        })
        .join('');
}

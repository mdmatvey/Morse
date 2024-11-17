import { 
    DOT_DURATION, 
    DASH_DURATION_MULTIPLIER, 
    INTRA_LETTER_PAUSE_MULTIPLIER, 
    INTER_LETTER_PAUSE_MULTIPLIER, 
    INTER_WORD_PAUSE_MULTIPLIER 
} from './consts.js';

const MORSE_TIMINGS = {
    '.': () => DOT_DURATION,
    '-': () => DOT_DURATION * DASH_DURATION_MULTIPLIER,
    ' ': () => DOT_DURATION * INTER_LETTER_PAUSE_MULTIPLIER,
    '/': () => DOT_DURATION * INTER_WORD_PAUSE_MULTIPLIER,
};

// Воспроизведение одного звука
function playMorseSound(duration) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Частота 600 Гц
    oscillator.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
}

// Воспроизведение последовательности Морзе
export function playMorseSequence(sequence) {
    let delay = 0;

    sequence.split('').forEach((symbol) => {
        setTimeout(() => {
            if (symbol === '.' || symbol === '-') {
                playMorseSound(MORSE_TIMINGS[symbol]());
            }
        }, delay);

        delay += MORSE_TIMINGS[symbol]() || 0;

        if (symbol === '.' || symbol === '-') {
            delay += DOT_DURATION * INTRA_LETTER_PAUSE_MULTIPLIER;
        }
    });
}

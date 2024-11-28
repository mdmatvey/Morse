import { SPEED_CONFIG, MORSE_TIMINGS } from './constants.js';

export class MorseAudioPlayer {
    constructor() {
        this._audioContext = null;
    }

    playSequence(sequence, speed) {
        let delay = 0;

        sequence.split('').forEach((symbol) => {
            const duration = this._calculateTiming(speed, symbol);

            setTimeout(() => {
                if (symbol === '.' || symbol === '-') {
                    this._playSignal(duration);
                }
            }, delay);

            delay += duration || 0;

            if (symbol === '.' || symbol === '-') {
                delay +=
                    SPEED_CONFIG.DOT_DURATION *
                    SPEED_CONFIG.PAUSE_MULTIPLIERS.INTRA_LETTER;
            }
        });
    }

    _getAudioContext() {
        if (!this._audioContext) {
            this._audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }

        return this._audioContext;
    }

    _cleanupAudioContext() {
        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }
    }

    _playSignal(duration) {
        const context = this._getAudioContext();
        const oscillator = context.createOscillator();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, context.currentTime); // Частота 600 Гц
        oscillator.connect(context.destination);
        oscillator.start();

        setTimeout(() => oscillator.stop(), duration);
    }

    _calculateTiming(speed, symbol) {
        const dotDuration = SPEED_CONFIG.BASE_UNIT / speed;

        const timings = {
            '.': dotDuration,
            '-': dotDuration * SPEED_CONFIG.DASH_MULTIPLIER,
            ' ': dotDuration * SPEED_CONFIG.PAUSE_MULTIPLIERS.INTER_LETTER,
            '/': dotDuration * SPEED_CONFIG.PAUSE_MULTIPLIERS.INTER_WORD,
        };

        return timings[symbol];
    }
}

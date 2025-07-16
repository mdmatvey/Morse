import { SPEED_CONFIG } from './constants.js';

export class MorseAudioPlayer {
    constructor() {
        this._audioContext = null;
    }

    playSequence(sequence, baseDuration, tone, letterPause, groupPause) {
        let delay = 0;
        const durations = {
            '.': baseDuration,
            '-': baseDuration * SPEED_CONFIG.DASH_MULTIPLIER,
        };

        sequence.split('').forEach((symbol, index, array) => {
            const symbolDuration = durations[symbol] || 0;

            if (symbolDuration > 0) {
                setTimeout(() => this._playSignal(symbolDuration, tone), delay);
                delay += symbolDuration + baseDuration;
            }

            if (symbol === ' ') {
                if (array[index + 1] === ' ') {
                    delay += groupPause;
                } else {
                    delay += letterPause;
                }
            }
        });
    }

    _playSignal(duration, tone) {
        const context = this._getAudioContext();
        const oscillator = context.createOscillator();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tone, context.currentTime);
        oscillator.connect(context.destination);
        oscillator.start();

        setTimeout(() => oscillator.stop(), duration);
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
}

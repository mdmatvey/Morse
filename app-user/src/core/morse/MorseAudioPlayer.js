import { SPEED_CONFIG } from './constants.js';

export class MorseAudioPlayer {
    constructor() {
        this._audioContext = null;
        this._oscillator = null;
    }

    playSequence(sequence, baseDuration, tone, letterPause, groupPause) {
        let delay = 0;
        const durations = {
            '.': baseDuration,
            '-': baseDuration * SPEED_CONFIG.DASH_MULTIPLIER,
        };

        sequence.split('').forEach((symbol, idx, arr) => {
            const dur = durations[symbol] || 0;
            if (dur > 0) {
                setTimeout(() => this._playSignal(dur, tone), delay);
                delay += dur + baseDuration;
            }
            if (symbol === ' ') {
                delay += arr[idx + 1] === ' ' ? groupPause : letterPause;
            }
        });
    }

    // Запускаем непрерывный тон
    startContinuous(baseDuration, tone) {
        if (this._oscillator) return;
        const ctx = this._getAudioContext();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        this._oscillator = osc;
    }

    // Останавливаем непрерывный тон
    stopContinuous() {
        if (!this._oscillator) return;
        this._oscillator.stop();
        this._oscillator.disconnect();
        this._oscillator = null;
    }

    _playSignal(duration, tone) {
        const ctx = this._getAudioContext();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), duration);
    }

    _getAudioContext() {
        if (!this._audioContext) {
            this._audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }
        return this._audioContext;
    }
}

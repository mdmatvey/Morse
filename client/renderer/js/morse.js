export function playMorseSound(duration) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
}

export function playMorseSequence(sequence) {
    sequence.split('').forEach((symbol, index) => {
        setTimeout(() => {
            playMorseSound(symbol === '.' ? 100 : 300);
        }, index * 400);
    });
}

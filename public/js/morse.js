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

export function handleMorseInput(event, output) {
    const char = event.key.toLowerCase();
    const morseCode = {
        'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..',
        'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.',
        'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----',
        'щ': '--.-', 'ъ': '.--.-.', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-'
    };

    if (morseCode[char]) {
        output.textContent += morseCode[char];
        playMorseSound(char === '.' ? 100 : 300); // Воспроизводим звук
    }
}

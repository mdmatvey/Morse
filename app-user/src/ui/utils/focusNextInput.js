export function focusNextInput(event) {
    const inputs = document.querySelectorAll('.message-input');
    const currentInput = document.activeElement;

    if (event.code === 'Space') {
        event.preventDefault();

        const currentIndex = Array.from(inputs).indexOf(currentInput);
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        }
    }
}

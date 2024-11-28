// Функция для перехода к следующему инпуту
export function focusNextInput(event) {
    const inputs = document.querySelectorAll('.morse-input');
    const currentInput = document.activeElement;

    // Проверяем, нажата ли клавиша пробела
    if (event.code === 'Space') {
        event.preventDefault(); // Предотвращаем стандартное поведение пробела

        // Переход к следующему инпуту
        const currentIndex = Array.from(inputs).indexOf(currentInput);
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus(); // Фокус на следующий инпут
        }
    }
}

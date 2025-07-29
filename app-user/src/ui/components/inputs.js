export function setupInputHandlers() {
    const inputs = document.querySelectorAll(
        '.operational-fields input, .controls-container input, #serviceInterface textarea',
    );

    inputs.forEach((input) => {
        input.addEventListener('input', (event) => {
            let value = event.target.value;

            // всегда верхний регистр
            event.target.value = value.toUpperCase();

            // для числовых полей убираем всё не-цифровое
            if (input.className.indexOf('number') !== -1) {
                event.target.value = event.target.value.replace(/\D/g, '');
            }
        });
    });
}

export function createInputFields(containerId, groupCount) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (let i = 0; i < groupCount + 1; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Группа ${i + 1}`;
        input.maxLength = 5;
        input.className = 'morse-input message-input';

        input.addEventListener('input', (e) => {
            e.target.value = e.target.value
                .replace(/[^а-яё0-9]/gi, '')
                .toUpperCase();
        });

        container.appendChild(input);
    }
}

export function getInputValues(interfaceMode) {
    const inputsContainer = document.getElementById(
        interfaceMode === 'operational'
            ? 'operationalInterface'
            : 'serviceInterface',
    );

    return Array.from(inputsContainer.querySelectorAll('.message-input'))
        .map((input) => input.value.trim())
        .filter(Boolean)
        .join(' ');
}

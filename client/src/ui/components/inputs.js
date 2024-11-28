export function createInputFields(containerId, groupCount) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (let i = 0; i < groupCount; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Группа ${i + 1}`;
        input.maxLength = 5;
        input.className = 'morse-input';

        input.addEventListener('input', (e) => {
            e.target.value = e.target.value
                .replace(/[^а-яё0-9-]/gi, '')
                .toUpperCase();
        });

        container.appendChild(input);
    }
}

export function getInputValues() {
    return Array.from(document.querySelectorAll('.morse-input'))
        .map((input) => input.value.trim())
        .filter(Boolean)
        .join(' ');
}

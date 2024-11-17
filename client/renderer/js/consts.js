// Длительности
export let DOT_DURATION = 100; // По умолчанию

export const DASH_DURATION_MULTIPLIER = 3;
export const INTRA_LETTER_PAUSE_MULTIPLIER = 1;
export const INTER_LETTER_PAUSE_MULTIPLIER = 3;
export const INTER_WORD_PAUSE_MULTIPLIER = 7;

export function setSpeed(speedGroupsPerMinute) {
    // Расчет длительности точки: 1200 / групп в минуту
    DOT_DURATION = Math.round(750 / speedGroupsPerMinute);
}

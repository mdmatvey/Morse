export function setupWebSocket(userId, recipientId, output, playMorseSequence) {
    const ws = new WebSocket('ws://192.168.0.106:3000');
  
    // Регистрация пользователя
    ws.onopen = () => {
        const registerMessage = JSON.stringify({ type: 'register', id: userId });
        ws.send(registerMessage);
    };
  
    // Обработка сообщений от других клиентов
    ws.onmessage = (event) => {
        const receivedCode = event.data; // Получаем данные как текст
        output.textContent += `\nReceived: ${receivedCode}`;
        playMorseSequence(receivedCode); // Воспроизводим сигнал
    };
  
    // Обработка ошибок подключения
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
  
    return ws;
  }
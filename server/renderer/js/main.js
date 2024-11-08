const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

startButton.addEventListener('click', () => {
  window.ipcRenderer.send('start-server');
  startButton.disabled = true;
  stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
  window.ipcRenderer.send('stop-server');
  startButton.disabled = false;
  stopButton.disabled = true;
});

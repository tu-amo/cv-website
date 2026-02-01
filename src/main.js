import './style.css'
import uiHtml from './ui.html?raw' // Vite raw import
import { WaterScene } from './WaterScene.js'

const app = document.querySelector('#app');

// Inject UI
const uiContainer = document.createElement('div');
uiContainer.innerHTML = uiHtml;
document.body.appendChild(uiContainer);

const waterScene = new WaterScene(app);
const input = document.getElementById('wish-input');
const instruction = document.getElementById('instruction');

// UI Logic
const slider = document.getElementById('depth-slider');

slider.addEventListener('input', (e) => {
  waterScene.setDepth(parseFloat(e.target.value));
});

input.addEventListener('focus', () => {
  instruction.classList.remove('opacity-0');
});

input.addEventListener('blur', () => {
  instruction.classList.add('opacity-0');
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = input.value.trim();
    if (text) {
      waterScene.tossCoin(text);
      input.value = '';
      input.blur(); // Optional: hide keyboard/focus
      // Maybe keep focus for rapid wishing? Let's keep focus.
      input.focus();
    }
  }
});



// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  let timerInterval;
  let isRunning = false;

  const timeInputs = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  const toggleBtn = document.getElementById('toggle');
  const themeToggle = document.getElementById('themeToggle');

  const timerStatus = document.getElementById('timer-status');

  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  function normalizeInputValue(input) {
    const value = parseInt(input.value, 10) || 0;
    const limits = {
      hours: { min: 0, max: 99, next: null },
      minutes: { min: 0, max: 59, next: timeInputs.hours },
      seconds: { min: 0, max: 59, next: timeInputs.minutes },
    };

    const { min, max, next } = limits[input.id];

    if (value < min) {
      input.value = padZero(max);
      if (next) next.value = padZero(Math.max(min, parseInt(next.value, 10) - 1));
    } else if (value > max) {
      input.value = padZero(min);
      if (next) next.value = padZero(Math.min(max, parseInt(next.value, 10) + 1));
    } else {
      input.value = padZero(value);
    }
  }

  function modifyTimeInput(input, delta) {
    if (!isRunning) {
      const currentValue = parseInt(input.value, 10) || 0;
      input.value = padZero(currentValue + delta);
      normalizeInputValue(input);
    }
  }

  function getInputAsSeconds() {
    return (
      parseInt(timeInputs.hours.value, 10) * 3600 +
      parseInt(timeInputs.minutes.value, 10) * 60 +
      parseInt(timeInputs.seconds.value, 10)
    ) || 0;
  }

  function updateInputsFromSeconds(totalSeconds) {
    timeInputs.hours.value = padZero(Math.floor(totalSeconds / 3600));
    timeInputs.minutes.value = padZero(Math.floor((totalSeconds % 3600) / 60));
    timeInputs.seconds.value = padZero(totalSeconds % 60);
  }

  function updateInputsReadOnly() {
    Object.values(timeInputs).forEach(input => {
      input.readOnly = isRunning;
    });
  }

  function updateButtonIcons() {
    toggleBtn.innerHTML = `<i class="bi bi-${isRunning ? 'pause-fill' : 'play-fill'}"></i>`;
    themeToggle.innerHTML = `<i class="bi bi-${document.body.classList.contains('light-theme') ? 'moon-fill' : 'sun-fill'}"></i>`;
  }

  function toggleTimer() {
    const totalSeconds = getInputAsSeconds();

    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      timerStatus.textContent = 'O temporizador foi pausado.';
    } else if (totalSeconds > 0) {
      isRunning = true;
      timerInterval = setInterval(decrementTimer, 1000);
      timerStatus.textContent = 'O temporizador começou.';
    }

    updateInputsReadOnly();
    updateButtonIcons();
  }

  function decrementTimer() {
    let totalSeconds = getInputAsSeconds();
    if (totalSeconds > 0) {
      totalSeconds--;
      updateInputsFromSeconds(totalSeconds);

      if (totalSeconds === 0) {
        clearInterval(timerInterval);
        isRunning = false;
        updateInputsReadOnly();
        updateButtonIcons();
        launchConfetti();
        timerStatus.textContent = 'O tempo acabou.'; // Anuncia que o tempo acabou
      }
    }
  }

  Object.values(timeInputs).forEach((input, index, inputsArray) => {
    let startY;
    let isSwiping = false; // Diferencia toque e deslize
    input.addEventListener('wheel', e => {
      e.preventDefault();
      modifyTimeInput(input, e.deltaY > 0 ? 1 : -1);
    });
    input.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      isSwiping = false; // Reset the flag
    });
    input.addEventListener('touchmove', e => {
      if (isRunning) return; // Prevent swipe when timer is running

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY; // Positive for upward swipe, negative for downward

      // Only consider it a swipe if the movement is significant
      if (Math.abs(deltaY) > 10) { // Threshold for swipe detection
        isSwiping = true;
        e.preventDefault(); // Prevent scrolling the page
        modifyTimeInput(input, deltaY > 0 ? 1 : -1);
        startY = currentY; // Update startY to allow continuous swiping
      }
    }, { passive: false }); // Use { passive: false } to allow preventDefault
    input.addEventListener('touchend', e => {
      if (isSwiping) {
        e.preventDefault(); // Prevent the input from gaining focus after a swipe
      }
      isSwiping = false; // Reset the flag
    });
    input.addEventListener('keydown', e => {
      if (!isRunning) {
        switch (e.key) {
          case 'ArrowUp': modifyTimeInput(input, 1); break;
          case 'ArrowDown': modifyTimeInput(input, -1); break;
          case 'ArrowLeft':
            inputsArray[(index - 1 + inputsArray.length) % inputsArray.length].focus();
            break;
          case 'ArrowRight':
            inputsArray[(index + 1) % inputsArray.length].focus();
            break;
        }
      }
    });

    input.addEventListener('blur', () => normalizeInputValue(input));
    input.addEventListener('focus', () => input.select());
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.target.matches('input')) e.target.blur();
      toggleTimer();
    }
  });

  toggleBtn.addEventListener('click', toggleTimer);

  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const newColor = isLight ? '#000' : '#fff';

    const circle = document.createElement('div');
    circle.classList.add('theme-transition-circle');
    circle.style.backgroundColor = newColor;

    const diameter = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) * 2;
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;

    const rect = themeToggle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    circle.style.left = `${centerX}px`;
    circle.style.top = `${centerY}px`;
    circle.style.marginLeft = `-${diameter / 2}px`;
    circle.style.marginTop = `-${diameter / 2}px`;

    document.body.appendChild(circle);
    circle.offsetWidth;
    circle.classList.add('animate');

    setTimeout(() => {
      document.body.classList.toggle('light-theme');
      updateButtonIcons();
      document.body.focus();
    }, 300);

    circle.addEventListener('animationend', () => circle.remove());
  });

  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FFC107', '#FF5722', '#8BC34A', '#00BCD4', '#E91E63'];

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');
      piece.style.animationDelay = `${Math.random()}s`;
      const side = Math.random() > 0.5 ? 'left' : 'right';
      piece.style.left = side === 'left' ? '0' : '100%';
      piece.style.setProperty('--xShift', `${(Math.random() * 50 + 20) * (side === 'left' ? 1 : -1)}vw`);
      piece.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
      piece.style.setProperty('--yPeak', `-${Math.random() * 30 + 10}vh`);
      piece.style.top = `${Math.floor(Math.random() * window.innerHeight)}px`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(piece);
    }

    setTimeout(() => (container.innerHTML = ''), 2000);
  }

  updateButtonIcons();
});

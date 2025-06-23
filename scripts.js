// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  let timerInterval;
  let isRunning = false;
  let isSoundEnabled = true;

  const timeInputs = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  const toggleBtn = document.getElementById('toggle');
  const timerStatus = document.getElementById('timer-status');
  const timerEndSound = document.getElementById('timerEndSound');

  // Elementos do Menu de Configurações
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPopup = document.getElementById('settingsPopup');
  const themeSetting = document.getElementById('themeSetting');
  const soundSetting = document.getElementById('soundSetting');
  const soundSettingText = document.getElementById('soundSettingText');
  const soundOnIcon = document.querySelector('.sound-on-icon');
  const soundOffIcon = document.querySelector('.sound-off-icon');

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
        if (isSoundEnabled) {
          timerEndSound.play();
        }
        document.body.focus();
        timerStatus.textContent = 'O tempo acabou.';
      }
    }
  }

  // Lógica de manipulação dos inputs de tempo
  Object.values(timeInputs).forEach((input, index, inputsArray) => {
    let startY;
    let isSwiping = false;
    input.addEventListener('wheel', e => {
      e.preventDefault();
      modifyTimeInput(input, e.deltaY > 0 ? -1 : 1);
    });
    input.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      isSwiping = false;
    });
    input.addEventListener('touchmove', e => {
      if (isRunning) return;
      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      if (Math.abs(deltaY) > 10) {
        isSwiping = true;
        e.preventDefault();
        modifyTimeInput(input, deltaY > 0 ? 1 : -1);
        startY = currentY;
      }
    }, { passive: false });
    input.addEventListener('touchend', e => {
      if (isSwiping) e.preventDefault();
      isSwiping = false;
    });
    input.addEventListener('keydown', e => {
      if (!isRunning) {
        switch (e.key) {
          case 'ArrowUp': modifyTimeInput(input, 1); break;
          case 'ArrowDown': modifyTimeInput(input, -1); break;
          case 'ArrowLeft': inputsArray[(index - 1 + inputsArray.length) % inputsArray.length].focus(); break;
          case 'ArrowRight': inputsArray[(index + 1) % inputsArray.length].focus(); break;
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
    if (e.key === 'Escape' && settingsPopup.classList.contains('open')) {
        closeSettings();
    }
  });

  toggleBtn.addEventListener('click', toggleTimer);

  // Lógica do menu de configurações
  function openSettings() {
    settingsPopup.classList.add('open');
    settingsBtn.classList.add('rotated');
  }

  function closeSettings() {
    settingsPopup.classList.remove('open');
    settingsBtn.classList.remove('rotated');
  }

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (settingsPopup.classList.contains('open')) {
      closeSettings();
    } else {
      openSettings();
    }
  });

  document.addEventListener('click', (e) => {
    if (settingsPopup.classList.contains('open') && !settingsPopup.contains(e.target) && !settingsBtn.contains(e.target)) {
      closeSettings();
    }
  });

  // Ajuste: Troca de Tema
  themeSetting.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-theme');
    const newColor = isLight ? '#000' : '#fff';
    const circle = document.createElement('div');
    circle.classList.add('theme-transition-circle');
    circle.style.backgroundColor = newColor;

    const maxDiameter = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    circle.style.width = `${maxDiameter}px`;
    circle.style.height = `${maxDiameter}px`;
    
    const rect = settingsBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    circle.style.left = `${centerX}px`;
    circle.style.top = `${centerY}px`;
    circle.style.marginLeft = `-${maxDiameter / 2}px`;
    circle.style.marginTop = `-${maxDiameter / 2}px`;

    document.body.appendChild(circle);
    circle.offsetWidth;
    circle.classList.add('animate');

    setTimeout(() => {
      document.body.classList.toggle('light-theme');
      document.body.focus();
    }, 300);

    circle.addEventListener('animationend', () => circle.remove());
  });
  
  // Ajuste: Ligar/Desligar Som
  soundSetting.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    updateSoundUI();
  });

  function updateSoundUI() {
      soundSettingText.textContent = isSoundEnabled ? 'Som ligado' : 'Som desligado';
      soundOnIcon.style.display = isSoundEnabled ? 'flex' : 'none';
      soundOffIcon.style.display = isSoundEnabled ? 'none' : 'flex';
  }


  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FFC107', '#FF5722', '#8BC34A', '#00BCD4', '#E91E63'];
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');
      piece.style.animationDelay = `${Math.random()}s`;
      const side = Math.random() > 0.5 ? 'left' : 'right';

      if (side === 'left') {
        piece.style.left = '0';
        piece.style.right = 'auto';
        piece.style.transformOrigin = 'left center';
      } else {
        piece.style.right = '0';
        piece.style.left = 'auto';
        piece.style.transformOrigin = 'right center';
      }

      piece.style.top = `${Math.random() * containerHeight}px`;
      const xDistance = (Math.random() * 0.4 + 0.8) * containerWidth;
      const xDirection = side === 'left' ? 1 : -1;
      piece.style.setProperty('--xShift', `${xDistance * xDirection}px`);
      const yInitialUp = -(Math.random() * containerHeight * 0.2 + 20);
      piece.style.setProperty('--yPeak', `${yInitialUp}px`);
      const yDrop = (Math.random() * 0.5 + 1) * containerHeight;
      piece.style.setProperty('--yDrop', `${yDrop}px`);
      piece.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(piece);
    }

    setTimeout(() => (container.innerHTML = ''), 2000);
  }
  
  // Inicialização da UI
  updateButtonIcons();
  updateSoundUI();
});
// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  let timerInterval;
  let isRunning = false;
  let isSoundEnabled; // Não inicialize aqui, será carregado do localStorage

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

  // ============== FUNÇÕES DE LOCAL STORAGE PARA CONFIGURAÇÕES ==============
  /**
   * Salva as configurações atuais de som e tema no localStorage.
   */
  function saveSettings() {
    localStorage.setItem('isSoundEnabled', isSoundEnabled); // Salva o estado do som como string 'true' ou 'false'
    localStorage.setItem('isLightTheme', document.body.classList.contains('light-theme')); // Salva o tema como string 'true' ou 'false'
    console.log('Configurações salvas:', {
      isSoundEnabled: isSoundEnabled,
      isLightTheme: document.body.classList.contains('light-theme')
    });
  }

  /**
   * Carrega as configurações de som e tema do localStorage e aplica-as à UI.
   */
  function loadSettings() {
    // Carrega o estado do som
    const storedSoundEnabled = localStorage.getItem('isSoundEnabled');
    if (storedSoundEnabled !== null) {
      isSoundEnabled = (storedSoundEnabled === 'true'); // Converte a string de volta para boolean
    } else {
      isSoundEnabled = true; // Define o estado padrão se nada for encontrado no localStorage
    }

    // Carrega o tema
    const storedLightTheme = localStorage.getItem('isLightTheme');
    if (storedLightTheme === 'true') {
      document.body.classList.add('light-theme');
    } else if (storedLightTheme === 'false') {
      document.body.classList.remove('light-theme');
    }
    // Se storedLightTheme for null, o tema padrão do CSS (escuro) será aplicado, o que é o comportamento esperado.

    console.log('Configurações carregadas:', {
      isSoundEnabled: isSoundEnabled,
      isLightTheme: document.body.classList.contains('light-theme')
    });
    // **IMPORTANTE:** Atualiza a UI com as configurações carregadas após o carregamento.
    updateSoundUI(); // Isso também chamará saveSettings(), mas está ok para garantir a consistência visual inicial.
  }

  // **CHAMADA:** Chame loadSettings() ao carregar a página para aplicar as configurações salvas.
  loadSettings();
  // ======================================================================

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
      return min;
    }
    if (value > max) {
      if (input.id !== 'hours' && next) {
        const overflow = Math.floor(value / (max + 1));
        const remaining = value % (max + 1);
        let nextValue = parseInt(next.value, 10) + overflow;
        next.value = padZero(nextValue);
        return remaining;
      }
      return max;
    }
    return value;
  }

  function modifyTimeInput(input, delta) {
    if (!isRunning) {
      const currentValue = parseInt(input.value, 10) || 0;
      let newValue = currentValue + delta;

      const limits = {
        hours: { min: 0, max: 99 },
        minutes: { min: 0, max: 59 },
        seconds: { min: 0, max: 59 },
      };
      const { min, max } = limits[input.id];

      if (newValue > max) {
        newValue = min;
      } else if (newValue < min) {
        newValue = max;
      }
      input.value = padZero(newValue);
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
    toggleBtn.setAttribute('aria-label', isRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro');
  }

  function toggleTimer() {
    const totalSeconds = getInputAsSeconds();

    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      timerStatus.textContent = 'O temporizador foi pausado.';
    } else if (totalSeconds > 0) {
      isRunning = true;
      timerStatus.textContent = 'O temporizador começou.';
      timerInterval = setInterval(decrementTimer, 1000);
    } else {
        timerStatus.textContent = "Defina um tempo válido para iniciar.";
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
        // Resetar inputs após o fim do temporizador
        timeInputs.hours.value = '00';
        timeInputs.minutes.value = '00';
        timeInputs.seconds.value = '00';
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
          case 'ArrowUp':
            e.preventDefault();
            modifyTimeInput(input, 1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            modifyTimeInput(input, -1);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            const prevInput = inputsArray[(index - 1 + inputsArray.length) % inputsArray.length];
            prevInput.focus();
            prevInput.select();
            break;
          case 'ArrowRight':
            e.preventDefault();
            const nextInput = inputsArray[(index + 1) % inputsArray.length];
            nextInput.focus();
            nextInput.select();
            break;
          case 'Enter':
            e.preventDefault();
            input.blur();
            toggleTimer();
            break;
          case 'Backspace':
          case 'Delete':
            setTimeout(() => {
              if (input.value === '' || isNaN(parseInt(input.value, 10))) {
                input.value = '00';
              }
            }, 0);
            break;
          default:
            if (!/^\d$/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
            }
        }
      }
    });
    input.addEventListener('blur', () => {
      input.value = padZero(normalizeInputValue(input));
    });
    input.addEventListener('focus', () => {
      input.select();
    });
    input.addEventListener('input', () => {
        if (input.value.length === 2 && input.id !== 'hours') {
            const nextInput = inputsArray[(index + 1) % inputsArray.length];
            nextInput.focus();
            nextInput.select();
        }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
      }
      toggleTimer();
    }
    // **CORRIGIDO:** Usar 'open' para verificar o estado do pop-up.
    if (e.key === 'Escape' && settingsPopup.classList.contains('open')) {
      closeSettings();
    }
  });

  toggleBtn.addEventListener('click', toggleTimer);

  // Lógica do menu de configurações
  function openSettings() {
    settingsPopup.classList.add('open'); // **CORRIGIDO:** Usar 'open'
    settingsBtn.classList.add('rotated'); // **CORRIGIDO:** Usar 'rotated'
    settingsBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSettings() {
    settingsPopup.classList.remove('open'); // **CORRIGIDO:** Usar 'open'
    settingsBtn.classList.remove('rotated'); // **CORRIGIDO:** Usar 'rotated'
    settingsBtn.setAttribute('aria-expanded', 'false');
  }

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // **CORRIGIDO:** Usar 'open' para verificar o estado do pop-up.
    if (settingsPopup.classList.contains('open')) {
      closeSettings();
    } else {
      openSettings();
    }
  });

  // Fechar pop-up ao clicar fora
  document.addEventListener('click', (e) => {
    // **CORRIGIDO:** Usar 'open' para verificar o estado do pop-up.
    if (settingsPopup.classList.contains('open') && !settingsPopup.contains(e.target) && !settingsBtn.contains(e.target)) {
      closeSettings();
    }
  });

  // Ajuste: Troca de Tema
  themeSetting.addEventListener('click', (event) => {
    const transitionCircle = document.createElement('div');
    transitionCircle.classList.add('theme-transition-circle');
    document.body.appendChild(transitionCircle);

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    const radius = Math.sqrt(Math.pow(maxDim, 2) + Math.pow(maxDim, 2));

    transitionCircle.style.width = `${radius * 2}px`;
    transitionCircle.style.height = `${radius * 2}px`;
    transitionCircle.style.left = `${centerX - radius}px`;
    transitionCircle.style.top = `${centerY - radius}px`;

    const isCurrentlyLight = document.body.classList.contains('light-theme');
    transitionCircle.style.backgroundColor = isCurrentlyLight ? 'var(--color-bg-dark)' : 'var(--color-bg-light)';

    requestAnimationFrame(() => {
      transitionCircle.classList.add('animate');
    });

    setTimeout(() => {
      document.body.classList.toggle('light-theme');
      saveSettings(); // Salva o estado do tema no localStorage
      document.body.focus();
    }, 100);

    // **CORRIGIDO:** Usar 'transitionCircle' em vez de 'circle'
    transitionCircle.addEventListener('animationend', () => transitionCircle.remove());
  });

  // Ajuste: Ligar/Desligar Som
  soundSetting.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    updateSoundUI();
    saveSettings(); // Salva o estado do som no localStorage
  });

  function updateSoundUI() {
    soundSettingText.textContent = isSoundEnabled ? 'Som ligado' : 'Som desligado';
    if (soundOnIcon) soundOnIcon.style.display = isSoundEnabled ? 'inline-block' : 'none';
    if (soundOffIcon) soundOffIcon.style.display = isSoundEnabled ? 'none' : 'inline-block';
  }


  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FFC107', '#FF5722', '#8BC34A', '#00BCD4', '#E91E63'];
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    container.innerHTML = '';

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

  // Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // Inicialização da UI (updateSoundUI já é chamada por loadSettings)
  updateButtonIcons();
});
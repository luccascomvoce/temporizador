// scripts.js

const TimerManager = {
  // Propriedades de estado
  timerInterval: null,
  isRunning: false,
  isSoundEnabled: true,
  startY: 0,
  
  // Referências DOM
  timeInputs: null,
  toggleBtn: null,
  timerStatus: null,
  timerEndSound: null,
  settingsBtn: null,
  settingsPopup: null,
  themeSetting: null,
  soundSetting: null,
  soundSettingText: null,
  soundOnIcon: null,
  soundOffIcon: null,

  // Inicialização principal
  init() {
    this.setupDOMReferences();
    this.loadSettings();
    this.setupEventListeners();
    this.registerServiceWorker();
    this.updateUI();
  },

  // Configurar referências DOM
  setupDOMReferences() {
    this.timeInputs = {
      hours: document.getElementById('hours'),
      minutes: document.getElementById('minutes'),
      seconds: document.getElementById('seconds')
    };
    
    this.toggleBtn = document.getElementById('toggle');
    this.timerStatus = document.getElementById('timer-status');
    this.timerEndSound = document.getElementById('timerEndSound');
    
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsPopup = document.getElementById('settingsPopup');
    this.themeSetting = document.getElementById('themeSetting');
    this.soundSetting = document.getElementById('soundSetting');
    this.soundSettingText = document.getElementById('soundSettingText');
    this.soundOnIcon = document.querySelector('.sound-on-icon');
    this.soundOffIcon = document.querySelector('.sound-off-icon');
  },

  // Configurar event listeners
  setupEventListeners() {
    // Eventos para inputs de tempo
    Object.values(this.timeInputs).forEach((input, index, inputsArray) => {
      let isSwiping = false;
      
      input.addEventListener('wheel', e => {
        e.preventDefault();
        this.modifyInput(input, e.deltaY > 0 ? -1 : 1);
      });
      
      input.addEventListener('touchstart', e => {
        this.startY = e.touches[0].clientY;
        isSwiping = false;
      });
      
      input.addEventListener('touchmove', e => {
        if (this.isRunning) return;
        const currentY = e.touches[0].clientY;
        const deltaY = this.startY - currentY;
        if (Math.abs(deltaY) > 10) {
          isSwiping = true;
          e.preventDefault();
          this.modifyInput(input, deltaY > 0 ? 1 : -1);
          this.startY = currentY;
        }
      }, { passive: false });
      
      input.addEventListener('touchend', e => {
        if (isSwiping) e.preventDefault();
      });
      
      input.addEventListener('keydown', e => {
        if (!this.isRunning) {
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              this.modifyInput(input, 1);
              break;
            case 'ArrowDown':
              e.preventDefault();
              this.modifyInput(input, -1);
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
              this.toggleTimer();
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
        input.value = this.padZero(this.normalizeInput(input));
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
    
    // Eventos globais de teclado
    document.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
        }
        this.toggleTimer();
      }
      
      if (e.key === 'Escape' && this.settingsPopup.classList.contains('open')) {
        this.closeSettings();
      }
    });
    
    // Eventos de botões
    this.toggleBtn.addEventListener('click', () => this.toggleTimer());
    
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.settingsPopup.classList.contains('open')) {
        this.closeSettings();
      } else {
        this.openSettings();
      }
    });
    
    document.addEventListener('click', (e) => {
      if (this.settingsPopup.classList.contains('open') && 
          !this.settingsPopup.contains(e.target) && 
          !this.settingsBtn.contains(e.target)) {
        this.closeSettings();
      }
    });
    
    this.themeSetting.addEventListener('click', (event) => this.toggleTheme(event));
    this.soundSetting.addEventListener('click', () => this.toggleSound());
  },
  
  // Utilitários
  padZero(num) {
    return num.toString().padStart(2, '0');
  },
  
  normalizeInput(input) {
    const value = parseInt(input.value, 10) || 0;
    const limits = {
      hours: { min: 0, max: 99, next: null },
      minutes: { min: 0, max: 59, next: this.timeInputs.hours },
      seconds: { min: 0, max: 59, next: this.timeInputs.minutes },
    };

    const { min, max, next } = limits[input.id];

    if (value < min) return min;
    if (value > max) {
      if (input.id !== 'hours' && next) {
        const overflow = Math.floor(value / (max + 1));
        const remaining = value % (max + 1);
        let nextValue = parseInt(next.value, 10) + overflow;
        next.value = this.padZero(nextValue);
        return remaining;
      }
      return max;
    }
    return value;
  },
  
  // Controles de tempo
  modifyInput(input, delta) {
    if (!this.isRunning) {
      const currentValue = parseInt(input.value, 10) || 0;
      let newValue = currentValue + delta;

      const limits = {
        hours: { min: 0, max: 99 },
        minutes: { min: 0, max: 59 },
        seconds: { min: 0, max: 59 },
      };
      const { min, max } = limits[input.id];

      if (newValue > max) newValue = min;
      else if (newValue < min) newValue = max;
      
      input.value = this.padZero(newValue);
    }
  },
  
  getTotalSeconds() {
    return (
      parseInt(this.timeInputs.hours.value, 10) * 3600 +
      parseInt(this.timeInputs.minutes.value, 10) * 60 +
      parseInt(this.timeInputs.seconds.value, 10)
    ) || 0;
  },
  
  updateInputsFromSeconds(totalSeconds) {
    this.timeInputs.hours.value = this.padZero(Math.floor(totalSeconds / 3600));
    this.timeInputs.minutes.value = this.padZero(Math.floor((totalSeconds % 3600) / 60));
    this.timeInputs.seconds.value = this.padZero(totalSeconds % 60);
  },
  
  // Controles do temporizador
  toggleTimer() {
    const totalSeconds = this.getTotalSeconds();

    if (this.isRunning) {
      clearInterval(this.timerInterval);
      this.isRunning = false;
      this.timerStatus.textContent = 'O temporizador foi pausado.';
    } else if (totalSeconds > 0) {
      this.isRunning = true;
      this.timerStatus.textContent = 'O temporizador começou.';
      this.timerInterval = setInterval(() => this.decrement(), 1000);
    } else {
      this.timerStatus.textContent = "Defina um tempo válido para iniciar.";
    }

    this.updateUI();
  },
  
  decrement() {
    let totalSeconds = this.getTotalSeconds();
    if (totalSeconds > 0) {
      totalSeconds--;
      this.updateInputsFromSeconds(totalSeconds);

      if (totalSeconds === 0) {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.launchConfetti();
        
        if (this.isSoundEnabled) {
          this.timerEndSound.play();
        }
        
        document.body.focus();
        this.timerStatus.textContent = 'O tempo acabou.';
        
        // Resetar inputs após o término
        setTimeout(() => {
          this.timeInputs.hours.value = '00';
          this.timeInputs.minutes.value = '00';
          this.timeInputs.seconds.value = '00';
          this.updateUI();
        }, 2000);
      }
    }
  },
  
  // Gerenciamento de UI
  updateUI() {
    this.updateInputState();
    this.updateControls();
    this.updateSoundUI();
  },
  
  updateInputState() {
    Object.values(this.timeInputs).forEach(input => {
      input.readOnly = this.isRunning;
    });
  },
  
  updateControls() {
    this.toggleBtn.innerHTML = `<i class="bi bi-${this.isRunning ? 'pause-fill' : 'play-fill'}"></i>`;
    this.toggleBtn.setAttribute('aria-label', this.isRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro');
  },
  
  // Configurações
  saveSettings() {
    localStorage.setItem('isSoundEnabled', this.isSoundEnabled);
    localStorage.setItem('isLightTheme', document.body.classList.contains('light-theme'));
  },
  
  loadSettings() {
    // Carregar configuração de som
    const storedSoundEnabled = localStorage.getItem('isSoundEnabled');
    if (storedSoundEnabled !== null) {
      this.isSoundEnabled = (storedSoundEnabled === 'true');
    }
    
    // Carregar configuração de tema
    const storedLightTheme = localStorage.getItem('isLightTheme');
    if (storedLightTheme === 'true') {
      document.body.classList.add('light-theme');
    } else if (storedLightTheme === 'false') {
      document.body.classList.remove('light-theme');
    }
    
    this.updateSoundUI();
  },
  
  toggleSound() {
    this.isSoundEnabled = !this.isSoundEnabled;
    this.updateSoundUI();
    this.saveSettings();
  },
  
  updateSoundUI() {
    this.soundSettingText.textContent = this.isSoundEnabled ? 'Som ligado' : 'Som desligado';
    if (this.soundOnIcon) this.soundOnIcon.style.display = this.isSoundEnabled ? 'inline-block' : 'none';
    if (this.soundOffIcon) this.soundOffIcon.style.display = this.isSoundEnabled ? 'none' : 'inline-block';
  },
  
  toggleTheme(event) {
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
      this.saveSettings();
      document.body.focus();
    }, 100);

    transitionCircle.addEventListener('animationend', () => transitionCircle.remove());
  },
  
  // Menu de configurações
  openSettings() {
    this.settingsPopup.classList.add('open');
    this.settingsBtn.classList.add('rotated');
    this.settingsBtn.setAttribute('aria-expanded', 'true');
  },
  
  closeSettings() {
    this.settingsPopup.classList.remove('open');
    this.settingsBtn.classList.remove('rotated');
    this.settingsBtn.setAttribute('aria-expanded', 'false');
  },
  
  // Efeitos
  launchConfetti() {
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
  },
  
  // Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => TimerManager.init());
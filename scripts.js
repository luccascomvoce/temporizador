document.addEventListener('DOMContentLoaded', function() {
  // Variáveis de controle do temporizador
  let timerInterval;
  let isRunning = false;

  // Referências aos elementos do DOM agrupadas em um objeto
  const timeInputs = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  const toggleBtn = document.getElementById('toggle');
  const themeToggle = document.getElementById('themeToggle');

  // Inicializa os ícones dos botões imediatamente após o carregamento
  toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
  themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';

  /**
   * Adiciona zeros à esquerda para manter sempre 2 dígitos.
   */
  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * Normaliza os valores dos inputs com base em seus limites máximos e mínimos.
   * @param {HTMLElement} input - O elemento de input a ser normalizado.
   */
  function normalizeInputValue(input) {
    let currentValue = parseInt(input.value, 10) || 0;
    const limits = {
      hours: { min: 0, max: 99, next: null },
      minutes: { min: 0, max: 59, next: timeInputs.hours },
      seconds: { min: 0, max: 59, next: timeInputs.minutes },
    };

    const { min, max, next } = limits[input.id];

    if (currentValue < min) {
      input.value = pad(max);
      if (next) next.value = pad(Math.max(min, parseInt(next.value, 10) - 1));
    } else if (currentValue > max) {
      input.value = pad(min);
      if (next) next.value = pad(Math.min(max, parseInt(next.value, 10) + 1));
    } else {
      input.value = pad(currentValue);
    }
  }

  /**
   * Modifica um input de tempo em função de um delta positivo ou negativo.
   * @param {HTMLElement} input - O campo de tempo a ser modificado.
   * @param {number} delta - O valor a ser adicionado ou subtraído.
   */
  function modifyTimeInput(input, delta) {
    if (!isRunning) {
      let currentValue = parseInt(input.value, 10) || 0;
      input.value = pad(currentValue + delta);
      normalizeInputValue(input);
    }
  }

  // Adiciona event listeners para os métodos de alteração de tempo
  Object.values(timeInputs).forEach(input => {
    // Listener de roda do mouse
    input.addEventListener('wheel', function(event) {
      event.preventDefault();
      modifyTimeInput(this, event.deltaY > 0 ? 1 : -1);
    });

    // Listener de setas do teclado
    input.addEventListener('keydown', function(event) {
      if (event.key === "ArrowUp") modifyTimeInput(this, 1);
      else if (event.key === "ArrowDown") modifyTimeInput(this, -1);
    });

    // Listener de perda de foco (blur)
    input.addEventListener('blur', function() {
      normalizeInputValue(this);
    });

    // Listener de foco (focus) para selecionar automaticamente o conteúdo
    input.addEventListener('focus', function() {
      this.select();
    });
  });

  /**
   * Recupera o tempo total (em segundos) com base nos valores dos inputs.
   */
  function getTotalSeconds() {
    return (
      parseInt(timeInputs.hours.value, 10) * 3600 +
      parseInt(timeInputs.minutes.value, 10) * 60 +
      parseInt(timeInputs.seconds.value, 10)
    ) || 0;
  }

  /**
   * Atualiza os inputs com base no total de segundos fornecido.
   */
  function setInputsFromTotal(totalSeconds) {
    timeInputs.hours.value = pad(Math.floor(totalSeconds / 3600));
    timeInputs.minutes.value = pad(Math.floor((totalSeconds % 3600) / 60));
    timeInputs.seconds.value = pad(totalSeconds % 60);
  }

  /**
   * Controla se os inputs dos dígitos estão editáveis ou não,
   * conforme o estado do temporizador.
   */
  function updateInputsReadOnly() {
    Object.values(timeInputs).forEach(input => input.readOnly = isRunning);
  }

  /**
   * Função executada a cada segundo para atualizar a contagem.
   */
  function tick() {
    let totalSeconds = getTotalSeconds();
  
    if (totalSeconds > 0) {
      totalSeconds--; // Decrementa imediatamente
      setInputsFromTotal(totalSeconds);
  
      if (totalSeconds === 0) {
        // Assim que chegar em zero, para o temporizador e exibe os confetes
        clearInterval(timerInterval);
        isRunning = false;
        toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        updateInputsReadOnly();
        launchConfetti();
      }
    }
  }

  /**
   * Evento de clique para o botão play/pause.
   */
  toggleBtn.addEventListener('click', function() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      updateInputsReadOnly();
    } else {
      let totalSeconds = getTotalSeconds();
      if (totalSeconds > 0) {
        isRunning = true;
        updateInputsReadOnly();
        toggleBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        timerInterval = setInterval(tick, 1000);
      }
    }
  });

  /**
   * Lógica para alternância entre temas.
   */
  themeToggle.addEventListener('click', function() {
    const isLight = document.body.classList.toggle('light-theme');
    themeToggle.innerHTML = `<i class="bi bi-${isLight ? 'moon-fill' : 'sun-fill'}"></i>`;
  });

  /**
   * Função para lançar os confetes.
   */
  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const numberOfPieces = 100;
    const colors = ['#FFC107', '#FF5722', '#8BC34A', '#00BCD4', '#E91E63'];

    for (let i = 0; i < numberOfPieces; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');
      piece.style.animationDelay = Math.random() + "s";

      const side = Math.random() > 0.5 ? "left" : "right";
      piece.style.left = side === "left" ? "0" : "100%";
      const xShift = (Math.random() * 50 + 20) * (side === "left" ? 1 : -1) + "vw";
      piece.style.setProperty('--xShift', xShift);
      piece.style.setProperty('--rotation', (Math.random() * 720 - 360) + "deg");
      piece.style.top = Math.floor(Math.random() * window.innerHeight) + "px";
      piece.style.setProperty('--yPeak', "-" + (Math.random() * 30 + 10) + "vh");
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(piece);
    }

    setTimeout(() => container.innerHTML = "", 2000);
  }
});
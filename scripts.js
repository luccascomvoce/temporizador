document.addEventListener('DOMContentLoaded', function() {
  // Variáveis de controle do temporizador
  let timerInterval;
  let isRunning = false;

  // Referências aos elementos do DOM
  const hoursInput = document.getElementById('hours');
  const minutesInput = document.getElementById('minutes');
  const secondsInput = document.getElementById('seconds');
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
  const currentValue = parseInt(input.value, 10) || 0;

  if (input.id === "seconds") {
    if (currentValue < 0) {
      input.value = pad(59); // Reinicia para 59
      const minutesValue = parseInt(minutesInput.value, 10) || 0;
      minutesInput.value = pad(Math.max(0, minutesValue - 1)); // Diminui minutos
    } else if (currentValue > 59) {
      input.value = pad(0); // Reinicia para 0
      const minutesValue = parseInt(minutesInput.value, 10) || 0;
      minutesInput.value = pad(Math.min(59, minutesValue + 1)); // Aumenta minutos
    } else {
      input.value = pad(currentValue); // Formata o valor
    }
  } else if (input.id === "minutes") {
    if (currentValue < 0) {
      input.value = pad(59); // Reinicia para 59
      const hoursValue = parseInt(hoursInput.value, 10) || 0;
      hoursInput.value = pad(Math.max(0, hoursValue - 1)); // Diminui horas
    } else if (currentValue > 59) {
      input.value = pad(0); // Reinicia para 0
      const hoursValue = parseInt(hoursInput.value, 10) || 0;
      hoursInput.value = pad(Math.min(99, hoursValue + 1)); // Aumenta horas
    } else {
      input.value = pad(currentValue); // Formata o valor
    }
  } else if (input.id === "hours") {
    input.value = pad(Math.min(99, Math.max(0, currentValue))); // Limita entre 0 e 99
  }
}

[hoursInput, minutesInput, secondsInput].forEach(input => {
  input.addEventListener('wheel', function(event) {
    if (!isRunning) { // Só permite a rolagem enquanto o temporizador estiver pausado
      event.preventDefault(); // Evita o comportamento padrão de rolagem da página

      let currentValue = parseInt(this.value, 10) || 0; // Valor atual do input

      // Determina se a rolagem foi para cima ou para baixo
      if (event.deltaY < 0) {
        currentValue -= 1; // Rolagem para cima: diminui 1
      } else if (event.deltaY > 0) {
        currentValue += 1; // Rolagem para baixo: aumenta 1
      }

      // Atualiza o valor do input
      this.value = pad(currentValue);

      // Chama a função de normalização para garantir os limites corretos
      normalizeInputValue(this);
    }
  });
});

[hoursInput, minutesInput, secondsInput].forEach(input => {
  input.addEventListener('keydown', function(event) {
    if (!isRunning) {
      let currentValue = parseInt(this.value, 10) || 0;

      if (event.key === "ArrowUp") {
        // Seta para cima: aumenta 1
        currentValue += 1;
      } else if (event.key === "ArrowDown") {
        // Seta para baixo: diminui 1
        currentValue -= 1;
      } else {
        return; // Ignora outras teclas
      }

      this.value = pad(currentValue); // Atualiza o valor
      normalizeInputValue(this); // Normaliza o valor com base nas regras
    }
  });
});

  // Evento para formatar os inputs assim que perdem o foco,
  // garantindo que valores como "5" sejam exibidos como "05"
  [hoursInput, minutesInput, secondsInput].forEach(input => {
    input.addEventListener('blur', function() {
      const value = parseInt(this.value, 10);
      this.value = !isNaN(value) ? pad(value) : "00";
      normalizeInputValue(this);
    });
  });

  // Evento para selecionar automaticamente o conteúdo do input ao focá-lo
  [hoursInput, minutesInput, secondsInput].forEach(input => {
    input.addEventListener('focus', function() {
      this.select();
    });
  });

  /**
   * Recupera o tempo total (em segundos) com base nos valores dos inputs.
   */
  function getTotalSeconds() {
    const hours = parseInt(hoursInput.value, 10) || 0;
    const minutes = parseInt(minutesInput.value, 10) || 0;
    const seconds = parseInt(secondsInput.value, 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Atualiza os inputs com base no total de segundos fornecido.
   */
  function setInputsFromTotal(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    hoursInput.value = pad(hrs);
    minutesInput.value = pad(mins);
    secondsInput.value = pad(secs);
  }

  /**
   * Controla se os inputs dos dígitos estão editáveis ou não,
   * conforme o estado do temporizador.
   */
  function updateInputsReadOnly() {
    hoursInput.readOnly = isRunning;
    minutesInput.readOnly = isRunning;
    secondsInput.readOnly = isRunning;
  }

  /**
   * Função executada a cada segundo para atualizar a contagem.
   */
  function tick() {
    let totalSeconds = getTotalSeconds();
    if (totalSeconds > 0) {
      totalSeconds--;
      setInputsFromTotal(totalSeconds);
      if (totalSeconds === 0) {
        clearInterval(timerInterval);
        isRunning = false;
        toggleBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        updateInputsReadOnly();
        launchConfetti(); // Chama os confetes imediatamente ao chegar em 00:00:00
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
   * - Se o tema for escuro (padrão), o botão mostra o ícone do sol.
   * - Se o tema for claro (body com "light-theme"), o botão mostra o ícone da lua.
   */
  themeToggle.addEventListener('click', function() {
    if (document.body.classList.contains('light-theme')) {
      document.body.classList.remove('light-theme');
      themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
      document.body.classList.add('light-theme');
      themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
    }
  });

  /**
   * Função para lançar os confetes.
   * Gera 100 confetes com animação de "eject" (parabólica) e os remove após 2 segundos.
   */
  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    const numberOfPieces = 100; // Número de confetes
    const colors = ['#FFC107', '#FF5722', '#8BC34A', '#00BCD4', '#E91E63'];

    for (let i = 0; i < numberOfPieces; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');

      // Aplica um atraso aleatório entre 0 e 1 segundo
      piece.style.animationDelay = Math.random() + "s";

      // Escolhe aleatoriamente o lado: "left" ou "right"
      const side = Math.random() > 0.5 ? "left" : "right";
      if (side === "left") {
        piece.style.left = "0";
        // Define deslocamento horizontal positivo variado (20vw a 70vw)
        const xShift = (Math.random() * 50 + 20) + "vw";
        piece.style.setProperty('--xShift', xShift);
      } else {
        piece.style.left = "100%";
        // Define deslocamento horizontal negativo variado (-20vw a -70vw)
        const xShift = "-" + (Math.random() * 50 + 20) + "vw";
        piece.style.setProperty('--xShift', xShift);
      }

      // Define uma rotação aleatória entre -360deg e 360deg
      const rotation = (Math.random() * 720 - 360) + "deg";
      piece.style.setProperty('--rotation', rotation);

      // Posição vertical inicial aleatória ao longo de toda a altura da tela
      piece.style.top = Math.floor(Math.random() * window.innerHeight) + "px";

      // Define o pico vertical aleatório (subida): valor negativo entre -10vh e -40vh
      const yPeak = "-" + (Math.random() * 30 + 10) + "vh";
      piece.style.setProperty('--yPeak', yPeak);

      // Atribui uma cor aleatória
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(piece);
    }

    // Remove os confetes após 2 segundos para limpar a interface
    setTimeout(() => {
      container.innerHTML = "";
    }, 2000);
  }
});
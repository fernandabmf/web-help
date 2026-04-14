// content.js — injeta na página e aplica filtros de cor recebidos do popup.js
// Guarda estado no objeto window para sobreviver a reinjeções sem duplicar listeners

if (!window.__extensaoCarregada) {
  window.__extensaoCarregada = true;
  window.__isBW = false;
  window.__isNight = false;

  console.log("EXTENSÃO CARREGADA");

  const nightStyleId = "__extensao_night_style";
  const MIN_SIZE = 8;
  const MAX_SIZE = 72;

  function applyFilter(filter) {
    document.documentElement.style.filter = filter;
  }

  function applyNightTheme() {
    if (document.getElementById(nightStyleId)) return;
    const style = document.createElement("style");
    style.id = nightStyleId;
    style.textContent = `
      html {
        filter: invert(90%) hue-rotate(180deg) !important;
      }
      img, video, iframe, canvas, svg, picture {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removeNightTheme() {
    const style = document.getElementById(nightStyleId);
    if (style) style.remove();
    document.documentElement.style.filter = "";
  }

  // Guarda os tamanhos originais de cada elemento na primeira execução
  const originalSizes = new Map();

  function getAllTextElements() {
    const tags = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "a",
      "li",
      "td",
      "th",
      "label",
      "button",
      "input",
      "textarea",
      "blockquote",
      "caption",
      "figcaption",
      "dt",
      "dd",
    ];
    return Array.from(document.querySelectorAll(tags.join(",")));
  }

  function resizeAllText(value) {
    // value vem do range: -40 a +40, centrado em 0
    // 0 = tamanho original, positivo = maior, negativo = menor
    getAllTextElements().forEach((el) => {
      // Salva o tamanho original apenas uma vez por elemento
      if (!originalSizes.has(el)) {
        originalSizes.set(el, parseFloat(window.getComputedStyle(el).fontSize));
      }
      const original = originalSizes.get(el);
      const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, original + value));
      el.style.fontSize = next + "px";
    });
  }

  function resetAllText() {
    originalSizes.forEach((_, el) => {
      el.style.fontSize = "";
    });
    originalSizes.clear();
  }

  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case "toggleBW":
        window.__isBW = !window.__isBW;
        applyFilter(window.__isBW ? "grayscale(100%)" : "none");
        break;

      case "setTemperature":
        window.__isBW = false;
        const value = message.value;
        const hue = `hue-rotate(${value}deg)`;
        const warmth = `sepia(${Math.abs(value) / 400}) saturate(1.2)`;
        applyFilter(`${hue} ${warmth}`);
        break;

      case "resetFilter":
      case "showTemp":
        window.__isBW = false;
        applyFilter("none");
        break;

      case "toggleNight":
        window.__isNight = !window.__isNight;
        window.__isNight ? applyNightTheme() : removeNightTheme();
        break;

      case "setTextSize":
        resizeAllText(message.value);
        break;

      case "resetTextSize":
        resetAllText();
        break;

      case "speechRead":
        executeSpeechRead(message.rate, message.volume);
        break;

      case "speechStop":
        window.speechSynthesis.cancel();
        break;
    }
  });

  // Função de leitura reutilizável — usada tanto pelo popup quanto pelo atalho
  function executeSpeechRead(rate = 1, volume = 1) {
    window.speechSynthesis.cancel();

    const selectedText = window.getSelection()?.toString().trim();

    if (!selectedText) {
      alert(
        "Nenhum texto selecionado.\nSelecione um trecho da página antes de acionar a leitura.",
      );
      return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.lang = document.documentElement.lang || "pt-BR";
    utterance.rate = rate;
    utterance.volume = volume;

    window.speechSynthesis.speak(utterance);
  }

  // Atalho Alt + L — aciona a leitura diretamente na página
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "l") {
      e.preventDefault();
      executeSpeechRead();
    }
  });
}

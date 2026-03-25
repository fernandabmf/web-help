// popup.js — injeta o content.js na aba ativa antes de enviar qualquer comando

const bwBtn = document.getElementById("bwBtn");
const tempBtn = document.getElementById("tempBtn");
const sliderContainer = document.getElementById("sliderContainer");
const tempRange = document.getElementById("tempRange");

// Garante que o content.js está injetado, depois envia a mensagem
function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;

    chrome.scripting.executeScript(
      { target: { tabId }, files: ["content.js"] },
      () => {
        // Ignora erro caso o script já esteja injetado
        chrome.runtime.lastError;
        chrome.tabs.sendMessage(tabId, data);
      },
    );
  });
}

// Alternar preto e branco
bwBtn.addEventListener("click", () => {
  sliderContainer.style.display = "none";
  sendMessage({ action: "toggleBW" });
});

// Mostrar/ocultar controle de temperatura
tempBtn.addEventListener("click", () => {
  const isVisible = sliderContainer.style.display !== "none";
  sliderContainer.style.display = isVisible ? "none" : "block";
  sendMessage({ action: isVisible ? "resetFilter" : "showTemp" });
});

// Ajustar temperatura de cor em tempo real
tempRange.addEventListener("input", () => {
  const value = parseInt(tempRange.value);
  sendMessage({ action: "setTemperature", value });
});

// Alternar tema noturno
const nightBtn = document.getElementById("nightBtn");

nightBtn.addEventListener("click", () => {
  sendMessage({ action: "toggleNight" });
});

// Ajustar tamanho de texto
const textAdjustBtn = document.getElementById("textAdjustBtn");
const textResetBtn = document.getElementById("textResetBtn");
const textSliderContainer = document.getElementById("textSliderContainer");
const textRange = document.getElementById("textRange");

textAdjustBtn.addEventListener("click", () => {
  const isVisible = textSliderContainer.style.display !== "none";
  textSliderContainer.style.display = isVisible ? "none" : "block";
  if (isVisible) {
    textRange.value = 0;
    sendMessage({ action: "resetTextSize" });
  }
});

textRange.addEventListener("input", () => {
  const value = parseInt(textRange.value);
  sendMessage({ action: "setTextSize", value });
});

textResetBtn.addEventListener("click", () => {
  textRange.value = 0;
  textSliderContainer.style.display = "none";
  sendMessage({ action: "resetTextSize" });
});

// DOM Elements ------------------------------------------------------------------
const personalBest = document.getElementById("personal-best"); // header
const resetPersonalBestBtn = document.querySelector(".header__btn");

const optionsSection = document.querySelector(".options"); // options
const currentWPM = document.getElementById("wpm");
const currentAccuracy = document.getElementById("accuracy");
const currentTime = document.getElementById("time");
const difficultyButtons = document
  .querySelector(".options__difficulty")
  .querySelectorAll(".options__btn");
const modeButtons = document
  .querySelector(".options__mode")
  .querySelectorAll(".options__btn");
const selectDifficultyEl = document.getElementById("difficulty");
const selectModeEl = document.getElementById("mode");

const typingSection = document.querySelector(".typing"); // typing
const typingStartBlur = document.querySelector(".typing__start");
const typingStartBtn = document.querySelector(".typing__start-btn");
const restartSection = document.querySelector(".restart");
const restartBtn = document.querySelector(".restart__btn");
const typingText = document.querySelector(".typing__text");
const typingInput = document.querySelector(".typing__input");

const resultsSection = document.querySelector(".results"); // results
const resultsCompletedIcon = document.querySelector(".results__icon-completed");
const resultsStarsIcon = document.querySelector(".results__deco-stars");
const resultsNewPbIcon = document.querySelector(".results__icon-new-pb");
const resultsNewPbConfetti = document.querySelector(".results__deco-confetti");
const resultsTitle = document.querySelector(".results__title");
const resultsDescription = document.querySelector(".results__description");
const resultsWPMEl = document.getElementById("result-wpm");
const resultsAccuracyEl = document.getElementById("result-accuracy");
const resultsCorrectCharacters = document.getElementById(
  "result-characters-correct",
);
const resultsIncorrectCharacters = document.getElementById(
  "result-characters-incorrect",
);
const resultsBtn = document.querySelector(".results__btn");

// State --------------------------------------------------------------------
let passages = [];
let difficultyValue = "easy";
let modeValue = "timed";
let spans = [];
let prevLength = 0;
let currentLetterIndex = 0;
let correctLetters = 0;
let totalMistakes = 0;
let totalTyped = 0;
let startTime = null;
let timerInterval = null;
let resultWPM = 0;
let resultAccuracy = 0;
let pb = null;
let testState = "idle"; // idle, running, finished

// Utils Function ---------------------------------------------------------
function updatePb() {
  if (localStorage.getItem("typing-test-pb")) {
    pb = Number(localStorage.getItem("typing-test-pb"));
    personalBest.textContent = pb + " WPM";
  } else {
    pb = null;
    personalBest.textContent = "-";
  }
}

function resetState() {
  difficultyValue = "easy";
  modeValue = "timed";
  spans = [];
  prevLength = 0;
  currentLetterIndex = 0;
  correctLetters = 0;
  totalMistakes = 0;
  totalTyped = 0;
  startTime = null;
  timerInterval = null;
  testState = "idle";
}

function resetUI() {
  typingInput.value = "";
  currentWPM.textContent = "0";
  currentAccuracy.textContent = "100%";
  currentAccuracy.style.color = "hsl(0, 0%, 100%)";
  currentTime.textContent = "0:15";
  currentTime.style.color = "hsl(0, 0%, 100%)";
  typingInput.disabled = true;
  updateDifficultyUI(difficultyValue);
  updateModeUI(modeValue);

  difficultyButtons.forEach((button) => {
    button.classList.remove("disabled");
  });
  modeButtons.forEach((button) => {
    button.classList.remove("disabled");
  });
  selectDifficultyEl.classList.remove("disabled");
  selectModeEl.classList.remove("disabled");

  optionsSection.classList.remove("hidden");
  typingSection.classList.remove("hidden");
  typingStartBlur.classList.remove("hidden");
  restartSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  resultsCompletedIcon.classList.remove("hidden");
  resultsStarsIcon.classList.remove("hidden");
  resultsNewPbIcon.classList.add("hidden");
  resultsNewPbConfetti.classList.add("hidden");
  resultsBtn.querySelector(".results__btn-text").textContent =
    "Beat This Score";
}

function resetTest() {
  resetState();
  resetUI();
}

function formatTime(remainingTime) {
  const totalSeconds = Math.ceil(remainingTime / 1000);

  const minute = Math.floor(totalSeconds / 60);
  const second = totalSeconds % 60;

  return `${minute}:${second.toString().padStart(2, "0")}`;
}

function calculateWpm() {
  if (startTime === null || totalTyped === 0) return 0;
  let elapsedTimeMs = Date.now() - startTime;
  let elapsedTimeSecond = elapsedTimeMs / 1000;

  if (elapsedTimeSecond === 0) return 0;

  const wpm = correctLetters / 5 / (elapsedTimeSecond / 60);

  return Math.round(wpm);
}

function calculateAccuracy() {
  // if (startTime === null || totalTyped === 0) return 100;
  if (totalTyped === 0) return 100;
  const accuracy = ((totalTyped - totalMistakes) / totalTyped) * 100;

  return Math.round(accuracy);
}

function updateStats() {
  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  currentWPM.textContent = wpm;
  currentAccuracy.textContent = accuracy + "%";
  if (accuracy === 100) {
    currentAccuracy.style.color = "hsl(140, 63%, 57%)";
  } else {
    currentAccuracy.style.color = "hsl(354, 63%, 57%)";
  }
}

function randomPassage(difficulty) {
  const index = Math.floor(Math.random() * passages[difficulty].length);
  const passage = passages[difficulty][index].text;
  return passage;
}

function splitPassageToLetters(passage) {
  passage.split("").forEach((letter) => {
    const span = document.createElement("span");
    span.textContent = letter;

    typingText.appendChild(span);
    spans.push(span);
  });
}

function displayPassage() {
  typingText.innerHTML = "";
  spans = [];
  const passage = randomPassage(difficultyValue);
  splitPassageToLetters(passage);
  typingInput.maxLength = `${spans.length}`;
}

function lockOptions() {
  difficultyButtons.forEach((button) => {
    button.classList.add("disabled");
  });
  modeButtons.forEach((button) => {
    button.classList.add("disabled");
  });
  selectDifficultyEl.classList.add("disabled");
  selectModeEl.classList.add("disabled");
}

function setResults() {
  const resultWPM = Number(currentWPM.textContent);
  const resultAccuracy =
    Number(currentAccuracy.textContent.replace("%", "")) / 100;

  if (pb === null) {
    localStorage.setItem("typing-test-pb", resultWPM);
    updatePb();
    resultsTitle.textContent = "Baseline Established!";
    resultsDescription.textContent =
      "You've set the bar. Now the real challenge begins—time to beat it.";
  } else if (pb < resultWPM) {
    localStorage.setItem("typing-test-pb", resultWPM);
    updatePb();
    resultsTitle.textContent = "High Score Smashed!";
    resultsDescription.textContent =
      "You're getting faster. That was incredible typing.";
    resultsCompletedIcon.classList.add("hidden");
    resultsStarsIcon.classList.add("hidden");
    resultsNewPbIcon.classList.remove("hidden");
    resultsNewPbConfetti.classList.remove("hidden");
  } else {
    resultsTitle.textContent = "Test Complete!";
    resultsDescription.textContent =
      "Solid run. Keep pushing to beat your high score.";
    resultsBtn.querySelector(".results__btn-text").textContent = "Go Again";
  }

  resultsWPMEl.textContent = resultWPM;
  resultsAccuracyEl.textContent = resultAccuracy * 100 + "%";
  resultsAccuracyEl.style.color = currentAccuracy.style.color;
  resultsCorrectCharacters.textContent = correctLetters;
  resultsIncorrectCharacters.textContent = totalMistakes;
}

function startPassage() {
  if (testState !== "idle") return;
  if (timerInterval !== null) clearInterval(timerInterval);

  typingStartBlur.classList.add("hidden");
  restartSection.classList.remove("hidden");
  testState = "running";
  lockOptions();

  typingInput.disabled = false;
  typingInput.focus();
  startTime = Date.now();

  timerInterval = setInterval(update, 500);

  function update() {
    updateStats();
    if (currentLetterIndex === spans.length) {
      clearInterval(timerInterval);
      endTest();
    }
  }
}

function startTimer(time) {
  if (testState !== "idle") return;
  if (timerInterval !== null) clearInterval(timerInterval);

  typingStartBlur.classList.add("hidden");
  restartSection.classList.remove("hidden");
  testState = "running";
  lockOptions();

  currentTime.style.color = "hsl(49, 85%, 70%)";
  typingInput.disabled = false;
  typingInput.focus();
  startTime = Date.now();

  update();
  timerInterval = setInterval(update, 1000);

  function update() {
    let remainingTime = startTime + time * 1000 - Date.now();

    if (remainingTime <= 0) {
      currentTime.textContent = "0:00";
      clearInterval(timerInterval);
      endTest();
      return;
    }

    currentTime.textContent = formatTime(remainingTime);
    updateStats();
  }
}

function endTest() {
  testState = "finished";
  typingInput.disabled = true;
  setResults();
  optionsSection.classList.add("hidden");
  typingSection.classList.add("hidden");
  restartSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");
}

function updateDifficultyUI(value) {
  difficultyButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === value);
  });
}

function updateModeUI(value) {
  modeButtons.forEach((btn) => {
    if (value === "timed") {
      currentTime.textContent = "0:15";
    } else {
      currentTime.textContent = "-";
    }
    btn.classList.toggle("active", btn.dataset.mode === value);
  });
}

// Event listeners ---------------------------------------------------------
resetPersonalBestBtn.addEventListener("click", () => {
  localStorage.removeItem("typing-test-pb");
  updatePb();
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    difficultyValue = button.dataset.difficulty;

    updateDifficultyUI(difficultyValue);
    displayPassage();
  });
});

selectDifficultyEl.addEventListener("change", () => {
  difficultyValue = selectDifficultyEl.value;
  updateDifficultyUI(difficultyValue);
  displayPassage();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeValue = button.dataset.mode;

    updateModeUI(modeValue);
  });
});

selectModeEl.addEventListener("change", () => {
  modeValue = selectModeEl.value;
  updateModeUI(modeValue);
});

typingStartBtn.addEventListener("click", () => {
  if (modeValue === "timed") {
    startTimer(15);
  } else if (modeValue === "passage") {
    startPassage();
  }
});

document.addEventListener("keydown", (e) => {
  if (testState !== "idle") return;
  if (e.key.length !== 1) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  e.preventDefault();

  if (modeValue === "timed") {
    startTimer(15);
  } else if (modeValue === "passage") {
    startPassage();
  }
});

typingInput.addEventListener("focus", () => {
  spans[currentLetterIndex].classList.add("current-letter");
});

typingInput.addEventListener("focusout", () => {
  spans[currentLetterIndex].classList.remove("current-letter");
});

typingInput.addEventListener("input", () => {
  const inputLetters = typingInput.value;
  const currentLength = inputLetters.length;

  if (currentLetterIndex < spans.length) {
    spans[currentLetterIndex].classList.remove("current-letter");
  }

  if (currentLength < prevLength) {
    const index = currentLength;
    if (index < spans.length) {
      if (spans[index].classList.contains("correct")) correctLetters--;
      spans[index].classList.remove("correct", "incorrect");
    }
    currentLetterIndex = currentLength;
  }

  if (currentLength > prevLength) {
    totalTyped++;
    const index = currentLength - 1;
    if (index < spans.length) {
      if (inputLetters[index] === spans[index].textContent) {
        spans[index].classList.add("correct");
        spans[index].classList.remove("incorrect");
        correctLetters++;
      } else {
        spans[index].classList.add("incorrect");
        spans[index].classList.remove("correct");
        totalMistakes++;
      }
    }
    currentLetterIndex = currentLength;
  }

  if (currentLength < spans.length) {
    spans[currentLetterIndex].classList.add("current-letter");
  }

  updateStats();
  prevLength = currentLength;
});

restartBtn.addEventListener("click", () => {
  if (timerInterval !== null) clearInterval(timerInterval);
  startApp();
});

resultsBtn.addEventListener("click", startApp);

// Main workflow ----------------------------------------------------------

async function initApp() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    passages = data;

    startApp();
  } catch (error) {
    console.log(error);
  }
}

function startApp() {
  resetTest();
  displayPassage();
  updatePb();
}

initApp();

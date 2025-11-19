const APP_NAME = "DecideNow";
let currentUser = JSON.parse(localStorage.getItem("DecideNowUser")) || {
  userId: Date.now().toString(),
  xp: 0,
  streak: 0,
  badges: [],
};
let currentDeck = null;
let currentResult = null;
let currentHistoryId = null;

// Inisialisasi
document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  loadDashboard();
  registerServiceWorker();
});

// Fungsi untuk mendaftarkan Service Worker
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
}

// Update UI Stats
function updateStats() {
  document.getElementById("xp-count").textContent = currentUser.xp;
  document.getElementById("streak-count").textContent = currentUser.streak;
}

// Dashboard
function loadDashboard() {
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("create-deck").classList.add("hidden");
  document.getElementById("navigator").classList.add("hidden");
  document.getElementById("rating").classList.add("hidden");

  const decksList = document.getElementById("decks-list");
  decksList.innerHTML = "";

  const decks = JSON.parse(localStorage.getItem("DecideNowDecks")) || [];
  decks.forEach((deck) => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = deck.name;
    card.onclick = () => startNavigator(deck);
    decksList.appendChild(card);
  });
}

// Buat Deck
document.getElementById("new-deck-btn").onclick = () => {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("create-deck").classList.remove("hidden");
  document.getElementById("deck-name").value = "";
  document.getElementById("options-container").innerHTML =
    '<input type="text" class="option-input" placeholder="Opsi 1">';
};

document.getElementById("add-option-btn").onclick = () => {
  const container = document.getElementById("options-container");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "option-input";
  input.placeholder = `Opsi ${container.children.length + 1}`;
  container.appendChild(input);
};

document.getElementById("save-deck-btn").onclick = () => {
  const name = document.getElementById("deck-name").value;
  const type = document.getElementById("deck-type").value;
  const options = Array.from(document.querySelectorAll(".option-input"))
    .map((input) => input.value)
    .filter((val) => val);

  if (!name || options.length === 0) {
    alert("Silakan isi nama deck dan minimal 1 opsi.");
    return;
  }

  const newDeck = {
    deckId: Date.now().toString(),
    name,
    type,
    options: options.map((opt, i) => ({
      optionId: `opt-${Date.now()}-${i}`,
      text: opt,
      contextTags: [],
      impactScore: 3,
      effortScore: 3,
    })),
  };

  const decks = JSON.parse(localStorage.getItem("DecideNowDecks")) || [];
  decks.push(newDeck);
  localStorage.setItem("DecideNowDecks", JSON.stringify(decks));

  loadDashboard();
};

document.getElementById("back-to-dashboard-btn").onclick = loadDashboard;

// Navigator
function startNavigator(deck) {
  currentDeck = deck;
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("navigator").classList.remove("hidden");
  document.getElementById(
    "navigator-title"
  ).textContent = `Navigasi: ${deck.name}`;

  // Pilih mode acak untuk demo
  const modes = ["elimination", "spinner"];
  const selectedMode = modes[Math.floor(Math.random() * modes.length)];

  const content = document.getElementById("navigator-content");
  content.innerHTML = "";

  if (selectedMode === "elimination") {
    loadEliminationMode(content);
  } else if (selectedMode === "spinner") {
    loadSpinnerMode(content);
  }
}

// Mode Eliminasi
function loadEliminationMode(container) {
  let roundOptions = [...currentDeck.options]
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);
  let currentPair = [roundOptions[0], roundOptions[1]];
  let currentIndex = 2;

  function displayPair() {
    container.innerHTML = "";
    const card1 = document.createElement("div");
    card1.className = "swipe-card";
    card1.textContent = currentPair[0].text;
    card1.dataset.id = currentPair[0].optionId;

    const card2 = document.createElement("div");
    card2.className = "swipe-card";
    card2.textContent = currentPair[1].text;
    card2.dataset.id = currentPair[1].optionId;

    card2.style.left = "5%";
    card2.style.transform = "translateX(0)";

    container.appendChild(card1);
    container.appendChild(card2);

    let startX,
      startY,
      moved = false;
    card2.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      moved = false;
    });

    card2.addEventListener("touchmove", (e) => {
      if (!startX || !startY) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - startX;
      const dy = Math.abs(y - startY);
      if (dy < 50) {
        // Hanya horizontal
        card2.style.transform = `translateX(${dx}px) rotate(${dx * 0.1}deg)`;
        moved = true;
      }
    });

    card2.addEventListener("touchend", (e) => {
      if (!moved) return;
      const x = e.changedTouches[0].clientX;
      const dx = x - startX;
      if (Math.abs(dx) > 100) {
        if (dx > 0) {
          roundOptions.push(currentPair[0]); // Kiri menang
        } else {
          roundOptions.push(currentPair[1]); // Kanan menang
        }
        roundOptions = roundOptions.filter(
          (opt) =>
            opt.optionId !== currentPair[0].optionId &&
            opt.optionId !== currentPair[1].optionId
        );
        nextRound();
      } else {
        card2.style.transform = "translateX(0) rotate(0deg)";
      }
    });
  }

  function nextRound() {
    if (roundOptions.length <= 1) {
      currentResult = roundOptions[0];
      document
        .getElementById("finish-navigator-btn")
        .classList.remove("hidden");
      container.innerHTML = `<h3>Pemenang: ${currentResult.text}</h3>`;
      return;
    }
    currentPair = [roundOptions[0], roundOptions[1]];
    roundOptions = roundOptions.slice(2);
    displayPair();
  }

  displayPair();
}

// Mode Spinner
function loadSpinnerMode(container) {
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.id = "spinner-wheel";

  const segments = currentDeck.options.map((opt) => {
    const weight = opt.impactScore * 3 + (5 - opt.effortScore);
    return { ...opt, weight };
  });

  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);
  let startAngle = 0;

  segments.forEach((seg) => {
    const angle = (seg.weight / totalWeight) * 360;
    const segment = document.createElement("div");
    segment.className = "segment";
    segment.style.transform = `rotate(${startAngle}deg)`;
    segment.style.width = `${angle > 180 ? 100 : (angle / 360) * 200}%`;
    segment.style.clipPath = `polygon(50% 50%, 100% 0%, 100% 100%)`;
    segment.innerHTML = `<div class="segment-text" style="transform: rotate(${
      angle / 2
    }deg);">${seg.text.substring(0, 10)}</div>`;
    spinner.appendChild(segment);
    startAngle += angle;
  });

  container.appendChild(spinner);

  const spinBtn = document.createElement("button");
  spinBtn.textContent = "Putar!";
  spinBtn.onclick = () => {
    const spinValue = Math.random() * 360 + 1440; // 4 putaran penuh
    spinner.style.transition = "transform 4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    spinner.style.transform = `rotate(${spinValue}deg)`;

    setTimeout(() => {
      const normalizedAngle = spinValue % 360;
      let cumulativeAngle = 0;
      for (let i = 0; i < segments.length; i++) {
        const segAngle = (segments[i].weight / totalWeight) * 360;
        if (
          normalizedAngle >= cumulativeAngle &&
          normalizedAngle < cumulativeAngle + segAngle
        ) {
          currentResult = segments[i];
          break;
        }
        cumulativeAngle += segAngle;
      }
      container.innerHTML = `<h3>Hasil: ${currentResult.text}</h3>`;
      document
        .getElementById("finish-navigator-btn")
        .classList.remove("hidden");
    }, 4000);
  };

  container.appendChild(spinBtn);
}

document.getElementById("finish-navigator-btn").onclick = () => {
  if (!currentResult) return;

  const history = JSON.parse(localStorage.getItem("DecideNowHistory")) || [];
  currentHistoryId = `hist-${Date.now()}`;
  const today = new Date().toISOString().split("T")[0];

  const newHistory = {
    historyId: currentHistoryId,
    deckId: currentDeck.deckId,
    date: today,
    result: currentResult.text,
  };

  history.push(newHistory);
  localStorage.setItem("DecideNowHistory", JSON.stringify(history));

  // Update streak jika belum hari ini
  const lastDate = localStorage.getItem("DecideNowLastDate");
  const todayStr = new Date().toISOString().split("T")[0];
  if (lastDate !== todayStr) {
    currentUser.streak += 1;
    localStorage.setItem("DecideNowLastDate", todayStr);
  }
  localStorage.setItem("DecideNowUser", JSON.stringify(currentUser));
  updateStats();

  // Pindah ke halaman rating
  document.getElementById("navigator").classList.add("hidden");
  document.getElementById("rating").classList.remove("hidden");
  document.getElementById("selected-result").textContent = currentResult.text;

  // Reset state
  document.getElementById("finish-navigator-btn").classList.add("hidden");
  currentDeck = null;
  currentResult = null;
};

document.getElementById("back-to-decks-btn").onclick = () => {
  document.getElementById("navigator").classList.add("hidden");
  document.getElementById("finish-navigator-btn").classList.add("hidden");
  loadDashboard();
};

// Rating
let selectedRating = 0;
document.querySelectorAll(".star").forEach((star) => {
  star.onclick = (e) => {
    selectedRating = parseInt(e.target.dataset.value);
    document
      .querySelectorAll(".star")
      .forEach((s) => s.classList.remove("active"));
    for (let i = 0; i < selectedRating; i++) {
      document.querySelectorAll(".star")[i].classList.add("active");
    }
  };
});

document.getElementById("submit-rating-btn").onclick = () => {
  if (selectedRating === 0) {
    alert("Silakan beri rating terlebih dahulu.");
    return;
  }

  // Update XP
  currentUser.xp += 10; // XP dari keputusan
  if (selectedRating >= 4) currentUser.xp += 15; // Bonus XP
  localStorage.setItem("DecideNowUser", JSON.stringify(currentUser));
  updateStats();

  // Update history dengan rating
  const history = JSON.parse(localStorage.getItem("DecideNowHistory")) || [];
  const entry = history.find((h) => h.historyId === currentHistoryId);
  if (entry) entry.rating = selectedRating;
  localStorage.setItem("DecideNowHistory", JSON.stringify(history));

  alert("Terima kasih atas rating Anda! Keputusan telah dicatat.");
  loadDashboard();
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/charaData.json");
    const data = await res.json();

    renderCharaList("A", data.A, document.getElementById("personaA"));
    renderCharaList("B", data.B, document.getElementById("personaB"));

    restoreSelection();
    updateNextButton();
  } catch (err) {
    console.error("キャラデータ読み込み失敗:", err);
  }

  // 「次へ」ボタン
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (!localStorage.getItem("selectedCharaA") || !localStorage.getItem("selectedCharaB")) {
      alert("推し(A)とフレンド(B)を1人ずつ選択してください");
      return;
    }
    window.location.href = "post.html";
  });
});

// キャラ一覧生成
function renderCharaList(type, list, container) {
  list.forEach(chara => {
    const card = document.createElement("div");
    card.className = "character";
    card.innerHTML = `
      <img src="${chara.img}" alt="${chara.name}">
      <p>${chara.name}</p>
    `;

    // --- タップで選択＋吹き出し表示 ---
    card.addEventListener("click", () => {
      // 既存吹き出し削除
      removeBubble();

      // 選択状態切り替え
      container.querySelectorAll(".character").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      localStorage.setItem(`selectedChara${type}`, JSON.stringify(chara));

      updateNextButton();

      // 吹き出し生成
      const bubble = document.createElement("div");
      bubble.className = `profile-bubble active ${type === "A" ? "bubble-a" : "bubble-b"}`;
      bubble.innerHTML = `<strong>${chara.name}</strong><br>${chara.desc}`;
      document.body.appendChild(bubble);

      // 吹き出し位置計算
      const rect = card.getBoundingClientRect();
      const bubbleWidth = bubble.offsetWidth;
      const bubbleHeight = bubble.offsetHeight;
      bubble.style.left = `${rect.left + rect.width / 2 - bubbleWidth / 2}px`;
      bubble.style.top = `${rect.top - bubbleHeight - 10}px`;
    });

    container.appendChild(card);
  });

  // スクロール時に吹き出し削除
  container.addEventListener("scroll", removeBubble);

  // 初期スクロール位置（スマホ2.5個見せ）
  if (window.innerWidth < 768) {
    setTimeout(() => {
      const cardWidth = container.querySelector(".character")?.offsetWidth || 0;
      container.scrollLeft = cardWidth * 0.5;
    }, 0);
  }
}

// 吹き出し削除
function removeBubble() {
  const existing = document.querySelector(".profile-bubble");
  if (existing) existing.remove();
}

// 選択状態復元
function restoreSelection() {
  ["A", "B"].forEach(type => {
    const data = localStorage.getItem(`selectedChara${type}`);
    if (!data) return;

    const chara = JSON.parse(data);
    const container = document.getElementById(type === "A" ? "personaA" : "personaB");
    const card = Array.from(container.querySelectorAll(".character")).find(c =>
      c.querySelector("p").textContent === chara.name
    );

    if (card) card.classList.add("selected");
  });
}

// 「次へ」ボタン制御
function updateNextButton() {
  const btn = document.getElementById("nextBtn");
  const aSelected = localStorage.getItem("selectedCharaA");
  const bSelected = localStorage.getItem("selectedCharaB");
  btn.disabled = !(aSelected && bSelected);
}

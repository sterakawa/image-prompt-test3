document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/charaData.json");
    const data = await res.json();

    renderCharaList("A", data.A, document.getElementById("personaA"));
    renderCharaList("B", data.B, document.getElementById("personaB"));

    restoreSelection(); // 戻り時の選択復元
    updateNextButton(); // 初期状態チェック
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

// キャラ一覧を生成
function renderCharaList(type, list, container) {
  list.forEach(chara => {
    const card = document.createElement("div");
    card.className = "character";
    card.innerHTML = `
      <img src="${chara.img}" alt="${chara.name}">
      <p>${chara.name}</p>
    `;

    // 選択処理
    card.addEventListener("click", () => {
      container.querySelectorAll(".character").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      localStorage.setItem(`selectedChara${type}`, JSON.stringify(chara));
      updateNextButton();
    });

    // 長押しでプロフィール吹き出し
    let bubble;
    const showBubble = () => {
      removeBubble();
      bubble = document.createElement("div");
      bubble.className = "profile-bubble active";
      bubble.innerHTML = `<strong>${chara.name}</strong><br>${chara.desc}`;
      document.body.appendChild(bubble);

      // 位置計算（カード中央上）
      const rect = card.getBoundingClientRect();
      const bubbleWidth = bubble.offsetWidth;
      const bubbleHeight = bubble.offsetHeight;

      bubble.style.left = `${rect.left + rect.width / 2 - bubbleWidth / 2}px`;
      bubble.style.top = `${rect.top - bubbleHeight - 10}px`;
    };

    const hideBubble = () => {
      removeBubble();
    };

    // PC対応
    card.addEventListener("mousedown", showBubble);
    card.addEventListener("mouseup", hideBubble);
    card.addEventListener("mouseleave", hideBubble);

    // スマホ対応
    card.addEventListener("touchstart", (e) => {
      e.preventDefault();
      showBubble();
    });
    card.addEventListener("touchend", hideBubble);

    container.appendChild(card);
  });

  // スマホ時のみ2.5個目を少し見せる位置にスクロール
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

// 選択状態を復元
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

// 「次へ」ボタンの有効/無効制御
function updateNextButton() {
  const btn = document.getElementById("nextBtn");
  const aSelected = localStorage.getItem("selectedCharaA");
  const bSelected = localStorage.getItem("selectedCharaB");
  btn.disabled = !(aSelected && bSelected);
}

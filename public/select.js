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
    card.className = "character"; // クラスを統一
    card.innerHTML = `
      <img src="${chara.img}" alt="${chara.name}">
      <p>${chara.name}</p>
    `;

    card.addEventListener("click", () => {
      // 既存の選択解除
      container.querySelectorAll(".character").forEach(c => c.classList.remove("selected"));

      // 新たに選択
      card.classList.add("selected");

      // キャラ情報をlocalStorageに保存
      localStorage.setItem(`selectedChara${type}`, JSON.stringify(chara));

      updateNextButton();
    });

    container.appendChild(card);
  });
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

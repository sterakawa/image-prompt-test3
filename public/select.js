document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/charaData.json");
    const data = await res.json();

    renderCharaList("A", data.A, document.getElementById("personaA"));
    renderCharaList("B", data.B, document.getElementById("personaB"));

    restoreSelection(); // 戻り時の選択復元
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
    card.className = "chara-card";
    card.innerHTML = `
      <img src="${chara.img}" alt="${chara.name}">
      <h3>${chara.name}</h3>
      <p>${chara.desc}</p>
    `;

    card.addEventListener("click", () => {
      // 既存の選択解除
      container.querySelectorAll(".chara-card").forEach(c => c.classList.remove("selected"));

      // 新たに選択
      card.classList.add("selected");

      // キャラ情報をlocalStorageに保存
      localStorage.setItem(`selectedChara${type}`, JSON.stringify(chara));
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
    const card = Array.from(container.querySelectorAll(".chara-card")).find(c =>
      c.querySelector("h3").textContent === chara.name
    );

    if (card) card.classList.add("selected");
  });
}

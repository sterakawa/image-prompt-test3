document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/charaData.json");
    const data = await res.json();

    renderCharaList("A", data.A, document.getElementById("rowA"));
    renderCharaList("B", data.B, document.getElementById("rowB"));
  } catch (err) {
    console.error("キャラデータ読み込み失敗:", err);
  }

  // 「次へ」ボタン
  document.getElementById("goNext").addEventListener("click", () => {
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
      localStorage.setItem(`selectedChara${type}`, chara.id);
    });

    container.appendChild(card);
  });
}

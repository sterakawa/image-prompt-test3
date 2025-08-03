let selectedFan = null;
let selectedPersona = null;

document.addEventListener("DOMContentLoaded", () => {
  const fanCards = document.querySelectorAll("#fanList .char-card");
  const personaCards = document.querySelectorAll("#personaList .char-card");
  const confirmBtn = document.getElementById("confirmBtn");

  // 選択処理（共通）
  function handleSelect(card, type) {
    // 他の選択解除
    const parent = card.parentElement;
    parent.querySelectorAll(".char-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    if (type === "fan") {
      selectedFan = card.dataset.id;
    } else {
      selectedPersona = card.dataset.id;
    }

    // 両方選択されたらボタン有効化
    confirmBtn.disabled = !(selectedFan && selectedPersona);
  }

  // クリックイベント設定
  fanCards.forEach(card => {
    card.addEventListener("click", () => handleSelect(card, "fan"));
  });

  personaCards.forEach(card => {
    card.addEventListener("click", () => handleSelect(card, "persona"));
  });

  // 決定ボタンクリック
  confirmBtn.addEventListener("click", () => {
    // 選択情報をlocalStorageに保存
    localStorage.setItem("selectedFan", selectedFan);
    localStorage.setItem("selectedPersona", selectedPersona);

    // 次のページに遷移
    window.location.href = "post.html";
  });
});

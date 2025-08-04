document.addEventListener("DOMContentLoaded", () => {
  let selectedA = "";
  let selectedB = "";

  // キャラ選択イベント
  document.querySelectorAll("#personaA .character").forEach(char => {
    char.addEventListener("click", () => {
      document.querySelectorAll("#personaA .character").forEach(c => c.classList.remove("selected"));
      char.classList.add("selected");
      selectedA = char.dataset.name;
      checkSelections();
    });
  });

  document.querySelectorAll("#personaB .character").forEach(char => {
    char.addEventListener("click", () => {
      document.querySelectorAll("#personaB .character").forEach(c => c.classList.remove("selected"));
      char.classList.add("selected");
      selectedB = char.dataset.name;
      checkSelections();
    });
  });

  // 次へボタン
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (selectedA && selectedB) {
      localStorage.setItem("personaA_name", selectedA);
      localStorage.setItem("personaB_name", selectedB);
      window.location.href = "post.html";
    }
  });

  function checkSelections() {
    document.getElementById("nextBtn").disabled = !(selectedA && selectedB);
  }
});

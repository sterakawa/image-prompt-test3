// ===============================
// グローバル変数
// ===============================
let selectedEmotion = "";
let currentMode = "A";
let personaPromptA = "";
let personaPromptB = "";
let rulePrompt = "";

// ===============================
// ページロード
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("post.js 読み込み");

  // プロフィール読み込み
  loadProfileA();
  loadIcons();

  // キャラ変更ボタン
  const changeBtn = document.getElementById("changeCharaBtn");
  if (changeBtn) {
    changeBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "select.html";
    });
  }

  // プロンプト読み込み
  try {
    const [aText, bText, ruleText] = await Promise.all([
      fetch("/prompts/personaA.txt").then(res => res.text()),
      fetch("/prompts/personaB.txt").then(res => res.text()),
      fetch("/prompts/rule.txt").then(res => res.text())
    ]);

    personaPromptA = aText.trim();
    personaPromptB = bText.trim();
    rulePrompt = ruleText.trim();
  } catch (err) {
    console.error("プロンプト読み込み失敗:", err);
  }

  // 感情ボタン
  document.querySelectorAll(".emotion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".emotion-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedEmotion = btn.dataset.emotion;
    });
  });

  // 画像プレビュー
  document.getElementById("imageInput").addEventListener("change", previewImage);

  // A/B切替
  document.getElementById("switchA").addEventListener("click", () => switchMode("A"));
  document.getElementById("switchB").addEventListener("click", () => switchMode("B"));

  // 送信・共有
  document.getElementById("sendBtn").addEventListener("click", sendData);
  document.getElementById("shareBtn").addEventListener("click", shareCapture);
});

// ===============================
// Aキャラプロフィール表示
// ===============================
function loadProfileA() {
  const data = localStorage.getItem("selectedCharaA");
  if (!data) return;
  const chara = JSON.parse(data);

  const profile = document.getElementById("profileA");
  profile.querySelector(".profile-icon").src = chara.img;
  profile.querySelector(".profile-name").textContent = chara.name;
  profile.querySelector(".profile-desc").textContent = chara.desc;
  profile.classList.remove("hidden");
}

// ===============================
// A/Bアイコン読み込み
// ===============================
function loadIcons() {
  const charaA = JSON.parse(localStorage.getItem("selectedCharaA") || "{}");
  const charaB = JSON.parse(localStorage.getItem("selectedCharaB") || "{}");

  if (charaA.img) document.getElementById("iconA").src = charaA.img;
  if (charaB.img) document.getElementById("iconB").src = charaB.img;
}

// ===============================
// A/B切替
// ===============================
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("switchA").classList.toggle("active", mode === "A");
  document.getElementById("switchB").classList.toggle("active", mode === "B");

  const bubbleA = document.getElementById("resultBubbleA");
  const bubbleB = document.getElementById("resultBubbleB");

  bubbleA.style.display = bubbleA.classList.contains("hidden") ? "none" : (mode === "A" ? "inline-block" : "none");
  bubbleB.style.display = bubbleB.classList.contains("hidden") ? "none" : (mode === "B" ? "inline-block" : "none");
}

// ===============================
// データ送信
// ===============================
async function sendData() {
  const username = document.getElementById("username").value || "匿名";
  const userComment = document.getElementById("userComment").value || "";
  const imageInput = document.getElementById("imageInput");

  if (!imageInput.files[0]) {
    alert("写真をアップロードしてください");
    return;
  }

  const combinedPromptA = `${personaPromptA}\n${rulePrompt}`;
  const combinedPromptB = `${personaPromptB}\n${rulePrompt}`;
  const emotionText = selectedEmotion ? `感情: ${selectedEmotion}\n` : "";

  const base64Image = await resizeImage(imageInput.files[0], 512);

  const requestData = {
    promptA: combinedPromptA,
    promptB: combinedPromptB,
    userPrompt: `名前: ${username}\n${emotionText}${userComment}`,
    image: base64Image,
    temperature: 0.7,
    maxTokens: 200,
    topP: 0.6,
    model: "gpt-4.1-mini"
  };

  // --- 送信中UI ---
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;
  sendBtn.textContent = "送信中…";

  const bubbleA = document.getElementById("resultBubbleA");
  const bubbleB = document.getElementById("resultBubbleB");

  bubbleA.classList.remove("hidden");
  bubbleB.classList.remove("hidden");
  bubbleA.classList.add("loading");
  bubbleB.classList.add("loading");

  bubbleA.querySelector(".comment").textContent = "";
  bubbleB.querySelector(".comment").textContent = "";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    bubbleA.querySelector(".comment").textContent = data.commentA || "応答がありません";
    bubbleB.querySelector(".comment").textContent = data.commentB || "応答がありません";
  } catch (error) {
    bubbleA.querySelector(".comment").textContent = "エラーが発生しました";
    bubbleB.querySelector(".comment").textContent = "エラーが発生しました";
  } finally {
    bubbleA.classList.remove("loading");
    bubbleB.classList.remove("loading");
    sendBtn.disabled = false;
    sendBtn.textContent = "送信";
    switchMode(currentMode);
  }
}

// ===============================
// 画像プレビュー
// ===============================
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("previewArea").innerHTML = `<img src="${e.target.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

// ===============================
// 画像リサイズ & Base64化 (JPG圧縮)
// ===============================
function resizeImage(file, maxSize = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    reader.readAsDataURL(file);
  });
}

// ===============================
// 共有機能（失敗時は保存にフォールバック）
// ===============================
async function shareCapture() {
  try {
    const target = document.getElementById("captureArea");

    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "share.jpg", { type: "image/jpeg" });

    // --- まず共有を試す ---
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "フォトコメント",
          text: "写真とコメントを送ります"
        });
        triggerResetAnimation();
        return;
      } catch (err) {
        // 共有失敗 → メッセージ後に保存
        alert("共有に失敗しました。代わりに画像を保存します。\nSafariをご利用いただくと共有が可能です。");
        fallbackDownload(dataUrl);
        return;
      }
    }

    // --- URL共有のみ可能ならURL共有 ---
    if (navigator.share) {
      try {
        await navigator.share({
          title: "フォトコメント",
          text: "写真とコメントを送ります",
          url: dataUrl
        });
        triggerResetAnimation();
        return;
      } catch (err) {
        alert("共有に失敗しました。代わりに画像を保存します。\nSafariをご利用いただくと共有が可能です。");
        fallbackDownload(dataUrl);
        return;
      }
    }

    // --- 共有不可なら即保存 ---
    fallbackDownload(dataUrl);

  } catch (error) {
    console.error("共有エラー:", error);
    alert("共有に失敗しました。代わりに画像を保存します。");
    const target = document.getElementById("captureArea");
    const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 2 });
    fallbackDownload(canvas.toDataURL("image/jpeg", 0.8));
  }
}

// ===============================
// 保存フォールバック関数
// ===============================
function fallbackDownload(dataUrl) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "share.jpg";
  link.click();
  triggerResetAnimation();
}

// ===============================
// 白フェード＆リセット
// ===============================
function triggerResetAnimation() {
  const overlay = document.getElementById("fadeOverlay");
  overlay.classList.add("active");
  document.querySelectorAll("button").forEach(btn => btn.disabled = true);

  setTimeout(() => {
    resetUI();
    overlay.classList.remove("active");
    document.querySelectorAll("button").forEach(btn => btn.disabled = false);
  }, 500);
}

// ===============================
// UI初期化（スクロールリセット付き）
// ===============================
function resetUI() {
  document.getElementById("imageInput").value = "";
  document.getElementById("previewArea").innerHTML = "写真をアップロード";
  document.getElementById("username").value = "";
  document.getElementById("userComment").value = "";
  document.querySelectorAll(".emotion-btn").forEach(b => b.classList.remove("selected"));
  selectedEmotion = "";
  currentMode = "A";

  document.querySelector("#resultBubbleA .comment").textContent = "";
  document.querySelector("#resultBubbleB .comment").textContent = "";

  document.getElementById("resultBubbleA").classList.add("hidden");
  document.getElementById("resultBubbleB").classList.add("hidden");

  switchMode("A");
  window.scrollTo(0, 0);
}

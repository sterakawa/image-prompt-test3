// ===============================
// グローバル変数
// ===============================
let selectedEmotion = "";   // 感情ボタン選択
let currentMode = "A";      // A/Bモード
let personaPromptA = "";    // personaA.txt
let personaPromptB = "";    // personaB.txt
let rulePrompt = "";        // rule.txt

// ===============================
// ページロード時処理
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("user.js 読み込みテスト");

  // --- プロンプト読み込み ---
  try {
    const [aText, bText, ruleText] = await Promise.all([
      fetch("/prompts/personaA.txt").then(res => res.text()),
      fetch("/prompts/personaB.txt").then(res => res.text()),
      fetch("/prompts/rule.txt").then(res => res.text())
    ]);

    personaPromptA = aText.trim();
    personaPromptB = bText.trim();
    rulePrompt = ruleText.trim();

    console.log("ロードされたプロンプト:", { personaPromptA, personaPromptB, rulePrompt });
  } catch (err) {
    console.error("プロンプト読み込み失敗:", err);
  }

  // 感情ボタンのイベント
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

  // 送信ボタン
  document.getElementById("sendBtn").addEventListener("click", sendData);

  // 共有ボタン
  document.getElementById("shareBtn").addEventListener("click", shareCapture);
});

// ===============================
// A/Bモード切替（hidden尊重）
// ===============================
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("switchA").classList.toggle("active", mode === "A");
  document.getElementById("switchB").classList.toggle("active", mode === "B");

  const bubbleA = document.getElementById("resultBubbleA");
  const bubbleB = document.getElementById("resultBubbleB");

  // hiddenクラスがある場合は強制非表示
  bubbleA.style.display = bubbleA.classList.contains("hidden")
    ? "none"
    : (mode === "A" ? "inline-block" : "none");

  bubbleB.style.display = bubbleB.classList.contains("hidden")
    ? "none"
    : (mode === "B" ? "inline-block" : "none");
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

  // プロンプト未読み込み時はエラー
  if (!personaPromptA && !personaPromptB) {
    alert("人格プロンプトが読み込まれていません。/prompts/ を確認してください。");
    return;
  }

  // --- A/B両方のプロンプト（+固定ルール） ---
  const combinedPromptA = `${personaPromptA}\n${rulePrompt}`;
  const combinedPromptB = `${personaPromptB}\n${rulePrompt}`;

  // 感情をコメントに追加
  const emotionText = selectedEmotion ? `感情: ${selectedEmotion}\n` : "";

  // 送信用にリサイズ＆Base64化
  const base64Image = await resizeImage(imageInput.files[0], 512);

  // APIリクエストデータ（常に両方送る）
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

  console.log("送信データ:", requestData);

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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log("受信データ:", data);

    // バブル更新
    bubbleA.querySelector(".comment").textContent = data.commentA || "応答がありません";
    bubbleB.querySelector(".comment").textContent = data.commentB || "応答がありません";

  } catch (error) {
    console.error("送信エラー:", error);
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
// 画像リサイズ & Base64化
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
// 共有機能（成功時フェード＋リセット）
// ===============================
async function shareCapture() {
  try {
    const target = document.getElementById("captureArea");

    if (typeof html2canvas === "undefined") {
      alert("html2canvas が読み込まれていません");
      return;
    }

    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2
    });

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "share.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "フォトコメント",
        text: "写真とコメントを送ります"
      });

      triggerResetAnimation(); // 成功時のみリセット
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "share.png";
      link.click();

      triggerResetAnimation(); // 保存完了時もリセット
    }

  } catch (error) {
    console.error("共有エラー:", error);
    alert("共有に失敗しました");
  }
}

// ===============================
// 白フェード＆リセット処理
// ===============================
function triggerResetAnimation() {
  const overlay = document.getElementById("fadeOverlay");
  overlay.classList.add("active");

  // ボタン無効化
  document.querySelectorAll("button").forEach(btn => btn.disabled = true);

  setTimeout(() => {
    resetUI();
    overlay.classList.remove("active");
    document.querySelectorAll("button").forEach(btn => btn.disabled = false);
  }, 500);
}

// ===============================
// UI初期化（バブルも完全リセット）
// ===============================
function resetUI() {
  // 入力リセット
  document.getElementById("imageInput").value = "";
  document.getElementById("previewArea").innerHTML = "写真をアップロード";
  document.getElementById("username").value = "";
  document.getElementById("userComment").value = "";
  document.querySelectorAll(".emotion-btn").forEach(b => b.classList.remove("selected"));
  selectedEmotion = "";
  currentMode = "A";

  // コメントリセット
  document.querySelector("#resultBubbleA .comment").textContent = "";
  document.querySelector("#resultBubbleB .comment").textContent = "";

  // バブル完全非表示
  const bubbleA = document.getElementById("resultBubbleA");
  const bubbleB = document.getElementById("resultBubbleB");

  bubbleA.classList.add("hidden");
  bubbleB.classList.add("hidden");
  bubbleA.style.display = "none";
  bubbleB.style.display = "none";

  // モード切替初期化
  switchMode("A");
}

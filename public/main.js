console.log("main.js 読み込みテスト");

// ===============================
// グローバル変数
// ===============================
let selectedEmotion = ""; // 感情ボタンで選択された絵文字
let lastRequestData = null; // リトライ用に直前リクエスト保持

// ===============================
// DOMロード後の初期設定
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded 発火");

  // 感情ボタンのクリックイベント
  document.querySelectorAll(".emotion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".emotion-btn").forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");
      selectedEmotion = btn.dataset.emotion;
      console.log("選択された感情:", selectedEmotion);
    });
  });

  // 比較送信ボタン
  document.getElementById("compareBtn").addEventListener("click", sendData);

  // リセットボタン
  document.getElementById("resetBtn").addEventListener("click", resetForm);

  // ページロード時に保存されたプロンプト・名前を復元
  loadSavedPrompts();

  // 入力があればリアルタイム保存
  ["personaPromptA", "personaPromptB", "rulePrompt", "username"].forEach(id => {
    document.getElementById(id).addEventListener("input", savePrompts);
  });

  // 履歴表示
  displayHistory();
});

// ===============================
// 入力データをまとめて送信する関数
// ===============================
async function sendData() {
  console.log("sendData called");

  const personaAEl = document.getElementById("personaPromptA");
  const personaBEl = document.getElementById("personaPromptB");
  const rulePromptEl = document.getElementById("rulePrompt");
  const inputPromptEl = document.getElementById("promptInput");
  const usernameEl = document.getElementById("username");
  const imageInput = document.getElementById("imageInput");

  // 値取得
  const username = usernameEl.value || "匿名";
  const personaA = personaAEl.value;
  const personaB = personaBEl.value;
  const rulePrompt = rulePromptEl.value;
  const userPrompt = inputPromptEl.value;

  // === 履歴参照サマリー取得 ===
  const historySummary = getRecentHistorySummary();

  // 合成プロンプト
  const fixedPromptA = `${personaA}\n${rulePrompt}\n${historySummary}\n\n投稿者: ${username}\n感情: ${selectedEmotion}`;
  const fixedPromptB = `${personaB}\n${rulePrompt}\n${historySummary}\n\n投稿者: ${username}\n感情: ${selectedEmotion}`;

  // パラメータ
  const temperature = parseFloat(document.getElementById("temperature").value) || 0.7;
  const maxTokens = parseInt(document.getElementById("maxTokens").value) || 200;
  const topP = parseFloat(document.getElementById("topP").value) || 1.0;
  const model = document.getElementById("model").value;

  // 画像チェック
  if (!imageInput.files[0]) {
    alert("画像を選択してください");
    return;
  }

  // Base64変換
  const base64Image = await toBase64(imageInput.files[0]);

  // リトライ用データ
  lastRequestData = {
    promptA: fixedPromptA,
    promptB: fixedPromptB,
    userPrompt,
    image: base64Image,
    temperature,
    maxTokens,
    topP,
    model
  };

  console.log("送信データ:", lastRequestData);

  // APIリクエスト
  document.getElementById("loading").style.display = "block";

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lastRequestData)
  });

  const data = await response.json();
  console.log("APIレスポンス:", data);

  document.getElementById("loading").style.display = "none";

  // 結果表示
  document.getElementById("resultA").textContent =
    data.commentA || data.output_text || "応答がありません";
  document.getElementById("resultB").textContent =
    data.commentB || data.output_text || "応答がありません";

  // === タグ抽出 → 履歴保存 ===
  await extractTagsAndSave(base64Image, {
    userPrompt,
    emotion: selectedEmotion,
    commentA: data.commentA,
    commentB: data.commentB,
    timestamp: Date.now()
  });

  displayHistory();
}

// ===============================
// タグ抽出 → 履歴保存
// ===============================
async function extractTagsAndSave(base64Image, historyEntry) {
  try {
    const response = await fetch("/api/extractTags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });

    if (!response.ok) throw new Error(`タグ抽出エラー: ${response.status}`);
    const tagData = await response.json();

    console.log("タグ抽出結果:", tagData);

    // タグ情報を履歴に追加
    historyEntry.tags = tagData.tags || [];
    historyEntry.extractedEmotions = tagData.emotions || [];

    saveHistory(historyEntry);
  } catch (err) {
    console.error("タグ抽出失敗:", err);

    // タグが取れなくても履歴だけ保存
    saveHistory(historyEntry);
  }
}

// ===============================
// 履歴まとめ生成（件数指定）
// ===============================
function getRecentHistorySummary() {
  const useHistory = document.getElementById("useHistory")?.checked;
  if (!useHistory) {
    return "過去履歴は参照せず、新しい写真についてのみコメントしてください。";
  }

  const count = parseInt(document.getElementById("historyCount").value) || 3;
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const recent = history.slice(0, count);

  if (!recent.length) {
    return "過去履歴は参照せず、新しい写真についてのみコメントしてください。";
  }

  return `過去${recent.length}件のコメント履歴を参考にしてください:\n` + 
    recent.map((item, i) => {
      const tags = item.tags?.join(", ") || "タグなし";
      return `${i + 1}. 感情: ${item.emotion || "なし"} / タグ: ${tags} / コメント: ${item.userPrompt || "なし"}`;
    }).join("\n");
}

// ===============================
// 補助関数
// ===============================

// 画像をBase64に変換
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 入力保存
function savePrompts() {
  const prompts = {
    personaPromptA: document.getElementById("personaPromptA").value,
    personaPromptB: document.getElementById("personaPromptB").value,
    rulePrompt: document.getElementById("rulePrompt").value,
    username: document.getElementById("username").value
  };
  localStorage.setItem("prompts", JSON.stringify(prompts));
}

// 入力復元
function loadSavedPrompts() {
  const saved = localStorage.getItem("prompts");
  if (!saved) return;
  const data = JSON.parse(saved);
  document.getElementById("personaPromptA").value = data.personaPromptA || "";
  document.getElementById("personaPromptB").value = data.personaPromptB || "";
  document.getElementById("rulePrompt").value = data.rulePrompt || "";
  document.getElementById("username").value = data.username || "";
}

// ===============================
// 履歴保存・表示
// ===============================
function saveHistory(entry) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  // 履歴IDを生成
  entry.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  history.unshift(entry); // 先頭に追加
  if (history.length > 20) history.pop(); // 最大20件保持
  localStorage.setItem("history", JSON.stringify(history));
}

function displayHistory() {
  const historyEl = document.getElementById("historyResult");
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  if (!history.length) {
    historyEl.textContent = "履歴はまだありません";
    return;
  }

  historyEl.innerHTML = history.map(item => {
    const date = new Date(item.timestamp).toLocaleString();
    return `
      <div class="history-item">
        <strong>${date}</strong> (${item.emotion || "感情なし"})<br>
        <em>${item.userPrompt || "コメントなし"}</em><br>
        A: ${item.commentA || "なし"}<br>
        B: ${item.commentB || "なし"}<br>
        タグ: ${item.tags?.join(", ") || "なし"}<br>
        <small>ID: ${item.id}</small>
      </div>
      <hr>`;
  }).join("");
}

// リセット
function resetForm() {
  document.getElementById("personaPromptA").value = "";
  document.getElementById("personaPromptB").value = "";
  document.getElementById("rulePrompt").value = "";
  document.getElementById("promptInput").value = "";
  document.getElementById("username").value = "";
  document.querySelectorAll(".emotion-btn").forEach((b) =>
    b.classList.remove("selected")
  );
  selectedEmotion = "";
  document.getElementById("resultA").textContent = "結果A: 応答がありません";
  document.getElementById("resultB").textContent = "結果B: 応答がありません";
}

const allowedOrigins = new Set([
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "https://jessielin5411-sketch.github.io",
  "https://classroom-toolbox.vercel.app"
]);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = allowedOrigins.has(origin)
    ? origin
    : "https://jessielin5411-sketch.github.io";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 24000) {
        reject(new Error("REQUEST_TOO_LARGE"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });

    req.on("error", reject);
  });
}

function cleanText(value, maxLength = 800) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanList(value, maxItems = 16) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, 60))
    .filter(Boolean)
    .slice(0, maxItems);
}

function zh(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
}

function buildSemesterPrompt(payload) {
  const studentName = cleanText(payload.studentName, 40) || zh`學生`;
  const selectedTags = cleanList(payload.selectedTags);
  const specificEvent = cleanText(payload.specificEvent, 900) || zh`老師未補充具體事件`;
  const style = cleanText(payload.style, 30) || zh`溫暖鼓勵`;
  const wordCount = cleanText(payload.wordCount, 30) || zh`100-150字`;
  const variation = Number.isFinite(Number(payload.variation)) ? Number(payload.variation) : 0;

  return zh`# Role
你是一位任教於台灣國小的資深優良導師，精通兒童心理學與教育正向鼓勵法。

# Task
請根據學生資料、行為標籤與具體事件，生成一篇流暢、繁體中文、符合台灣校園語境、溫暖且專業的期末成績單評語。

# Rules
1. 採用三明治讚美法：先肯定學生優點或人際表現，再將待成長處轉化為具體建議，最後給予溫暖期許。
2. 嚴禁直接否定學生。請避免「不帶作業、愛講話、粗心」等生硬字眼，改寫成「若能加強個人物品管理能力、若能學習在合適的時間展現發表欲、若能在作答時多一份細心」。
3. 必須使用台灣教育現場用語，例如：同儕、表現、活潑、謹慎、期待、聯絡簿、貴家長。
4. 嚴禁使用中國大陸用語，例如：給力、學霸、素質、優化、做作業。
5. 必須依照勾選內容與補充事件生成，不可只套用固定模板。
6. 若是重新生成，請換句型、換開頭與結尾，避免和前一次雷同。
7. 字數限制只是自然長度方向，不要為了精準字數犧牲語句通順。

# Student Data
- 學生姓名：${studentName}
- 行為勾選：${selectedTags.length ? selectedTags.join("、") : zh`未勾選`}
- 其他補充：${specificEvent}
- 語氣風格：${style}
- 字數方向：${wordCount}
- 變化版本：${variation}

# Output
請直接輸出評語內文，不需要任何前言、結語或「好的，為您生成」等說明。`;
}

function buildParentPrompt(payload) {
  const rawEvent = cleanText(payload.rawEvent, 1000) || zh`老師尚未補充具體事件`;
  const details = cleanList(payload.details);
  const actions = cleanList(payload.actions);
  const channel = cleanText(payload.channel, 30) || zh`聯絡簿格式`;
  const tone = cleanText(payload.tone, 30) || zh`溫柔堅定`;
  const adjustment = cleanText(payload.adjustment, 30) || "generate";
  const variation = Number.isFinite(Number(payload.variation)) ? Number(payload.variation) : 0;

  const adjustmentRules = {
    regenerate: zh`請換一種說法，避免與前一次使用相同開頭、句型與結尾。`,
    warmer: zh`請加點溫暖與同理，讓文字更親切，但仍保持教師專業。`,
    shorter: zh`請更精簡，保留重點、關懷與行動建議。`
  };

  return zh`# Role
你是一位精通親師溝通、具備高度情緒教育素養的台灣國小班導師。

# Task
請將老師輸入的日常學生事件碎念，轉化為一篇符合台灣親師文化、兼顧親切感與教育專業的溝通文字，可用於聯絡簿或 LINE 訊息。

# Rules
1. 嚴格遵守三明治溝通法：先關懷或肯定，再客觀陳述事件，最後提出親師攜手的具體引導方向。
2. 用客觀、不帶情緒審判的字眼描述事件；避免「壞、惡意、故意」等字眼，可改成「一時心急、情緒有些起伏、在溝通上有些摩擦」。
3. 若事件是學用品、作業或生活提醒，不要誤寫成同儕衝突。
4. 若是 LINE 格式，句尾可適度加入 1 到 2 個溫暖 emoji，例如 😊、🙏。
5. 嚴禁使用中國大陸用語，必須完全符合台灣校園語境。
6. ${adjustmentRules[adjustment] || zh`請生成一篇自然、親切、專業的親師溝通文字。`}

# Teacher Input
- 事件碎念：${rawEvent}
- 行為細節勾選：${details.length ? details.join("、") : zh`未勾選`}
- 期望家長配合：${actions.length ? actions.join("、") : zh`未勾選`}
- 發送管道：${channel}
- 語氣風格：${tone}
- 變化版本：${variation}

# Output
請直接輸出溝通文字，不需要任何前言、結語或「好的，為您生成」等說明。`;
}

function buildPrompt(payload) {
  return payload.mode === "parent"
    ? buildParentPrompt(payload)
    : buildSemesterPrompt(payload);
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("").trim();
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: zh`只接受 POST 請求。` });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: zh`後端尚未設定 OPENAI_API_KEY 環境變數。` });
    return;
  }

  try {
    const payload = await readBody(req);
    const prompt = buildPrompt(payload);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        temperature: 0.85,
        max_output_tokens: 520
      })
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error?.message || zh`OpenAI API 呼叫失敗。`
      });
      return;
    }

    const text = extractOutputText(data);
    if (!text) {
      res.status(502).json({ error: zh`AI 沒有回傳可用文字，請稍後再試。` });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    const message = error.message === "REQUEST_TOO_LARGE"
      ? zh`輸入內容過長，請縮短補充內容。`
      : zh`後端暫時無法產生內容，請稍後再試。`;
    res.status(500).json({ error: message });
  }
}

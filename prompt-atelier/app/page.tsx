"use client";

import { useMemo, useState } from "react";

type StyleGroup = "全部" | "攝影" | "插畫" | "藝術" | "3D" | "設計";
type PromptMode = "detailed" | "compact";

type VisualStyle = {
  id: string;
  name: string;
  group: Exclude<StyleGroup, "全部">;
  description: string;
  direction: string;
  defaultLight: string;
  defaultComposition: string;
};

const styles: VisualStyle[] = [
  {
    id: "cinematic",
    name: "電影劇照",
    group: "攝影",
    description: "戲劇光影、電影構圖",
    direction: "cinematic film still, dramatic visual storytelling, realistic texture, subtle film grain, rich tonal range",
    defaultLight: "有方向性的電影光線，明暗層次深",
    defaultComposition: "電影感景別，主體明確，畫面具有敘事張力",
  },
  {
    id: "natural",
    name: "自然寫實",
    group: "攝影",
    description: "真實生活、自然光線",
    direction: "natural lifestyle photography, authentic details, candid atmosphere, realistic colors, editorial quality",
    defaultLight: "柔和自然光，光影真實",
    defaultComposition: "生活感構圖，不刻意擺拍",
  },
  {
    id: "studio",
    name: "商業棚拍",
    group: "攝影",
    description: "乾淨精緻、產品質感",
    direction: "premium studio photography, refined commercial art direction, flawless material detail, clean background",
    defaultLight: "精準棚拍光線，輪廓乾淨",
    defaultComposition: "置中或三分構圖，商品為唯一視覺焦點",
  },
  {
    id: "fashion",
    name: "時尚雜誌",
    group: "攝影",
    description: "高級編輯、前衛構圖",
    direction: "high-fashion editorial photography, bold art direction, sophisticated styling, magazine quality",
    defaultLight: "高反差時尚光或柔霧棚燈",
    defaultComposition: "大膽裁切與編輯式構圖",
  },
  {
    id: "food",
    name: "美食攝影",
    group: "攝影",
    description: "誘人細節、食物質地",
    direction: "appetizing food photography, delicious texture, fresh ingredients, premium culinary styling",
    defaultLight: "側向柔光，凸顯食物光澤與質地",
    defaultComposition: "45 度或俯拍構圖，主體份量清楚",
  },
  {
    id: "macro",
    name: "微距特寫",
    group: "攝影",
    description: "細節放大、淺景深",
    direction: "macro photography, extreme fine detail, shallow depth of field, precise focus, tactile texture",
    defaultLight: "細緻柔光，局部高光自然",
    defaultComposition: "極近距離特寫，背景柔化",
  },
  {
    id: "flat",
    name: "扁平插畫",
    group: "插畫",
    description: "簡潔圖形、清楚配色",
    direction: "clean flat illustration, simple geometric shapes, crisp edges, limited color palette, modern visual language",
    defaultLight: "無寫實光影，以色塊建立層次",
    defaultComposition: "圖形清楚、留白均衡、主次分明",
  },
  {
    id: "storybook",
    name: "繪本插畫",
    group: "插畫",
    description: "溫暖故事、手繪質感",
    direction: "charming storybook illustration, warm hand-drawn texture, gentle storytelling, expressive details",
    defaultLight: "溫暖柔和，帶童話氛圍",
    defaultComposition: "具有故事情境與視線引導",
  },
  {
    id: "anime",
    name: "日系動畫",
    group: "插畫",
    description: "清透色彩、動畫場景",
    direction: "Japanese animation-inspired illustration, expressive clean linework, luminous colors, detailed atmospheric background",
    defaultLight: "清透逆光或柔和環境光",
    defaultComposition: "動畫分鏡感，角色與場景關係自然",
  },
  {
    id: "comic",
    name: "復古漫畫",
    group: "插畫",
    description: "網點印刷、強烈線條",
    direction: "retro comic book illustration, bold ink outlines, halftone print texture, dynamic action composition",
    defaultLight: "高反差陰影，以墨線表現",
    defaultComposition: "動態透視與強烈視覺節奏",
  },
  {
    id: "paper-cut",
    name: "紙雕拼貼",
    group: "插畫",
    description: "層疊紙張、手作趣味",
    direction: "layered paper-cut illustration, handcrafted collage, tactile paper fibers, dimensional cut-paper shadows",
    defaultLight: "柔和側光，表現紙張層次",
    defaultComposition: "前後景分層，輪廓清楚",
  },
  {
    id: "line-art",
    name: "極簡線稿",
    group: "插畫",
    description: "乾淨線條、克制留白",
    direction: "minimal line art, elegant continuous strokes, generous negative space, refined modern simplicity",
    defaultLight: "無寫實光影，維持乾淨平面感",
    defaultComposition: "大量留白，線條焦點集中",
  },
  {
    id: "watercolor",
    name: "透明水彩",
    group: "藝術",
    description: "暈染柔和、紙張紋理",
    direction: "transparent watercolor painting, delicate pigment blooms, soft wet-on-wet edges, visible cold-press paper texture",
    defaultLight: "明亮通透，以水彩濃淡表現光線",
    defaultComposition: "輕盈留白，邊緣自然暈染",
  },
  {
    id: "oil",
    name: "古典油畫",
    group: "藝術",
    description: "厚實筆觸、經典光影",
    direction: "classical oil painting, rich impasto brushwork, museum-quality color depth, timeless painterly realism",
    defaultLight: "古典明暗法，柔和聚光",
    defaultComposition: "穩定經典，主體具有莊重感",
  },
  {
    id: "ink",
    name: "東方水墨",
    group: "藝術",
    description: "墨色留白、東方意境",
    direction: "contemporary East Asian ink wash painting, expressive brushwork, poetic negative space, subtle rice-paper texture",
    defaultLight: "以墨色濃淡表現空氣與距離",
    defaultComposition: "疏密有致，大量留白與流動感",
  },
  {
    id: "risograph",
    name: "孔版印刷",
    group: "藝術",
    description: "錯位疊色、印刷顆粒",
    direction: "risograph print, limited spot colors, charming ink misregistration, grainy analog print texture",
    defaultLight: "以疊色色塊表現層次",
    defaultComposition: "圖形化構圖，帶手工印刷的不完美",
  },
  {
    id: "pastel",
    name: "粉彩蠟筆",
    group: "藝術",
    description: "柔軟顆粒、溫柔色調",
    direction: "soft pastel drawing, visible chalk texture, gentle blended colors, tactile handmade warmth",
    defaultLight: "柔和漫射光，色彩溫柔",
    defaultComposition: "自然平衡，保留手繪呼吸感",
  },
  {
    id: "surreal",
    name: "超現實藝術",
    group: "藝術",
    description: "夢境隱喻、奇異尺度",
    direction: "surreal conceptual art, poetic visual metaphor, unexpected scale, dreamlike yet coherent imagery",
    defaultLight: "夢境般的戲劇光線",
    defaultComposition: "以不合理但美麗的關係製造視覺驚喜",
  },
  {
    id: "clay",
    name: "3D 黏土",
    group: "3D",
    description: "可愛圓潤、柔軟材質",
    direction: "charming 3D clay render, rounded handcrafted forms, soft tactile material, polished playful art direction",
    defaultLight: "柔和棚燈，陰影圓潤",
    defaultComposition: "主體集中，空間簡潔可愛",
  },
  {
    id: "isometric",
    name: "等角 3D",
    group: "3D",
    description: "俯視空間、資訊清楚",
    direction: "isometric 3D illustration, clean miniature environment, precise geometry, readable spatial storytelling",
    defaultLight: "均勻柔光，材質與空間清楚",
    defaultComposition: "等角俯視，物件配置有秩序",
  },
  {
    id: "glass",
    name: "玻璃擬態",
    group: "3D",
    description: "透明折射、未來質感",
    direction: "futuristic translucent glass 3D render, realistic refraction, luminous edges, premium digital material study",
    defaultLight: "彩色邊緣光與柔和環境光",
    defaultComposition: "極簡空間，突出透明材質",
  },
  {
    id: "miniature",
    name: "微縮模型",
    group: "3D",
    description: "袖珍世界、模型細節",
    direction: "highly detailed miniature diorama, tilt-shift depth, handcrafted model realism, whimsical tiny-world scale",
    defaultLight: "模型棚拍光，柔和陰影",
    defaultComposition: "俯視或微距視角，呈現完整微縮場景",
  },
  {
    id: "minimal-poster",
    name: "極簡海報",
    group: "設計",
    description: "大膽留白、單一焦點",
    direction: "minimalist graphic poster, bold negative space, one dominant visual idea, precise modern composition",
    defaultLight: "平面化處理，以色彩與形狀建立層次",
    defaultComposition: "單一視覺焦點，留白充足",
  },
  {
    id: "luxury",
    name: "精品廣告",
    group: "設計",
    description: "克制高級、品牌質感",
    direction: "luxury brand campaign, restrained elegance, premium materials, sophisticated art direction, immaculate finish",
    defaultLight: "精緻雕塑光，深色背景可帶輪廓光",
    defaultComposition: "畫面克制、主體高級、細節精準",
  },
  {
    id: "retro",
    name: "復古海報",
    group: "設計",
    description: "懷舊配色、印刷質感",
    direction: "vintage graphic poster, nostalgic color palette, screen-print texture, bold retro typography layout",
    defaultLight: "平面印刷感，不使用寫實光影",
    defaultComposition: "幾何排版與懷舊圖形，視覺直接",
  },
  {
    id: "cyberpunk",
    name: "霓虹未來",
    group: "設計",
    description: "夜色霓虹、科技氛圍",
    direction: "futuristic neon visual, cyberpunk atmosphere, luminous signage, rain-slick reflections, intricate technology detail",
    defaultLight: "霓虹側光、冷暖對比、夜間反射",
    defaultComposition: "深度透視，城市或科技元素層層延伸",
  },
  {
    id: "pixel",
    name: "像素藝術",
    group: "設計",
    description: "復古遊戲、清楚像素",
    direction: "polished pixel art, crisp pixel clusters, limited game-inspired palette, nostalgic 16-bit visual language",
    defaultLight: "以像素色階表現光影",
    defaultComposition: "遊戲場景式構圖，輪廓清楚",
  },
];

const groups: StyleGroup[] = ["全部", "攝影", "插畫", "藝術", "3D", "設計"];

const platforms = [
  { id: "chatgpt", name: "ChatGPT 圖片" },
  { id: "midjourney", name: "Midjourney" },
  { id: "gemini", name: "Gemini" },
  { id: "ideogram", name: "Ideogram" },
  { id: "general", name: "其他圖片 AI" },
];

const ratios = [
  { id: "1:1", name: "1:1 方形", hint: "社群貼文" },
  { id: "16:9", name: "16:9 橫式", hint: "簡報、網站" },
  { id: "4:5", name: "4:5 直式", hint: "Instagram" },
  { id: "9:16", name: "9:16 長直式", hint: "限動、短影音" },
  { id: "3:2", name: "3:2 橫式", hint: "攝影比例" },
];

const exampleIdeas = [
  "清晨的山間咖啡館，窗外有薄霧，一杯熱咖啡放在木桌上",
  "一款天然香氛蠟燭的高級產品照，帶有木質與植物元素",
  "未來城市中的綠色交通系統，展現科技與永續共存",
  "週末手作市集的社群主視覺，熱鬧但保持設計感",
];

function ratioParam(ratio: string) {
  return ratio.replace(":", ":");
}

function platformName(id: string) {
  return platforms.find((item) => item.id === id)?.name ?? "圖片 AI";
}

export default function Home() {
  const [group, setGroup] = useState<StyleGroup>("全部");
  const [styleId, setStyleId] = useState("cinematic");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("chatgpt");
  const [ratio, setRatio] = useState("1:1");
  const [colors, setColors] = useState("");
  const [lighting, setLighting] = useState("");
  const [composition, setComposition] = useState("");
  const [exactText, setExactText] = useState("");
  const [avoid, setAvoid] = useState("");
  const [promptMode, setPromptMode] = useState<PromptMode>("detailed");
  const [copied, setCopied] = useState(false);
  const [showError, setShowError] = useState(false);

  const selectedStyle = styles.find((item) => item.id === styleId) ?? styles[0];
  const visibleStyles = group === "全部" ? styles : styles.filter((item) => item.group === group);

  const prompt = useMemo(() => {
    if (!content.trim()) return "";

    const colorLine = colors.trim()
      ? `色彩以「${colors.trim()}」為主，整體配色一致且有層次。`
      : "配色需和主題一致，控制色彩數量並保持視覺和諧。";
    const lightLine = lighting.trim()
      ? `光線：${lighting.trim()}。`
      : `光線：${selectedStyle.defaultLight}。`;
    const compositionLine = composition.trim()
      ? `構圖：${composition.trim()}。`
      : `構圖：${selectedStyle.defaultComposition}。`;
    const textLine = exactText.trim()
      ? `畫面必須清楚、正確、逐字呈現文字「${exactText.trim()}」，不可增字、漏字或拼錯。`
      : "畫面中不要出現任何文字、字母、標誌或浮水印。";
    const avoidLine = avoid.trim()
      ? `避免：${avoid.trim()}、低解析度、模糊主體、錯誤肢體、重複物件、廉價素材感、浮水印。`
      : "避免：低解析度、模糊主體、錯誤肢體、重複物件、廉價素材感、過度銳化、浮水印。";

    const compact = `${content.trim()}，${selectedStyle.name}風格，${selectedStyle.direction}，${compositionLine} ${lightLine} ${colorLine} ${textLine} ${avoidLine}`;

    if (platform === "midjourney") {
      return promptMode === "compact"
        ? `${compact} --ar ${ratioParam(ratio)} --stylize 250`
        : `${content.trim()}。\n\n視覺風格：${selectedStyle.name}；${selectedStyle.direction}。\n${compositionLine}\n${lightLine}\n${colorLine}\n${textLine}\n畫面完成度高，主體清楚，細節精緻，符合專業發布品質。\n${avoidLine}\n\n--ar ${ratioParam(ratio)} --stylize 250`;
    }

    if (promptMode === "compact") {
      return compact;
    }

    const opening =
      platform === "chatgpt"
        ? "請直接生成一張圖片，不要先解釋或提供製作步驟。"
        : platform === "ideogram"
          ? "直接生成一張完成度高的圖片，優先確保構圖與文字準確。"
          : "請依照以下描述直接生成圖片。";

    return `${opening}

畫面內容：
${content.trim()}

視覺風格：
${selectedStyle.name}。${selectedStyle.direction}。

畫面設定：
- 比例：${ratio}
- ${compositionLine}
- ${lightLine}
- ${colorLine}
- ${textLine}

品質要求：
主體清楚，細節精緻，材質與光影合理，畫面具有專業發布品質。所有元素都必須服務於主要內容，不加入未要求的角色、物件或裝飾。

${avoidLine}`;
  }, [content, selectedStyle, platform, ratio, colors, lighting, composition, exactText, avoid, promptMode]);

  const chooseStyle = (id: string) => {
    setStyleId(id);
    setCopied(false);
  };

  const copyPrompt = async () => {
    if (!prompt) {
      setShowError(true);
      document.querySelector("#idea")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const fillExample = (idea: string) => {
    setContent(idea);
    setShowError(false);
  };

  const clearAll = () => {
    setGroup("全部");
    setStyleId("cinematic");
    setContent("");
    setPlatform("chatgpt");
    setRatio("1:1");
    setColors("");
    setLighting("");
    setComposition("");
    setExactText("");
    setAvoid("");
    setPromptMode("detailed");
    setCopied(false);
    setShowError(false);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Prompt Atelier 首頁">
          <span className="brand-mark">P</span>
          <span><strong>Prompt Atelier</strong><small>AI 製圖提示詞</small></span>
        </a>
        <nav>
          <a href="#styles">選擇風格</a>
          <a href="#result">查看提示詞</a>
          <button type="button" onClick={clearAll}>清空重來</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> IMAGE PROMPT BUILDER</div>
          <h1>選風格、寫內容，<br /><em>提示詞直接帶走。</em></h1>
          <p>專門為 AI 製圖設計。沒有複雜企劃流程，只留下生成圖片真正需要的內容、風格與規格。</p>
          <div className="hero-actions">
            <a className="primary-button" href="#idea">開始製作 <span>↓</span></a>
            <span className="micro-copy">免登入 · 免費使用 · 一鍵複製</span>
          </div>
        </div>
        <div className="hero-demo" aria-hidden="true">
          <div className="demo-input"><span>01</span><i /><i className="short" /></div>
          <div className="demo-plus">＋</div>
          <div className="demo-style">
            <span>02</span>
            <div className="mini-swatches"><i /><i /><i /></div>
          </div>
          <div className="demo-equals">＝</div>
          <div className="demo-prompt"><b>PROMPT</b><i /><i /><i /><i className="short" /></div>
        </div>
      </section>

      <section className="idea-section" id="idea">
        <div className="section-number">01</div>
        <div className="section-title">
          <p>YOUR IDEA</p>
          <h2>先寫下想要的畫面</h2>
          <span>用平常說話的方式描述即可，人物、場景、物件或氣氛都可以。</span>
        </div>
        <div className={`idea-box ${showError ? "has-error" : ""}`}>
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setShowError(false);
              setCopied(false);
            }}
            placeholder="例如：一隻橘貓坐在巴黎咖啡館窗邊，外面正在下雨，桌上有一杯熱咖啡……"
            rows={5}
            aria-label="想要生成的畫面內容"
          />
          <div className="idea-meta">
            <span>{content.length} 字</span>
            {showError && <strong>請先輸入想生成的畫面內容</strong>}
          </div>
        </div>
        <div className="examples">
          <span>不知道怎麼開始？試試：</span>
          <div>
            {exampleIdeas.map((idea, index) => (
              <button type="button" onClick={() => fillExample(idea)} key={idea}>範例 {index + 1}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="styles-section" id="styles">
        <div className="section-number">02</div>
        <div className="section-title">
          <p>VISUAL STYLE</p>
          <h2>點選一種常用風格</h2>
          <span>從攝影、插畫、藝術、3D 到平面設計，共 {styles.length} 種可直接套用。</span>
        </div>
        <div className="group-tabs" role="tablist" aria-label="風格分類">
          {groups.map((item) => (
            <button
              key={item}
              type="button"
              className={group === item ? "active" : ""}
              onClick={() => setGroup(item)}
              role="tab"
              aria-selected={group === item}
            >
              {item}
              <span>{item === "全部" ? styles.length : styles.filter((style) => style.group === item).length}</span>
            </button>
          ))}
        </div>
        <div className="style-grid">
          {visibleStyles.map((style) => (
            <button
              type="button"
              className={`style-card ${styleId === style.id ? "selected" : ""}`}
              key={style.id}
              onClick={() => chooseStyle(style.id)}
              aria-pressed={styleId === style.id}
            >
              <span className={`style-swatch swatch-${style.id}`} aria-hidden="true">
                <i /><i /><i />
              </span>
              <span className="style-info">
                <small>{style.group}</small>
                <strong>{style.name}</strong>
                <em>{style.description}</em>
              </span>
              <span className="selected-mark">✓</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-number">03</div>
        <div className="section-title">
          <p>OUTPUT</p>
          <h2>選擇工具與圖片比例</h2>
          <span>提示詞會依照不同工具整理格式，Midjourney 會自動加入比例參數。</span>
        </div>
        <div className="settings-grid">
          <fieldset>
            <legend>使用哪個 AI 製圖？</legend>
            <div className="platform-list">
              {platforms.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={platform === item.id ? "active" : ""}
                  onClick={() => setPlatform(item.id)}
                >
                  {item.name}<span>✓</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>圖片比例</legend>
            <div className="ratio-list">
              {ratios.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={ratio === item.id ? "active" : ""}
                  onClick={() => setRatio(item.id)}
                >
                  <i className={`ratio-shape ratio-${item.id.replace(":", "-")}`} />
                  <span><strong>{item.name}</strong><small>{item.hint}</small></span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <details className="advanced">
          <summary>
            <span><b>＋</b> 進階設定</span>
            <small>有特別要求時再填，不填也能直接生成提示詞</small>
          </summary>
          <div className="advanced-grid">
            <label><span>偏好色彩</span><input value={colors} onChange={(event) => setColors(event.target.value)} placeholder="例：奶油白、酒紅、深墨綠" /></label>
            <label><span>光線氛圍</span><input value={lighting} onChange={(event) => setLighting(event.target.value)} placeholder="例：夕陽逆光、柔和棚燈" /></label>
            <label><span>構圖要求</span><input value={composition} onChange={(event) => setComposition(event.target.value)} placeholder="例：人物在左側，右側保留留白" /></label>
            <label><span>畫面文字</span><input value={exactText} onChange={(event) => setExactText(event.target.value)} placeholder="沒有就留白" /></label>
            <label className="wide"><span>不要出現</span><input value={avoid} onChange={(event) => setAvoid(event.target.value)} placeholder="例：不要人物、不要霓虹色、不要過度卡通化" /></label>
          </div>
        </details>
      </section>

      <section className="result-section" id="result">
        <div className="result-intro">
          <div className="section-number">04</div>
          <div className="section-title">
            <p>READY TO COPY</p>
            <h2>你的製圖提示詞</h2>
            <span>內容或風格改變時，這裡會立即更新。</span>
          </div>
        </div>

        <div className="result-layout">
          <div className="result-card">
            <div className="result-bar">
              <div>
                <i />
                <span>{platformName(platform)}</span>
                <b>{selectedStyle.name}</b>
              </div>
              <div className="mode-toggle" role="group" aria-label="提示詞長度">
                <button type="button" className={promptMode === "detailed" ? "active" : ""} onClick={() => setPromptMode("detailed")}>完整版</button>
                <button type="button" className={promptMode === "compact" ? "active" : ""} onClick={() => setPromptMode("compact")}>精簡版</button>
              </div>
            </div>
            <div className={`prompt-text ${prompt ? "" : "empty"}`}>
              {prompt ? <pre>{prompt}</pre> : (
                <div>
                  <span>✦</span>
                  <strong>輸入畫面內容後，提示詞會立即出現在這裡</strong>
                  <p>已選擇：{selectedStyle.name} · {ratio} · {platformName(platform)}</p>
                </div>
              )}
            </div>
            <button type="button" className={`copy-button ${copied ? "copied" : ""}`} onClick={copyPrompt}>
              {copied ? "✓ 已複製，可以貼到 AI 製圖" : "複製提示詞"} <span>↗</span>
            </button>
          </div>

          <aside className="selection-summary">
            <span>目前選擇</span>
            <div className={`summary-swatch swatch-${selectedStyle.id}`}><i /><i /><i /></div>
            <h3>{selectedStyle.name}</h3>
            <p>{selectedStyle.description}</p>
            <dl>
              <div><dt>AI 工具</dt><dd>{platformName(platform)}</dd></div>
              <div><dt>圖片比例</dt><dd>{ratio}</dd></div>
              <div><dt>提示詞</dt><dd>{promptMode === "detailed" ? "完整版" : "精簡版"}</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <footer>
        <div>
          <span className="brand-mark">P</span>
          <p><strong>Prompt Atelier</strong><br />選風格、寫內容，提示詞直接帶走。</p>
        </div>
        <p>免登入使用。你輸入的內容不會上傳或儲存。</p>
      </footer>
    </main>
  );
}

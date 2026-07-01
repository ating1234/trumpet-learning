import rapaData from '../../src/data/rapaData.json';

// 安全驗證 Helper
function authorize(request, env) {
  const correctPassword = env.ACCESS_PASSWORD || 'rapa123';
  const authHeader = request.headers.get('Authorization');
  return authHeader === correctPassword;
}

export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  // 安全攔截
  if (!authorize(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized', message: '認證失敗，請輸入正確密碼。' }), {
      status: 401,
      headers
    });
  }

  const DB = context.env.DB;
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  const OPENAI_API_KEY = context.env.OPENAI_API_KEY;

  try {
    const { question } = await context.request.json();
    if (!question) {
      return new Response(JSON.stringify({ error: '缺少 question 參數' }), { status: 400, headers });
    }

    // 1. 撈出 D1 中的自訂影音與概念，並與預設資料合併，作為 Context 上下文
    let allVideos = [...rapaData.videos];
    let allConcepts = [...rapaData.concepts];

    if (DB) {
      try {
        const { results: d1Videos } = await DB.prepare("SELECT * FROM videos").all();
        const customVideos = d1Videos.map(row => {
          let tags = [], notes = [];
          try { tags = JSON.parse(row.tags || '[]'); } catch (e) {}
          try { notes = JSON.parse(row.notes || '[]'); } catch (e) {}
          return { ...row, tags, notes };
        });

        const { results: d1Concepts } = await DB.prepare("SELECT * FROM concepts").all();
        
        const videoMap = new Map();
        rapaData.videos.forEach(v => videoMap.set(v.id, v));
        customVideos.forEach(v => videoMap.set(v.id, v));
        allVideos = Array.from(videoMap.values());

        const conceptMap = new Map();
        rapaData.concepts.forEach(c => conceptMap.set(c.id, c));
        d1Concepts.forEach(c => conceptMap.set(c.id, c));
        allConcepts = Array.from(conceptMap.values());
      } catch (dbErr) {
        console.warn('問答 API 合併 D1 失敗，將僅使用預設 JSON 作為 Context。', dbErr);
      }
    }

    // 2. 組裝 Context 文本以進行資料庫內檢索
    let contextText = "【當前小號知識庫收錄的教學影片列表】:\n";
    allVideos.forEach((v, index) => {
      contextText += `${index + 1}. 標題: "${v.title}" | 平台: ${v.platform} | 網址: ${v.url}\n`;
      contextText += `   摘要: ${v.summary}\n`;
      contextText += `   重點時間點:\n`;
      v.notes.forEach(n => {
        contextText += `     - [${n.time}] ${n.title}: ${n.content}\n`;
      });
    });

    contextText += "\n【當前收錄的核心小號觀念與文章】:\n";
    allConcepts.forEach((c, index) => {
      contextText += `${index + 1}. 觀念標題: "${c.title}" | 網址: ${c.url || '無'}\n`;
      contextText += `   內容描述: ${c.description}\n`;
    });

    // 3. 準備發送給 LLM 的 System Prompt 規範 (要求結構化來源與嚴格的主題限制)
    const systemPrompt = `你是一個專業的 Adam Rapa 小號教學智能導師。
你的任務是回答使用者的吹奏問題。請仔細查閱以下提供的【當前小號知識庫】上下文。

【⚠️ 嚴格主題限制 - 核心規則】
1. 你「只能」回答與「小號吹奏技術」、「小號練習方法」、「吹奏物理機制（如口型 Embouchure、呼吸法 Airflow、Wedge Technique 等）」、「小號保養與恢復」以及「與 Adam Rapa 的教學理念、影片、文章」直接相關的話題。
2. 如果使用者的問題與「小號學習」或「Adam Rapa」完全無關（例如問天氣、寫程式碼、問歷史八卦、一般無關問候與政治等），你「必須絕對拒絕回答」！
3. 拒絕回答時，請在 JSON 的 "answer" 欄位中禮貌地回覆：
   「您好！我是您的 Adam Rapa 智能小號導師。我只回答與 Adam Rapa 小號學習、吹奏技巧、呼吸法以及本知識庫相關的專業小號問題。請問有什麼我可以協助您的小號學習嗎？🎺」
   並且將 "found_in_db" 設為 false，"sources" 設為 []，"suggested_import" 設為 null。

請「嚴格且僅」輸出一個符合以下結構的 JSON 對象，不要包含任何 markdown 標記（如 \`\`\`json 或是 \`\`\`）：
{
  "answer": "給使用者的繁體中文答覆。請詳細解答他的小號問題。",
  "found_in_db": true, // 若答案能在提供的【當前小號知識庫】中找到，設為 true。若資料庫查無或不足，設為 false
  "sources": [ // 本次回答所引用的參考來源列表。若被限制規則拒絕回答，則此處為 []。若有參考，請從 Context 中找出項目加入，或加入參考的聯網外部網址。
    {
      "title": "來源影片或觀念文章的精確標題",
      "url": "來源網址",
      "type": "video" 或 "concept" 或 "web", // 來自庫內影音、庫內觀念，或是外部網頁
      "youtubeId": "11位YouTube ID，若是YouTube影音且有的話，否則為空"
    }
  ],
  "suggested_import": { // 若被限制規則拒絕回答，則此處為 null。若 found_in_db 為 false 且有合適的網路資源，在此附上建議匯入的影音或觀念，無則為 null
    "type": "video" 或 "concept",
    "data": {
      // 若為 video，必須包含: id (唯一字串), title, type ("video"/"shorts"), platform ("YouTube"/"Website"), youtubeId (11位ID，若有), url, duration (時長), thumbnail (圖片網址), tags (陣列), summary (100字摘要), notes (包含 time, timestamp, title, content 的陣列)
      // 若為 concept，必須包含: id (唯一字串), title, url, description (詳細文字觀念)
    }
  }
}
注意：所有回答與文字描述請一律使用 Traditional Chinese (繁體中文)。`;

    const userPrompt = `【當前小號知識庫】:\n${contextText}\n\n使用者提出的問題: ${question}`;

    let jsonResult = null;

    if (GEMINI_API_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n現在請分析並回答此問題，直接回傳純 JSON：\n${userPrompt}`
            }]
          }],
          tools: [{
            googleSearch: {}
          }]
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API Error: ${errText}`);
      }

      const resData = await geminiRes.json();
      const rawText = resData.candidates[0].content.parts[0].text;
      
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleanJsonText);

    } else if (OPENAI_API_KEY) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        throw new Error(`OpenAI API Error: ${errText}`);
      }

      const resData = await openaiRes.json();
      const rawText = resData.choices[0].message.content;
      jsonResult = JSON.parse(rawText);
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '未配置 LLM API 金鑰。請在 Cloudflare 設定 GEMINI_API_KEY 或 OPENAI_API_KEY。' 
      }), { headers });
    }

    return new Response(JSON.stringify({ success: true, data: jsonResult }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

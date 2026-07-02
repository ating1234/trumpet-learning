// 安全驗證 Helper
function authorize(request, env) {
  const correctPassword = env.ACCESS_PASSWORD || 'rapa123';
  const authHeader = request.headers.get('Authorization');
  return authHeader === correctPassword;
}

// 核心解析邏輯 Helper
async function doParse(context, url, content) {
  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  const OPENAI_API_KEY = context.env.OPENAI_API_KEY;

  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    return {
      error: 'no_key',
      message: 'Cloudflare 後端尚未設定 API 金鑰。請在 Cloudflare Pages 的環境變數中設定 GEMINI_API_KEY 或 OPENAI_API_KEY。'
    };
  }

  let title = '';
  let descriptionText = '';
  
  if (url && !content) {
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (pageRes.ok) {
        const html = await pageRes.text();
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();
        
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || 
                          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (descMatch) descriptionText = descMatch[1].trim();
      }
    } catch (e) {
      console.error('抓取目標網頁 HTML 失敗', e);
    }
  }

  const systemPrompt = `你是一個專業的小號教學知識整理小助手。請分析以下網頁影音連結或貼上的文章內容，提煉出該教學的結構化 JSON 數據。
請「嚴格且僅」輸出一個符合以下結構的 JSON 對象，不要包含任何 markdown 標記（如 \`\`\`json 或是 \`\`\`）：
{
  "title": "教學影片或文章的精確繁體中文標題",
  "tags": ["標籤1", "標籤2"],
  "summary": "100字左右的繁體中文教學核心摘要，解釋此教學的核心施力或練習方法",
  "notes": [
    { "time": "章節重點名稱或時間點", "content": "該重點對應的具體繁體中文教學重點內容說明" }
  ]
}
請確保 tags 是關於小號技巧的（例如: Embouchure, Airflow, Posture, Wedge, Buzzing, Lip Recovery）。
如果內容是文字文章而非影片，notes 陣列請保留 2-3 個主要章節重點，並給予虛擬的時間點或章節名稱（例如 00:00 導言，或依據文章分段）。
所有繁體中文內容請使用 Traditional Chinese。`;

  let userPrompt = '';
  if (content) {
    userPrompt = `直接貼上的文章內容:\n${content}`;
  } else {
    userPrompt = `目標網址: ${url}\n網頁標題: ${title}\n網頁描述/前言: ${descriptionText}`;
  }

  let jsonResult = null;

  if (GEMINI_API_KEY) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n現在請分析以下內容，並直接回傳純 JSON：\n${userPrompt}`
          }]
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
  }

  return { success: true, data: jsonResult };
}

export async function onRequestGet(context) {
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

  const { searchParams } = new URL(context.request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: '缺少 url 參數' }), {
      status: 400,
      headers
    });
  }

  try {
    const result = await doParse(context, url, null);
    if (result.error) {
      return new Response(JSON.stringify(result), { status: 200, headers });
    }
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
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

  try {
    const { url, content } = await context.request.json();
    
    if (!url && !content) {
      return new Response(JSON.stringify({ error: '缺少 url 或 content 參數' }), {
        status: 400,
        headers
      });
    }

    const result = await doParse(context, url, content);
    if (result.error) {
      return new Response(JSON.stringify(result), { status: 200, headers });
    }
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} }

      const resData = await openaiRes.json();
      const rawText = resData.choices[0].message.content;
      jsonResult = JSON.parse(rawText);
    }

    return new Response(JSON.stringify({ success: true, data: jsonResult }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

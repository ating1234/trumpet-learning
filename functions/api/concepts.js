import rapaData from '../../src/data/rapaData.json';

export async function onRequestGet(context) {
  const DB = context.env.DB;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  if (!DB) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: rapaData.concepts,
      warning: 'DB_NOT_BOUNDED' 
    }), { headers });
  }

  try {
    // 查詢 D1 中自訂新增的觀念/文章
    const { results } = await DB.prepare("SELECT * FROM concepts ORDER BY created_at DESC").all();
    
    const customConcepts = results.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url || '',
      description: row.description
    }));

    // 合併預設觀念與資料庫自訂觀念
    const conceptMap = new Map();
    rapaData.concepts.forEach(c => conceptMap.set(c.id, c));
    customConcepts.forEach(c => conceptMap.set(c.id, c));

    return new Response(JSON.stringify({ 
      success: true, 
      data: Array.from(conceptMap.values()) 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: rapaData.concepts, 
      error: error.message 
    }), { headers });
  }
}

export async function onRequestPost(context) {
  const DB = context.env.DB;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: 'Cloudflare D1 未綁定，無法在線上寫入。' }), {
      status: 500,
      headers
    });
  }

  try {
    const newItem = await context.request.json();
    
    // 驗證必要欄位
    if (!newItem.id || !newItem.title || !newItem.description) {
      return new Response(JSON.stringify({ success: false, error: '缺少必要欄位' }), {
        status: 400,
        headers
      });
    }

    // 寫入 D1
    await DB.prepare(
      "INSERT INTO concepts (id, title, url, description) VALUES (?, ?, ?, ?)"
    ).bind(
      newItem.id,
      newItem.title,
      newItem.url || null,
      newItem.description
    ).run();

    return new Response(JSON.stringify({ success: true, message: '成功寫入 D1 資料庫！' }), { headers });
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

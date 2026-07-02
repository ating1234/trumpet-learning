import rapaData from '../../src/data/rapaData.json';

// 安全驗證 Helper
function authorize(request, env) {
  const correctPassword = env.ACCESS_PASSWORD || 'rapa123';
  const authHeader = request.headers.get('Authorization');
  return authHeader === correctPassword;
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

  const DB = context.env.DB;

  if (!DB) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: rapaData.concepts,
      warning: 'DB_NOT_BOUNDED' 
    }), { headers });
  }

  try {
    const { results } = await DB.prepare("SELECT * FROM concepts ORDER BY created_at DESC").all();
    
    const customConcepts = results.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url || '',
      description: row.description
    }));

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

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: 'Cloudflare D1 未綁定，無法在線上寫入。' }), {
      status: 500,
      headers
    });
  }

  try {
    const newItem = await context.request.json();
    
    if (!newItem.id || !newItem.title || !newItem.description) {
      return new Response(JSON.stringify({ success: false, error: '缺少必要欄位' }), {
        status: 400,
        headers
      });
    }

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

export async function onRequestDelete(context) {
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

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: 'Cloudflare D1 未綁定，無法在線上刪除。' }), {
      status: 500,
      headers
    });
  }

  try {
    const { id, deleteKey } = await context.request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少必要欄位 id' }), {
        status: 400,
        headers
      });
    }

    const correctDeleteKey = context.env.DELETE_KEY || 'rapa123';
    if (!deleteKey || deleteKey !== correctDeleteKey) {
      return new Response(JSON.stringify({ success: false, error: '刪除金鑰（Delete Key）錯誤，拒絕執行刪除。' }), {
        status: 403,
        headers
      });
    }

    await DB.prepare("DELETE FROM concepts WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, message: '已成功從 D1 刪除觀念！' }), { headers });
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

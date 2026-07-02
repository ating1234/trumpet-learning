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
      data: rapaData.videos,
      warning: 'DB_NOT_BOUNDED' 
    }), { headers });
  }

  try {
    const { results } = await DB.prepare("SELECT * FROM videos ORDER BY created_at DESC").all();
    
    const customVideos = results.map(row => {
      let tags = [];
      let notes = [];
      try {
        tags = JSON.parse(row.tags || '[]');
      } catch (e) {
        tags = (row.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      }
      try {
        notes = JSON.parse(row.notes || '[]');
      } catch (e) {
        notes = [];
      }
      
      return {
        id: row.id,
        title: row.title,
        type: row.type,
        platform: row.platform,
        youtubeId: row.youtubeId || '',
        url: row.url,
        duration: row.duration,
        thumbnail: row.thumbnail,
        tags,
        notes
      };
    });

    const videoMap = new Map();
    rapaData.videos.forEach(v => videoMap.set(v.id, v));
    customVideos.forEach(v => videoMap.set(v.id, v));

    return new Response(JSON.stringify({ 
      success: true, 
      data: Array.from(videoMap.values()) 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: true, 
      data: rapaData.videos, 
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
    
    if (!newItem.id || !newItem.title || !newItem.url) {
      return new Response(JSON.stringify({ success: false, error: '缺少必要欄位' }), {
        status: 400,
        headers
      });
    }

    await DB.prepare(
      "INSERT INTO videos (id, title, type, platform, youtubeId, url, duration, thumbnail, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      newItem.id,
      newItem.title,
      newItem.type,
      newItem.platform,
      newItem.youtubeId || null,
      newItem.url,
      newItem.duration,
      newItem.thumbnail,
      JSON.stringify(newItem.tags || []),
      JSON.stringify(newItem.notes || [])
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
    const { id } = await context.request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少必要欄位 id' }), {
        status: 400,
        headers
      });
    }

    await DB.prepare("DELETE FROM videos WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, message: '已成功從 D1 刪除影片！' }), { headers });
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

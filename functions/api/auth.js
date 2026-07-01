export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { password } = await context.request.json();
    
    // 獲取 Cloudflare 後端設定的密碼，若未設定則預設為 rapa123
    const correctPassword = context.env.ACCESS_PASSWORD || 'rapa123';

    if (password === correctPassword) {
      return new Response(JSON.stringify({ 
        success: true, 
        token: correctPassword // 直接將密碼作為簡單的 Authorization Token 回傳
      }), { headers });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '密碼錯誤，請重新輸入！' 
      }), { status: 401, headers });
    }
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

#!/usr/bin/env python3
import urllib.request
import urllib.parse
import ssl
import json
import re

def resolve_redirect(url):
    context = ssl._create_unverified_context()
    try:
        class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                self.redirected_url = newurl
                return None

        handler = NoRedirectHandler()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(), handler)
        urllib.request.install_opener(opener)
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        try:
            with urllib.request.urlopen(req, context=context, timeout=10) as r:
                return r.geturl()
        except urllib.error.HTTPError as e:
            if e.code in [301, 302, 303, 307, 308]:
                loc = e.headers.get('Location')
                if loc:
                    return loc
            return f"HTTP Error {e.code}"
    except Exception as e:
        return str(e)

def check_youtube_video(video_id):
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    context = ssl._create_unverified_context()
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, context=context, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            return True, data.get('title', 'Unknown Title')
    except Exception as e:
        return False, str(e)

def main():
    urls = {
        "High Note Technique": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE1RbQyOJHJSOi_DzWXoi1Nvuu9Fej001Vs1vI8LVMKrnVzFkyIaGd4IgnHk11u57rvQ5wudzkf86-HMnV5KJPnu-I79hq_QWB5jKKKua3LiCt3zwajW1rups8ZBd-SIhKO",
        "Feldenkrais & Range": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHEsk-lexQHEkG5Q20z0OUdSXKbnvEtRzo3G0qZCnBwr_C-I02d2kzz9u5qn9UOx1jTJKXZW-h9cYvp0TVjqYxuafHzbiRd_nErZVrwkxjxOOEPn3chdokAcOqFcmZVC9bW"
    }
    
    print("=" * 80)
    print("  Google Grounding Redirect 第三波解析 (Feldenkrais & High Range)")
    print("=" * 80)
    
    pattern = r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})'
    
    for name, url in urls.items():
        print(f"[{name}] 解析重定向...")
        resolved = resolve_redirect(url)
        print(f"  └─ 重定向URL: {resolved}")
        
        match = re.search(pattern, resolved)
        if match:
            vid = match.group(1)
            print(f"  └─ 偵測到 Video ID: {vid}")
            is_ok, title = check_youtube_video(vid)
            if is_ok:
                print(f"  └─ 【驗證成功】真實標題: {title}")
            else:
                print(f"  └─ 【驗證失敗】原因: {title}")
        else:
            print("  └─ 【無法提取 Video ID】")
        print()
        
    print("=" * 80)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import json
import os
import re
import sys

def extract_youtube_id(url):
    # Regex to extract YouTube video ID from various URL formats
    pattern = r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def parse_time_to_seconds(time_str):
    try:
        parts = list(map(int, time_str.split(':')))
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
    except Exception:
        pass
    return 0

def main():
    print("=" * 60)
    print("  Adam Rapa 小號教學知識庫 - 新增影片工具")
    print("=" * 60)

    # Resolve data path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.abspath(os.path.join(script_dir, "..", "src", "data", "rapaData.json"))

    if not os.path.exists(data_path):
        print(f"錯誤：找不到資料檔案於 {data_path}")
        sys.exit(1)

    # Read current data
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"錯誤：讀取 JSON 檔案失敗。{e}")
        sys.exit(1)

    # Get inputs
    url = input("1. 請輸入影片連結 (URL): ").strip()
    if not url:
        print("URL 不能為空！已取消操作。")
        return

    yt_id = extract_youtube_id(url)
    
    # Auto-detect platform and type
    platform = "YouTube" if yt_id or "youtube.com" in url or "youtu.be" in url else "TikTok"
    if "tiktok.com" in url:
        platform = "TikTok"
    
    default_type = "video"
    if yt_id and "shorts" in url:
        default_type = "shorts"
    elif platform == "TikTok":
        default_type = "tiktok"

    print(f"   [系統偵測] 平台: {platform}, 預設類型: {default_type}")
    
    type_input = input(f"2. 請輸入類型 (video/shorts/tiktok) [預設: {default_type}]: ").strip()
    video_type = type_input if type_input in ["video", "shorts", "tiktok"] else default_type

    title = input("3. 請輸入影片標題 (Title): ").strip()
    if not title:
        title = f"未命名 {platform} 教學影片"

    duration = input("4. 請輸入影片長度 (例如 12:45 或 0:58): ").strip()
    if not duration:
        duration = "0:00"

    tags_input = input("5. 請輸入主題標籤 (以英文逗號分隔，例如 Breathing, High Range): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()]

    summary = input("6. 請輸入教學核心摘要: ").strip()

    print("\n7. 請輸入時間點筆記 (格式: 時間點|標題|筆記內容)")
    print("   例如: 02:15|呼吸的基本原理|說明正確吸氣應擴張後背與兩側")
    print("   輸入完畢後，直接按 Enter (空行) 即可結束。")
    
    notes = []
    while True:
        note_line = input(f"   筆記 #{len(notes) + 1} > ").strip()
        if not note_line:
            break
        
        parts = note_line.split("|")
        if len(parts) >= 2:
            time_str = parts[0].strip()
            note_title = parts[1].strip()
            note_content = parts[2].strip() if len(parts) > 2 else ""
            
            notes.append({
                "time": time_str,
                "timestamp": parse_time_to_seconds(time_str),
                "title": note_title,
                "content": note_content
            })
        else:
            print("   [警告] 格式錯誤，必須包含 '|'。例如: '01:30|主題|內容'")

    # Generate unique ID
    import random
    video_id = f"apa-{video_type}-{random.randint(100, 999)}"
    
    # Placeholders for thumbnails based on type
    thumb_map = {
        "video": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
        "shorts": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
        "tiktok": "https://images.unsplash.com/photo-1573871666457-7c7329415201?auto=format&fit=crop&w=600&q=80"
    }
    
    new_video = {
        "id": video_id,
        "title": title,
        "type": video_type,
        "platform": platform,
        "youtubeId": yt_id if yt_id else "",
        "url": url,
        "duration": duration,
        "thumbnail": thumb_map.get(video_type, thumb_map["video"]),
        "tags": tags,
        "summary": summary,
        "notes": notes
    }

    # Append to top of the video list
    data["videos"].insert(0, new_video)

    # Save back to JSON file
    try:
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("\n" + "=" * 60)
        print(f"成功！已將新影片『{title}』寫入資料庫！")
        print(f"ID: {video_id}，共 {len(notes)} 筆時間點筆記。")
        print("請重新整理網頁即可看見更新。")
        print("=" * 60)
    except Exception as e:
        print(f"錯誤：儲存 JSON 檔案失敗。{e}")

if __name__ == "__main__":
    main()

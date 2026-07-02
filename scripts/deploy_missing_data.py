#!/usr/bin/env python3
import json
import os
import sys

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
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.abspath(os.path.join(script_dir, "..", "src", "data", "rapaData.json"))
    sql_path = os.path.abspath(os.path.join(script_dir, "..", "insert_missing_data.sql"))

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

    existing_youtube_ids = {v.get("youtubeId") for v in data.get("videos", []) if v.get("youtubeId")}
    existing_concept_ids = {c.get("id") for c in data.get("concepts", [])}

    # 13 missing videos
    new_videos = [
        {
            "id": "apa-video-01",
            "title": "1. (Kryptonite for) Anxiety & Ego - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "4tLr3kL9CQM",
            "url": "https://www.youtube.com/watch?v=4tLr3kL9CQM",
            "duration": "9:00",
            "thumbnail": "https://img.youtube.com/vi/4tLr3kL9CQM/hqdefault.jpg",
            "tags": ["Mindset", "Anxiety Control", "Ego Management"],
            "summary": "Adam Rapa 探討如何消除演奏時的恐懼、焦慮與自負。他指出，許多吹奏者將自我價值與表演結果鎖定，導致身心緊繃。透過轉移注意力到傳遞音樂能量上，能釋放演奏潛能。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "演奏焦慮的根源與自我價值綁定", "content": "說明許多小號手會因為把自我價值與每次演奏的音準、高音表現綁定，而產生極大得焦慮，這需要將心態從自我證明中抽離。"},
                {"time": "02:30", "timestamp": 150, "title": "注意力轉移：從『不吹錯』到『傳遞能量』", "content": "分享如何將大腦注意力從防禦性的思維，移轉至強烈的音樂故事與情感表達，這能自動協調身體肌肉放鬆。"},
                {"time": "05:00", "timestamp": 300, "title": "安撫 Ego 的心智練習", "content": "提供一套在舞台上安撫內心 Ego（恐懼失敗）的具體冥想與深呼吸技巧。"}
            ]
        },
        {
            "id": "apa-video-03",
            "title": "3. It's About The VIBE! - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "wW6UJjONL9A",
            "url": "https://www.youtube.com/watch?v=wW6UJjONL9A",
            "duration": "5:30",
            "thumbnail": "https://img.youtube.com/vi/wW6UJjONL9A/hqdefault.jpg",
            "tags": ["Mindset", "Musical Expression", "Tone Quality"],
            "summary": "本影片介紹「The VIBE」（音樂共振與能量場）的概念。Adam Rapa 強調演奏者與聽眾之間的能量流動，小號不僅是物理聲音的傳輸器，更是情感與意圖的共鳴器。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "什麼是 The VIBE？音樂中的隱形能量", "content": "解釋聲音背後的意圖和能量場，這往往決定了聽眾能否感受到共鳴，而不僅漸是完美的音符。"},
                {"time": "01:45", "timestamp": 105, "title": "調整身心狀態以產物理共鳴", "content": "說明如何透過調整內在狀態來放鬆呼吸系統，從而產生音色上更寬廣、更有穿透力的共鳴。"},
                {"time": "03:30", "timestamp": 210, "title": "將喜悅與意圖融入音色中的具體方法", "content": "示範吹奏簡單音符時注入不同的情感意圖，聽眾能立即感知音色質地的奇妙改變。"}
            ]
        },
        {
            "id": "apa-video-04",
            "title": "4. I'M A SLOW LEARNER - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "KA6creZKxPk",
            "url": "https://www.youtube.com/watch?v=KA6creZKxPk",
            "duration": "7:00",
            "thumbnail": "https://img.youtube.com/vi/KA6creZKxPk/hqdefault.jpg",
            "tags": ["Daily Practice", "Time Management", "Mindset"],
            "summary": "面對複雜的技巧與練習，Adam Rapa 分享他如何自認是「慢學型」演奏者，並提倡細緻、緩慢且零容忍 physical strain (物理掙扎) 的練習習慣。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "慢速練習的物理重要性", "content": "強調大腦編程肌肉記憶時，只有在完全沒有物理掙扎和聳肩、用力不當的情況下，才能建立正確的反射。"},
                {"time": "02:15", "timestamp": 135, "title": "為什麼急於求成會引入防禦性緊繃", "content": "分析若過早嘗試快速或困難樂段，身體會啟動防禦性的代償緊繃，反而加固了錯誤習慣。"},
                {"time": "04:30", "timestamp": 270, "title": "如何為每日練習制定系統化慢速學習計劃", "content": "提供具體的練習拆解步驟，將高難度樂句分解為極小、極慢的單元來逐一攻克。"}
            ]
        },
        {
            "id": "apa-video-05",
            "title": "5. Practice Partners (Are Essential!) - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "7icSExIt5tQ",
            "url": "https://www.youtube.com/watch?v=7icSExIt5tQ",
            "duration": "6:00",
            "thumbnail": "https://img.youtube.com/vi/7icSExIt5tQ/hqdefault.jpg",
            "tags": ["Daily Practice", "Focus", "Community"],
            "summary": "探討尋找練習夥伴（Practice Partners）的重要性。透過社交學習與同儕回饋，能更快發現自己的代償動作與盲點，並共同維持練習動力。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "為什麼閉門造車容易陷入錯誤練習循環", "content": "說明自己吹奏時往往因為無意識的習慣而忽視身體的緊繃，需要第三方客觀觀察。"},
                {"time": "01:50", "timestamp": 110, "title": "如何與夥伴進行有效且客觀的互相回饋", "content": "教導如何不帶評判地指正夥伴的站姿、嘴角撐力與肩膀放鬆程度。"},
                {"time": "03:20", "timestamp": 200, "title": "團體學習對音高覺察與聽覺的巨大幫助", "content": "分享多人在同一個空間練習音階，對培養精準的合奏聽音與聲部融合的益處。"}
            ]
        },
        {
            "id": "apa-video-06",
            "title": "6. Food Groups (A Wholistic Approach to Your Routine) - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "jhTT1DjvY8w",
            "url": "https://www.youtube.com/watch?v=jhTT1DjvY8w",
            "duration": "8:00",
            "thumbnail": "https://img.youtube.com/vi/jhTT1DjvY8w/hqdefault.jpg",
            "tags": ["Daily Practice", "Routine", "Balance"],
            "summary": "Rapa 將練習項目比喻為營養均衡的「食物群 (Food Groups)」，包括氣流、口型強度、靈活性與音樂性。每日練習必須包含各群組，避免單一項目過度疲勞。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "練習日常的營養學：四大食物群組", "content": "詳細介紹小號日常練習不可或缺的四大支柱：Airflow (氣流)、Embouchure Strength (口型力量)、Flexibility (靈活性) 與 Musical Expression (音樂表達)。"},
                {"time": "02:00", "timestamp": 120, "title": "過度練習單一項目的危害", "content": "解釋若每天盲目練習高音或強音，會導致局部嘴唇微血管受損與肌肉僵硬，必須像均衡飲食一樣搭配靈活與恢復練習。"},
                {"time": "04:15", "timestamp": 255, "title": "客製化調配每日練習菜單", "content": "教導學生如何根據當天的生理狀態和排練任務，動態微調各食物群練習的比重。"}
            ]
        },
        {
            "id": "apa-video-10",
            "title": "10. Trumpet Players' Secret Weapons (Overtone Singing & Dan Moi) - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "26vO0b07--4",
            "url": "https://www.youtube.com/watch?v=26vO0b07--4",
            "duration": "7:30",
            "thumbnail": "https://img.youtube.com/vi/26vO0b07--4/hqdefault.jpg",
            "tags": ["Vocal Tract", "Tongue Position", "Overtone Singing", "Dan Moi"],
            "summary": "介紹兩樣訓練聲道與舌頭控制的祕密武器：泛音詠唱（Overtone Singing）與越南口琴（Dan Moi）。這能幫助吹奏者在不拿小號時，微調舌根位置以控制共鳴。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "泛音詠唱的物理原理及其對小號的幫助", "content": "示範如何利用喉嚨與舌根的微調唱出雙音（泛音），這與吹奏小號時控制口腔聲道以獲得極佳音色的原理完全相通。"},
                {"time": "02:30", "timestamp": 150, "title": "越南口琴 (Dan Moi) 介紹與舌位訓練", "content": "親自示範如何使用 Dan Moi 口琴，這是一樣能讓吹奏者以極低成本、趣味方式訓練舌頭位置與共鳴空腔的工具。"},
                {"time": "05:00", "timestamp": 300, "title": "將聲道微調轉化為小號音色共鳴的控制", "content": "說明在大腦中建立舌頭微調的感覺後，如何立刻在拿起樂器吹奏時，讓聲道成為一個放大共振器。"}
            ]
        },
        {
            "id": "apa-video-11",
            "title": "11. Optimize Your Playing (Using Your Tongue) - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "KULRVgzr4B0",
            "url": "https://www.youtube.com/watch?v=KULRVgzr4B0",
            "duration": "6:45",
            "thumbnail": "https://img.youtube.com/vi/KULRVgzr4B0/hqdefault.jpg",
            "tags": ["Tongue Position", "Airflow", "Efficiency"],
            "summary": "深入探討舌頭在吹奏時的作用。舌位高低（如發音 A-E-I-O-U）直接影響氣流通道的大小與速度。正確的舌位能讓吹奏省力 90%。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "舌頭在管樂吹奏中的氣流閥門角色", "content": "說明舌頭位置並非固定不動，它是調節口腔內氣流壓縮與流速的最關鍵、最省力工具。"},
                {"time": "02:15", "timestamp": 135, "title": "示範 A-E-I-O-U 舌位對氣流速度的影響", "content": "示範在吹奏不同音域時，將舌頭後部拱起（如發出 E 或 I 的音）如何能瞬間加速空氣，讓高音變得輕鬆。"},
                {"time": "04:30", "timestamp": 270, "title": "釋放喉嚨與舌根代償性緊繃的練習", "content": "教導如何避免因為舌頭用力過度而導致喉嚨鎖死，維持舌根放鬆下沉的吹奏習慣。"}
            ]
        },
        {
            "id": "apa-video-12",
            "title": "12. The Outrageous Benefits of Half-Step Bending - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "kPiKzqrEZ0E",
            "url": "https://www.youtube.com/watch?v=kPiKzqrEZ0E",
            "duration": "8:15",
            "thumbnail": "https://img.youtube.com/vi/kPiKzqrEZ0E/hqdefault.jpg",
            "tags": ["Pitch Bending", "Embouchure", "Lip Resonance"],
            "summary": "介紹半音彎音（Half-Step Bending）的練習。這項練習要求只用口型與氣流改變音高，而不改變按鍵，是校正嘴唇震動與氣流效率的極佳方法。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "彎音練習與嘴唇震動微調", "content": "解釋彎音練習的物理機制。這迫使吹奏者不能硬壓吹嘴，必須完全依賴嘴角支撐與氣流流速微調來改變音高。"},
                {"time": "02:00", "timestamp": 120, "title": "實作示範：如何精準彎音並安全拉回", "content": "現場示範在中音域將音準向下彎半個音，保持音色共鳴不散，然後再平滑拉回中心靶心。"},
                {"time": "04:00", "timestamp": 240, "title": "利用彎音消除右手壓力的實踐", "content": "說明如果學生吹奏時過度依賴吹嘴壓力，是絕對吹不出彎音的，這是一個極佳的自我檢測指標。"}
            ]
        },
        {
            "id": "apa-video-14",
            "title": "14. Note Targets & LOTUS Mouthpieces - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "11vpBqQyxLY",
            "url": "https://www.youtube.com/watch?v=11vpBqQyxLY",
            "duration": "9:30",
            "thumbnail": "https://img.youtube.com/vi/11vpBqQyxLY/hqdefault.jpg",
            "tags": ["Equipment", "LOTUS Mouthpieces", "Note Targets"],
            "summary": "討論音符的「靶心（Note Targets）」與吹嘴聲學。Adam Rapa 分享他設計 LOTUS 吹嘴的物理理念，說明如何藉由優化樂器阻抗來使氣流與嘴唇的共振更容易找到靶心。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "什麼是音符的靶心概念", "content": "講解吹奏小號時，大腦必須有一張精確的『音高靶心圖』，用意念引導嘴唇肌肉與氣壓對齊，而不是盲目吹氣。"},
                {"time": "02:45", "timestamp": 165, "title": "吹嘴阻抗與聲學設計對震動的輔助", "content": "解說吹嘴的 cup (杯深)、throat (喉徑) 及 backbore (後孔) 如何與小號物理聲學共振，適當的阻力回饋能讓靶心更容易被鎖定。"},
                {"time": "05:30", "timestamp": 330, "title": "如何根據個人生理特性挑選合適吹嘴", "content": "提供實用的器材挑選建議，避免一味追求淺吹嘴而犧牲了音色與氣流共鳴。"}
            ]
        },
        {
            "id": "apa-video-15",
            "title": "15. Active Listening (How & Why?) - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "m7TV6vvrwdU",
            "url": "https://www.youtube.com/watch?v=m7TV6vvrwdU",
            "duration": "7:45",
            "thumbnail": "https://img.youtube.com/vi/m7TV6vvrwdU/hqdefault.jpg",
            "tags": ["Active Listening", "Musicality", "Ear Training"],
            "summary": "探討「主動聆聽（Active Listening）」對音樂家成長的重要性。不只是聽旋律，更要解析音色結構、節奏微小變化與樂手之間的互動能量。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "主動聆聽與被動聽音樂的本質區別", "content": "說明主動聆聽需要調動大腦的分析機能，去解析音樂的層次、聲學環境與樂手的身體物理狀態。"},
                {"time": "02:15", "timestamp": 135, "title": "分析大師的氣流支撐與口型共鳴特徵", "content": "教導如何透過聽錄音，去『辨識』演奏者是否聳肩、喉嚨是否緊繃、以及嘴角肌肉是否給予足夠支撐。"},
                {"time": "04:30", "timestamp": 270, "title": "透過深度聆聽拓寬自己的音色調色盤", "content": "建議多聽不同樂器的演奏，將歌唱家、大提琴家等不同音色質感內化到小號吹奏中。"}
            ]
        },
        {
            "id": "apa-video-16",
            "title": "16. High Notes & Musical Expression - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "1uFwbTl01ho",
            "url": "https://www.youtube.com/watch?v=1uFwbTl01ho",
            "duration": "8:00",
            "thumbnail": "https://img.youtube.com/vi/1uFwbTl01ho/hqdefault.jpg",
            "tags": ["High Range", "Air Support", "Musical Expression"],
            "summary": "當吹奏高音時，大部分人會失去音樂表現力。Rapa 指出，高音不應只是體力展示，而是情感的頂峰。透過 Wedge 氣流支撐，讓高音域仍能展現豐富的音樂細節。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "高音域演奏與音樂性脫鉤的現象", "content": "探討為什麼許多吹奏者在吹高音時音色變得僵硬乾癟，且無法做出強弱變化，這是因為身體陷入了防禦性抵抗。"},
                {"time": "02:00", "timestamp": 120, "title": "利用 Wedge 楔形呼吸法支撐高音情感張力", "content": "示範如何利用下腹部核心空氣壓縮，提供源源不絕的氣流動能，使嘴角放鬆，高音仍具備溫暖的歌唱性。"},
                {"time": "04:15", "timestamp": 255, "title": "高音域的強弱 (Crescendo/Decrescendo) 控制示範", "content": "實地吹奏示範在高音域做極細緻的強弱起伏控制，證明高效率吹奏能保留音樂細節。"}
            ]
        },
        {
            "id": "apa-video-17",
            "title": "17. Developing Musicality - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "lzDklbUtkzQ",
            "url": "https://www.youtube.com/watch?v=lzDklbUtkzQ",
            "duration": "10:00",
            "thumbnail": "https://img.youtube.com/vi/lzDklbUtkzQ/hqdefault.jpg",
            "tags": ["Musicality", "Storytelling", "Expression"],
            "summary": "探討音樂性（Musicality）的培養。Rapa 指出，演奏者不能僅是按譜吹奏的機器，必須具備說故事的能力，並將個人的生命體驗融入到音符的強弱與語氣中。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "什麼是音樂性？如何吹出有故事的音符", "content": "強調演奏者必須是大師級的說故事者。樂譜上的音符只是黑白標記，需要吹奏者注入音樂意圖與靈魂。"},
                {"time": "02:30", "timestamp": 150, "title": "語氣 (Phrasing) 的起伏控制與歌聲模擬", "content": "示範如何藉由微調氣流線條與舌位變化，讓樂句的呼吸和起伏聽起來如同人類歌唱般自然。"},
                {"time": "04:45", "timestamp": 285, "title": "突破物理限制，讓情感意圖主導生理肌肉", "content": "說明當音樂表達意圖強烈到一定程度時，身體會自然調整至最有效率的吹奏姿勢，減少失誤。"}
            ]
        },
        {
            "id": "apa-video-18",
            "title": "18. In Conclusion - Adam Rapa",
            "type": "video",
            "platform": "YouTube",
            "youtubeId": "rN8s7tthfm8",
            "url": "https://www.youtube.com/watch?v=rN8s7tthfm8",
            "duration": "5:00",
            "thumbnail": "https://img.youtube.com/vi/rN8s7tthfm8/hqdefault.jpg",
            "tags": ["Mindset", "Summary", "Trumpet Pedagogy"],
            "summary": "教育系列的總結。Rapa 回顧了從心智、呼吸、口型到樂器的完整學習體系，勉勵吹奏者要「對自己友善」，享受學習的過程，將小號視為身心修行與自我表達的管道。",
            "notes": [
                {"time": "00:00", "timestamp": 0, "title": "回顧身心靈與物理技術的完整教學體系", "content": "總結本系列的 18 部影片，從最底層的呼吸、姿勢（超人姿勢）、嘴角支撐（魚臉），到心智（冥想、意念）與音樂性表達的融會貫通。"},
                {"time": "02:30", "timestamp": 150, "title": "保持耐心與對自己的慈悲 (Be Kind)", "content": "勉勵學生吹奏小號是一生得旅程，有起有落，要在調整口型或技術低谷時善待自己，享受演奏帶來的快樂。"},
                {"time": "04:30", "timestamp": 270, "title": "Adam Rapa 對所有熱愛小號演奏者的期許與感謝", "content": "向觀看此系列並付出時間練習的所有演奏者致敬，感謝大家傳播好的音樂能量。"}
            ]
        }
    ]

    # 1 missing concept (PDF)
    new_concepts = [
        {
            "id": "concept-chacarera-pdf",
            "title": "Expanding Your Musical Vocabulary with the Rhythmic Language of the Chacarera (PDF)",
            "url": "https://www.adamrapa.com/_files/ugd/8dc9bc_dd953e43c1dd4f63b22b36c437250a53.pdf",
            "description": "這是一篇由 Adam Rapa 撰寫的教學文章，探討如何利用阿根廷傳統音樂 Chacarera 的節奏語言來擴展爵士樂或即興演奏的音樂詞彙。文章內包含他在 \"Solo Por Hoy\" 中的旋律與即興獨奏的精細五線譜轉錄（Transcription），非常適合希望提升節奏感與旋律變化的吹奏者學習。"
        }
    ]

    # Filter out already existing items
    videos_to_append = [v for v in new_videos if v["youtubeId"] not in existing_youtube_ids]
    concepts_to_append = [c for c in new_concepts if c["id"] not in existing_concept_ids]

    if not videos_to_append and not concepts_to_append:
        print("所有資料皆已存在於 JSON 中，無須重複添加！")
    else:
        # Append to JSON
        for v in videos_to_append:
            data["videos"].append(v)
            print(f"-> 準備將影片寫入 JSON: {v['title']}")

        for c in concepts_to_append:
            data["concepts"].append(c)
            print(f"-> 準備將概念寫入 JSON: {c['title']}")

        # Save JSON back
        try:
            with open(data_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n成功！共新增 {len(videos_to_append)} 部影片與 {len(concepts_to_append)} 個概念至 {data_path}。")
        except Exception as e:
            print(f"錯誤：儲存 JSON 檔案失敗。{e}")
            sys.exit(1)

    # Generate SQL file
    sql_lines = []
    sql_lines.append("-- SQLite INSERT script for missing Adam Rapa data")
    sql_lines.append("BEGIN TRANSACTION;")

    for v in videos_to_append:
        escaped_title = v["title"].replace("'", "''")
        escaped_summary = v["summary"].replace("'", "''")
        escaped_tags = json.dumps(v["tags"], ensure_ascii=False).replace("'", "''")
        escaped_notes = json.dumps(v["notes"], ensure_ascii=False).replace("'", "''")
        
        insert_video = (
            f"INSERT INTO videos (id, title, type, platform, youtubeId, url, duration, thumbnail, tags, notes) "
            f"VALUES ('{v['id']}', '{escaped_title}', '{v['type']}', '{v['platform']}', '{v['youtubeId']}', "
            f"'{v['url']}', '{v['duration']}', '{v['thumbnail']}', '{escaped_tags}', '{escaped_notes}');"
        )
        sql_lines.append(insert_video)

    for c in concepts_to_append:
        escaped_title = c["title"].replace("'", "''")
        escaped_url = c["url"].replace("'", "''")
        escaped_desc = c["description"].replace("'", "''")
        
        insert_concept = (
            f"INSERT INTO concepts (id, title, url, description) "
            f"VALUES ('{c['id']}', '{escaped_title}', '{escaped_url}', '{escaped_desc}');"
        )
        sql_lines.append(insert_concept)

    sql_lines.append("COMMIT;")

    if videos_to_append or concepts_to_append:
        try:
            with open(sql_path, "w", encoding="utf-8") as f:
                f.write("\n".join(sql_lines) + "\n")
            print(f"成功！已生成 SQL 部署檔案於 {sql_path}。")
        except Exception as e:
            print(f"錯誤：寫入 SQL 檔案失敗。{e}")
            sys.exit(1)
    else:
        print("無新資料需要生成 SQL 檔案。")

if __name__ == "__main__":
    main()

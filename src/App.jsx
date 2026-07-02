import { useState, useMemo, useEffect } from 'react';
import { 
  Music, 
  Tv, 
  Search, 
  PlusCircle, 
  BookOpen, 
  ChevronRight, 
  Play, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Clock,
  Compass,
  Video,
  Award,
  Link,
  Loader2,
  AlertCircle,
  Save,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  Globe,
  Download
} from 'lucide-react';
import { rapaData } from './data/rapaData';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'videos', 'concepts', 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  
  // Detail views
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(null);

  // Form states
  const [activeFormTab, setActiveFormTab] = useState('video'); // 'video', 'concept'
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Video Form states
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('video');
  const [formPlatform, setFormPlatform] = useState('YouTube');
  const [formUrl, setFormUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Concept/Article Form states
  const [formConceptTitle, setFormConceptTitle] = useState('');
  const [formConceptUrl, setFormConceptUrl] = useState('');
  const [formConceptDescription, setFormConceptDescription] = useState('');
  const [formConceptArticleText, setFormConceptArticleText] = useState('');

  // Q&A AI states
  const [userQuestion, setUserQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [askError, setAskError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('rapa_auth_key');
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // RWD Detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic Data loading (Merge static rapaData, local storage, and Cloudflare D1)
  const [localData, setLocalData] = useState(() => {
    const savedVideos = JSON.parse(localStorage.getItem('rapa_user_videos') || '[]');
    const savedConcepts = JSON.parse(localStorage.getItem('rapa_user_concepts') || '[]');
    
    // Prevent duplicates by checking ID
    const videoMap = new Map();
    rapaData.videos.forEach(v => videoMap.set(v.id, v));
    savedVideos.forEach(v => videoMap.set(v.id, v));
    
    const conceptMap = new Map();
    rapaData.concepts.forEach(c => conceptMap.set(c.id, c));
    savedConcepts.forEach(c => conceptMap.set(c.id, c));
    
    return {
      videos: Array.from(videoMap.values()),
      concepts: Array.from(conceptMap.values())
    };
  });

  // Get HTTP Authorization headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': sessionStorage.getItem('rapa_auth_key') || ''
    };
  };

  // Fetch Cloudflare D1 Database on load
  const loadDatabase = async () => {
    try {
      const videoRes = await fetch('/api/videos', { headers: getHeaders() });
      const videoResult = await videoRes.json();
      
      const conceptRes = await fetch('/api/concepts', { headers: getHeaders() });
      const conceptResult = await conceptRes.json();

      if (videoResult.success && conceptResult.success) {
        const savedVideos = JSON.parse(localStorage.getItem('rapa_user_videos') || '[]');
        const savedConcepts = JSON.parse(localStorage.getItem('rapa_user_concepts') || '[]');
        
        const videoMap = new Map();
        rapaData.videos.forEach(v => videoMap.set(v.id, v));
        videoResult.data.forEach(v => videoMap.set(v.id, v));
        savedVideos.forEach(v => videoMap.set(v.id, v));
        
        const conceptMap = new Map();
        rapaData.concepts.forEach(c => conceptMap.set(c.id, c));
        conceptResult.data.forEach(c => conceptMap.set(c.id, c));
        savedConcepts.forEach(c => conceptMap.set(c.id, c));
        
        setLocalData({
          videos: Array.from(videoMap.values()),
          concepts: Array.from(conceptMap.values())
        });
      }
    } catch (e) {
      console.warn('無法連線到 Cloudflare D1。將繼續使用本地快取與預設資料。', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDatabase();
    }
  }, [isAuthenticated]);

  // Collect all unique tags for tag cloud
  const allTags = useMemo(() => {
    const tags = new Set();
    localData.videos.forEach(v => {
      v.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [localData.videos]);

  // Filtered videos based on search, tags and platform
  const filteredVideos = useMemo(() => {
    return localData.videos.filter(v => {
      const matchesSearch = searchQuery === '' || 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.notes.some(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === '' || v.tags.includes(selectedTag);
      
      const matchesPlatform = selectedPlatform === 'all' || 
        (selectedPlatform === 'video' && v.type === 'video') ||
        (selectedPlatform === 'shorts' && v.type === 'shorts') ||
        (selectedPlatform === 'tiktok' && v.type === 'tiktok');
        
      return matchesSearch && matchesTag && matchesPlatform;
    });
  }, [searchQuery, selectedTag, selectedPlatform, localData.videos]);

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    setCurrentTimestamp(0);
    setActiveNoteIndex(null);
  };

  const handleTimestampClick = (timestamp, index) => {
    setCurrentTimestamp(timestamp);
    setActiveNoteIndex(index);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag); // toggle tag
    if (activeTab !== 'videos') {
      setActiveTab('videos');
    }
  };

  // Auth password verify submit
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passwordInput) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        sessionStorage.setItem('rapa_auth_key', passwordInput);
        setIsAuthenticated(true);
      } else {
        setAuthError(result.error || '金鑰認證失敗！');
      }
    } catch (err) {
      setAuthError('連線錯誤，無法完成身份認證。');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // AI Q&A Submit Logic
  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    setIsAsking(true);
    setAskError('');
    setAiResponse(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: userQuestion.trim() })
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setAiResponse(result.data);
      } else {
        setAskError(result.error || '呼叫 AI 導師失敗，請確認 Cloudflare 後端已設定 API 金鑰。');
      }
    } catch (err) {
      console.error('Q&A failed', err);
      setAskError('連線錯誤，無法與 AI 導師建立連線。');
    } finally {
      setIsAsking(false);
    }
  };

  // Click handler to jump directly to sources
  const handleSourceClick = (source) => {
    if (source.type === 'video') {
      const foundVideo = localData.videos.find(v => 
        v.title.toLowerCase().includes(source.title.toLowerCase()) || 
        (v.youtubeId && source.youtubeId && v.youtubeId === source.youtubeId) ||
        v.url === source.url
      );

      if (foundVideo) {
        setActiveTab('videos');
        handleSelectVideo(foundVideo);

        const timeMatch = source.title.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const mins = parseInt(timeMatch[1], 10);
          const secs = parseInt(timeMatch[2], 10);
          const totalSeconds = mins * 60 + secs;
          setCurrentTimestamp(totalSeconds);

          const closestIndex = foundVideo.notes.findIndex(n => n.timestamp === totalSeconds || Math.abs(n.timestamp - totalSeconds) < 6);
          if (closestIndex !== -1) {
            setActiveNoteIndex(closestIndex);
          }
        }
      } else {
        window.open(source.url, '_blank');
      }
    } else if (source.type === 'concept') {
      const foundConcept = localData.concepts.find(c => 
        c.title.toLowerCase().includes(source.title.toLowerCase())
      );

      setActiveTab('concepts');
      if (foundConcept) {
        setTimeout(() => {
          const element = document.getElementById(foundConcept.id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.boxShadow = '0 0 25px var(--primary-glow)';
            setTimeout(() => {
              element.style.boxShadow = 'none';
            }, 2000);
          }
        }, 150);
      }
    } else {
      window.open(source.url, '_blank');
    }
  };

  // One-click import suggested content from web search
  const handleImportSuggested = async () => {
    if (!aiResponse || !aiResponse.suggested_import) return;
    setIsImporting(true);

    const suggest = aiResponse.suggested_import;
    const newItem = suggest.data;
    const isVideo = suggest.type === 'video';

    // 1. 本地 LocalStorage 寫入
    if (isVideo) {
      const savedVideos = JSON.parse(localStorage.getItem('rapa_user_videos') || '[]');
      savedVideos.push(newItem);
      localStorage.setItem('rapa_user_videos', JSON.stringify(savedVideos));
    } else {
      const savedConcepts = JSON.parse(localStorage.getItem('rapa_user_concepts') || '[]');
      savedConcepts.push(newItem);
      localStorage.setItem('rapa_user_concepts', JSON.stringify(savedConcepts));
    }

    // 2. 雲端 D1 資料庫寫入
    const apiPath = isVideo ? '/api/videos' : '/api/concepts';
    let cloudSuccess = false;
    try {
      const writeResponse = await fetch(apiPath, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newItem)
      });
      const writeResult = await writeResponse.json();
      if (writeResponse.ok && writeResult.success) {
        cloudSuccess = true;
      }
    } catch (e) {
      console.warn('雲端 D1 寫入失敗，使用本地 LocalStorage 緩存。', e);
    }

    // 3. 同步寫入本地 JSON 檔案 (僅本地 dev server 有效)
    try {
      fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } catch (e) {}

    // 重新加載資料庫
    await loadDatabase();
    setIsImporting(false);
    
    if (cloudSuccess) {
      alert(`✨ 成功將《${newItem.title}》自動加入 Cloudflare D1 雲端知識庫中！\n其他電腦與手持設備重新整理後已同步！`);
    } else {
      alert(`💾 成功將《${newItem.title}》加入此裝置的瀏覽器快取 (LocalStorage) 中！\n已即時顯示在您的網頁中。`);
    }

    setAiResponse(prev => ({ ...prev, suggested_import: null }));
  };

  // URL Auto-Parse Logic (Cloudflare Pages Function + Fallback noembed)
  const handleUrlAutoParse = async () => {
    const targetUrl = activeFormTab === 'video' ? formUrl : formConceptUrl;
    const isArticleTextParse = activeFormTab === 'concept' && formConceptArticleText.trim() !== '';
    
    if (!targetUrl && !isArticleTextParse) {
      setParseError(activeFormTab === 'video' ? '請先輸入影片網址' : '請先輸入參考網址，或在下方貼上文章內容');
      return;
    }
    
    setParseError('');
    setIsParsing(true);

    try {
      let apiResponse;
      if (isArticleTextParse) {
        apiResponse = await fetch('/api/parse', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ content: formConceptArticleText.trim() })
        });
      } else {
        apiResponse = await fetch(`/api/parse?url=${encodeURIComponent(targetUrl)}`, {
          headers: getHeaders()
        });
      }
      
      const apiResult = await apiResponse.json();
      
      if (apiResponse.ok && apiResult.success && apiResult.data) {
        const llmData = apiResult.data;
        
        if (activeFormTab === 'video') {
          const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})/);
          const vid = ytMatch ? ytMatch[1] : '';
          
          if (llmData.title) setFormTitle(llmData.title);
          if (llmData.summary) setFormSummary(llmData.summary);
          if (llmData.tags && Array.isArray(llmData.tags)) setFormTags(llmData.tags.join(', '));
          
          if (llmData.notes && Array.isArray(llmData.notes)) {
            const formattedNotes = llmData.notes.map(n => {
              const cleanContent = n.content || '';
              const shortTitle = cleanContent.slice(0, 12) + (cleanContent.length > 12 ? '...' : '');
              return `${n.time}|${shortTitle}|${cleanContent}`;
            }).join('\n');
            setFormNotes(formattedNotes);
          }
          
          if (ytMatch) {
            setFormThumbnail(`https://img.youtube.com/vi/${vid}/hqdefault.jpg`);
            setFormPlatform('YouTube');
            if (targetUrl.includes('shorts')) {
              setFormType('shorts');
              setFormDuration('0:59');
            } else {
              setFormType('video');
              setFormDuration(llmData.notes && llmData.notes.length > 0 ? llmData.notes[llmData.notes.length - 1].time : '10:00');
            }
          } else {
            setFormPlatform(targetUrl.includes('tiktok.com') ? 'TikTok' : 'Website');
            setFormType(targetUrl.includes('tiktok.com') ? 'tiktok' : 'video');
            setFormThumbnail('https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80');
            setFormDuration('0:00');
          }
        } else {
          if (llmData.title) setFormConceptTitle(llmData.title);
          
          let desc = llmData.summary || '';
          if (llmData.notes && llmData.notes.length > 0) {
            desc += '\n\n【核心觀念重點】\n' + llmData.notes.map(n => `- **${n.time || '核心'}**：${n.content}`).join('\n');
          }
          setFormConceptDescription(desc);
        }
        
        setParseError('');
        alert('✨ 成功調用 Cloudflare 後端 LLM 完成深度解析！已自動帶入教學標題、標籤、摘要與時間重點！');
        setIsParsing(false);
        return;
      }
      
      if (apiResult.error === 'no_key') {
        setParseError('💡 提示：您的 Cloudflare 後端尚未設定 API 金鑰。已自動回退為「基本解析」（僅取得標題與縮圖）。若要啟用 LLM 智慧分析自動生成摘要與筆記，請在 Cloudflare Pages Dashboard 中設定環境變數 GEMINI_API_KEY 或 OPENAI_API_KEY。');
      } else {
        console.warn('Cloudflare API 調用出錯，將自動回退至基礎解析服務。錯誤原因：', apiResult.error || 'Connection Failed');
      }
      
      if (isArticleTextParse) {
        throw new Error(apiResult.message || 'LLM 解析文章失敗，可能未設定 API 金鑰。');
      }
      
      const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})/);
      
      if (ytMatch) {
        const vid = ytMatch[1];
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`);
        const data = await response.json();
        
        if (activeFormTab === 'video') {
          if (data.title) setFormTitle(data.title);
          setFormThumbnail(data.thumbnail_url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`);
          setFormPlatform('YouTube');
          
          if (targetUrl.includes('shorts')) {
            setFormType('shorts');
            setFormDuration('0:59');
          } else {
            setFormType('video');
            setFormDuration('10:00');
          }
        } else {
          if (data.title) setFormConceptTitle(data.title);
        }
      } else {
        const urlObj = new URL(targetUrl);
        let siteName = urlObj.hostname.replace('www.', '');
        
        if (activeFormTab === 'video') {
          setFormPlatform(targetUrl.includes('tiktok.com') ? 'TikTok' : 'Website');
          setFormType(targetUrl.includes('tiktok.com') ? 'tiktok' : 'video');
          setFormTitle(`來自 ${siteName} 的教學影音`);
          setFormThumbnail('https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80');
        } else {
          setFormConceptTitle(`來自 ${siteName} 的文字教學/文章`);
        }
      }
    } catch (err) {
      console.error('解析失敗', err);
      setParseError(isArticleTextParse ? '文章解析失敗，請確認 API 金鑰是否設定或手動填入內容。' : '網址解析失敗，請手動輸入資訊。');
    } finally {
      setIsParsing(false);
    }
  };

  // Save new item dynamically
  const handleSaveToDatabase = async (e) => {
    e.preventDefault();
    setIsParsing(true);
    
    let newObj = null;

    if (activeFormTab === 'video') {
      // 檢查影片標題或 URL 是否重複
      const titleExistsInVideos = localData.videos.some(v => 
        v.title.trim().toLowerCase() === formTitle.trim().toLowerCase()
      );
      const urlExists = formUrl.trim() !== '' && localData.videos.some(v => 
        v.url.trim().toLowerCase() === formUrl.trim().toLowerCase()
      );
      
      if (titleExistsInVideos || urlExists) {
        const confirmSave = window.confirm(`⚠️ 檢測到相同的影片標題或連結已存在於資料庫中。\n\n您確定要重複匯入嗎？`);
        if (!confirmSave) {
          setIsParsing(false);
          return;
        }
      }

      const tagsArr = formTags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const notesArr = formNotes.split('\n').map((line) => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const time = parts[0].trim();
          const title = parts[1].trim();
          const content = parts[2] ? parts[2].trim() : '';
          
          const timeParts = time.split(':').map(Number);
          let seconds = 0;
          if (timeParts.length === 2) {
            seconds = timeParts[0] * 60 + timeParts[1];
          } else if (timeParts.length === 3) {
            seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          }
          
          return {
            time,
            timestamp: seconds,
            title,
            content
          };
        }
        return null;
      }).filter(n => n !== null);

      let ytId = '';
      if (formPlatform === 'YouTube') {
        const match = formUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})/);
        if (match) ytId = match[1];
      }

      const randomId = "apa-" + formType + "-" + Math.floor(Math.random() * 1000);
      const mockThumb = formThumbnail || (formType === 'shorts' 
        ? "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80"
        : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80");

      newObj = {
        id: randomId,
        title: formTitle,
        type: formType,
        platform: formPlatform,
        youtubeId: ytId,
        url: formUrl,
        duration: formDuration,
        thumbnail: mockThumb,
        tags: tagsArr,
        summary: formSummary,
        notes: notesArr
      };

      const savedVideos = JSON.parse(localStorage.getItem('rapa_user_videos') || '[]');
      savedVideos.push(newObj);
      localStorage.setItem('rapa_user_videos', JSON.stringify(savedVideos));

      setLocalData(prev => ({
        ...prev,
        videos: [...prev.videos, newObj]
      }));

    } else {
      // 檢查概念標題是否重複
      const titleExistsInConcepts = localData.concepts.some(c => 
        c.title.trim().toLowerCase() === formConceptTitle.trim().toLowerCase()
      );
      const titleExistsInVideos = localData.videos.some(v => 
        v.title.trim().toLowerCase() === formConceptTitle.trim().toLowerCase()
      );
      
      if (titleExistsInConcepts || titleExistsInVideos) {
        const confirmSave = window.confirm(`⚠️ 檢測到相同的教學觀念或影片標題《${formConceptTitle}》已存在於資料庫中。\n\n您確定要重複匯入嗎？`);
        if (!confirmSave) {
          setIsParsing(false);
          return;
        }
      }

      const randomId = "concept-" + Math.floor(Math.random() * 1000);
      newObj = {
        id: randomId,
        title: formConceptTitle,
        url: formConceptUrl || undefined,
        description: formConceptDescription
      };

      const savedConcepts = JSON.parse(localStorage.getItem('rapa_user_concepts') || '[]');
      savedConcepts.push(newObj);
      localStorage.setItem('rapa_user_concepts', JSON.stringify(savedConcepts));

      setLocalData(prev => ({
        ...prev,
        concepts: [...prev.concepts, newObj]
      }));
    }

    // 3. 呼叫 Cloudflare D1 後端寫入 API (線上資料同步)
    const apiPath = activeFormTab === 'video' ? '/api/videos' : '/api/concepts';
    let d1WriteSuccess = false;
    try {
      const writeResponse = await fetch(apiPath, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newObj)
      });
      const writeResult = await writeResponse.json();
      if (writeResponse.ok && writeResult.success) {
        d1WriteSuccess = true;
      }
    } catch (e) {
      console.warn('無法連接至 D1 後端 API。已回退到本機儲存機制。', e);
    }

    // 4. 同步嘗試寫入本地開發 JSON (僅在本地 npm run dev 時有效)
    let localFileSuccess = false;
    try {
      const localResponse = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObj)
      });
      const localResult = await localResponse.json();
      if (localResponse.ok && localResult.success) {
        localFileSuccess = true;
      }
    } catch (e) {
      // 忽略，在線上必定 404
    }

    if (d1WriteSuccess) {
      alert('✨ 成功！資料已寫入 Cloudflare D1 雲端資料庫！\n您的手機、iPad 以及其他電腦現在重新整理皆可同步看見！');
    } else if (localFileSuccess) {
      alert('✨ 成功！資料已同步寫入本地的 rapaData.json 檔案！\nGit 已偵測到檔案修改，請將其推送至 GitHub 來發布更新。');
    } else {
      alert('💾 成功！資料已安全保存於您此裝置的瀏覽器快取 (LocalStorage) 中，網頁已即時更新！\n\n提示：因為您的 Cloudflare D1 尚未綁定，若要開啟全平台手機/iPad同步，請依照 README.md 初始化 D1。');
    }

    if (activeFormTab === 'video') {
      setFormTitle('');
      setFormUrl('');
      setFormDuration('');
      setFormThumbnail('');
      setFormSummary('');
      setFormTags('');
      setFormNotes('');
    } else {
      setFormConceptTitle('');
      setFormConceptUrl('');
      setFormConceptDescription('');
      setFormConceptArticleText('');
    }

    setIsParsing(false);
  };

  // UNVERIFIED SCREEN RENDERING (Rich Aesthetics password lock screen)
  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at center, #0e1630 0%, #050814 100%)', padding: '1rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(0, 240, 255, 0.15)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.08)' }}>
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(0, 240, 255, 0.05)', 
            border: '1px solid var(--primary)', 
            color: 'var(--primary)', 
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px var(--primary-glow)',
            alignSelf: 'center'
          }}>
            <Music size={32} className="animate-pulse" />
          </div>

          <h1 style={{ fontFamily: 'var(--display-font)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
            Trumpet-Learning
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            本小號教學系統已受加密保護，請輸入管理員金鑰解鎖以存取。
          </p>

          {authError && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              color: '#ef4444', 
              fontSize: '0.82rem', 
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>管理員金鑰 (存取密碼)</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="請輸入密碼..." 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '0.2rem', background: 'rgba(10, 14, 28, 0.8)' }}
              />
            </div>
            <button 
              type="submit" 
              className="form-submit-btn" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : <Compass size={18} />}
              {isAuthenticating ? '驗證金鑰中...' : '解鎖並進入系統'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED SCREEN RENDERING
  return (
    <div className="app-container">
      
      {/* SIDEBAR: Hidden on Mobile (< 768px) */}
      {!isMobile && (
        <aside className="sidebar">
          <div className="logo-container">
            <Music className="logo-icon" size={28} />
            <span className="logo-text">Rapa Trumpet</span>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setSelectedVideo(null); }}
            >
              <Compass className="nav-icon" />
              儀表板 Dashboard
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('videos'); }}
            >
              <Video className="nav-icon" />
              教學影音庫 Videos
            </button>

            <button 
              className={`nav-item ${activeTab === 'concepts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('concepts'); setSelectedVideo(null); }}
            >
              <BookOpen className="nav-icon" />
              核心觀念 Concepts
            </button>

            <button 
              className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => { setActiveTab('add'); setSelectedVideo(null); }}
            >
              <PlusCircle className="nav-icon" />
              新增教學 Add Data
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>© 2026 Adam Rapa Library</p>
            <p>小號學習系統知識庫</p>
          </div>
        </aside>
      )}

      {/* MOBILE HEADER: Shown only on Mobile (< 768px) */}
      {isMobile && (
        <header className="mobile-header glass-panel">
          <div className="logo-container" style={{ margin: 0, padding: 0 }}>
            <Music className="logo-icon" size={24} />
            <span className="logo-text" style={{ fontSize: '1.25rem' }}>Rapa Trumpet</span>
          </div>
          <div className="mobile-header-active-tab">
            {activeTab === 'dashboard' && '儀表板'}
            {activeTab === 'videos' && '影音庫'}
            {activeTab === 'concepts' && '核心觀念'}
            {activeTab === 'add' && '新增教學'}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && !selectedVideo && (
          <div>
            {/* Banner */}
            <div className="welcome-banner glass-panel">
              <div className="welcome-banner-content">
                <h1>Adam Rapa 小號教學知識庫</h1>
                <p>
                  歡迎來到 Adam Rapa 教學資料整理庫。在這裡，您可以探索他獨一無二的小號學習與吹奏心法。包含 Wedge Technique、3D 呼吸法與歌唱思維。
                </p>
              </div>
            </div>

            {/* Q&A SECTION (RAG AI Agent Assistant with interactive sources) */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(0, 240, 255, 0.15)', background: 'linear-gradient(135deg, rgba(10, 14, 28, 0.8) 0%, rgba(5, 50, 80, 0.25) 100%)' }}>
              <h2 className="row-title" style={{ color: 'var(--primary)', textShadow: '0 0 10px var(--primary-glow)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} className="logo-icon animate-pulse" />
                🎺 Rapa AI 智能小號導師
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                輸入任何關於小號吹奏技巧、呼吸、口型 (Embouchure) 或 Adam Rapa 的觀念問題，AI 會幫您在庫內資料庫進行分析作答；若庫內不足則自動去 Google 聯網搜尋！
              </p>

              <form onSubmit={handleAskAi} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="詢問問題，例如：口唇 Warm down 怎麼練習？或 3D 呼吸法是什麼？"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  style={{ flex: 1, background: 'rgba(10, 14, 28, 0.8)', borderColor: 'rgba(0, 240, 255, 0.15)' }}
                  required
                />
                <button
                  type="submit"
                  className="form-submit-btn"
                  style={{ 
                    width: 'auto', 
                    padding: '0 1.5rem', 
                    background: 'linear-gradient(135deg, var(--primary) 0%, #0099ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                  disabled={isAsking}
                >
                  {isAsking ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                  {isAsking ? '思考中...' : '提問'}
                </button>
              </form>

              {askError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', padding: '0.5rem 0', borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <AlertCircle size={16} /> {askError}
                </div>
              )}

              {/* AI Answer Rendering */}
              {aiResponse && (
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(10, 14, 28, 0.9)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.75rem', color: aiResponse.found_in_db ? 'var(--primary)' : '#10b981' }}>
                    {aiResponse.found_in_db ? <CheckCircle size={16} /> : <Globe size={16} className="animate-pulse" />}
                    {aiResponse.found_in_db ? '✅ AI 導師從您的知識庫中找到了以下教學解答：' : '🌐 知識庫尚未收錄此教學，已為您自 Google 聯網搜尋並提煉如下：'}
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '1rem', borderBottom: (aiResponse.sources && aiResponse.sources.length > 0) || aiResponse.suggested_import ? '1px solid var(--border-light)' : 'none', paddingBottom: (aiResponse.sources && aiResponse.sources.length > 0) || aiResponse.suggested_import ? '1rem' : '0' }}>
                    {aiResponse.answer}
                  </div>

                  {/* SOURCES LIST WITH CLICK-TO-JUMP */}
                  {aiResponse.sources && aiResponse.sources.length > 0 && (
                    <div style={{ marginTop: '1rem', marginBottom: aiResponse.suggested_import ? '1rem' : '0', paddingBottom: aiResponse.suggested_import ? '1rem' : '0', borderBottom: aiResponse.suggested_import ? '1px dashed var(--border-light)' : 'none' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BookOpen size={14} /> 📚 參考來源與延伸學習 (點擊可直接在網頁中開啟/跳轉播放)：
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {aiResponse.sources.map((src, index) => (
                          <button
                            key={index}
                            onClick={() => handleSourceClick(src)}
                            style={{
                              background: 'rgba(0, 240, 255, 0.05)',
                              border: '1px solid rgba(0, 240, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.78rem',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.2s',
                              maxWidth: '100%',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.15)'; }}
                          >
                            {src.type === 'video' ? <Video size={12} /> : src.type === 'concept' ? <Award size={12} /> : <Link size={12} />}
                            {src.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* suggested_import (One-click storage button) */}
                  {aiResponse.suggested_import && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        💡 智能導師建議匯入以下搜尋到的新教學資源以充實您的雲端知識庫：
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px dashed rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
                        <Award size={16} style={{ color: '#10b981' }} />
                        <span style={{ color: '#fff', fontWeight: '600', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          《{aiResponse.suggested_import.data.title}》 ({aiResponse.suggested_import.type === 'video' ? '影音教學' : '文字觀念'})
                        </span>
                        {aiResponse.suggested_import.data.url && (
                          <a href={aiResponse.suggested_import.data.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.1rem', textDecoration: 'none' }}>
                            原連結 <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      
                      <button 
                        onClick={handleImportSuggested}
                        disabled={isImporting}
                        className="form-submit-btn"
                        style={{ 
                          width: '100%', 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isImporting ? '正在寫入資料庫...' : '📥 立即將此教學一鍵收錄至我的雲端資料庫'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper blue">
                  <Video size={24} />
                </div>
                <div>
                  <div className="stat-number">{localData.videos.length}</div>
                  <div className="stat-label">已收錄教學影音</div>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper purple">
                  <Award size={24} />
                </div>
                <div>
                  <div className="stat-number">{localData.concepts.length}</div>
                  <div className="stat-label">核心觀念解析</div>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-icon-wrapper pink">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="stat-number">{allTags.length}</div>
                  <div className="stat-label">主題分類標籤</div>
                </div>
              </div>
            </div>

            {/* Dashboard Row */}
            <div className="dashboard-row">
              {/* Recent Videos */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 className="row-title">
                  <Tv size={20} className="logo-icon" />
                  精選/推薦學習影音
                </h2>
                <div className="recent-videos-list">
                  {localData.videos.map(video => (
                    <div 
                      key={video.id} 
                      className="recent-video-item glass-panel"
                      onClick={() => handleSelectVideo(video)}
                    >
                      <img src={video.thumbnail} alt={video.title} className="recent-video-thumb" />
                      <div className="recent-video-info">
                        <div className="recent-video-title">{video.title}</div>
                        <div className="recent-video-meta">
                          <span className={`video-badge ${video.type}`}>{video.platform}</span>
                          <span className="flex-row-center"><Clock size={12} /> {video.duration}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tag Cloud & Tip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="tags-cloud-card glass-panel">
                  <h2 className="row-title">
                    <Sparkles size={20} className="logo-icon" />
                    探索主題標籤
                  </h2>
                  <div className="tags-container">
                    {allTags.map(tag => (
                      <span 
                        key={tag} 
                        className={`tag-bubble ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => handleTagClick(tag)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                  <h2 className="row-title" style={{ color: 'var(--primary)' }}>
                    <Compass size={20} />
                    吹奏心法提示
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <strong>Wedge Technique 核心秘訣：</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    「吹高音時，感覺下腹部肌肉往上提，將肚子裡的空氣往上壓縮；保持嘴角向內聚攏（不要拉開），並把舌頭位置提高發出『Ee』的音。這時候嘴唇只需要自然放鬆地震動，右手千萬不要將吹嘴往嘴巴死命地壓！」
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: VIDEOS (LIST MODE) */}
        {activeTab === 'videos' && !selectedVideo && (
          <div>
            {/* Search & Filters */}
            <div className="search-filter-panel glass-panel" style={{ padding: '1.5rem' }}>
              <div className="search-input-wrapper">
                <Search className="search-icon-inside" size={20} />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="搜尋影片標題、筆記內容、觀念主題..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters-row">
                <div className="platform-filters">
                  <button 
                    className={`filter-btn ${selectedPlatform === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform('all')}
                  >
                    全部平台
                  </button>
                  <button 
                    className={`filter-btn ${selectedPlatform === 'video' ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform('video')}
                  >
                    YouTube 影片
                  </button>
                  <button 
                    className={`filter-btn ${selectedPlatform === 'shorts' ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform('shorts')}
                  >
                    Shorts 短片
                  </button>
                  <button 
                    className={`filter-btn ${selectedPlatform === 'tiktok' ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform('tiktok')}
                  >
                    TikTok
                  </button>
                </div>

                {selectedTag && (
                  <button className="filter-btn active" onClick={() => setSelectedTag('')}>
                    標籤: #{selectedTag} ✕
                  </button>
                )}
              </div>
            </div>

            {/* Video Cards Grid */}
            {filteredVideos.length > 0 ? (
              <div className="video-grid">
                {filteredVideos.map(video => (
                  <div 
                    key={video.id} 
                    className="video-card glass-panel"
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="video-card-thumb-wrapper">
                      <img src={video.thumbnail} alt={video.title} className="video-card-thumb" />
                      <span className="video-duration-badge">{video.duration}</span>
                      <span className="video-card-platform-badge">
                        <span className={`video-badge ${video.type}`}>{video.platform}</span>
                      </span>
                    </div>

                    <div className="video-card-body">
                      <h3 className="video-card-title">{video.title}</h3>
                      <p className="video-card-desc">{video.summary}</p>
                      
                      <div className="video-card-tags">
                        {video.tags.map(tag => (
                          <span key={tag} className="tag-label">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state glass-panel">
                <Search size={48} className="empty-icon" />
                <p>找不到符合篩選條件的教學影片。</p>
                <button 
                  className="filter-btn" 
                  style={{ marginTop: '1rem' }}
                  onClick={() => { setSearchQuery(''); setSelectedTag(''); setSelectedPlatform('all'); }}
                >
                  清除所有篩選條件
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: VIDEOS (DETAIL/PLAYER MODE) */}
        {selectedVideo && (
          <div>
            <button className="back-button" onClick={() => setSelectedVideo(null)}>
              <ArrowLeft size={16} /> 返回列表
            </button>

            <div className="detail-player-layout">
              {/* Left Column: Player & Meta */}
              <div className="video-player-section">
                <div className="video-viewport-wrapper">
                  {selectedVideo.youtubeId && selectedVideo.type !== 'shorts' ? (
                    <iframe
                      key={`${selectedVideo.id}-${currentTimestamp}`}
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?start=${currentTimestamp}&autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', border: '1px dashed rgba(0, 240, 255, 0.25)', borderRadius: '16px', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundImage: `url(${selectedVideo.thumbnail})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        filter: 'blur(16px) brightness(0.2)', 
                        zIndex: 0 
                      }} />
                      <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px', padding: '1rem' }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '50%', 
                          background: 'rgba(0, 240, 255, 0.1)', 
                          border: '1px solid var(--primary)', 
                          color: 'var(--primary)', 
                          marginBottom: '1.5rem',
                          boxShadow: '0 0 20px var(--primary-glow)'
                        }}>
                          <Play size={28} style={{ transform: 'translateX(2px)' }} />
                        </div>
                        <h3 style={{ fontFamily: 'var(--display-font)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
                          {selectedVideo.type === 'shorts' ? 'YouTube Shorts 播放提示' : 'TikTok 影音播放提示'}
                        </h3>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.5' }}>
                          由於 {selectedVideo.platform} 短影片具有嚴格的版權音樂與安全嵌入限制，無法在網頁中直接播放。請點擊下方按鈕前往原平台收看，並可對照右側的時間點筆記進行練習：
                        </p>
                        <a 
                          href={selectedVideo.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="form-submit-btn"
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.5rem', 
                            width: '100%', 
                            textDecoration: 'none',
                            padding: '0.85rem'
                          }}
                        >
                          在新分頁開啟 {selectedVideo.platform} 觀看原片 <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="video-info-details glass-panel">
                  <h2 className="video-info-title">{selectedVideo.title}</h2>
                  <div className="video-info-meta">
                    <span className={`video-badge ${selectedVideo.type}`}>{selectedVideo.platform}</span>
                    <span className="flex-row-center" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} /> 長度: {selectedVideo.duration}
                    </span>
                  </div>
                  <div className="video-card-tags" style={{ marginBottom: '1.25rem' }}>
                    {selectedVideo.tags.map(tag => (
                      <span key={tag} className="tag-label" style={{ cursor: 'pointer' }} onClick={() => handleTagClick(tag)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="video-info-summary">
                    <strong>教學核心摘要：</strong><br />
                    {selectedVideo.summary}
                  </p>
                </div>
              </div>

              {/* Right Column: Timestamps & Notes */}
              <div className="notes-section glass-panel">
                <div className="notes-header">
                  <FileText size={20} className="logo-icon" />
                  教學時間點筆記
                </div>
                
                <div className="notes-list">
                  {selectedVideo.notes && selectedVideo.notes.length > 0 ? (
                    selectedVideo.notes.map((note, index) => (
                      <div 
                        key={index} 
                        className={`note-item ${activeNoteIndex === index ? 'active' : ''}`}
                        onClick={() => handleTimestampClick(note.timestamp, index)}
                      >
                        <div className="note-item-header">
                          <span className="note-item-title">{note.title}</span>
                          <span className="note-timestamp">
                            <Play size={10} /> {note.time}
                          </span>
                        </div>
                        {note.content && <p className="note-content">{note.content}</p>}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      尚未對此影音建立細部時間點筆記。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONCEPTS */}
        {activeTab === 'concepts' && (
          <div>
            <div className="welcome-banner glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div className="welcome-banner-content">
                <h1 style={{ fontSize: '2rem' }}>Adam Rapa 小號教學核心觀念</h1>
                <p>整理自大師班與教材，深入剖析最關鍵的吹奏物理機制與心智訓練。</p>
              </div>
            </div>

            <div className="concepts-grid">
              {localData.concepts.map(concept => (
                <div key={concept.id} id={concept.id} className="concept-card glass-panel" style={{ transition: 'all 0.5s' }}>
                  <div className="concept-header">
                    <Award className="concept-icon" size={28} />
                    <h3 className="concept-title">{concept.title}</h3>
                  </div>
                  <div className="concept-body">
                    {concept.description.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                    ))}
                    {concept.url && (
                      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <a 
                          href={concept.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-row-center"
                          style={{ 
                            fontSize: '0.82rem', 
                            color: 'var(--primary)', 
                            textDecoration: 'none', 
                            gap: '0.25rem',
                            border: '1px solid rgba(0, 240, 255, 0.2)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            background: 'rgba(0, 240, 255, 0.05)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          閱讀詳細教學原文 <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ADD DATA (AUTO & MANUAL) */}
        {activeTab === 'add' && (
          <div className="glass-panel form-panel">
            <h2 className="form-title">新增教學資料庫項目</h2>
            
            {/* Form Toggle Tab */}
            <div className="platform-filters" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                className={`filter-btn ${activeFormTab === 'video' ? 'active' : ''}`}
                onClick={() => { setActiveFormTab('video'); setParseError(''); }}
                style={{ flex: 1, maxWidth: '200px' }}
              >
                🎬 新增影音/短片
              </button>
              <button 
                type="button"
                className={`filter-btn ${activeFormTab === 'concept' ? 'active' : ''}`}
                onClick={() => { setActiveFormTab('concept'); setParseError(''); }}
                style={{ flex: 1, maxWidth: '200px' }}
              >
                ✍️ 新增文字教學/觀念
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {activeFormTab === 'video' 
                ? "貼上影片連結，系統會自動在 Cloudflare 後端執行 LLM 深度分析，自動生成標題、標籤、摘要與筆記！"
                : "填寫教學文章或筆記連結，後端 LLM 將自動提煉出核心教學主題與文章精華觀念！"}
            </p>

            {/* Notification / Error / Warning Box */}
            {parseError && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.5rem', 
                padding: '0.85rem 1.15rem', 
                borderRadius: '8px', 
                background: parseError.includes('💡') ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                border: parseError.includes('💡') ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)', 
                color: parseError.includes('💡') ? '#f59e0b' : '#ef4444', 
                fontSize: '0.85rem', 
                lineHeight: '1.5',
                marginBottom: '1.5rem' 
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{parseError}</span>
              </div>
            )}

            <form onSubmit={handleSaveToDatabase}>
              
              {/* VIDEO TAB FORM */}
              {activeFormTab === 'video' && (
                <>
                  <div className="form-group">
                    <label className="form-label">影片連結 (URL) - 貼上後可點擊右側自動解析</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://www.youtube.com/watch?v=... 或 https://www.youtube.com/shorts/..." 
                        required
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="form-submit-btn"
                        style={{ 
                          width: 'auto', 
                          padding: '0 1.25rem', 
                          background: 'linear-gradient(135deg, var(--primary) 0%, #0099ff 100%)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={handleUrlAutoParse}
                        disabled={isParsing}
                      >
                        {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isParsing ? 'LLM 分析中...' : '⚡ AI 智能解析'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">教學標題</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="例如: 8. FISH FACE! (How to Build a Stronger Embouchure)" 
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">影音分類</label>
                      <select 
                        className="form-select"
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                      >
                        <option value="video">長影音 (Video)</option>
                        <option value="shorts">YouTube Shorts</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">平台</label>
                      <select 
                        className="form-select"
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                      >
                        <option value="YouTube">YouTube</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Website">其他網頁</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">影片縮圖網址 (自動解析可帶入)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="https://img.youtube.com/vi/..." 
                        value={formThumbnail}
                        onChange={(e) => setFormThumbnail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">時長 (MM:SS)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="12:45" 
                        required
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">主題標籤 (以英文逗號分隔)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Embouchure, High Range, Airflow" 
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">教學核心摘要</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      placeholder="簡單敘述這支影片的重要教學重點與物理心法..."
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      時間點筆記列表 (每行一筆，格式：`時間|大綱標題|詳細筆記內容`)
                    </label>
                    <textarea 
                      className="form-textarea" 
                      rows="5" 
                      placeholder="01:20|呼吸放鬆練習|說明如何放鬆肩膀&#13;04:35|Wedge的氣壓感受|說明氣壓如何在腹部建立"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    ></textarea>
                  </div>
                </>
              )}

              {/* CONCEPT/ARTICLE TAB FORM */}
              {activeFormTab === 'concept' && (
                <>
                  <div className="form-group">
                    <label className="form-label">參考文章網址 (URL) - 選填</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://www.adamrapa.com/... 或臉書教學連結" 
                        value={formConceptUrl}
                        onChange={(e) => setFormConceptUrl(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="form-submit-btn"
                        style={{ 
                          width: 'auto', 
                          padding: '0 1.25rem', 
                          background: 'linear-gradient(135deg, var(--primary) 0%, #0099ff 100%)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={handleUrlAutoParse}
                        disabled={isParsing}
                      >
                        {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isParsing ? 'LLM 分析中...' : (formConceptArticleText.trim() !== '' ? '⚡ AI 解析文章' : (formConceptUrl ? '⚡ AI 解析網址' : '⚡ AI 智能解析'))}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">貼上文章內容進行 AI 智能解析 (選填)</label>
                    <textarea 
                      className="form-textarea" 
                      rows="6" 
                      placeholder="如果您有大師班筆記、PDF 文章段落或是社群貼文，可以直接貼在這裡，然後點擊上方的『⚡ AI 解析文章』，AI 會自動為您提煉標題與精華內容！"
                      value={formConceptArticleText}
                      onChange={(e) => setFormConceptArticleText(e.target.value)}
                      style={{ background: 'rgba(10, 14, 28, 0.8)', borderColor: 'rgba(0, 240, 255, 0.1)' }}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">教學主題/核心觀念標題</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="例如: Wedge Technique (楔形呼吸法)" 
                      required
                      value={formConceptTitle}
                      onChange={(e) => setFormConceptTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">觀念詳細描述 / 教學文字文章精華</label>
                    <textarea 
                      className="form-textarea" 
                      rows="8" 
                      placeholder="在此貼上大師班的文字精華內容、部落格文章重點或自主學習筆記。段落之間可用兩個換行區分..."
                      required
                      value={formConceptDescription}
                      onChange={(e) => setFormConceptDescription(e.target.value)}
                    ></textarea>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="form-submit-btn" 
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
                }}
                disabled={isParsing}
              >
                <Save size={18} />
                {isParsing ? '資料寫入中...' : '💾 確認寫入資料庫'}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* BOTTOM NAV BAR: Shown only on Mobile (< 768px) */}
      {isMobile && (
        <nav className="mobile-bottom-nav glass-panel">
          <button 
            className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSelectedVideo(null); }}
          >
            <Compass size={20} />
            <span>儀表板</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('videos'); }}
          >
            <Video size={20} />
            <span>影音庫</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'concepts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('concepts'); setSelectedVideo(null); }}
          >
            <BookOpen size={20} />
            <span>核心觀念</span>
          </button>
          <button 
            className={`mobile-nav-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => { setActiveTab('add'); setSelectedVideo(null); }}
          >
            <PlusCircle size={20} />
            <span>新增教學</span>
          </button>
        </nav>
      )}

    </div>
  );
}

export default App;

import { useState, useMemo } from 'react';
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
  Save
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

  // Dynamic Data loading (Merge rapaData and localStorage for persistent instant additions)
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

  // URL Auto-Parse Logic (Cloudflare Pages Function + Fallback noembed)
  const handleUrlAutoParse = async () => {
    const targetUrl = activeFormTab === 'video' ? formUrl : formConceptUrl;
    
    if (!targetUrl) {
      setParseError('請先輸入網址');
      return;
    }
    
    setParseError('');
    setIsParsing(true);

    try {
      // 1. 優先嘗試呼叫 Cloudflare Pages 後端 LLM 解析 API
      const apiResponse = await fetch(`/api/parse?url=${encodeURIComponent(targetUrl)}`);
      const apiResult = await apiResponse.json();
      
      if (apiResponse.ok && apiResult.success && apiResult.data) {
        const llmData = apiResult.data;
        
        // 提取 YouTube 相關資訊 (如果是 YouTube)
        const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|shorts\/)([^"&?\/\s]{11})/);
        const vid = ytMatch ? ytMatch[1] : '';
        
        if (activeFormTab === 'video') {
          if (llmData.title) setFormTitle(llmData.title);
          if (llmData.summary) setFormSummary(llmData.summary);
          if (llmData.tags && Array.isArray(llmData.tags)) setFormTags(llmData.tags.join(', '));
          
          // Notes 格式轉換: "時間|大綱標題|詳細筆記內容"
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
          // Concept Tab
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
      
      // 2. 如果後端回傳無金鑰 (no_key)，或是其他 API 失敗，自動 Fallback 回退至 noembed 基礎解析
      if (apiResult.error === 'no_key') {
        setParseError('💡 提示：您的 Cloudflare 後端尚未設定 API 金鑰。已自動回退為「基本解析」（僅取得標題與縮圖）。若要啟用 LLM 智慧分析自動生成摘要與筆記，請在 Cloudflare Pages Dashboard 中設定環境變數 GEMINI_API_KEY 或 OPENAI_API_KEY。');
      } else {
        console.warn('Cloudflare API 調用出錯，將自動回退至基礎解析服務。錯誤原因：', apiResult.error || 'Connection Failed');
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
          // Concept Tab
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
      console.error('解析網址失敗', err);
      setParseError('網址解析失敗，請手動輸入資訊。');
    } finally {
      setIsParsing(false);
    }
  };

  // Save new item dynamically to LocalStorage and attempt local disk write if on dev server
  const handleSaveToDatabase = async (e) => {
    e.preventDefault();
    setIsParsing(true);
    
    let newObj = null;

    if (activeFormTab === 'video') {
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

      // 1. 保存到 LocalStorage (確保雲端部署重整後依舊存在)
      const savedVideos = JSON.parse(localStorage.getItem('rapa_user_videos') || '[]');
      savedVideos.push(newObj);
      localStorage.setItem('rapa_user_videos', JSON.stringify(savedVideos));

      // 2. 更新 React 當前顯示 State
      setLocalData(prev => ({
        ...prev,
        videos: [...prev.videos, newObj]
      }));

    } else {
      const randomId = "concept-" + Math.floor(Math.random() * 1000);
      newObj = {
        id: randomId,
        title: formConceptTitle,
        url: formConceptUrl || undefined,
        description: formConceptDescription
      };

      // 1. 保存到 LocalStorage
      const savedConcepts = JSON.parse(localStorage.getItem('rapa_user_concepts') || '[]');
      savedConcepts.push(newObj);
      localStorage.setItem('rapa_user_concepts', JSON.stringify(savedConcepts));

      // 2. 更新 React 當前顯示 State
      setLocalData(prev => ({
        ...prev,
        concepts: [...prev.concepts, newObj]
      }));
    }

    // 3. 嘗試寫入本地硬碟 (僅在 npm run dev 本地開發伺服器下有作用)
    try {
      const writeResponse = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObj)
      });
      const writeResult = await writeResponse.json();

      if (writeResponse.ok && writeResult.success) {
        alert('✨ 成功！資料已同步寫入本地的 rapaData.json 檔案！\nGit 將會偵測到檔案修改，請將其推送至 GitHub 來發布更新。');
      } else {
        alert('💾 成功！資料已安全保存於您瀏覽器的本機快取 (LocalStorage) 中，網頁已即時更新顯示！\n\n提示：因為 Cloudflare Pages 雲端為唯讀環境，若要將此更新永久同步到 GitHub 代碼庫中，請於本地執行開發伺服器新增，並執行 git push。');
      }
    } catch (e) {
      // 雲端或 Wrangler Pages Dev 模式下沒有 save-data API 則會報錯，自動回退使用 LocalStorage
      alert('💾 成功！資料已安全保存於您瀏覽器的本機快取 (LocalStorage) 中，網頁已即時更新顯示！\n\n提示：因為 Cloudflare Pages 雲端為唯讀環境，若要將此更新永久同步到 GitHub 代碼庫中，請於本地執行開發伺服器新增，並執行 git push。');
    }

    // 清空表單
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
    }

    setIsParsing(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Section */}
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
                <div key={concept.id} className="concept-card glass-panel">
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
                    <label className="form-label">參考文章網址 (URL) - 選填，貼上後可點擊右側自動解析標題</label>
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
                        {isParsing ? 'LLM 分析中...' : '⚡ AI 智能解析'}
                      </button>
                    </div>
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
    </div>
  );
}

export default App;

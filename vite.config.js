import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 自訂本地開發資料寫入插件
const localDataSaverPlugin = () => ({
  name: 'local-data-saver',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.method === 'POST' && req.url === '/api/save-data') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const newItem = JSON.parse(body);
            const dataPath = path.resolve(__dirname, 'src/data/rapaData.json');
            
            // 讀取現有的 JSON
            const fileData = fs.readFileSync(dataPath, 'utf-8');
            const jsonData = JSON.parse(fileData);
            
            // 根據有沒有 notes 或是 duration 來判斷寫入 videos 還是 concepts
            if (newItem.notes !== undefined) {
              // 影音類型
              // 防止重複寫入 (藉由 id 或 youtubeId 判斷)
              const exists = jsonData.videos.some(v => v.id === newItem.id || (v.youtubeId && v.youtubeId === newItem.youtubeId));
              if (!exists) {
                jsonData.videos.push(newItem);
              }
            } else {
              // 觀念類型
              const exists = jsonData.concepts.some(c => c.id === newItem.id || c.title === newItem.title);
              if (!exists) {
                jsonData.concepts.push(newItem);
              }
            }
            
            // 寫回本地檔案
            fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2), 'utf-8');
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, message: '已成功寫入本地 rapaData.json 檔案！' }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else if (req.method === 'POST' && req.url === '/api/delete-data') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const deleteInfo = JSON.parse(body);
            const dataPath = path.resolve(__dirname, 'src/data/rapaData.json');
            
            // 讀取現有的 JSON
            const fileData = fs.readFileSync(dataPath, 'utf-8');
            const jsonData = JSON.parse(fileData);
            
            // 過濾掉要刪除的項目
            if (deleteInfo.type === 'video') {
              jsonData.videos = jsonData.videos.filter(v => v.id !== deleteInfo.id);
            } else {
              jsonData.concepts = jsonData.concepts.filter(c => c.id !== deleteInfo.id);
            }
            
            // 寫回本地檔案
            fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2), 'utf-8');
            
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, message: '已成功從本地 rapaData.json 檔案中刪除該項目！' }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localDataSaverPlugin()],
})

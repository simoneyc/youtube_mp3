import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const publicPath = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
}
app.use(express.static(publicPath));
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

// 將 Render 環境變數轉為 cookies.txt
const cookiesBase64 = process.env.YTDLP_COOKIES_BASE64;
const cookiesPath = path.join(process.cwd(), 'cookies.txt');

if (cookiesBase64) {
    const cookiesContent = Buffer.from(cookiesBase64, 'base64').toString('utf-8');
    fs.writeFileSync(cookiesPath, cookiesContent);
    console.log('✅ Cookies 檔案已成功寫入');
} else {
    console.warn('⚠️ 未偵測到 YTDLP_COOKIES_BASE64，請確認已設定 Render 環境變數');
}

app.post('/download', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).send('請輸入 YouTube 連結');

    exec(`yt-dlp --cookies "${cookiesPath}" --get-title "${url}"`, (err, stdout) => {
        if (err) {
            console.error(err);
            return res.status(500).send('無法取得影片標題');
        }

        let title = stdout.trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_');

        const outputPath = path.join(process.cwd(), 'downloads', `${title}.mp3`);
        const command = `yt-dlp --cookies "${cookiesPath}" -f bestaudio --extract-audio --audio-format mp3 -o "${outputPath}" "${url}"`;

        exec(command, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('下載失敗');
            }

            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    res.json({ downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${encodeURIComponent(title)}.mp3` });
                } else {
                    res.status(500).send('檔案尚未準備好，請稍後再試');
                }
            }, 2000);
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server Running on http://localhost:${PORT}`));

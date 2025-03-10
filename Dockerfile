# 以 Node.js 18 作為基底映像
FROM node:18-slim

# 安裝必要的系統工具
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 建立 Python 虛擬環境
RUN python3 -m venv /venv

# 啟用虛擬環境並安裝 yt-dlp
RUN /venv/bin/pip install --no-cache-dir --upgrade pip && \
    /venv/bin/pip install --no-cache-dir yt-dlp

# 建立應用目錄
WORKDIR /app

# 複製專案檔案
COPY . .

# 安裝 node.js 套件
RUN npm install

# 設定環境變數，讓所有指令都使用虛擬環境的 Python
ENV PATH="/venv/bin:$PATH"

# 對外開放 3000 端口
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]

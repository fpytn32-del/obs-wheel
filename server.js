const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = "VikaWheel2024";

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        options: ["Ничего", "Джекпот — 10 000 ₽", "Бонуска"],
        history: [],
        settings: { spinSound: "spin.mp3", startBtnText: "Да-да, Нет-нет", conveyorSpeed: 15 },
        lastUpdate: Date.now()
    }));
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'GET') {

        // ===== Эндпоинт для пинга =====
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'alive', timestamp: new Date().toISOString() }));
        }
        // ===============================

        if (req.url === '/api/data') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(fs.readFileSync(DATA_FILE));
        }
        let filePath = req.url === '/' ? 'index.html' : req.url.substring(1);
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            const mime = { '.html': 'text/html', '.mp3': 'audio/mpeg' };
            res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
            res.end(fs.readFileSync(fullPath));
        } else { res.writeHead(404); res.end(); }
    } else if (req.method === 'POST' && req.url === '/api/data') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incomingData = JSON.parse(body);
                if (incomingData.password !== ADMIN_PASSWORD) {
                    res.writeHead(403); return res.end(JSON.stringify({ status: 'error' }));
                }
                delete incomingData.password;
                incomingData.lastUpdate = Date.now();
                fs.writeFileSync(DATA_FILE, JSON.stringify(incomingData, null, 2));
                res.writeHead(200); res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) { res.writeHead(400); res.end(); }
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    // ===== SELF-PING для Render.com (каждые 10 минут) =====
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
        const PING_INTERVAL = 10 * 60 * 1000; // 10 минут

        setInterval(() => {
            https.get(`${RENDER_URL}/health`, (resp) => {
                console.log(`[Keep-Alive] Ping OK: ${resp.statusCode} | ${new Date().toISOString()}`);
            }).on('error', (err) => {
                console.error(`[Keep-Alive] Ping failed: ${err.message}`);
            });
        }, PING_INTERVAL);

        console.log(`[Keep-Alive] Self-ping enabled every 10 min → ${RENDER_URL}/health`);
    } else {
        console.log('[Keep-Alive] RENDER_EXTERNAL_URL not set, self-ping disabled (local mode)');
    }
    // ======================================================
});

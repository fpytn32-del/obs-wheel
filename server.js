const http = require('http');
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
server.listen(PORT, '0.0.0.0');

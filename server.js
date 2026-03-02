const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = "VikaWheel2024";

const initialData = {
    options: ["Ничего", "Приз 1", "Приз 2"],
    history: [],
    settings: { 
        spinSound: "spin.mp3",
        startBtnText: "Да-да, Нет-нет",
        centerImage: "https://media.tenor.com/On79Z75UvS8AAAAC/cat-dance.gif",
        spinTime: 12000,
        flavorTexts: {},
        autoDelete: false,
        remoteTrigger: 0,
        // ДИЗАЙН И ПОЗИЦИИ (Твои пресеты)
        panelOpacity: 0.7,
        panelBlur: 15,
        startBtnTop: 100, startBtnLeft: 50,
        historyTop: 260, historyLeft: 50,
        // ШРИФТЫ (Стили и размеры)
        fontWheel: 14, fontWheelFamily: 'Inter',
        fontBtn: 50, fontBtnFamily: 'Inter',
        fontHist: 16, fontHistFamily: 'Inter',
        // СТРЕЛКА
        arrowType: 'classic',
        arrowColor: '#ffffff'
    },
    lastUpdate: Date.now()
};

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(initialData));

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
        if (fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath).toLowerCase();
            const mime = { '.html': 'text/html', '.mp3': 'audio/mpeg', '.json': 'application/json' };
            res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
            res.end(fs.readFileSync(fullPath));
        } else res.end();
    } else if (req.method === 'POST' && req.url === '/api/data') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incoming = JSON.parse(body);
                if (incoming.password !== ADMIN_PASSWORD) { res.writeHead(403); return res.end(); }
                const currentData = JSON.parse(fs.readFileSync(DATA_FILE));
                const newData = { ...currentData, ...incoming, lastUpdate: Date.now() };
                delete newData.password;
                fs.writeFileSync(DATA_FILE, JSON.stringify(newData));
                res.writeHead(200); res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) { res.writeHead(400); res.end(); }
        });
    }
});
server.listen(PORT, '0.0.0.0');

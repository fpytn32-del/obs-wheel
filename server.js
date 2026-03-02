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
        spinSound: "spin.mp3", startBtnText: "Да-да, Нет-нет", historyTitle: "ИСТОРИЯ ВЫИГРЫШЕЙ",
        centerImage: "", spinTime: 12000, flavorTexts: {}, autoDelete: false, remoteTrigger: 0,
        panelOpacity: 0.7, panelBlur: 15,
        startBtnTop: 100, startBtnWidth: 500, startBtnHeight: 110,
        historyTop: 260, historyWidth: 340, historyHeight: 200,
        fontWheel: 14, fontWheelFamily: 'Inter', fontBtn: 50, fontBtnFamily: 'Inter',
        fontHist: 15, fontHistFamily: 'Inter', fontHistTitle: 11,
        arrowType: 'classic', arrowColor: '#ffffff',
        dragonImg: "", dragonX: 50, dragonY: 50, dragonSize: 300,
        showPrizeList: true, prizeListTop: 500, prizeListWidth: 340, prizeListHeight: 200, prizeListTitle: "ПРИЗОВОЙ ФОНД"
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
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
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
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = "VikaWheel2024";

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'GET') {
        if (req.url === '/api/data') {
            const data = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE) : JSON.stringify({});
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(data);
        }
        let filePath = req.url === '/' ? 'index.html' : req.url.substring(1);
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            const mime = { '.html': 'text/html', '.mp3': 'audio/mpeg', '.json': 'application/json' };
            res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
            res.end(fs.readFileSync(fullPath));
        } else { res.writeHead(404); res.end(); }

    } else if (req.method === 'POST' && req.url === '/api/data') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incoming = JSON.parse(body);
                if (incoming.password !== ADMIN_PASSWORD) {
                    res.writeHead(403); return res.end("Wrong Password");
                }
                // Сохраняем данные, удаляя пароль
                const dataToSave = { ...incoming };
                delete dataToSave.password;
                dataToSave.lastUpdate = Date.now();
                
                fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
                res.writeHead(200); res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) { res.writeHead(400); res.end("Error"); }
        });
    }
});
server.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on ${PORT}`));

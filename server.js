const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
        case '.mp3':
            contentType = 'audio/mpeg';
            break;
        case '.ogg':
            contentType = 'audio/ogg';
            break;
        case '.webp':
            contentType = 'image/webp';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                if (filePath.startsWith('./assets/')) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end(`Asset not found: ${filePath}`, 'utf-8');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File Not Found</h1>', 'utf-8');
                }
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8086;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Assets directory accessible at http://localhost:${PORT}/assets/`);
});
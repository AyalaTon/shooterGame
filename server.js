const { createServer } = require('node:http');
const { readFile } = require('node:fs');
const { join, extname } = require('node:path');
const WebSocket = require('ws');
const Player = require('./Player');

const hostname = '0.0.0.0';
const port = 3000;

const players = [];

function broadcastPosition(player) {
    const message = JSON.stringify({
        type: 'updatePosition',
        player: player.name,
        position: player.position,
        color: player.color,
        life: player.life,
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
function broadcastText(playerFrom, mensaje) {
    const player = players.find(p => p.name === playerFrom);
    const message = JSON.stringify({
        type: 'text',
        player: player.name,
        color: player.color,
        mensaje: mensaje,
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function loopFunction() {
    players.forEach(player => {
        broadcastPosition(player);
    });
}

setInterval(loopFunction, 1000 / 60); // 60 FPS

const server = createServer((req, res) => {
    let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = extname(filePath);

    let contentType = 'text/html';
    if (ext === '.js') {
        contentType = 'application/javascript';
    } else if (ext === '.css') {
        contentType = 'text/css';
    }

    readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('404 Not Found');
            console.error(err);
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            res.end(data);
        }
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', data => {
        const message = JSON.parse(data);

        if (message.type === 'updatePlayer') {
            let player = players.find(p => p.name === message.name);
            if (!player) {
                player = new Player(message.name, message.color, message.position, 100);
                players.push(player);
            }
            player.position = message.position; 
        } else if (message.type === 'updatePosition') {
            const player = players.find(p => p.name === message.player);
            if (player) {
                player.position = message.position;
                broadcastPosition(player);
            }
        } else if (message.type === 'text') {
            console.log(message.player + " escribió: '" + message.mensaje + "'")
            broadcastText(message.player, message.mensaje)
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

$(document).ready(function() {
    $('#input_nickname').val("");
});

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let ws;
const players = {};
const keys = {};
const speed = 2;
let isDivMessageVisible = false;

function drawPlayer(player, position, color, life) {
    const radius = 20;

    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, false); // Draw a circle
    ctx.fillStyle = color; // Set the fill color
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000'; // Set the stroke color
    ctx.stroke();
    ctx.closePath();

    // Optionally draw player name and life points
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000000'; // Text color
    ctx.textAlign = 'center';
    ctx.fillText(player, position.x, position.y - radius - 10); // Draw player name above the player
    ctx.fillText(`Life: ${life}`, position.x, position.y + radius + 20); // Draw life points below the player
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updatePlayer(playerName, position, color, life) {
    if (players[playerName]) {
        players[playerName].position = position || players[playerName].position;
        players[playerName].color = color || players[playerName].color;
        players[playerName].life = life !== undefined ? life : players[playerName].life;
    } else {
        // Create a new player if they don't exist
        players[playerName] = {
            position: position || { x: 0, y: 0 },
            color: color || getRandomColor(),    
            life: life !== undefined ? life : 100
        };
    }
}

// Handle key events
document.addEventListener('keydown', function(event) {
    keys[event.key] = true;
    if (event.key === 'Enter') {
        console.log($(document.activeElement)[0].id) // Get the currently focused element)
        if ($(document.activeElement)[0].id == "inputMessage" || $(document.activeElement)[0].id == "myCanvas"){
            if (!isDivMessageVisible) {
                $('#inputMessage').focus()
                isDivMessageVisible = true;
            } else {
                if($('#inputMessage').val() != ""){
                    sendMessageToServer($('#inputMessage').val())
                }
                $('#inputMessage').val("")
                $('#myCanvas').focus()
                isDivMessageVisible = false;
            }
        }
    }
});

document.addEventListener('keyup', function(event) {
    keys[event.key] = false;
});

setInterval(loop, 1000 / 60); // 60 FPS

function loop() {
    clearCanvas();
    Object.keys(players).forEach(name => {
        const p = players[name];
        drawPlayer(name, p.position, p.color, p.life);
    });

    let moveX = 0;
    let moveY = 0;

    if(!isDivMessageVisible) {
        if (keys['w'] || keys['W']) moveY -= speed; // Move up
        if (keys['s'] || keys['S']) moveY += speed; // Move down
        if (keys['a'] || keys['A']) moveX -= speed; // Move left
        if (keys['d'] || keys['D']) moveX += speed; // Move right
    }

    // Update position if there was any movement
    if (moveX !== 0 || moveY !== 0) {
        let playerName = $('#input_nickname').val();

        players[playerName].position.x = Math.max(0, Math.min(canvas.width, players[playerName].position.x + moveX));
        players[playerName].position.y = Math.max(0, Math.min(canvas.height, players[playerName].position.y + moveY));

        // Send the new position to the server
        sendPositionToServer(players[playerName].position);
    }
}

function sendMessageToServer(mensaje) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'text',
            player: $('#input_nickname').val(),
            mensaje: mensaje
        };
        ws.send(JSON.stringify(message));
    }
}

function writeToTextarea(user, text) {
    const textarea = document.getElementById('chat');
    textarea.value += `${user}: ${text}\n`;
    textarea.scrollTop = textarea.scrollHeight;
}

function sendPositionToServer(position) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'updatePosition',
            player: $('#input_nickname').val(),
            position: position,
            color: players[$('#input_nickname').val()].color,
            life: players[$('#input_nickname').val()].life
        };

        ws.send(JSON.stringify(message));
    }
}

// Function to generate a random hex color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function startGame() {
    $('#chat').val("")
    const playerName = $('#input_nickname').val().trim();

    if (playerName === "") {
        alert("Please enter a name to play.");
        return;
    }

    $('#start_menu').addClass("hidden");
    $('#myCanvas').removeClass();
    canvas.width = $('#myCanvas').innerWidth();
    canvas.height = $('#myCanvas').innerHeight();       
    // Establish WebSocket connection
    ws = new WebSocket(`ws://${location.hostname}:${location.port}`);

    ws.onopen = () => {
        console.log("Connected to the server");

        // Generate random position for the player
        const randomX = Math.floor(Math.random() * (990 - 25 + 1)) + 25;
        const randomY = Math.floor(Math.random() * (720 - 45 + 1)) + 45;

        // Initialize player in the local players list with the random position
        players[playerName] = {
            position: { x: randomX, y: randomY }, // Random initial position
            color: getRandomColor(), // Random color
            life: 100 // Initial life
        };

        // Send player's name and initial data to the server
        const playerData = {
            type: 'updatePlayer',
            name: playerName,
            color: players[playerName].color,
            position: players[playerName].position 
        };

        ws.send(JSON.stringify(playerData));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'updatePosition') {
            updatePlayer(message.player, message.position, message.color, message.life);
        } else if (message.type === 'text') {
            // console.log("Nuevo mensaje")
            writeToTextarea(message.player, message.mensaje)
        }
    };

    ws.onclose = () => {
        console.log("Disconnected from the server");
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
}

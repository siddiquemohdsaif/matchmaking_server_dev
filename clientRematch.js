const WebSocket = require('ws');

// Prepare data for the player
const player = {
    uid: 'sampleUid',
    gameId: 'sampleGameId',
    trophy: 10,
    mapId: 1,
    strikerId: 1,
    carromId: 1,
    playerExtraInfo: 'extraInfo'
};

// Create the websocket connection string
const connectionUrl = `ws://167.172.85.50:3001?uid=${player.uid}&gameId=${player.gameId}&trophy=${player.trophy}&mapId=${player.mapId}&strikerId=${player.strikerId}&carromId=${player.carromId}&playerExtraInfo=${player.playerExtraInfo}`;

// Create a new websocket connection
const ws = new WebSocket(connectionUrl);

ws.on('open', function open() {
    console.log('Connected to server');

    // Request a rematch
    ws.send('reMatch');
});

ws.on('message', function incoming(data) {
    console.log(`Received: ${data}`);
    
    const message = JSON.parse(data);

    if (message.type === "wantToReMatch") {
        console.log("Opponent wants to rematch");
        // Respond to rematch request
        ws.send('reMatch');
    } else if (message.type === "cancel") {
        console.log("Match cancelled");
    } else if (message.type === "success") {
        console.log("Rematch successful");
        console.log(`Game state: ${message.gameState}`);
        console.log(`Server IP: ${message.IP}`);
    }
});

ws.on('close', function close() {
    console.log('Connection closed');
});

ws.on('error', function error(err) {
    console.log(`An error occurred: ${err}`);
});
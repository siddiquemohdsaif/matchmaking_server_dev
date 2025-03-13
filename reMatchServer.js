const WebSocket = require('ws');
const GameMaker = require('./Utils/GameMaker');
const { initializeGameInGameServer } = require('./Utils/GameInitiator');
const FirestoreManager = require('./Firestore/FirestoreManager');
const firestoreManager = FirestoreManager.getInstance();
const wss = new WebSocket.Server({ port: 3001 });

const reMatchPlayers = {};

const getPlayerFromRequest = (request) => {
    const queryParams = new URLSearchParams(request.url.slice(request.url.indexOf('?') + 1));
    const ping = queryParams.get('ping') ? queryParams.get('ping').split(',').map(Number) : null;

    return {
        uid: queryParams.get('uid'),
        gameId: queryParams.get('gameId'),
        mapId: parseInt(queryParams.get('mapId')),
        reMatch: false,
        ping : ping,
        timeStamp: new Date().getTime(),
    }
}

const isPlayerDataValid = (player) => {
    return player.uid !== null &&
        player.gameId !== null &&
        player.mapId !== null;
}

const addPlayerToReMatch = (player, gameId, uid) => {
    if (!(gameId in reMatchPlayers)) {
        reMatchPlayers[gameId] = {};
    }
    if (gameId.slice(0, 16) === uid) {
        reMatchPlayers[gameId].uid1 = player;
    } else if (gameId.slice(16) === uid) {
        reMatchPlayers[gameId].uid2 = player;
    }
}

const attemptRematch = (gameId) => {
    const player1 = reMatchPlayers[gameId].uid1;
    const player2 = reMatchPlayers[gameId].uid2;

    if (player1 && player2 && player1.reMatch && player2.reMatch) {
        doRematch(gameId);
    } else if (player1 && player2) {
        if (player1.reMatch) {
            player2.socket.send(JSON.stringify({ type: "wantToReMatch" }));
        } else if (player2.reMatch) {
            player1.socket.send(JSON.stringify({ type: "wantToReMatch" }));
        }
    }
}

const doRematch = async (gameId) => {
    let tempPlayer1 = reMatchPlayers[gameId].uid1;
    let tempPlayer2 = reMatchPlayers[gameId].uid2;

    // Randomly decide who will be player1
    const rand = Math.random();
    const player1 = rand <= 0.5 ? tempPlayer1 : tempPlayer2;
    const player2 = rand <= 0.5 ? tempPlayer2 : tempPlayer1;

    if (player1.socket.readyState !== WebSocket.OPEN) {
        cancelMatch(gameId, player1.uid);
        return;
    }

    if (player2.socket.readyState !== WebSocket.OPEN) {
        cancelMatch(gameId, player2.uid);
        return;
    }

    const trophyData = {
        p1 : {win : 0, lose : 0},
        p2 : {win : 0, lose : 0},
    }
    const gameInfo = await GameMaker.createGameInfoWithWar(player1.uid, player2.uid, player1.mapId, false, false, trophyData, player1.ping, player2.ping, "REMATCH", "REMATCH");
    const gameIdNew = gameInfo.gameID;
    const type = "success"
    const isInitialize = await initializeGameInGameServer(gameInfo.gameID, gameInfo.gameState, gameInfo.IP);

    if(isInitialize){

        player1.socket.send(JSON.stringify({ type, gameId : gameIdNew, IP: gameInfo.IP }));
        player2.socket.send(JSON.stringify({ type, gameId : gameIdNew, IP: gameInfo.IP }));
        player1.socket.close();
        player2.socket.close();
        delete reMatchPlayers[gameId];
    

    }else{
        console.error("error : x01624");
        player1.socket.close();
        player2.socket.close();
        delete reMatchPlayers[gameId];
    }
}

wss.on('connection', (socket, request) => {
    const player = getPlayerFromRequest(request);
    player.socket = socket;
    //console.log("gameId:"+player.gameId);
    if (!isPlayerDataValid(player)) {
        socket.close();
        return;
    }

    addPlayerToReMatch(player, player.gameId, player.uid);

    socket.on('message', (message) => {
        if (message == 'reMatch') {
            if (reMatchPlayers[player.gameId].uid1 && reMatchPlayers[player.gameId].uid1.uid === player.uid) {
                reMatchPlayers[player.gameId].uid1.reMatch = true;
            } else if (reMatchPlayers[player.gameId].uid2 && reMatchPlayers[player.gameId].uid2.uid === player.uid) {
                reMatchPlayers[player.gameId].uid2.reMatch = true;
            }
            attemptRematch(player.gameId);
        }
    });

    socket.on('close', () => {
        cancelMatch(player.gameId, player.uid);
    });
});

const cancelMatch = (gameId, uid) => {

    if(!reMatchPlayers[gameId]){
        return;
    }

    const player1 = reMatchPlayers[gameId].uid1;
    const player2 = reMatchPlayers[gameId].uid2;

    if (player1 && player1.uid === uid) {
        if (player2) {
            player2.socket.send(JSON.stringify({ type: "cancel" }));
            player2.socket.close();
        }
        delete reMatchPlayers[gameId];
    } else if (player2 && player2.uid === uid) {
        if (player1) {
            player1.socket.send(JSON.stringify({ type: "cancel" }));
            player1.socket.close();
        }
        delete reMatchPlayers[gameId];
    }
};
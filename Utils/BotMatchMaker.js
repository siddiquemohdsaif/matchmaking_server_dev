const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const GameMaker = require('./GameMaker');
const { initializeGameInGameServer } = require('./GameInitiator');
const WebSocket = require('ws');
const TrophyExchangeEvaluater = require('./TrophyExchangeEvaluater');


const selectBot = async (xp, mapId) => {
    try {
        const { collectionPath, level } = getBotLevel(xp, mapId) || {};
        if (!collectionPath || !level) {
            console.error("Failed to determine bot level or collection path");
            return false;
        }

        const botsDocument = await firestoreManager.readDocument("Data", collectionPath, "/");
        const bots = [];
        const currentTime = Date.now();

        Object.entries(botsDocument).forEach(([key, bot]) => {
            const timeDiff = currentTime - bot.lastGamePlayedAt;
            if (bot.isFree || timeDiff >= 1800000) {
                bots.push({ key, ...bot });
            }
        });

        if (bots.length === 0) {
            console.error("No free bots available");
            return false;
        }

        const randomIndex = Math.floor(Math.random() * bots.length);
        const bot = bots[randomIndex];
        bot.level = level;
        // console.log(bot)
        return bot;
    } catch (error) {
        console.error("Error fetching bots:", error);
        return false;
    }
};

const getBotLevel = (xp, mapId) => {
    const xpMapConfig = [
        { min: 0, max: 3, mapConfig: { 0: { path: "BotAccountsLvl1", level: 1 }, 1: { path: "BotAccountsLvl3", level: 3 }, 2: { path: "BotAccountsLvl3", level: 3 }, 3: { path: "BotAccountsLvl7", level: 7 } } },
        { min: 4, max: 6, mapConfig: { 0: { path: "BotAccountsLvl1", level: 1 }, 1: { path: "BotAccountsLvl3", level: 3 }, 2: { path: "BotAccountsLvl7", level: 7 }, 3: { path: "BotAccountsLvl7", level: 7 } } },
        { min: 7, max: 9, mapConfig: { 0: { path: "BotAccountsLvl3", level: 3 }, 1: { path: "BotAccountsLvl7", level: 7 }, 2: { path: "BotAccountsLvl7", level: 7 }, 3: { path: "BotAccountsLvl10", level: 10 } } },
        { min: 10, max: Infinity, mapConfig: { 0: { path: "BotAccountsLvl7", level: 7 }, 1: { path: "BotAccountsLvl7", level: 7 }, 2: { path: "BotAccountsLvl10", level: 10 }, 3: { path: "BotAccountsLvl10", level: 10 } } }
    ];

    // Find the appropriate config based on xp
    const xpConfig = xpMapConfig.find(({ min, max }) => xp >= min && xp <= max);
    if (!xpConfig || !xpConfig.mapConfig[mapId]) {
        console.error("Invalid mapId or xp range");
        return false;
    }

    const { path: collectionPath, level } = xpConfig.mapConfig[mapId];
    // console.log(`collectionPath :${collectionPath} level: ${level}`)
    return { collectionPath, level };
};

const getBotProfile = async (uid) => {
    return await firestoreManager.readDocumentWithProjection("Users", uid, "/", { "gameData.trophy": 1 });
}

const setBotUsed = async (bot) => {
    let freeField = `${bot.key}.isFree`;
    let tsField = `${bot.key}.lastGamePlayedAt`;
    await firestoreManager.updateDocument("Data", "BotAccountsLvl" + bot.level, "/", { [freeField]: false, [tsField]: Date.now() });
}



const makeMatchWithBot = async (uid, mapId, player) => {

    let isSuccessfull = false;

    if (mapId >= 0 && mapId <= 3) {
        let bot = await selectBot(player.xp,mapId);
        if (bot) {
            const botProfile = await getBotProfile(bot.uid);
            const result = await makeMatch(bot.uid, uid, mapId, player, bot.level, botProfile.gameData.trophy, player.trophy);
            setBotUsed(bot);
            return result;
        }
    }

    return isSuccessfull;

}


const makeMatch = async (uid1, uid2, mapId, player, level, botTrophy, playerTrophy) => {

    const botUid = uid1;
    let botIsFirstPlayer = true;


   
    // Randomly decide whether to swap uid1 and uid2 , it make random of being any player first player
    if (Math.random() > 0.5) {
        let temp = uid1;
        uid1 = uid2;
        uid2 = temp;
        botIsFirstPlayer = false;
    }

    let player1InWar = false;
    let player2InWar = false;
    let trophyData;
    let gameType1 = "NORMAL";
    let gameType2 = "NORMAL";

    if (botIsFirstPlayer) {
        trophyData = await TrophyExchangeEvaluater.evaluate(botTrophy, playerTrophy);
        player2InWar = player.isPlayerInWar;
        gameType1 = "BOT";
    } else {
        player1InWar = player.isPlayerInWar;
        trophyData = await TrophyExchangeEvaluater.evaluate(playerTrophy, botTrophy);
        gameType2 = "BOT";
    }


    //Initialize Game in game server
    const gameInfo = await GameMaker.createGameInfoWithWar(uid1, uid2, mapId, player1InWar, player2InWar, trophyData, player.ping, player.ping, gameType1, gameType2);
    const gameId = gameInfo.gameID;
    const type = "success";


    if (player.socket.readyState !== WebSocket.OPEN) {
        return false;
    }

    const isInitialize = await initializeGameInGameServer(gameInfo.gameID, gameInfo.gameState, gameInfo.IP);
    if (isInitialize) {
        //console.log(gameInfo);
        player.socket.send(JSON.stringify({ type, gameId, IP: gameInfo.IP }));
        player.socket.send(JSON.stringify({ type: "PBC", gameId, IP: gameInfo.IP, uid: botUid, level: level })); // play with bot connect
        player.socket.close();
        return true;

    } else {
        console.error("error failed to initialize Game in GameServer.");
        return false;
    }

}



module.exports = {
    makeMatchWithBot,
}
const WebSocket = require('ws');
// const GameInitiater = require('./GameInitiator');
const GameMaker = require('./Utils/GameMaker');
const { initializeGameInGameServer } = require('./Utils/GameInitiator');
const FirestoreManager = require('./Firestore/FirestoreManager');
const WarHandler = require('./Utils/WarHandler');
const TrophyExchangeEvaluater = require('./Utils/TrophyExchangeEvaluater');
const firestoreManager = FirestoreManager.getInstance();
const MatchMakingEvaluator = require('./Utils/MatchMakingEvaluator');
const BotMatchMaker = require('./Utils/BotMatchMaker');
const GameAnalytics = require('./Utils/GameAnalytics');
let gameWithUserList = {};
let gameWithBotList = {};


const scheduleDailyAnalyticsUpdate = () => {
    // Get the current UTC time
    const now = new Date();

    // Convert UTC time to IST by adding 5 hours 30 minutes
    const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

    // Set the next execution time to 12:00 AM IST (midnight)
    const midnightIST = new Date(nowIST);
    midnightIST.setHours(24, 0, 0, 0); // Set time to 12:00 AM IST

    // Calculate the delay until midnight in IST
    const timeUntilMidnightIST = midnightIST - nowIST;

    console.log(`Scheduled first update in ${timeUntilMidnightIST / 1000 / 60} minutes (IST)`);

    // Wait until midnight, then start the interval
    setTimeout(() => {
        // Run updateGameAnalytics for the first time
        updateGameAnalytics();

        // Schedule it to run every 24 hours (once per day)
        setInterval(async () => {
            console.log("Running updateGameAnalytics at midnight (IST)...");
            await updateGameAnalytics();
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilMidnightIST);
};

// Start the scheduler when the server starts
// scheduleDailyAnalyticsUpdate();




// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3000+100 }, async () => {
    console.log(`Server started on port ${3000+100}`);
    matchMakerWorker();
});


const matchMakingPlayers = Array.from({ length: 8 }, () => ({}));
const newMatchMakingPlayers = Array.from({ length: 8 }, () => ({}));

let isWorkerRunning = false;
let deletionQueue = Array.from({ length: 8 }, () => []);

const canPlayWithBot = true;


const matchMakerWorker = () => {
    setInterval(async () => {


        if (isWorkerRunning) {
            return;
        }
        isWorkerRunning = true;



        for (let mapId = 0; mapId < 8; mapId++) {




            // Delete players that requested to cancel matchmaking
            deletionQueue[mapId].forEach(uid => {
                const player = matchMakingPlayers[mapId][uid] || newMatchMakingPlayers[mapId][uid];
                if (player) {
                    player.socket.send(JSON.stringify({ type: "stopped_MM" }));
                    player.socket.close();
                }
                delete matchMakingPlayers[mapId][uid];
                delete newMatchMakingPlayers[mapId][uid];
            });
            deletionQueue[mapId] = [];


            // add new player to matchMakingPlayers
            for (const key in newMatchMakingPlayers[mapId]) {
                if (Object.prototype.hasOwnProperty.call(newMatchMakingPlayers[mapId], key)) {
                    matchMakingPlayers[mapId][key] = newMatchMakingPlayers[mapId][key];
                    delete newMatchMakingPlayers[mapId][key];
                }
            }

            let allProcessed = false;
            while (!allProcessed) {

                let matchMakingPlayersModified = false;

                for (let uid1 in matchMakingPlayers[mapId]) {
                    const player1 = matchMakingPlayers[mapId][uid1];
                    const currentTimeStamp = new Date().getTime();

                    const timeDiff = currentTimeStamp - player1.timeStamp;

                    let trophyRange = 100;
                    const trophyRangeResult = await MatchMakingEvaluator.calculateTrophyRange(timeDiff);
                    await unableToMakeMatchTryBot(uid1, mapId);
                        matchMakingPlayersModified = true;
                    // if (trophyRangeResult.isTimeOut) {
                    //     unableToMakeMatch(uid1, mapId);
                    //     matchMakingPlayersModified = true;
                    //     break;
                    // } else if (trophyRangeResult.canPlayWithBot) {
                    //     await unableToMakeMatchTryBot(uid1, mapId);
                    //     matchMakingPlayersModified = true;
                    //     break;
                    // } else {
                    //     trophyRange = trophyRangeResult.currentTrophyRange;
                    // }

                    let matchFound = false;

                    if (trophyRange === -2) {

                        if (await matchAcrossMaps(uid1, mapId, player1)) {
                            matchMakingPlayersModified = true;
                            matchFound = true;
                            break;
                        }

                    } else {

                        for (let uid2 in matchMakingPlayers[mapId]) {
                            if (uid1 === uid2) continue;
                            const player2 = matchMakingPlayers[mapId][uid2];
                            if (Math.abs(player1.trophy - player2.trophy) <= trophyRange || trophyRange === -1) {
                                if (checkPlayersXp(player1.xp, player2.xp)) {
                                    const trophyData = await TrophyExchangeEvaluater.evaluate(player1.trophy, player2.trophy);
                                    makeMatch(uid1, uid2, mapId, trophyData);
                                    matchMakingPlayersModified = true;
                                    matchFound = true;
                                    break;
                                }
                            }
                        }

                    }



                    if (matchFound) {
                        break;
                    }
                }

                if (!matchMakingPlayersModified) {
                    allProcessed = true;
                }
            }




        }


        isWorkerRunning = false;

    }, 1000);
};

const checkPlayersXp = (player1xp, player2xp) => {
    // Function to check if xp is in range 0-20
    const inRangeA = (xp) => (xp >= 0 && xp <= 20);

    // Function to check if xp is in range 5-40
    const inRangeB = (xp) => (xp >= 5 && xp <= 40);

    // Function to check if xp is in range 10-50
    const inRangeC = (xp) => (xp >= 10 && xp <= 50);

    // Function to check if xp is in range 20 to max (let's assume JavaScript's safe integer limit)
    const inRangeD = (xp) => (xp >= 20);

    // First, check if both players' xp are in range A (0-10)
    if (inRangeA(player1xp) && inRangeA(player2xp)) {
        return true;  // Both are in the 0-10 range
    }

    // Then, check if both are in range B (5-40)
    if (inRangeB(player1xp) && inRangeB(player2xp)) {
        return true;  // Both are in the 5-40 range
    }

    // Next, check if both are in range C (10-50)
    if (inRangeC(player1xp) && inRangeC(player2xp)) {
        return true;  // Both are in the 10-50 range
    }

    // Finally, check if both are in range D (20-max)
    if (inRangeD(player1xp) && inRangeD(player2xp)) {
        return true;  // Both are in the 20-max range
    }

    // Return false if they do not fit together in any range
    return false;
};


const matchAcrossMaps = async (uid, mapId, player) => {
    for (let otherMapId = 0; otherMapId < 8; otherMapId++) {
        for (let otherUid in matchMakingPlayers[otherMapId]) {
            if (uid === otherUid) continue;
            const otherPlayer = matchMakingPlayers[otherMapId][otherUid];
            const trophyData = await TrophyExchangeEvaluater.evaluate(player.trophy, otherPlayer.trophy);
            if (checkPlayersXp(player.xp, otherPlayer.xp)) {
                if (otherMapId !== mapId) {
                    makeMatchDifferentMap(uid, otherUid, mapId, otherMapId, trophyData);
                    return true; // Match made
                } else {
                    makeMatch(uid, otherUid, mapId, trophyData);
                    return true; // Match made
                }
            }
        }
    }
    return false; // No match found
};


const unableToMakeMatchTryBot = async (uid, mapId) => {
    const player = matchMakingPlayers[mapId][uid];

    if (!player) {
        return;
    }

    let mapIdSelected = mapId;
    if (mapIdSelected > 3) {   // connect to bot at 10k match
        mapIdSelected = 3;
    }

    if (mapIdSelected <= 3 && canPlayWithBot) {

        let result = await BotMatchMaker.makeMatchWithBot(uid, mapIdSelected, player);
        if (!gameWithBotList["map-"+mapId]) {
            gameWithBotList["map-"+mapId] = 1; // First occurrence
        } else {
            gameWithBotList["map-"+mapId] += 1; // Increment count
        }
        // console.log("Updated gameWithBotList:", gameWithBotList);
        // console.log("result",result);
        delete matchMakingPlayers[mapId][uid];

    } else {

        unableToMakeMatch(uid, mapId);
    }
};


const unableToMakeMatch = (uid, mapId) => {
    const player = matchMakingPlayers[mapId][uid];

    if (!player) {
        return;
    }

    const error = 'error unable to make match!'
    const type = "error"
    player.socket.send(JSON.stringify({ type, error }));
    player.socket.close();
    delete matchMakingPlayers[mapId][uid];
};

const unableToMakeMatchError = (player1, player2, errorStr) => {
    const error = `error unable to make match!  ${errorStr}`
    const type = "error"
    player1.socket.send(JSON.stringify({ type, error }));
    player1.socket.close();
    player2.socket.send(JSON.stringify({ type, error }));
    player2.socket.close();
};


const makeMatch = (uid1, uid2, mapId, trophyData) => {
    //console.log("makeMatch:"+uid1+" "+uid2);
    const player1 = matchMakingPlayers[mapId][uid1];
    const player2 = matchMakingPlayers[mapId][uid2];

    initializeGame(uid1, uid2, mapId, player1, player2, trophyData);
    delete matchMakingPlayers[mapId][uid1];
    delete matchMakingPlayers[mapId][uid2];
};

const makeMatchDifferentMap = (uid1, uid2, mapId1, mapId2, trophyData) => {
    //console.log("makeMatch:"+uid1+" "+uid2);
    const player1 = matchMakingPlayers[mapId1][uid1];
    const player2 = matchMakingPlayers[mapId2][uid2];

    initializeGame(uid1, uid2, Math.min(mapId1, mapId2), player1, player2, trophyData);
    delete matchMakingPlayers[mapId1][uid1];
    delete matchMakingPlayers[mapId2][uid2];
};

const initializeGame = async (uid1, uid2, mapId, player1, player2, trophyData) => {

    if (player1 && player2) {

        //Initialize Game in game server
        const gameInfo = await GameMaker.createGameInfoWithWar(uid1, uid2, mapId, player1.isPlayerInWar, player2.isPlayerInWar, trophyData, player1.ping, player2.ping, "NORMAL", "NORMAL");
        const gameId = gameInfo.gameID;
        const type = "success"

        if (player1.socket.readyState !== WebSocket.OPEN) {
            unableToMakeMatchError(player1, player2, "other player disconnect");
            return;
        }

        if (player2.socket.readyState !== WebSocket.OPEN) {
            unableToMakeMatchError(player1, player2, "other player disconnect");
            return;
        }

        const isInitialize = await initializeGameInGameServer(gameInfo.gameID, gameInfo.gameState, gameInfo.IP);
        if (isInitialize) {
            if (!gameWithUserList["map-"+mapId]) {
                gameWithUserList["map-"+mapId] = 1; // First occurrence
            } else {
                gameWithUserList["map-"+mapId] += 1; // Increment count
            }
            // console.log("Updated gameWithUserList:", gameWithUserList);
            //console.log(gameInfo);
            player1.socket.send(JSON.stringify({ type, gameId, IP: gameInfo.IP }));
            player2.socket.send(JSON.stringify({ type, gameId, IP: gameInfo.IP }));
            player1.socket.close();
            player2.socket.close();

        } else {
            //console.log("error failed to initialize Game in GameServer.");
            unableToMakeMatchError(player1, player2, "match initialize error");
        }
    }
};

const updateGameAnalytics = async () => {
    // Check if gameWithUserList is not empty before sending data
    if (Object.keys(gameWithUserList).length > 0) {
        await GameAnalytics.addGamePlayedWithUser(gameWithUserList);
    } else {
        console.log("No user game data to update.");
    }

    // Check if gameWithBotList is not empty before sending data
    if (Object.keys(gameWithBotList).length > 0) {
        await GameAnalytics.addGamePlayedWithBot(gameWithBotList);
    } else {
        console.log("No bot game data to update.");
    }

    // Reset the objects after processing
    gameWithUserList = {};
    gameWithBotList = {};
};


wss.on('connection', async (socket, request) => {
    try {
        const queryParams = new URLSearchParams(request.url.slice(request.url.indexOf('?') + 1));
        const uid = queryParams.get('uid');
        const mapId = parseInt(queryParams.get('mapId'));
        const war = parseInt(queryParams.get('war'));  // 0 or 1
        const ping = queryParams.get('ping') ? queryParams.get('ping').split(',').map(Number) : null;

        //console.log(uid);

        if (uid === null || mapId === null || war === null || mapId < 0 || mapId > 7) {
            socket.close();
            return;
        }

        let isPlayerInWar = false;
        const playerInfoFromDb = await firestoreManager.readDocumentWithProjection('Users', uid, '/', { 'gameData.xp': 1, 'gameData.trophy': 1 });
        if (war === 1) {
            const canPlayerWar = await WarHandler.isPlayerCanPlayWarFind(uid);
            if (!canPlayerWar) {
                socket.close();
                return;
            }
            isPlayerInWar = true;
        }



        const player = {
            uid,
            trophy: playerInfoFromDb.gameData.trophy,
            xp: playerInfoFromDb.gameData.xp.x,
            isPlayerInWar,
            socket,
            mapId,
            ping,
            timeStamp: new Date().getTime(),
        };


        newMatchMakingPlayers[mapId][uid] = player;

        socket.on('message', (message) => {
            if (message == 'cancel') {
                cancelMatchMaking(uid, mapId);
            }
        });
    } catch (error) {
        console.error('Error handling the connection:', error);
        socket.close();
    }
});




const cancelMatchMaking = (uid, mapId) => {
    if (newMatchMakingPlayers[mapId][uid] || matchMakingPlayers[mapId][uid]) {
        deletionQueue[mapId].push(uid);
    }
};

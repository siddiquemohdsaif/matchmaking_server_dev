const FirestoreManager = require('../Firestore/FirestoreManager');
const GameInitiator = require('./GameInitiator');
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("./StaticDocument/GameInfo/PuckInfo");
const TrailInfoCache = require("./StaticDocument/GameInfo/TrailInfo");

class GameMaker {


    static async createGameInfoWithWar(uid1, uid2, mapId, isPlayer1InWar, isPlayer2InWar, trophyData, ping1, ping2, gameType1, gameType2) {
        const UID1 = uid1;
        const UID2 = uid2;
        const timeStamp = Date.now();
        const gameID = UID1 + UID2 + timeStamp;
        const gameState = await this.getGameState(UID1, UID2, mapId, isPlayer1InWar, isPlayer2InWar, trophyData, gameType1, gameType2);

        const friendlyBattleGameInfo = {
            IP: await GameInitiator.getGameServerIP(ping1, ping2),
            gameID,
            gameState,
            UID1,
            UID2,
            timeStamp
        };

        return friendlyBattleGameInfo
    }

    static async getGameState(UID1, UID2, mapId, isPlayer1InWar, isPlayer2InWar, trophyData, gameType1, gameType2) {
        const CacheDocumentPromises = [
            StrikerInfoCache.get(),
            PowerInfoCache.get(),
            PuckInfoCache.get(),
            TrailInfoCache.get()
        ]
        // Use Promise.all to fetch all documents in parallel
        const [StrikerInfo, PowerInfo, PuckInfo, TrailInfo] = await Promise.all(CacheDocumentPromises);
        this.GameInfo = { StrikerInfo: StrikerInfo, PowerInfo: PowerInfo, PuckInfo: PuckInfo, TrailInfo: TrailInfo };


        const usercollectionArray = await FirestoreManager.getInstance().bulkReadDocuments("Users", "/", [UID1, UID2], { "gameData.collection": 1 });
        //console.log(usercollectionArray);
        const collection1 = usercollectionArray[0].gameData.collection;
        const collection2 = usercollectionArray[1].gameData.collection;

        const playerExtraInfo1 = this.getPlayerExtraInfo(collection1, this.GameInfo, isPlayer1InWar);
        const playerExtraInfo2 = this.getPlayerExtraInfo(collection2, this.GameInfo, isPlayer2InWar);


        if(trophyData){
            playerExtraInfo1.trophyData = trophyData.p1;
            playerExtraInfo2.trophyData = trophyData.p2;
        }

        // type : CHALLENGE FRIENDLY NORMAL BOT REMATCH
        playerExtraInfo1.gameType = gameType1;
        playerExtraInfo2.gameType = gameType2;

        const strikerId_1 = collection1.striker.id;
        const strikerId_2 = collection2.striker.id;

        const map = mapId;
        const CarromId_1 = collection1.puck.id;
        const CarromId_2 = collection2.puck.id;

        const gameState = GameInitiator.getInitialGamePosition(strikerId_1, strikerId_2, map, CarromId_1, CarromId_2, JSON.stringify(playerExtraInfo1), JSON.stringify(playerExtraInfo2));

        return gameState;
    }

    static getPlayerExtraInfo(collection, GameInfo, isPlayerInWar) {
        let extraInfo = { isPlayerInWar };

        let striker = collection.striker;
        let power = collection.power;
        let puck = collection.puck;
        let trail = collection.trail;

        let StrikerInfo = GameInfo.StrikerInfo;
        let PowerInfo = GameInfo.PowerInfo;

        let selectedStrikerLevel = this.getCurrentLevel(StrikerInfo, striker.id, striker.level);
        let selectedPowerLevel = this.getCurrentLevel(PowerInfo, power.id, power.level);

        let aimS = selectedStrikerLevel[0];
        let aimP = selectedPowerLevel[0];
        let aim = (aimS + aimP) / 2;
        extraInfo.a = aim;

        let forceS = selectedStrikerLevel[1];
        let forceP = selectedPowerLevel[1];
        let force = (forceS + forceP) / 2;
        extraInfo.f = force;

        let timeS = selectedStrikerLevel[2];
        let timeP = selectedPowerLevel[2];
        let time = (timeS + timeP) / 2;
        extraInfo.t = time;

        extraInfo.striker = striker.id;
        extraInfo.power = power.id;
        extraInfo.puck = puck.id;
        extraInfo.trail = trail.id;

        return extraInfo;
    }

    static getCurrentLevel(objectInfo, id, level) {
        for (let category of ["Normal", "Rare", "Epic", "Legendary"]) {
            let categoryObjects = objectInfo[category];
            for (let i = 0; i < categoryObjects.length; i++) {
                let categoryObject = categoryObjects[i];
                if (categoryObject.id === id) {
                    return categoryObject["level" + level].fat;
                }
            }
        }
        return null;
    }
}

module.exports = GameMaker;

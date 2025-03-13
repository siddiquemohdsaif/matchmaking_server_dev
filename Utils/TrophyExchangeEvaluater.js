const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();
const TrophyExchangeEvalDataCache = require("../Utils/StaticDocument/Data/TrophyExchangeEvalData");


 
const interpolateByTrophyMap = (trophy, TrophyExchangeEvalData) => {

    const trophyMap = TrophyExchangeEvalData.trophyMap;

    let keys = Object.keys(trophyMap).map(Number).sort((a, b) => a - b);

    if (trophy <= keys[0]) {
        return {
            win:  Math.round(trophyMap[keys[0]].win),
            lose: Math.round(trophyMap[keys[0]].lose)
        };
    }

    for (let i = 0; i < keys.length - 1; i++) {
        if (trophy >= keys[i] && trophy <= keys[i + 1]) {
            let range = keys[i + 1] - keys[i];
            let progress = (trophy - keys[i]) / range;

            let winStart = trophyMap[keys[i]].win;
            let winEnd = trophyMap[keys[i + 1]].win;
            let loseStart = trophyMap[keys[i]].lose;
            let loseEnd = trophyMap[keys[i + 1]].lose;

            let win = winStart + progress * (winEnd - winStart);
            let lose = loseStart + progress * (loseEnd - loseStart);

            return {
                win: Math.round(win),
                lose: Math.round(lose)
            };
        }
    }

    return {
        win:  Math.round(trophyMap[keys[keys.length - 1]].win),
        lose: Math.round(trophyMap[keys[keys.length - 1]].lose)
    };

}


function findTrophyDifferenceAdjustment(maxCalDiffAllowed, p1Trophy, p2Trophy) {

    let actuaDiffrence;

    if(p1Trophy > p2Trophy){
        actuaDiffrence = (p1Trophy-p2Trophy);
    }else{
        actuaDiffrence = (p2Trophy-p1Trophy);
    }

    if (actuaDiffrence > maxCalDiffAllowed){
        actuaDiffrence = maxCalDiffAllowed;
    }

    const adjustment = (actuaDiffrence*30)/maxCalDiffAllowed;

    return Math.round(adjustment);
}




const evaluate = async (player1Trophy, player2Trophy) => {

    const TrophyExchangeEvalData = await TrophyExchangeEvalDataCache.get();

    //console.log(TrophyExchangeEvalData);
    
    const player1WinLoseMap = interpolateByTrophyMap( player1Trophy, TrophyExchangeEvalData);
    //console.log(TrophyExchangeEvalData);

    const player2WinLoseMap = interpolateByTrophyMap( player2Trophy, TrophyExchangeEvalData);
    
    const winAdjustment = findTrophyDifferenceAdjustment(TrophyExchangeEvalData.maxCalDiffAllowed, player1Trophy, player2Trophy);
    
    
    
    if(player1Trophy > player2Trophy){
    
        player1WinLoseMap.win -= winAdjustment;
        player2WinLoseMap.win += winAdjustment;
    
        if(player1WinLoseMap.win > 30){
            player1WinLoseMap.win = 30;
        }
    
        if(player2WinLoseMap.win > 30){
            player2WinLoseMap.win = 30;
        }
    
        if(player1WinLoseMap.win < 1){
            player1WinLoseMap.win = 1;
        }
    
        if(player2WinLoseMap.win < 1){
            player2WinLoseMap.win = 1;
        }
    
    }else{
    
        player2WinLoseMap.win -= winAdjustment;
        player1WinLoseMap.win += winAdjustment;
    
        
        if(player1WinLoseMap.win > 30){
            player1WinLoseMap.win = 30;
        }
    
        if(player2WinLoseMap.win > 30){
            player2WinLoseMap.win = 30;
        }
    
        if(player1WinLoseMap.win < 1){
            player1WinLoseMap.win = 1;
        }
    
        if(player2WinLoseMap.win < 1){
            player2WinLoseMap.win = 1;
        }
    
    }

    //lose reduce for week
    if(player1Trophy > player2Trophy){

        const loseAjustment = Math.round(winAdjustment/2);

        player2WinLoseMap.lose -= loseAjustment;
        if (player2WinLoseMap.lose < 0){
            player2WinLoseMap.lose = 0;
        }

    }else{

        const loseAjustment = Math.round(winAdjustment/2);

        player1WinLoseMap.lose -= loseAjustment;
        if (player1WinLoseMap.lose < 0){
            player1WinLoseMap.lose = 0;
        }
    }
    
    const trophyData = {
        p1 : player1WinLoseMap,
        p2 : player2WinLoseMap,
    }

    return trophyData;
}



module.exports = {
    evaluate
}
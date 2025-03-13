








// function interpolateByTrophyMap(trophyMap, trophy) {
//     let keys = Object.keys(trophyMap).map(Number).sort((a, b) => a - b);

//     if (trophy <= keys[0]) {
//         return trophyMap[keys[0]];
//     }

//     for (let i = 0; i < keys.length - 1; i++) {
//         if (trophy >= keys[i] && trophy <= keys[i + 1]) {
//             let range = keys[i + 1] - keys[i];
//             let progress = (trophy - keys[i]) / range;

//             let winStart = trophyMap[keys[i]].win;
//             let winEnd = trophyMap[keys[i + 1]].win;
//             let loseStart = trophyMap[keys[i]].lose;
//             let loseEnd = trophyMap[keys[i + 1]].lose;

//             let win = winStart + progress * (winEnd - winStart);
//             let lose = loseStart + progress * (loseEnd - loseStart);

//             return {
//                 win: Math.round(win),
//                 lose: Math.round(lose)
//             };
//         }
//     }

//     return trophyMap[keys[keys.length - 1]];
// }


// function findTrophyDifferenceAdjustment(maxCalDiffAllowed, p1Trophy, p2Trophy) {

//     let actuaDiffrence;

//     if(p1Trophy > p2Trophy){
//         actuaDiffrence = (p1Trophy-p2Trophy);
//     }else{
//         actuaDiffrence = (p2Trophy-p1Trophy);
//     }

//     if (actuaDiffrence > maxCalDiffAllowed){
//         actuaDiffrence = maxCalDiffAllowed;
//     }

//     const adjustment = (actuaDiffrence*30)/maxCalDiffAllowed;

//     return adjustment;
// }




// // Example usage
// let trophyMap = {
//     "0": { "win": 30, "lose": 0 },
//     "1000": { "win": 30, "lose": 14 },
//     "2000": { "win": 30, "lose": 24 },
//     "3000": { "win": 30, "lose": 30 },
//     "4000": { "win": 20, "lose": 30 }
// };


// const player1Trophy = 3000;
// const player2Trophy = 3700;

// const player1WinLoseMap = interpolateByTrophyMap(trophyMap, player1Trophy);
// const player2WinLoseMap = interpolateByTrophyMap(trophyMap, player2Trophy);

// const winAdjustment = findTrophyDifferenceAdjustment(1000, player1Trophy, player2Trophy);



// if(player1Trophy > player2Trophy){

//     player1WinLoseMap.win -= winAdjustment;
//     player2WinLoseMap.win += winAdjustment;

//     if(player1WinLoseMap.win > 30){
//         player1WinLoseMap.win = 30;
//     }

//     if(player2WinLoseMap.win > 30){
//         player2WinLoseMap.win = 30;
//     }

//     if(player1WinLoseMap.win < 1){
//         player1WinLoseMap.win = 1;
//     }

//     if(player2WinLoseMap.win < 1){
//         player2WinLoseMap.win = 1;
//     }

// }else{

//     player2WinLoseMap.win -= winAdjustment;
//     player1WinLoseMap.win += winAdjustment;

    
//     if(player1WinLoseMap.win > 30){
//         player1WinLoseMap.win = 30;
//     }

//     if(player2WinLoseMap.win > 30){
//         player2WinLoseMap.win = 30;
//     }

//     if(player1WinLoseMap.win < 1){
//         player1WinLoseMap.win = 1;
//     }

//     if(player2WinLoseMap.win < 1){
//         player2WinLoseMap.win = 1;
//     }

// }

// console.log(" p1Trophy :  " + player1Trophy);
// console.log(player1WinLoseMap);
// console.log(" p2Trophy :  " + player2Trophy);
// console.log(player2WinLoseMap);



// console.log(interpolateByTrophyMap(trophyMap, 5000)); // Should output something like { win: 30, lose: 19 }
// console.log(interpolateByTrophyMap(trophyMap, 6000)); // Should output { win: 20, lose: 30 }








const BotHandler = require('../Utils/BotHandler');
const TrophyExchangeEvaluater = require('../Utils/TrophyExchangeEvaluater');




const test = async() => {

 //   await BotHandler.loadBotsAccounts();
    await TrophyExchangeEvaluater.load();

    // const player = {
    //     uid : "ZM85FK9PVjUCC6MO",
    //     trophy : 59,
    //     xp : 3,
    //     isPlayerInWar : false,
    //     socket : null,
    //     mapId : 0,
    //     timeStamp: new Date().getTime(),
    // };

    // let r = await BotHandler.makeMatchWithBot(player.uid, player.mapId, player);
    // console.clog(r);


    const trophyData = await TrophyExchangeEvaluater.evaluate(433 , 70);
    console.log(trophyData);
}

test();

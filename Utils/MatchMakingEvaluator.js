
const MatchMakingEvalData = require('../Utils/StaticDocument/Data/MatchMakingEvalData');



const calculateTrophyRange = async (timeElapsed) => {
    timeElapsed = Math.round(timeElapsed/1000);
    const trophyTimeMap = await MatchMakingEvalData.getMatchMakingEvalData();
    // Destructure the necessary properties from the trophyTimeMap
    const { timeout, time_trophy_map, bot_at_min_time  } = trophyTimeMap;

    // Initialize the default trophy range as 0
    let currentTrophyRange = 0;
    
    // Determine the current trophy range based on time elapsed
    for (let i = 0; i < time_trophy_map.length; i++) {
        if (timeElapsed <= time_trophy_map[i].timeMax) {
            currentTrophyRange = time_trophy_map[i].trophyRange;
            break;
        }
    }

    // Check if the bot can be played with based on the minimum time
    const canPlayWithBot = timeElapsed >= bot_at_min_time ;

    // Check if the time elapsed has exceeded the timeout
    const isTimeOut = timeElapsed >= timeout;

    // Return the results in an object
    return { currentTrophyRange, canPlayWithBot, isTimeOut };
}


module.exports = {
    calculateTrophyRange
}

const MatchMakingEvaluator = require('../Utils/MatchMakingEvaluator');

const trophyTimeMap = {
    "timeout": 20,
    "time_trophy_map": [
        {"timeMax": 3, "trophyRange": 100},
        {"timeMax": 6, "trophyRange": 200},
        {"timeMax": 9, "trophyRange": 500},
        {"timeMax": 12, "trophyRange": 800},
        {"timeMax": 15, "trophyRange": 1200},
        {"timeMax": 18, "trophyRange": 1500}
    ],
    "bot_at_time_min": 18
};

const test = async() => {

    const result = await MatchMakingEvaluator.calculateTrophyRange(19001, trophyTimeMap);
    console.log(result);
}

test();

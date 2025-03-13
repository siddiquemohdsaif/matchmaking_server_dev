const TrophyExchangeEvaluater = require('../Utils/TrophyExchangeEvaluater');


const test = async() => {
    const result = await TrophyExchangeEvaluater.evaluate(6000, 6000);
    console.log(result);
}

test();

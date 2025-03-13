
const BotMatchMaker = require('../Utils/BotMatchMaker');

const test = async() => {

    const result = await BotMatchMaker.makeMatchWithBot("Nvq9f1cZQ3VdiLPf", 0 , {isPlayerInWarisPlayerInWar : false, trophy : 433});
    console.log(result);
}

test();

const FirestoreManager = require('./../Firestore/FirestoreManager');
const firestoreManager = FirestoreManager.getInstance();

const addGamePlayedWithUser = async (gameWithUserList) => {

    
    const date = await getDate();
    const document = {
        GamePlayed: gameWithUserList
    }
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
};

const getDate = async () => {
    const timeStamp = Date.now();
    const dateObject = new Date(timeStamp);

    // Get the day, month, and year from the date object
    const day = dateObject.getDate().toString().padStart(2, '0'); // Pad with zero if necessary
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1
    const year = dateObject.getFullYear();

    // Format the date in dd-mm-yyyy
    const formattedDate = `${day}-${month}-${year}`;
    // console.log(formattedDate); // Output the date for verification

    return formattedDate;
}

const addGamePlayedWithBot = async (gameWithBotList) => {

    
    const date = await getDate();
    const document = {
        BotPlayed: gameWithBotList
    }
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);

}

module.exports = {
    addGamePlayedWithUser,
    addGamePlayedWithBot
}
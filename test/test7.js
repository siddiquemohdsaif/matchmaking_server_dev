const FirestoreManager = require('./../Firestore/FirestoreManager');
const firestoreManager = FirestoreManager.getInstance();

const addGamePlayedWithUser = async (gameID,uid1,uid2,map) => {

    const date = await getDate();
    const document = {
        GamePlayed: {
            [gameID]: { uid1, uid2, map }
        }
    }
    const doc = await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
    // if (!doc) {
    //     const document = {
    //         GamePlayed: {
    //             [gameID]: { uid1, uid2, map }
    //         },
    //         BotPlayed: {},
    //         DailyUsage: {},
    //         AdsShown: {},
    //         IAPHistory: {}
    //     }
    //     await firestoreManager.createDocument("GameAnalytics", date, "/", document);
    // } else {
    //     if (!doc.GamePlayed) {
    //         // If GamePlayed does not exist, initialize it
    //         const gamePlayedInit = {
    //             [`GamePlayed.${gameID}`]: { uid1, uid2, map }
    //         };
    //         await firestoreManager.updateDocument("GameAnalytics", date, "/", gamePlayedInit);
    //     } else {
    //         // GamePlayed exists, add new game data
    //         const gamePlayedUpdate = {
    //             [`GamePlayed.${gameID}`]: { uid1, uid2, map }
    //         };
    //         await firestoreManager.updateDocument("GameAnalytics", date, "/", gamePlayedUpdate);
    //     }
    // }
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
    console.log(formattedDate); // Output the date for verification

    return formattedDate;
}

const addGamePlayedWithBot = async () => {

}


// addGamePlayedWithUser(123456,"12P","34S",2);
const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for MatchMakingEvalData
let matchMakingEvalDataCache = {
    data: null,
    timestamp: null
};

const getMatchMakingEvalData = async () => {
    const now = new Date().getTime();
    // Check if MatchMakingEvalData is in cache and not older than 10 seconds
    if (matchMakingEvalDataCache.data && (now - matchMakingEvalDataCache.timestamp) < 10000) {
        return matchMakingEvalDataCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const matchMakingEvalData = await firestoreManager.readDocument("Data", "MatchMakingEvalData", "/");
        matchMakingEvalDataCache = {
            data: matchMakingEvalData,
            timestamp: now
        };
        return matchMakingEvalData;
    }
};

module.exports = {
    getMatchMakingEvalData
};

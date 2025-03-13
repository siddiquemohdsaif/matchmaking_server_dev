const FirestoreManager = require("../Firestore/FirestoreManager");

const isPlayerCanPlayWarFind = async (uid) => {

    try {

        // Find clan Id by profile data
        const user = await FirestoreManager.getInstance().readDocumentWithProjection("Users", uid, "/", { "profileData.clanId": 1 });
        const clanId = user.profileData.clanId;

        if (clanId === "null") {
            return false; // Player has not joined any clan and is playing war
        }

        // Find clanWarId.warId by clan
        const clan = await FirestoreManager.getInstance().readDocumentWithProjection("Clans", clanId, "/", { "clanWarId": 1 });
        if (clan.clanWarId === '') {
            return false; // Clan is not in war
        }
        const clanWarId = JSON.parse(clan.clanWarId);
        if (!clanWarId.warId) {
            return false; // Clan is not in war
        }
        const warId = clanWarId.warId;

        // Get clanWar ongoing document and verify player can play war by attack used and given
        const war = await FirestoreManager.getInstance().readDocument("OnGoingWar", warId, "/ClanWar/War");

        let membersList;
        if (clanId === war.clanId1) {
            membersList = war.membersList1;
        } else if (clanId === war.clanId2) {
            membersList = war.membersList2;
        } else {
            return false; // Player's clan is not part of this war
        }

        for (let member of membersList) {
            if (member.UID === uid) {
                // Player found, check if they have any attacks left
                return member.used < member.given;
            }
        }

        return false; // Player not found in the war members list

    } catch (e) {
        return false
    }
};

module.exports = {
    isPlayerCanPlayWarFind
}

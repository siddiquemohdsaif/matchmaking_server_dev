const GAME_SERVER_IPS = {
    GamePlayServers: [
        {
            IP: "142.93.221.86:14999",
            load: 0.1
        },
        {
            IP: "157.230.43.100:14999",
            load: 0.1
        },
        {
            IP: "139.59.25.107:14999",
            load: 0.1
        }
    ]
};

const isGameServerIpValid = () => true; // Dummy implementation for testing
const loadGameServerIPS = async () => {}; // Dummy implementation for testing

const getGameServerIP = async (ping1, ping2) => {
    if (!isGameServerIpValid()) {
        await loadGameServerIPS();
    }

    // Filter out servers with ping values above 300 in either ping1 or ping2
    const filteredServers = GAME_SERVER_IPS.GamePlayServers.filter((server, index) => {
        let pingValue1 = ping1 ? ping1[index] : null;
        let pingValue2 = ping2 ? ping2[index] : null;

        if(pingValue1 === undefined){
            pingValue1 = null;
        }

        if(pingValue2 === undefined){
            pingValue2 = null;
        }

        return (pingValue1 === null || pingValue1 <= 300) && (pingValue2 === null || pingValue2 <= 300);
    });

    console.log("Filtered Servers: ", filteredServers);

    // If all servers are excluded, use the last server as a fallback
    const serversToConsider = filteredServers.length > 0 ? filteredServers : GAME_SERVER_IPS.GamePlayServers;

    // Calculate the inverse loads
    const inverseLoads = serversToConsider.map(server => (1 - server.load) * 100);

    // Calculate the cumulative loads
    const cumulativeLoads = [];
    let cumulativeLoad = 0;
    for (const load of inverseLoads) {
        cumulativeLoad += load;
        cumulativeLoads.push(cumulativeLoad);
    }

    console.log("Inverse Loads: ", inverseLoads);
    console.log("Cumulative Loads: ", cumulativeLoads);

    if (cumulativeLoad <= 10) {
        // If all servers are near their highest load, randomly select any server.
        const randomIndex = Math.floor(Math.random() * serversToConsider.length);
        return serversToConsider[randomIndex].IP;
    } else {
        // Randomly select a value in the range [1, cumulativeLoad]
        const randomValue = Math.floor(Math.random() * cumulativeLoad) + 1;

        // Find the IP corresponding to the selected value
        for (let i = 0; i < cumulativeLoads.length; i++) {
            if (randomValue <= cumulativeLoads[i]) {
                return serversToConsider[i].IP;
            }
        }
    }

    return serversToConsider[serversToConsider.length - 1].IP;
};

// Test examples
const testCases = [
    { ping1: [200, 330, 100], ping2: [420, 40] },
    { ping1: [200, 330], ping2: null },
    { ping1: [200, 100, 400, 400], ping2: null },
    { ping1: [400, 330, 30, 400], ping2: [220, 40, 400] }
];

testCases.forEach(async (testCase, index) => {
    const ip = await getGameServerIP(testCase.ping1, testCase.ping2);
    console.log(`Test Case ${index + 1}: Selected IP: ${ip}`);
});

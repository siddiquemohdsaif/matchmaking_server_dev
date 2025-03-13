module.exports = {
    apps: [
      {
        name: "matchMakingServer",
        script: "./index.js",
        exec_mode: "fork",
        instances: 1,
        autorestart: true,
        max_memory_restart: "2G"
      },
      {
        name: "reMatchServer",
        script: "./reMatchServer.js",
        exec_mode: "fork",
        instances: 1,
        autorestart: true,
        max_memory_restart: "2G"
      }
    ]
};
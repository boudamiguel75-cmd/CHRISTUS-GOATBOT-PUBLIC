const DATA = require("./foot-data");
const GAME = require("./foot-game");
const AI = require("./foot-ai");

module.exports = {
  config: {
    name: "foot",
    aliases: ["football", "carriere"],
    version: "1.0.0",
    author: "NovaAI",
    role: 0,
    shortDescription: "Simulateur de carrière football",
    longDescription: "Gère ta carrière de footballeur",
    category: "games",
    guide: "{pn} [start|profil|match|coach|journaliste|commentateur|directeur|analyste]"
  },

  onStart: async function ({ api, event, args, message }) {
    return GAME.onStart({ api, event, args, message, DATA, AI });
  },

  onChat: async function ({ api, event, message }) {
    return GAME.onChat({ api, event, message, DATA, AI });
  }
};

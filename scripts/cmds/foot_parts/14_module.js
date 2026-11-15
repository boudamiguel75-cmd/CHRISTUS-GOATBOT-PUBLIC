// ===== FOOT PART 14/16 =====
// ═══════════════════════════════════════════════════════════════════════
//  MODULE
// ═══════════════════════════════════════════════════════════════════════
const sessions = {};
const isCmdCall = (b) => /^\W?(foot|football|carriere)\b/i.test(b || "");

const FOOT_CONFIG = {
    name: "foot",
    aliases: ["football", "carriere"],
    version: "2.0",
    author: "Master Charbel",
    countDown: 2,
    role: 0,
    category: "game",
    shortDescription: "⚽ Simulateur de carrière de footballeur ultra-réaliste",
    longDescription: "Crée ton joueur, passe par l'académie, signe dans l'un des ≈390 clubs réels, joue championnats, coupes, Ligue des Champions et Coupe du Monde, négocie tes transferts et vise le Ballon d'Or.",
    guide: "foot aide"
};
// ===== END PART 14/16 =====

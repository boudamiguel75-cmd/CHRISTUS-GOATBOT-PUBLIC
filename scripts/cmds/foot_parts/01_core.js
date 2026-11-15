// ===== FOOT PART 01/16 =====
// ═══════════════════════════════════════════════════════════════════════
//  ⚽ FOOT — SIMULATEUR DE CARRIÈRE RÉALISTE  (v2.0)
// ═══════════════════════════════════════════════════════════════════════
//  • 20 championnats réels (≈ 390 clubs) avec promotions / relégations
//  • Calendrier complet : championnat, coupes nationales, Coupe de la Ligue,
//    Ligue des Champions (phase de ligue, barrages, tours à élimination),
//    Europa League, Conférence, Libertadores, LDC d'Asie et CONCACAF
//  • Moteur de match minute par minute : tirs, xG, penalties, VAR, cartons,
//    blessures, prolongations, tirs au but, notes détaillées
//  • 27 attributs, 8 postes, âges, progression réaliste, potentiel
//  • Académie, prêts, mercato d'été et d'hiver, négociations, clauses
//  • Sélection nationale, qualifications, Coupe du Monde, tournois continentaux
//  • Moral, forme, fraîcheur physique, confiance du coach, fans, réputation
//  • Sponsors, boutique, événements aléatoires, Ballon d'Or, trophées
//  • Retraite et Panthéon des légendes
// ═══════════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

// ─── PERSISTANCE ───
const DB_DIR = path.join(__dirname, "cache");
const DB_PATH = path.join(DB_DIR, "foot_carrieres_v2.json");
let DB = { players: {}, hof: [] };
let saveTimer = null;

function loadDB() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (fs.existsSync(DB_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      DB = { players: raw.players || {}, hof: raw.hof || [] };
    }
  } catch (e) {
    console.error("[foot] chargement impossible :", e.message);
  }
}
function saveDB() {
  if (process.env.FOOT_NOSAVE || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(DB));
    } catch (e) {
      console.error("[foot] sauvegarde impossible :", e.message);
    }
  }, 300);
}
loadDB();

// ─── UTILITAIRES ───
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const rndF = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const chance = (p) => Math.random() < p;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sround = (v) => {
  const b = Math.floor(v);
  return b + (Math.random() < v - b ? 1 : 0);
};
const norm = (s) =>
  String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9' .-]/g, "")
    .trim();

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L && k < 60);
  return k - 1;
}

function wpick(arr, wf) {
  const w = arr.map(wf);
  let t = w.reduce((a, b) => a + b, 0);
  if (t <= 0) return pick(arr);
  let r = Math.random() * t;
  for (let i = 0; i < arr.length; i++) {
    r -= w[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

const bold = (t) =>
  [...String(t)].map((c) => {
    const x = c.codePointAt(0);
    if (x >= 65 && x <= 90) return String.fromCodePoint(0x1d5d4 + x - 65);
    if (x >= 97 && x <= 122) return String.fromCodePoint(0x1d5ee + x - 97);
    if (x >= 48 && x <= 57) return String.fromCodePoint(0x1d7ec + x - 48);
    return c;
  }).join("");

const money = (n) => {
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e9) return s + (a / 1e9).toFixed(2) + " Md€";
  if (a >= 1e6) return s + (a / 1e6).toFixed(1) + " M€";
  if (a >= 1e3) return s + Math.round(a / 1e3) + " k€";
  return s + Math.round(a) + " €";
};

const bar = (v, max = 100, len = 10) => {
  const f = clamp(Math.round((v / max) * len), 0, len);
  return "▰".repeat(f) + "▱".repeat(len - f);
};
const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const LINE = "━━━━━━━━━━━━━━━━━━━━";
const head = (icon, title) => `${icon} ${bold(title)}\n${LINE}\n`;
const P = () => (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "";
const ord = (n) => (n === 1 ? "1er" : n + "e");

// ─── NOMS DES COÉQUIPIERS / ADVERSAIRES (fictifs) ───
const FIRST_NAMES = ["Lucas", "Mateo", "Hugo", "Enzo", "Noah", "Leo", "Gabriel", "Rafael", "Diego", "Marco", "Luca", "Andrea", "Mehdi", "Yanis", "Karim", "Ibrahima", "Moussa", "Kwame", "Emre", "Burak", "Jan", "Lukas", "Felix", "Niklas", "Tom", "Jack", "Harry", "Oliver", "Pedro", "Bruno", "João", "Thiago", "Matías", "Santiago", "Kenji", "Hiro", "Omar", "Youssef", "Amine", "Ali", "Arda", "Sami", "Victor", "Adrien", "Théo", "Nicolas", "Pablo", "Sergio", "Daniel", "Mathis"];
const LAST_NAMES = ["Silva", "Santos", "Fernández", "García", "Rossi", "Bianchi", "Müller", "Schmidt", "Dubois", "Martin", "Bernard", "Diallo", "Traoré", "Kouassi", "Mensah", "Okafor", "Yılmaz", "Kaya", "Jansen", "De Vries", "Smith", "Taylor", "Jones", "Ramos", "Costa", "Pereira", "Moreno", "Ortega", "Vargas", "Haddad", "Nakamura", "Park", "Kim", "Sato", "Novak", "Kowalski", "Petrović", "Andersson", "Larsen", "Hansen", "Lopes", "Ndiaye", "Sow", "Camara", "Cissé", "Bouzid", "Lambert", "Moreau", "Fischer", "Vidal"];
const genName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const shortName = () => {
  const n = genName().split(" ");
  return `${n[0][0]}. ${n.slice(1).join(" ")}`;
};
const PLACES = ["Ashford", "Brenton", "Calvera", "Dorset", "Eastlake", "Fairmont", "Glenvale", "Harwick", "Ironbridge", "Kingsmoor", "Lakeside", "Marlow", "Northgate", "Oakham", "Pinewood", "Riverton", "Stonebridge", "Thornbury", "Upton", "Westfield", "Saint-Aubin", "Montferrand", "Villeneuve", "Castelnau", "San Miguel", "Villarreal del Sol", "Borgo", "Monteverde", "Neustadt", "Hohenfeld"];
const SUFFIXES = ["FC", "United", "Athletic", "Town", "Sporting", "Rovers", "City", "Albion"];
const genAmateur = () => ({ id: "AM" + Math.random().toString(36).slice(2, 7), n: `${pick(PLACES)} ${pick(SUFFIXES)}`, s: rnd(34, 48), amateur: true });

// ─── CHAMPIONNATS ───
//  tier 1 = élite, tier 2 = deuxième division, ext = clubs « extérieurs » (pour les coupes d'Europe)
const LEAGUES = {
  ENG1: { n: "Premier League", f: "🇬🇧", ct: "ENG", tier: 1, coef: 1.25, conf: "UEFA", pair: "ENG2", mv: 3 },
  ENG2: { n: "Championship", f: "🇬🇧", ct: "ENG", tier: 2, coef: 0.55, conf: "UEFA", pair: "ENG1", mv: 3 },
  ESP1: { n: "La Liga", f: "🇪🇸", ct: "ESP", tier: 1, coef: 1.1, conf: "UEFA", pair: "ESP2", mv: 3 },
  ESP2: { n: "LaLiga 2", f: "🇪🇸", ct: "ESP", tier: 2, coef: 0.4, conf: "UEFA", pair: "ESP1", mv: 3 },
  ITA1: { n: "Serie A", f: "🇮🇹", ct: "ITA", tier: 1, coef: 1.0, conf: "UEFA", pair: "ITA2", mv: 3 },
  ITA2: { n: "Serie B", f: "🇮🇹", ct: "ITA", tier: 2, coef: 0.4, conf: "UEFA", pair: "ITA1", mv: 3 },
  GER1: { n: "Bundesliga", f: "🇩🇪", ct: "GER", tier: 1, coef: 1.0, conf: "UEFA", pair: "GER2", mv: 2 },
  GER2: { n: "2. Bundesliga", f: "🇩🇪", ct: "GER", tier: 2, coef: 0.4, conf: "UEFA", pair: "GER1", mv: 2 },
  FRA1: { n: "Ligue 1", f: "🇫🇷", ct: "FRA", tier: 1, coef: 0.9, conf: "UEFA", pair: "FRA2", mv: 2 },
  FRA2: { n: "Ligue 2", f: "🇫🇷", ct: "FRA", tier: 2, coef: 0.35, conf: "UEFA", pair: "FRA1", mv: 2 },
  POR1: { n: "Liga Portugal", f: "🇵🇹", ct: "POR", tier: 1, coef: 0.6, conf: "UEFA" },
  NED1: { n: "Eredivisie", f: "🇳🇱", ct: "NED", tier: 1, coef: 0.65, conf: "UEFA" },
  BEL1: { n: "Pro League", f: "🇧🇪", ct: "BEL", tier: 1, coef: 0.5, conf: "UEFA" },
  TUR1: { n: "Süper Lig", f: "🇹🇷", ct: "TUR", tier: 1, coef: 0.6, conf: "UEFA" },
  SCO1: { n: "Premiership écossaise", f: "🏴", ct: "SCO", tier: 1, coef: 0.4, conf: "UEFA" },
  SAU1: { n: "Saudi Pro League", f: "🇸🇦", ct: "SAU", tier: 1, coef: 1.7, conf: "AFC" },
  USA1: { n: "MLS", f: "🇺🇸", ct: "USA", tier: 1, coef: 0.8, conf: "CONCACAF", fmt: "rand", games: 34 },
  BRA1: { n: "Brasileirão", f: "🇧🇷", ct: "BRA", tier: 1, coef: 0.55, conf: "CONMEBOL" },
  ARG1: { n: "Liga Profesional", f: "🇦🇷", ct: "ARG", tier: 1, coef: 0.45, conf: "CONMEBOL" },
  MEX1: { n: "Liga MX", f: "🇲🇽", ct: "MEX", tier: 1, coef: 0.6, conf: "CONCACAF" },
  XEU: { n: "Clubs européens", f: "🌍", tier: 9, ext: true, conf: "UEFA" },
  XSA: { n: "Clubs sud-américains", f: "🌎", tier: 9, ext: true, conf: "CONMEBOL" },
  XAS: { n: "Clubs asiatiques", f: "🌏", tier: 9, ext: true, conf: "AFC" },
  XCC: { n: "Clubs d'Amérique du Nord", f: "🌎", tier: 9, ext: true, conf: "CONCACAF" }
};
const PLAY_LEAGUES = Object.keys(LEAGUES).filter((k) => !LEAGUES[k].ext);

// places en compétition continentale : [Ligue des Champions, Europa League, Conférence]
const SPOTS = {
  ENG1: [5, 2, 1], ESP1: [4, 2, 1], ITA1: [4, 2, 1], GER1: [4, 2, 1], FRA1: [3, 2, 1],
  POR1: [2, 1, 2], NED1: [2, 1, 2], BEL1: [1, 1, 2], TUR1: [1, 1, 2], SCO1: [1, 1, 1],
  BRA1: [4], ARG1: [3], MEX1: [4], USA1: [4], SAU1: [3]
};

// ─── CLUBS (nom, force 0-100) ───
const RAW = {};

RAW.ENG1 = [["Manchester City", 90], ["Arsenal", 90], ["Liverpool", 89], ["Chelsea", 85], ["Tottenham", 82], ["Newcastle United", 81], ["Manchester United", 80], ["Aston Villa", 80], ["Brighton", 75], ["Crystal Palace", 74], ["Brentford", 73], ["Bournemouth", 73], ["Nottingham Forest", 73], ["West Ham", 72], ["Fulham", 72], ["Everton", 71], ["Wolverhampton", 68], ["Leeds United", 68], ["Sunderland", 64], ["Burnley", 62]];

RAW.ENG2 = [["Southampton", 63], ["Leicester City", 63], ["Ipswich Town", 63], ["Sheffield United", 62], ["West Bromwich Albion", 61], ["Middlesbrough", 61], ["Norwich City", 60], ["Watford", 60], ["Coventry City", 60], ["Birmingham City", 59], ["Stoke City", 59], ["Swansea City", 57], ["Blackburn Rovers", 57], ["Hull City", 57], ["Bristol City", 57], ["Millwall", 56], ["Queens Park Rangers", 55], ["Preston North End", 55], ["Derby County", 55], ["Wrexham", 55], ["Portsmouth", 54], ["Charlton Athletic", 54], ["Oxford United", 53], ["Sheffield Wednesday", 52]];

RAW.ESP1 = [["Real Madrid", 92], ["FC Barcelone", 91], ["Atlético de Madrid", 86], ["Athletic Bilbao", 80], ["Real Sociedad", 78], ["Villarreal", 77], ["Real Betis", 77], ["FC Séville", 73], ["Valence", 72], ["Girona", 72], ["Celta Vigo", 71], ["Osasuna", 69], ["Getafe", 69], ["Rayo Vallecano", 68], ["Majorque", 68], ["Alavés", 66], ["Espanyol", 65], ["Elche", 62], ["Levante", 62], ["Real Oviedo", 60]];
// ===== END PART 01/16 =====

// ===== FOOT PART 03/16 =====
// ─── COUPES NATIONALES ───
//  R = nombre de tours, w0/w1 = semaine du 1er tour / de la finale, two = demi-finales aller-retour
const CUPS = {
  ENG: [{ key: "fa", name: "FA Cup", R: 6, w0: 19, w1: 40 }, { key: "lc", name: "Coupe de la Ligue (EFL Cup)", R: 5, w0: 5, w1: 29, two: true }],
  ESP: [{ key: "cdr", name: "Copa del Rey", R: 6, w0: 12, w1: 40, two: true }],
  ITA: [{ key: "cit", name: "Coppa Italia", R: 6, w0: 9, w1: 40, two: true }],
  GER: [{ key: "dfb", name: "DFB-Pokal", R: 6, w0: 7, w1: 39 }],
  FRA: [{ key: "cdf", name: "Coupe de France", R: 6, w0: 17, w1: 40 }],
  POR: [{ key: "tdp", name: "Taça de Portugal", R: 5, w0: 14, w1: 40 }],
  NED: [{ key: "knv", name: "Coupe des Pays-Bas", R: 5, w0: 10, w1: 38 }],
  BEL: [{ key: "cbe", name: "Coupe de Belgique", R: 5, w0: 12, w1: 38 }],
  TUR: [{ key: "ttk", name: "Coupe de Turquie", R: 5, w0: 12, w1: 39 }],
  SCO: [{ key: "sco", name: "Scottish Cup", R: 5, w0: 16, w1: 40 }],
  SAU: [{ key: "kng", name: "Coupe du Roi", R: 4, w0: 18, w1: 38 }],
  USA: [{ key: "uso", name: "US Open Cup", R: 4, w0: 14, w1: 38 }],
  BRA: [{ key: "cdb", name: "Copa do Brasil", R: 5, w0: 10, w1: 39 }],
  ARG: [{ key: "carg", name: "Copa Argentina", R: 5, w0: 12, w1: 39 }],
  MEX: [{ key: "cmx", name: "Copa MX", R: 4, w0: 14, w1: 37 }]
};
Object.keys(CUPS).forEach((ct) => CUPS[ct].forEach((d) => (d.ct = ct)));
const ROUND_NAMES = ["Finale", "Demi-finale", "Quarts de finale", "8es de finale", "16es de finale", "32es de finale", "64es de finale"];
const roundName = (R, i) => ROUND_NAMES[R - 1 - i] || `Tour ${i + 1}`;

// ─── COMPÉTITIONS CONTINENTALES ───
const EURO_NAMES = { ucl: "Ligue des Champions", uel: "Ligue Europa", uecl: "Ligue Conférence", lib: "Copa Libertadores", acl: "LDC d'Asie", ccc: "LDC CONCACAF" };
const EURO_ICON = { ucl: "⭐", uel: "🟠", uecl: "🟢", lib: "🏆", acl: "🌏", ccc: "🌎" };
const STAGE_NAMES = { lp: "Phase de ligue", po: "Barrages", r16: "8es de finale", qf: "Quarts de finale", sf: "Demi-finale", f: "Finale" };

// ─── SAISONS ───
const START_YEAR = 2026;
const seasonLabel = (n) => `${START_YEAR + n - 1}/${String((START_YEAR + n) % 100).padStart(2, "0")}`;
const seasonEndYear = (n) => START_YEAR + n;

// ═══════════════════════════════════════════════════════════════════════
//  MODÈLE DU JOUEUR : attributs, postes, progression, valeur, salaires
// ═══════════════════════════════════════════════════════════════════════
const ATTRS = {
  acc: ["Accélération", "VIT"], spr: ["Vitesse de pointe", "VIT"],
  fin: ["Finition", "TIR"], pwr: ["Puissance de frappe", "TIR"], lng: ["Tirs lointains", "TIR"], pen: ["Penalty", "TIR"],
  vis: ["Vision", "PAS"], shp: ["Passes courtes", "PAS"], lpa: ["Passes longues", "PAS"], crs: ["Centres", "PAS"],
  dri: ["Dribble", "DRI"], ctl: ["Contrôle", "DRI"], agi: ["Agilité", "DRI"], bal: ["Équilibre", "DRI"],
  mar: ["Marquage", "DEF"], int: ["Interceptions", "DEF"], tak: ["Tacle", "DEF"], hea: ["Jeu de tête", "DEF"],
  str: ["Force", "PHY"], sta: ["Endurance", "PHY"], jmp: ["Détente", "PHY"], agg: ["Agressivité", "PHY"],
  div: ["Plongeon", "GK"], han: ["Prise de balle", "GK"], kic: ["Jeu au pied", "GK"], ref: ["Réflexes", "GK"], gpo: ["Placement", "GK"]
};
const ATTR_KEYS = Object.keys(ATTRS);
const CATS = { VIT: "Vitesse", TIR: "Tir", PAS: "Passes", DRI: "Technique", DEF: "Défense", PHY: "Physique", GK: "Gardien" };
const ATTR_TYPE = { acc: "phys", spr: "phys", agi: "phys", jmp: "phys", sta: "phys", str: "str", div: "gk", han: "gk", kic: "gk", ref: "gk", gpo: "gk" };

// sh = part de tirs de l'équipe, kp = part de passes décisives/clés, yc = risque de jaune,
// drb = dribbles tentés / 90', tk = tacles tentés / 90', ps = coefficient de passes
const POS = {
  GB: { n: "Gardien", ic: "🧤", w: { div: 0.22, han: 0.2, kic: 0.1, ref: 0.26, gpo: 0.22 }, sh: 0.0005, kp: 0.01, yc: 0.03, drb: 0.1, tk: 0.1, ps: 0.7 },
  DC: { n: "Défenseur central", ic: "🛡️", w: { mar: 0.16, int: 0.14, tak: 0.15, hea: 0.14, str: 0.12, jmp: 0.06, agg: 0.06, spr: 0.03, acc: 0.03, shp: 0.04, lpa: 0.04, bal: 0.03 }, sh: 0.03, kp: 0.03, yc: 0.16, drb: 0.6, tk: 3.4, ps: 1.25 },
  LAT: { n: "Latéral", ic: "🏃", w: { acc: 0.08, spr: 0.1, crs: 0.08, shp: 0.06, dri: 0.06, ctl: 0.05, agi: 0.04, mar: 0.1, int: 0.1, tak: 0.12, sta: 0.1, str: 0.04, bal: 0.03, hea: 0.02, vis: 0.02 }, sh: 0.04, kp: 0.12, yc: 0.13, drb: 2, tk: 3, ps: 1.1 },
  MDC: { n: "Milieu défensif", ic: "⚓", w: { mar: 0.12, int: 0.14, tak: 0.14, shp: 0.1, lpa: 0.08, vis: 0.06, ctl: 0.05, str: 0.1, sta: 0.09, agg: 0.06, hea: 0.04, bal: 0.02 }, sh: 0.04, kp: 0.08, yc: 0.15, drb: 1, tk: 3.6, ps: 1.4 },
  MC: { n: "Milieu central", ic: "⚙️", w: { vis: 0.1, shp: 0.14, lpa: 0.1, ctl: 0.1, dri: 0.06, sta: 0.1, str: 0.06, int: 0.08, tak: 0.07, mar: 0.05, lng: 0.05, fin: 0.03, agi: 0.03, bal: 0.03 }, sh: 0.06, kp: 0.14, yc: 0.11, drb: 2.2, tk: 2.4, ps: 1.35 },
  MOC: { n: "Milieu offensif", ic: "🎩", w: { vis: 0.14, shp: 0.12, lpa: 0.05, crs: 0.03, dri: 0.1, ctl: 0.12, agi: 0.06, bal: 0.03, fin: 0.09, lng: 0.07, pwr: 0.04, acc: 0.05, spr: 0.03, sta: 0.04, str: 0.03 }, sh: 0.11, kp: 0.24, yc: 0.08, drb: 3.4, tk: 1, ps: 1.05 },
  AIL: { n: "Ailier", ic: "💨", w: { acc: 0.1, spr: 0.12, fin: 0.1, pwr: 0.03, lng: 0.04, vis: 0.06, shp: 0.06, crs: 0.09, dri: 0.12, ctl: 0.08, agi: 0.08, bal: 0.03, sta: 0.05, str: 0.02 }, sh: 0.13, kp: 0.17, yc: 0.07, drb: 5.5, tk: 0.8, ps: 0.8 },
  BU: { n: "Avant-centre", ic: "🎯", w: { acc: 0.07, spr: 0.09, fin: 0.26, pwr: 0.09, lng: 0.03, pen: 0.02, vis: 0.03, shp: 0.05, dri: 0.06, ctl: 0.09, agi: 0.04, bal: 0.03, hea: 0.06, str: 0.06, jmp: 0.03 }, sh: 0.22, kp: 0.08, yc: 0.08, drb: 3, tk: 0.5, ps: 0.55 }
};
const POS_ORDER = ["BU", "AIL", "MOC", "MC", "MDC", "LAT", "DC", "GB"];

const ARCH = {
  1: { n: "Prodige", ic: "🌟", start: [44, 52], pot: [84, 95], desc: "Départ modeste, potentiel colossal", bias: {} },
  2: { n: "Travailleur", ic: "💪", start: [50, 57], pot: [76, 87], desc: "Progression régulière et fiable", bias: { sta: 6, agg: 4, str: 3 } },
  3: { n: "Naturel", ic: "✨", start: [56, 63], pot: [72, 82], desc: "Talent précoce, plafond plus bas", bias: {} },
  4: { n: "Athlète", ic: "🏃", start: [50, 58], pot: [75, 86], desc: "Explosif et puissant", bias: { acc: 8, spr: 8, str: 7, sta: 6, jmp: 6, vis: -4, shp: -3 } },
  5: { n: "Technicien", ic: "🎩", start: [50, 58], pot: [77, 89], desc: "Toucher de balle et vision de jeu", bias: { dri: 7, ctl: 8, agi: 6, vis: 7, shp: 6, lng: 4, str: -4, sta: -3 } }
};

// alias pour la commande « entrainer »
const ALIAS = {};
ATTR_KEYS.forEach((k) => {
  ALIAS[k] = k;
  ALIAS[norm(ATTRS[k][0])] = k;
});
Object.assign(ALIAS, { vitesse: "spr", sprint: "spr", acceleration: "acc", dribbles: "dri", passes: "shp", passe: "shp", tete: "hea", frappe: "pwr", penalty: "pen", penalties: "pen", finition: "fin", controle: "ctl", tacles: "tak", force: "str", endurance: "sta", detente: "jmp", reflexes: "ref", placement: "gpo", plongeon: "div", lointain: "lng" });
const CAT_ALIAS = { vit: "VIT", tir: "TIR", tirs: "TIR", pas: "PAS", tech: "DRI", technique: "DRI", def: "DEF", defense: "DEF", phy: "PHY", physique: "PHY", gk: "GK", gardien: "GK" };

function resolveTrain(s, pos) {
  const n = norm(s);
  if (!n) return null;
  if (ALIAS[n]) return ALIAS[n];
  const cat = CAT_ALIAS[n];
  if (!cat) return ATTR_KEYS.find((k) => norm(ATTRS[k][0]).startsWith(n)) || null;
  const w = POS[pos].w;
  return wpick(ATTR_KEYS.filter((k) => ATTRS[k][1] === cat), (k) => w[k] || 0.01);
}

function calcOvr(a, pos) {
  const w = POS[pos].w;
  let t = 0, s = 0;
  for (const k in w) { t += a[k] * w[k]; s += w[k]; }
  return Math.round(t / s);
}

function genAttrs(pos, start, arch) {
  const w = POS[pos].w;
  const keys = Object.keys(w);
  const avgW = 1 / keys.length;
  const bias = ARCH[arch].bias || {};
  const a = {};
  ATTR_KEYS.forEach((k) => {
    let v;
    if (w[k]) v = start + (w[k] / avgW - 1) * 7 + rnd(-5, 5);
    else if (ATTRS[k][1] === "GK") v = rnd(8, 24);
    else v = start - (pos === "GB" ? 20 : 15) + rnd(-7, 7);
    if (bias[k] && (w[k] || pos !== "GB")) v += bias[k];
    a[k] = clamp(Math.round(v), 10, 94);
  });
  return a;
}

function traitsOf(c) {
  const a = c.a, t = [];
  if (c.pos === "GB") {
    if (a.ref >= 84) t.push("🐈 Réflexes de chat");
    if (a.kic >= 80) t.push("🎯 Relanceur");
    if (a.gpo >= 85) t.push("🧱 Mur");
    return t;
  }
  if (a.fin >= 82) t.push("🎯 Finisseur");
  if (a.lng >= 80) t.push("🚀 Frappe de loin");
  if (a.vis >= 82 && a.shp >= 80) t.push("🧠 Passeur");
  if (a.dri >= 85) t.push("🌀 Dribbleur");
  if (a.spr >= 88) t.push("⚡ Fusée");
  if (a.tak >= 84 && a.mar >= 82) t.push("🧱 Mur défensif");
  if (a.hea >= 84) t.push("🪽 Roi des airs");
  if (a.sta >= 88) t.push("🔋 Infatigable");
  if (a.pen >= 85) t.push("🥅 Tireur de penalty");
  if (a.crs >= 84) t.push("📐 Centreur");
  return t;
}

// progression moyenne annuelle d'un attribut selon l'âge
function ageDelta(k, age) {
  const t = ATTR_TYPE[k] || "tech";
  if (t === "phys") {
    if (age <= 18) return 3.5; if (age <= 21) return 2.5; if (age <= 24) return 1.2; if (age <= 26) return 0.2;
    if (age <= 29) return -1.4; if (age <= 32) return -2.6; return -3.6;
  }
  if (t === "gk") {
    if (age <= 20) return 3; if (age <= 24) return 2; if (age <= 28) return 0.8; if (age <= 33) return -0.2;
    if (age <= 36) return -1.6; return -2.8;
  }
  if (t === "str") {
    if (age <= 21) return 3; if (age <= 25) return 1.6; if (age <= 28) return 0.4; if (age <= 31) return -0.8; return -2;
  }
  if (age <= 18) return 3.2; if (age <= 21) return 2.4; if (age <= 24) return 1.6; if (age <= 27) return 0.8;
  if (age <= 30) return 0.1; if (age <= 33) return -0.8; return -1.8;
}

// évolution de fin de saison (appelée avant l'incrément d'âge)
function develop(c) {
  const S = c.s;
  const before = { ...c.a };
  const oldOvr = c.ovr;
  const gap = c.pot - c.ovr;
  const luck = rndF(0.6, 1.4);
  const ratio = S && S.tm ? S.st.m / S.tm : S && S.youth ? S.st.m / S.youth.n : 0.5;
  ATTR_KEYS.forEach((k) => {
    let d = ageDelta(k, c.age);
    if (d > 0) {
      d *= (c.age <= 27 ? clamp(gap / 9, 0.3, 2.3) : 1) * luck;
      if (c.age <= 26 && gap > 4) d += gap * 0.05 * luck;
      d *= ratio >= 0.6 ? 1.12 : ratio < 0.2 ? 0.75 : 1;
    } else if (c.items.physio) d *= 0.85;
    if (!POS[c.pos].w[k]) d *= 0.4;
    if (c.focus && ATTRS[k][1] === c.focus) d += 1.4;
    d += rndF(-1.2, 1.2);
    c.a[k] = clamp(c.a[k] + sround(d), 10, 99);
  });
  if (c.items.gym) { c.a.str = clamp(c.a.str + 1, 10, 99); c.a.sta = clamp(c.a.sta + 1, 10, 99); }
  c.ovr = calcOvr(c.a, c.pos);
  c.peak = Math.max(c.peak, c.ovr);
  c.pot = c.age >= 29 ? c.ovr : clamp(Math.max(c.ovr, c.pot + rnd(-2, 1)), c.ovr, 99);
  return { before, oldOvr };
}
// ===== END PART 03/16 =====

// ===== FOOT PART 09/16 =====
// ─── événements aléatoires ───
const EVENTS = [
  {
    id: "interview", w: 3, cond: (c) => c.rep >= 5,
    t: "🎤 Un journaliste te tend le micro après le match. Que dis-tu ?",
    o: [
      ["Rester humble", (c) => { c.fans += 2; c.rep = clamp(c.rep + 1, 0, 100); return "Les supporters apprécient ton humilité (+fans, +réputation)."; }],
      ["Lancer une provocation", (c) => { if (chance(0.55)) { c.rep = clamp(c.rep + 3, 0, 100); c.fans += 1; return "Buzz médiatique : ta cote grimpe (+réputation)."; } c.fans -= 4; c.trust -= 2; return "La polémique tourne mal : critiques et confiance du coach en baisse."; }],
      ["Éviter les médias", () => "Tu passes sans un mot. Rien ne change."]
    ]
  },
  {
    id: "coach", w: 3, cond: (c) => c.trust < 55 && c.level === "pro",
    t: "😤 Tu es frustré par ton temps de jeu. Comment réagis-tu ?",
    o: [
      ["Discuter avec le coach", (c) => { if (chance(0.65)) { c.trust += 6; return "Le coach apprécie ta franchise (+confiance)."; } c.trust -= 3; return "Le coach reste sur sa position (-confiance)."; }],
      ["Râler sur les réseaux", (c) => { c.trust -= 8; c.morale += 3; c.rep = clamp(c.rep + 1, 0, 100); return "Ça fait du bruit, mais le coach n'apprécie pas (-confiance)."; }],
      ["Travailler en silence", (c) => { c.trust += 2; c.tokens = Math.min(5, c.tokens + 1); return "Tu bosses dur à l'entraînement (+séance, +confiance)."; }]
    ]
  },
  {
    id: "teammate", w: 2, cond: (c) => c.level === "pro",
    t: "⚡ Accrochage avec un coéquipier à l'entraînement.",
    o: [
      ["Présenter des excuses", (c) => { c.trust += 2; c.morale -= 1; return "L'ambiance reste saine (+confiance)."; }],
      ["Hausser le ton", (c) => { c.morale += 2; c.trust -= 3; return "Tu t'imposes mais le vestiaire tousse (-confiance)."; }],
      ["Ignorer", () => "L'incident est vite oublié."]
    ]
  },
  {
    id: "charity", w: 2, cond: (c) => c.money > 300000,
    t: "🤝 Une association te propose une action caritative.",
    o: [
      ["Faire un gros don (200 k€)", (c) => { c.money -= 200000; c.rep = clamp(c.rep + 4, 0, 100); c.fans += 3; return "Ton geste est salué partout (+réputation, +fans)."; }],
      ["Participer en personne", (c) => { c.rep = clamp(c.rep + 2, 0, 100); c.fit = clamp(c.fit - 5, 0, 100); c.morale += 3; return "Une belle journée (+réputation, +moral)."; }],
      ["Décliner", () => "Tu déclines poliment."]
    ]
  },
  {
    id: "deal", w: 2, cond: (c) => c.rep >= 15,
    t: "💼 Une marque propose un contrat publicitaire ponctuel.",
    o: [
      ["Accepter", (c) => { const g = Math.round(c.rep * 12000); c.money += g; return `Tu encaisses ${money(g)}.`; }],
      ["Refuser pour rester concentré", (c) => { c.morale += 2; c.form = clamp(c.form + 3, 0, 100); return "Tu restes focus (+moral, +forme)."; }]
    ]
  },
  {
    id: "party", w: 2, cond: (c) => c.age >= 18,
    t: "🎉 Soirée entre amis la veille d'un match. Tu y vas ?",
    o: [
      ["Sortir", (c) => { c.morale += 8; c.fit = clamp(c.fit - 15, 0, 100); if (chance(0.15)) { c.rep = clamp(c.rep - 4, 0, 100); c.fans -= 3; return "Photos compromettantes dans la presse (-réputation)."; } return "Belle soirée (+moral) mais tu es fatigué (-fraîcheur)."; }],
      ["Rester à la maison", (c) => { c.fit = clamp(c.fit + 6, 0, 100); c.morale -= 1; return "Soirée tranquille (+fraîcheur)."; }]
    ]
  },
  {
    id: "injured", w: 2, cond: (c) => c.inj.left >= 1 && c.inj.left <= 3 && c.level === "pro",
    t: "🩹 Le coach veut te voir revenir plus vite, mais le staff médical conseille le repos.",
    o: [
      ["Reprendre plus tôt", (c) => { if (chance(0.35)) { c.inj.left += 4; return "Rechute ! Tu t'es blessé de nouveau (+4 matchs d'absence)."; } c.inj.left = 0; c.trust += 4; return "Tu reviens plus vite que prévu (+confiance)."; }],
      ["Écouter le staff", (c) => { c.trust -= 2; return "Tu respectes le protocole médical."; }]
    ]
  },
  {
    id: "rumor", w: 2, cond: (c) => c.rep >= 20,
    t: "📰 Une rumeur lie ton nom à un grand club. Ta réaction ?",
    o: [
      ["Entretenir la rumeur", (c) => { c.rep = clamp(c.rep + 2, 0, 100); c.trust -= 3; c.rumor = true; return "Ta cote monte (+réputation) mais le coach fronce les sourcils."; }],
      ["Démentir publiquement", (c) => { c.fans += 3; return "Les supporters sont rassurés (+fans)."; }]
    ]
  },
  {
    id: "game", w: 1, cond: (c) => c.ovr >= 78,
    t: "🎮 Tu vas figurer en vedette dans un grand jeu vidéo de football !",
    o: [["Génial !", (c) => { c.rep = clamp(c.rep + 2, 0, 100); c.morale += 3; return "Tu es une star du jeu ! (+réputation, +moral)"; }]]
  },
  {
    id: "captain", w: 3, cond: (c) => !c.captain && c.age >= 22 && c.yearsAtClub >= 2 && c.rep >= 30 && c.level === "pro" && !c.loan,
    t: "🎖️ Le coach te propose le brassard de capitaine.",
    o: [
      ["Accepter", (c) => { c.captain = true; c.trust += 8; c.morale += 5; return "Tu deviens capitaine du club ! (+confiance, +moral)"; }],
      ["Décliner", (c) => { c.trust += 2; return "Tu préfères te concentrer sur ton jeu."; }]
    ]
  },
  {
    id: "legend", w: 2, cond: (c) => c.level === "pro",
    t: "🏋️ Séance spéciale avec une ancienne gloire du club : sur quoi travailles-tu ?",
    o: [
      ["Technique individuelle", (c) => { const k = pick(["dri", "ctl", "shp", "vis"]); c.a[k] = clamp(c.a[k] + 1, 10, 99); c.ovr = calcOvr(c.a, c.pos); return `${ATTRS[k][0]} +1.`; }],
      ["Condition physique", (c) => { const k = pick(["acc", "spr", "sta", "str"]); c.a[k] = clamp(c.a[k] + 1, 10, 99); c.ovr = calcOvr(c.a, c.pos); return `${ATTRS[k][0]} +1.`; }],
      ["État d'esprit", (c) => { c.morale += 6; c.form = clamp(c.form + 4, 0, 100); return "Tu repars gonflé à bloc (+moral, +forme)."; }]
    ]
  }
];

function eventPrompt(ev) {
  return `${head("🎭", "ÉVÉNEMENT")}${ev.t}\n${ev.o.map((o, i) => `${i + 1}. ${o[0]}`).join("\n")}\n📌 ${P()}foot choix <n°>`;
}

function maybeEvent(c, ctx) {
  if (c.evCool > 0) c.evCool--;
  if (c.pending || c.evCool > 0 || c.level !== "pro" || (ctx && ctx.isNat) || !chance(0.045)) return { text: "", stop: false };
  const ev = wpick(EVENTS.filter((e) => e.cond(c)), (e) => e.w);
  if (!ev) return { text: "", stop: false };
  c.pending = ev.id;
  c.evCool = rnd(10, 18);
  return { text: "\n\n" + eventPrompt(ev), stop: true };
}

function resolveEvent(c, idx, auto) {
  const ev = EVENTS.find((e) => e.id === c.pending);
  c.pending = null;
  if (!ev) return "";
  const o = ev.o[clamp(idx, 0, ev.o.length - 1)];
  const r = o[1](c);
  c.morale = clamp(c.morale, 5, 100);
  c.fans = clamp(c.fans, 0, 100);
  c.trust = clamp(c.trust, 0, 100);
  return `${auto ? "⏭️ Pas de réponse, option par défaut : " : "🎭 "}${o[0]} → ${r}`;
}

// ═══════════════════════════════════════════════════════════════════════
//  FIN DE SAISON, RÉCOMPENSES, MERCATO, ACADÉMIE, SPONSORS, RETRAITE
// ═══════════════════════════════════════════════════════════════════════
const round10k = (n) => Math.round(n / 10000) * 10000;

const BRANDS = [
  { n: "Nike", k: "Équipementier" }, { n: "Adidas", k: "Équipementier" }, { n: "Puma", k: "Équipementier" }, { n: "New Balance", k: "Équipementier" },
  { n: "Pepsi", k: "Boisson" }, { n: "Coca-Cola", k: "Boisson" }, { n: "Red Bull", k: "Boisson" },
  { n: "Rolex", k: "Montre" }, { n: "Hublot", k: "Montre" }, { n: "EA Sports", k: "Jeu vidéo" }, { n: "Konami", k: "Jeu vidéo" },
  { n: "Samsung", k: "Tech" }, { n: "Beats", k: "Tech" }, { n: "Visa", k: "Banque" }, { n: "Mastercard", k: "Banque" },
  { n: "Emirates", k: "Compagnie aérienne" }, { n: "Qatar Airways", k: "Compagnie aérienne" }, { n: "Gillette", k: "Soins" }
];

function genSponsorOffers(c) {
  if (c.rep < 15 || c.level !== "pro") return [];
  const have = new Set(c.sponsors.map((s) => s.k));
  const base = round10k(Math.pow(c.rep, 2) * 650 + c.ovr * 3000);
  return shuffle(BRANDS.filter((b) => !have.has(b.k))).slice(0, 3).map((b) => ({
    brand: b.n, k: b.k, income: round10k(base * rndF(0.7, 1.3) * (b.k === "Équipementier" ? 1.6 : 1)), years: rnd(1, 3)
  }));
}

function tourSummary(T) {
  const r = T.res;
  if (r === "champion") return "CHAMPION 🏆";
  if (r === "finale") return "finaliste 🥈";
  if (r === "nq") return "non qualifié";
  if (r === "ns") return "non sélectionné";
  if (r === "inj") return "forfait (blessure)";
  if (r === "groupe") return "éliminé en phase de groupes";
  return `éliminé en ${r}`;
}
const tourBonus = (T) => (!T ? 0 : T.res === "champion" ? (T.kind === "WC" ? 20 : 10) : T.res === "finale" ? (T.kind === "WC" ? 8 : 4) : T.res === "demi-finale" ? (T.kind === "WC" ? 4 : 2) : 0);

// ─── récompenses individuelles ───
function seasonAwards(c, S, avgR, pos) {
  const st = S.st, L = LEAGUES[S.lk], R = S.lg.R;
  const out = [];
  const topG = Math.round(R * rndF(0.5, 0.78) * (L.tier === 1 ? 1 : 0.8));
  const topA = Math.round(R * rndF(0.28, 0.45));
  if (st.lg >= 8 && st.lg >= topG) { addHonor(c, "scorer", `Meilleur buteur — ${L.n}`); out.push(`👟 Meilleur buteur de ${L.n} (${st.lg} buts)`); }
  if (st.la >= 7 && st.la >= topA) { addHonor(c, "assist", `Meilleur passeur — ${L.n}`); out.push(`🅰️ Meilleur passeur de ${L.n} (${st.la} passes)`); }
  if (c.pos === "GB" && st.cs >= Math.round(R * 0.34) && st.m >= R * 0.6) { addHonor(c, "glove", `Gant d'or — ${L.n}`); out.push(`🧤 Gant d'or de ${L.n} (${st.cs} clean sheets)`); }
  if (st.m >= R * 0.5 && L.tier === 1) {
    if (avgR >= 7.3 && chance(clamp((avgR - 7.2) * 1.6 + (pos <= 4 ? 0.1 : 0), 0.05, 0.9))) { addHonor(c, "potm", `Joueur de la saison — ${L.n}`); out.push(`🌟 Joueur de la saison en ${L.n}`); }
    else if (avgR >= 7.0 && chance(0.5)) { addHonor(c, "xi", `Équipe type — ${L.n}`); out.push(`📋 Dans l'équipe type de la saison`); }
  }
  if (c.age <= 21 && c.ovr >= 76 && st.m >= R * 0.4 && chance(clamp((c.ovr - 74) / 20, 0.05, 0.9))) { addHonor(c, "golden", "Golden Boy 🌟"); out.push("🌟 Golden Boy (meilleur jeune d'Europe)"); }
  return out;
}
// ===== END PART 09/16 =====

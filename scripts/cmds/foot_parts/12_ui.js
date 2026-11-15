// ===== FOOT PART 12/16 =====
// ═══════════════════════════════════════════════════════════════════════
//  AFFICHAGES
// ═══════════════════════════════════════════════════════════════════════
const SHOP = [
  { id: "coach", n: "Coach personnel", ic: "🧑‍🏫", price: 500000, desc: "+15% de réussite à l'entraînement" },
  { id: "nutri", n: "Nutritionniste", ic: "🥗", price: 300000, desc: "-15% de risque de blessure" },
  { id: "physio", n: "Kiné personnel", ic: "💆", price: 400000, desc: "Meilleure récupération, -30% de blessures" },
  { id: "agent", n: "Super-agent", ic: "🕴️", price: 1000000, desc: "+12% sur les salaires, négociations facilitées" },
  { id: "boots", n: "Crampons sur-mesure", ic: "👟", price: 200000, desc: "+5% d'efficacité sur buts et passes" },
  { id: "gym", n: "Salle de sport privée", ic: "🏋️", price: 800000, desc: "+1 Force et +1 Endurance chaque saison" },
  { id: "media", n: "Équipe médias", ic: "📱", price: 1500000, desc: "Réputation et sponsors accrus" },
  { id: "villa", n: "Villa de luxe", ic: "🏡", price: 3000000, desc: "+8 de moral immédiat" },
  { id: "car", n: "Voiture de sport", ic: "🏎️", price: 400000, desc: "+4 de réputation (une fois)" },
  { id: "found", n: "Fondation caritative", ic: "❤️", price: 2000000, desc: "+8 de réputation et +10 fans (une fois)" }
];

const noCareer = () => `❌ Tu n'as pas de carrière.\n📌 Tape ${P()}foot creer pour commencer !`;
const barL = (v) => `${bar(v, 100, 8)} ${Math.round(v)}%`;

function helpText() {
  const p = P();
  let t = head("⚽", "FOOT — CARRIÈRE RÉALISTE");
  t += `De l'académie au Ballon d'Or, dans un monde de ${CLUBS.filter((x) => !LEAGUES[x.l].ext).length} clubs réels.\n\n`;
  t += `${bold("DÉMARRER")}\n🆕 ${p}foot creer • 👤 profil • 📊 attributs\n\n`;
  t += `${bold("JOUER")}\n⚽ ${p}foot match — prochain match détaillé\n⏩ ${p}foot sim [n | mois | saison] — simuler\n▶️ ${p}foot continuer — reprendre après le mercato d'hiver\n\n`;
  t += `${bold("COMPÉTITIONS")}\n🗓️ calendrier • 📊 classement • ⭐ europe • 🏆 coupe • 👑 ballondor\n\n`;
  t += `${bold("PROGRESSION")}\n🏋️ entrainer <attribut|vit|tir|pas|tech|def|phy> • 🎯 focus <catégorie>\n📈 stats • 🏅 palmares • 📰 actu\n\n`;
  t += `${bold("CARRIÈRE")}\n📨 offres • ✅ accepter <n°> • 💬 negocier <n°> • 🔁 rester\n✍️ prolonger • 📣 demander (départ) • 📃 contrat\n\n`;
  t += `${bold("VIE DE STAR")}\n💼 sponsors • 🛍️ boutique • acheter <n°> • 🎭 choix <n°>\n🥅 penalty • 🎁 daily\n\n`;
  t += `${bold("FIN")}\n🏛️ top • 🎖️ retraite • 🗑️ supprimer`;
  return t;
}

function introText(c) {
  let t = head("🌱", "TA CARRIÈRE COMMENCE");
  t += `${natOf(c).f} ${bold(c.name)} • ${POS[c.pos].ic} ${POS[c.pos].n} • ${c.age} ans\n`;
  t += `🌠 ${ARCH[c.arch].ic} ${ARCH[c.arch].n} • ⭐ ${c.ovr} (potentiel ${c.pot})\n`;
  const lk = leagueKeyOf(c, c.club);
  if (c.level === "academy") t += `🎓 Tu intègres l'académie de ${bold(clubName(c.club))} ${LEAGUES[lk].f}.\n🎯 Objectif : décrocher un contrat pro avant 19 ans.\n\n`;
  else t += `🏟️ Tu signes à ${bold(clubName(c.club))} ${LEAGUES[lk].f} • ${money(c.contract.wage)}/an.\n\n`;
  t += `📌 ${P()}foot match — jouer ton premier match\n📌 ${P()}foot attributs — voir tes qualités\n📌 ${P()}foot aide — toutes les commandes`;
  return t;
}

function profileText(c) {
  const n = natOf(c), lk = leagueKeyOf(c, c.club);
  let t = head("👤", c.name.toUpperCase());
  t += `${n.f} ${n.n} • ${POS[c.pos].ic} ${POS[c.pos].n} • ${c.age} ans • ${c.foot === "g" ? "gaucher" : "droitier"}\n`;
  t += `🌠 ${ARCH[c.arch].ic} ${ARCH[c.arch].n}${c.captain ? " • 🎖️ Capitaine" : ""}\n`;
  t += `⭐ ${bold(c.ovr)} (potentiel ${c.pot}) • 💎 ${money(marketValue(c))}\n`;
  t += `🏟️ ${bold(clubName(c.club))} ${LEAGUES[lk].f}${c.level === "academy" ? " — Académie U19" : ""}${c.loan ? ` (prêté par ${clubName(c.loan.parent)})` : ""}\n`;
  t += `📋 ${roleOf(c)} • 📃 ${c.contract.years} an(s) • ${money(c.contract.wage)}/an\n`;
  t += `🌟 Réputation ${c.rep}/100 • 💰 ${money(c.money)}\n${LINE}\n`;
  t += `🔥 Forme     ${barL(c.form)}\n😊 Moral     ${barL(c.morale)}\n🔋 Fraîcheur ${barL(c.fit)}\n`;
  if (c.level === "pro") t += `🤝 Confiance ${barL(c.trust)}\n❤️ Fans      ${barL(c.fans)}\n`;
  if (c.inj.left > 0) t += `🩹 Blessé : ${c.inj.name} (${c.inj.left} match${c.inj.left > 1 ? "s" : ""})\n`;
  if (c.susp > 0) t += `🟥 Suspendu (${c.susp} match${c.susp > 1 ? "s" : ""})\n`;
  const tr = traitsOf(c);
  if (tr.length) t += `✨ ${tr.join(" • ")}\n`;
  if (c.s && c.phase === "season") {
    const st = c.s.st;
    t += `${LINE}\n🎯 Saison ${c.s.label} : ${st.m} m • ${st.g} ⚽ • ${st.a} 🅰️${st.rn ? " • note " + fmt1(st.rs / st.rn) : ""}\n`;
  } else if (c.phase !== "season") t += `${LINE}\n📨 Mercato ouvert — ${P()}foot offres\n`;
  t += `🏆 ${c.honors.length} titre(s)${c.cnt.ballon ? " • 👑 ×" + c.cnt.ballon : ""} • 🧢 ${c.intl.caps} sélection(s)`;
  if (c.pending) t += `\n🎭 Un événement t'attend : ${P()}foot choix <n°>`;
  return t;
}

function attrsText(c) {
  let t = head("📊", "ATTRIBUTS") + `⭐ ${c.ovr} • ${POS[c.pos].ic} ${POS[c.pos].n}\n`;
  const cats = c.pos === "GB" ? ["GK", "PHY"] : ["VIT", "TIR", "PAS", "DRI", "DEF", "PHY"];
  cats.forEach((ct) => {
    const keys = ATTR_KEYS.filter((k) => ATTRS[k][1] === ct);
    t += `\n${bold(CATS[ct])} ${Math.round(avg(keys.map((k) => c.a[k])))}${c.focus === ct ? " 🎯" : ""}\n`;
    keys.forEach((k) => (t += `• ${ATTRS[k][0]} ${c.a[k]} ${bar(c.a[k], 100, 8)}\n`));
  });
  t += `\n🏋️ Séances : ${Math.floor(c.tokens)} • 🎯 Focus : ${c.focus ? CATS[c.focus] : "aucun"}\n📌 ${P()}foot entrainer <attribut|catégorie>`;
  return t;
}

function tableText(c) {
  const S = c.s;
  if (!S.lg) return "🎓 Pas de classement en académie : concentre-toi sur tes progrès !";
  const rows = standings(S.lg.table), L = LEAGUES[S.lk];
  let t = head("📊", `${L.n} — J${S.lg.table[c.club].p}/${S.lg.R}`);
  const idx = rows.findIndex((r) => r.id === c.club);
  const show = (i) => {
    const r = rows[i], gd = r.gf - r.ga;
    return `${r.id === c.club ? "👉" : "  "}${String(i + 1).padStart(2, " ")}. ${clubName(r.id)} • ${r.pts} pts (${gd >= 0 ? "+" : ""}${gd}) • ${r.p}J`;
  };
  const set = new Set();
  [0, 1, 2, 3, 4, idx - 1, idx, idx + 1, rows.length - 3, rows.length - 2, rows.length - 1].forEach((i) => { if (i >= 0 && i < rows.length) set.add(i); });
  let prev = -1;
  [...set].sort((a, b) => a - b).forEach((i) => {
    if (prev >= 0 && i - prev > 1) t += "   ⋯\n";
    t += show(i) + "\n";
    prev = i;
  });
  return t.trim();
}

function euroText(c) {
  const E = c.s.euro;
  if (!E) return "⭐ Ton club ne joue pas de compétition continentale cette saison.";
  let t = head(E.ic, E.name);
  if (E.table && (E.stage === "lp" || E.rank)) {
    const rows = standings(E.table);
    const idx = rows.findIndex((r) => r.id === c.club);
    t += `${bold("PHASE DE LIGUE")} • ${E.md}/8 matchs\n`;
    const set = new Set();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 23, idx - 1, idx, idx + 1].forEach((i) => { if (i >= 0 && i < rows.length) set.add(i); });
    let prev = -1;
    [...set].sort((a, b) => a - b).forEach((i) => {
      const r = rows[i], gd = r.gf - r.ga;
      if (prev >= 0 && i - prev > 1) t += "   ⋯\n";
      t += `${r.id === c.club ? "👉" : "  "}${String(i + 1).padStart(2, " ")}. ${clubName(r.id)} • ${r.pts} pts (${gd >= 0 ? "+" : ""}${gd})\n`;
      prev = i;
    });
    t += `\n🟢 1-8 : 8es • 🟡 9-24 : barrages • 🔴 25-36 : éliminés\n`;
  }
  if (E.stage === "champ") t += `\n🏆 Tu as remporté la compétition !`;
  else if (E.stage === "elim") t += `\n❌ ${E.res || "Éliminé"}${E.champ ? ` • Vainqueur : ${clubName(E.champ)}` : ""}`;
  else if (E.stage !== "lp") t += `\n➡️ Prochaine étape : ${STAGE_NAMES[E.stage]}${E.tie ? ` vs ${clubName(E.tie.opp)}` : ""}`;
  return t.trim();
}

function cupText(c) {
  const S = c.s;
  if (!S.cupDefs.length) return "🏆 Aucune coupe nationale disponible pour cette période.";
  let t = head("🏆", "COUPES NATIONALES");
  S.cupDefs.forEach((d) => {
    const s = S.cups[d.key];
    t += `${bold(d.name)}\n`;
    if (s.alive) t += `✅ Toujours en lice : ${roundName(d.R, s.rd)}${s.tie ? ` vs ${s.tie.opp.n}` : ""}\n`;
    else t += `${s.res && s.res.includes("vainqueur") ? "🏆 Vainqueur !" : "❌ " + (s.res || "éliminé")}\n`;
  });
  return t.trim();
}

function fixtureLabel(c, S, it) {
  const mon = monthOf(it.wk);
  if (it.k === "L") {
    const pair = S.lg.rounds[it.r].find(([h, a]) => h === c.club || a === c.club);
    if (!pair) return null;
    const home = pair[0] === c.club;
    return `⚽ ${mon} • J${it.r + 1} • ${clubName(home ? pair[1] : pair[0])} (${home ? "dom." : "ext."})`;
  }
  if (it.k === "C") {
    const st = S.cups[it.ck], d = S.cupDefs.find((x) => x.key === it.ck);
    if (!st || !st.alive || st.rd !== it.rd) return null;
    return `🏆 ${mon} • ${d.name} — ${roundName(d.R, it.rd)}${it.legs === 2 ? (it.leg === 1 ? " (aller)" : " (retour)") : ""}`;
  }
  if (it.k === "E") {
    const E = S.euro;
    if (!E || E.stage !== it.st || E.stage === "elim" || E.stage === "champ") return null;
    if (it.st === "lp") {
      const fx = E.fx[it.md];
      return fx ? `${E.ic} ${mon} • ${E.name} J${it.md + 1} • ${clubName(fx.opp)} (${fx.home ? "dom." : "ext."})` : null;
    }
    return `${E.ic} ${mon} • ${E.name} — ${STAGE_NAMES[it.st]}${it.legs === 2 ? (it.leg === 1 ? " (aller)" : " (retour)") : ""}`;
  }
  if (it.k === "I") return `🌍 ${mon} • Trêve internationale`;
  if (it.k === "W") return `❄️ Janvier • Mercato d'hiver`;
  if (it.k === "T") return `🌍 Juin • ${it.kind === "WC" ? "Coupe du Monde" : "Tournoi continental"}`;
  if (it.k === "Y") return `🎓 ${mon} • U19 J${it.i + 1} • ${clubName(it.opp)} U19 (${it.home ? "dom." : "ext."})`;
  return null;
}

function calText(c) {
  const S = c.s;
  let t = head("🗓️", `CALENDRIER ${S.label}`);
  let n = 0;
  for (let i = S.idx; i < S.cal.length && n < 9; i++) {
    const l = fixtureLabel(c, S, S.cal[i]);
    if (l) { t += l + "\n"; n++; }
  }
  if (!n) t += "Saison terminée.";
  const left = S.cal.slice(S.idx).filter((it) => fixtureLabel(c, S, it)).length;
  return t.trim() + `\n\n📆 ${left} rendez-vous restants cette saison.`;
}
// ===== END PART 12/16 =====

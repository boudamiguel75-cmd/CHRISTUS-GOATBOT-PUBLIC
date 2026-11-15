// ===== FOOT PART 11/16 =====
// ─── mercato ───
function genOffers(c, kind) {
  const offers = [];
  const years = c.contract.years;
  const S = c.s;
  const avgR = S && S.st && S.st.rn ? S.st.rs / S.st.rn : 6.5;
  const des = c.ovr + c.rep / 10 + (c.age <= 23 ? (c.pot - c.ovr) * 0.25 : 0) + (avgR - 6.5) * 4;
  const base = marketValue(c);
  const mk = (type, clubId, fee, wage, yrs) => ({
    type, club: clubId, fee, wage, years: yrs, bonus: Math.round(wage * (type === "free" ? 0.3 : 0.12)),
    goalBonus: Math.round(wage * 0.004), clause: type === "transfer" || type === "free" ? round10k(base * rndF(1.8, 3)) : null, neg: false
  });
  if (kind !== "release" && (kind !== "winter" || years <= 2) && !(roleOf(c) === "Remplaçant" && c.age >= 28 && chance(0.25))) {
    const cur = c.loan ? c.loan.parent : c.club;
    offers.push({ ...mk("renew", cur, 0, round10k(wageFor(c, cur) * rndF(1, 1.15)), rnd(2, 5)), clause: null });
  }
  let pool = CLUBS.filter((x) => !LEAGUES[x.l].ext && x.id !== c.club && cs(c, x.id) <= des + 4 && cs(c, x.id) >= des - 16);
  if (pool.length < 3) pool = CLUBS.filter((x) => !LEAGUES[x.l].ext && x.id !== c.club && cs(c, x.id) <= des + 12).sort((a, b) => cs(c, b.id) - cs(c, a.id)).slice(0, 8);
  const n = kind === "winter" ? rnd(1, 3) : kind === "release" ? rnd(3, 5) : rnd(3, 6) + (c.transferReq ? 2 : 0);
  shuffle(pool).slice(0, n).forEach((cl) => {
    const free = years <= 0 || kind === "release";
    const wage = round10k(wageFor(c, cl.id) * rndF(0.92, 1.18) * (kind === "release" ? 0.5 : 1));
    const fee = free ? 0 : round10k(base * rndF(0.85, 1.2) * (cs(c, cl.id) >= 70 ? 1 : 0.8));
    offers.push(mk(free ? "free" : "transfer", cl.id, fee, Math.max(30000, wage), rnd(2, 5)));
  });
  if (kind !== "release" && c.age <= 24 && ["Rotation", "Remplaçant"].includes(roleOf(c))) {
    const lp = CLUBS.filter((x) => !LEAGUES[x.l].ext && x.id !== c.club && cs(c, x.id) >= c.ovr - 8 && cs(c, x.id) <= cs(c, c.club) - 4);
    shuffle(lp).slice(0, 2).forEach((cl) => offers.push({ ...mk("loan", cl.id, 0, c.contract.wage, 1), bonus: 0, clause: null }));
  }
  const renew = offers.filter((o) => o.type === "renew");
  const rest = offers.filter((o) => o.type !== "renew").sort((a, b) => cs(c, b.club) - cs(c, a.club));
  return [...renew, ...rest];
}

function acceptOffer(c, o) {
  const old = c.club;
  if (o.type === "renew") {
    c.contract = { wage: o.wage, years: o.years, goalBonus: o.goalBonus, clause: null };
    c.money += o.bonus;
    addNews(c, `✍️ Prolongation à ${clubName(old)} jusqu'en ${seasonEndYear(c.seasonNo - 1) + o.years}.`);
    return { ok: true, moved: false, text: `✍️ ${bold("PROLONGATION SIGNÉE")}\nTu restes à ${bold(clubName(old))} : ${money(o.wage)}/an pendant ${o.years} ans.\n💶 Prime de signature : ${money(o.bonus)}` };
  }
  if (o.type === "transfer" && c.contract.years > 0 && !c.transferReq) {
    const role = roleOf(c);
    let pOk = 0.9 - (role === "Star" ? 0.35 : role === "Joueur clé" ? 0.2 : 0) - (c.contract.years >= 4 ? 0.1 : 0) + (c.trust < 40 ? 0.15 : 0);
    if (o.fee >= marketValue(c) * 1.1) pOk += 0.15;
    if (!chance(clamp(pOk, 0.15, 0.97))) {
      c.morale = clamp(c.morale - 4, 5, 100);
      o.refused = true;
      return { ok: false, moved: false, text: `❌ ${clubName(old)} refuse de te laisser partir (offre de ${clubName(o.club)} rejetée). Ton moral baisse.\n💡 Tu peux forcer le départ avec ${P()}foot demander.` };
    }
  }
  const nc = clubName(o.club);
  if (o.type === "loan") {
    c.loan = { parent: old, club: o.club };
    c.club = o.club; c.yearsAtClub = 0; c.trust = 55; c.fans = 40; c.captain = false;
    addNews(c, `🔁 Prêté à ${nc}.`);
    return { ok: true, moved: true, text: `🔁 ${bold("PRÊT OFFICIALISÉ")}\n${clubName(old)} ➜ ${bold(nc)} (1 an)\n🎯 Objectif : jouer et progresser !` };
  }
  c.club = o.club;
  c.contract = { wage: o.wage, years: o.years, goalBonus: o.goalBonus, clause: o.clause || null };
  c.money += o.bonus;
  c.loan = null; c.yearsAtClub = 0; c.trust = 50; c.fans = 40; c.captain = false; c.transferReq = false;
  c.morale = clamp(c.morale + 6, 5, 100);
  c.rep = clamp(c.rep + clamp(Math.round(o.fee / 15e6), 0, 6), 0, 100);
  addNews(c, `✍️ Transfert : ${clubName(old)} ➜ ${nc}${o.fee ? " (" + money(o.fee) + ")" : " (libre)"}`);
  return {
    ok: true, moved: true,
    text: `✍️ ${bold("TRANSFERT OFFICIEL")}\n${clubName(old)} ➜ ${bold(nc)} ${clubFlag(c, o.club)}\n💰 Indemnité : ${o.fee ? money(o.fee) : "libre"}\n💶 ${money(o.wage)}/an • ${o.years} ans • prime ${money(o.bonus)}${o.fee >= 80e6 ? "\n💣 Transfert à prix d'or !" : ""}`
  };
}

function negotiateOffer(c, o) {
  if (o.neg) return "⚠️ Tu as déjà négocié cette offre.";
  o.neg = true;
  const r = Math.random();
  const nm = clubName(o.club);
  if (r < 0.45 + (c.items.agent ? 0.1 : 0)) {
    o.wage = round10k(o.wage * rndF(1.1, 1.25));
    o.bonus = Math.round(o.bonus * 1.15);
    o.goalBonus = Math.round(o.goalBonus * 1.2);
    return `🤝 ${nm} accepte d'améliorer son offre : ${bold(money(o.wage))}/an !`;
  }
  if (r < 0.7 && o.type !== "renew") { o.withdrawn = true; return `💥 ${nm} retire son offre, vexé par tes exigences.`; }
  return `😐 ${nm} ne bouge pas : l'offre reste identique.`;
}

function startNextSeason(c) {
  c.phase = "season";
  c.offers = [];
  c.transferReq = false;
  c.rumor = false;
  c.pending = null;
  buildSeason(c);
}

// transfert pendant le mercato d'hiver : on rejoue la fin de saison avec le nouveau club
function winterMove(c) {
  const old = c.s;
  const played = old.cal.slice(0, old.idx).filter((i) => i.k === "L").length;
  const frac = old.lg ? played / old.lg.R : 0.5;
  c.phase = "season";
  c.offers = [];
  c.pending = null;
  buildSeason(c, { mid: clamp(frac, 0.1, 0.9), carry: old });
}

function requestTransfer(c) {
  if (c.transferReq) return "⚠️ Tu as déjà demandé à partir.";
  if (c.level !== "pro") return "⚠️ Tu n'es pas encore professionnel.";
  c.transferReq = true;
  c.morale = clamp(c.morale - 5, 5, 100);
  c.trust = clamp(c.trust - 8, 0, 100);
  c.fans = clamp(c.fans - 4, 0, 100);
  addNews(c, `📣 Tu as demandé à quitter ${clubName(c.club)}.`);
  return `📣 Tu as officiellement demandé ton départ. Ton club ne pourra plus bloquer un transfert, mais les supporters et le coach le prennent mal.\n(Moral -5 • Confiance -8 • Fans -4)\nTu recevras plus d'offres au prochain mercato.`;
}

function renewMidSeason(c) {
  if (c.level !== "pro" || c.loan) return "⚠️ Impossible pour le moment.";
  if (c.contract.years > 2) return `⚠️ Ton contrat court encore ${c.contract.years} ans : le club ne veut pas discuter maintenant.`;
  const role = roleOf(c);
  const p = clamp(0.35 + (c.trust - 50) / 100 + (role === "Star" || role === "Joueur clé" ? 0.3 : role === "Titulaire" ? 0.1 : -0.15), 0.05, 0.92);
  if (!chance(p)) { c.trust = clamp(c.trust - 2, 0, 100); return "❌ Le club repousse les discussions pour l'instant."; }
  const wage = round10k(wageFor(c, c.club) * rndF(1.05, 1.2));
  const yrs = rnd(2, 4);
  const bonus = Math.round(wage * 0.12);
  c.contract = { wage, years: yrs, goalBonus: Math.round(wage * 0.004), clause: null };
  c.money += bonus;
  c.morale = clamp(c.morale + 4, 5, 100);
  addNews(c, `✍️ Prolongation à ${clubName(c.club)}.`);
  return `✍️ ${bold("PROLONGATION SIGNÉE")}\n${money(wage)}/an pendant ${yrs} ans • prime ${money(bonus)}`;
}

function acceptSponsor(c, idx) {
  const o = c.sponsorOffers[idx];
  if (!o) return "❌ Offre introuvable.";
  if (c.sponsors.length >= 3) return "⚠️ Tu as déjà 3 sponsors (maximum).";
  if (c.sponsors.some((s) => s.k === o.k)) return `⚠️ Tu as déjà un sponsor dans la catégorie « ${o.k} ».`;
  c.sponsors.push({ brand: o.brand, k: o.k, income: o.income, years: o.years });
  c.sponsorOffers.splice(idx, 1);
  c.fans = clamp(c.fans + 1, 0, 100);
  return `💼 Contrat signé avec ${bold(o.brand)} : ${money(o.income)}/an pendant ${o.years} an(s).`;
}

// ─── retraite et panthéon ───
function retireCareer(c, forced) {
  const sc = legacy(c);
  const entry = {
    name: c.name, nat: natOf(c).f + " " + natOf(c).n, pos: POS[c.pos].n, seasons: c.history.length,
    m: c.tot.m, g: c.tot.g, a: c.tot.a, ballon: c.cnt.ballon || 0, titles: c.honors.length, caps: c.intl.caps,
    peak: c.peak, score: sc, owner: c.uid
  };
  DB.hof.push(entry);
  DB.hof.sort((a, b) => b.score - a.score);
  DB.hof = DB.hof.slice(0, 50);
  delete DB.players[c.uid];
  saveDB();
  let t = head("🎖️", forced ? "FIN DE CARRIÈRE" : "TU RACCROCHES LES CRAMPONS");
  t += `${natOf(c).f} ${bold(c.name)} • ${POS[c.pos].n}\n`;
  t += `📅 ${c.history.length} saison(s) • ${c.tot.m} matchs • ${c.intl.caps} sélections\n`;
  t += `⚽ ${c.tot.g} buts • 🅰️ ${c.tot.a} passes décisives\n`;
  t += `🏆 ${c.honors.length} titre(s)/distinction(s) • 👑 ${c.cnt.ballon || 0} Ballon d'Or\n`;
  const big = [["ucl", "Ligue des Champions"], ["mondial", "Coupe du Monde"], ["ligue", "Championnat"]].filter(([k]) => c.cnt[k]).map(([k, n]) => `${c.cnt[k]}× ${n}`);
  if (big.length) t += `🥇 ${big.join(" • ")}\n`;
  t += `⭐ Pic de forme : ${c.peak} • 💰 Fortune : ${money(c.money)}\n\n`;
  t += `🏛️ ${bold("Score de légende")} : ${sc}\n📌 Tu entres au Panthéon (${P()}foot top). ${P()}foot creer pour une nouvelle carrière !`;
  return t;
}

// ─── entraînement ───
function train(c, key) {
  if (c.tokens < 1) return "❌ Plus de séance disponible ! Tu en gagnes en jouant des matchs (ou via le bonus quotidien).";
  if (c.a[key] >= 99) return "⚠️ Cet attribut est déjà au maximum.";
  c.tokens -= 1;
  let p = 0.55 + (c.age <= 23 ? 0.2 : c.age >= 30 ? -0.2 : 0) + (c.items.coach ? 0.15 : 0) - Math.max(0, c.a[key] - 80) * 0.02;
  if (c.ovr >= c.pot + 2) p *= 0.3;
  p = clamp(p, 0.1, 0.95);
  const lab = ATTRS[key][0];
  if (chance(p)) {
    const inc = chance(0.12) ? 2 : 1;
    const old = c.ovr;
    c.a[key] = clamp(c.a[key] + inc, 10, 99);
    c.ovr = calcOvr(c.a, c.pos);
    c.peak = Math.max(c.peak, c.ovr);
    if (c.ovr > c.pot) c.pot = c.ovr;
    c.form = clamp(c.form + 3, 5, 100);
    return `💪 Séance réussie ! ${lab} +${inc} (${c.a[key]})${c.ovr > old ? `\n⭐ Note globale : ${old} ➜ ${c.ovr}` : ""}\n🏋️ Séances : ${Math.floor(c.tokens)}`;
  }
  return `😓 Séance sans effet sur ${lab}. Réessaie !\n🏋️ Séances : ${Math.floor(c.tokens)}`;
}
// ===== END PART 11/16 =====

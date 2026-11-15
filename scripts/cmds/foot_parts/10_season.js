// ===== FOOT PART 10/16 =====
function ballonDor(c, S, avgR, intlBonus, teamTitles) {
  const st = S.st, L = LEAGUES[S.lk], R = S.lg.R;
  if (c.ovr < 74 || st.m < R * 0.45) return null;
  const euroBonus = S.euro && S.euro.stage === "champ" ? 18 : S.euro && ["sf", "f"].includes(S.euro.outAt) ? 7 : 0;
  const k = 38 / R;
  const score =
    c.ovr * 0.45 + avgR * 6 + st.g * (c.pos === "BU" ? 0.55 : 0.8) * k + st.a * 0.4 * k + teamTitles * 5 + euroBonus +
    (cs(c, c.club) - 70) * 0.2 + (L.tier === 1 ? L.coef * 3 : -6) + intlBonus +
    (c.pos === "GB" || c.pos === "DC" ? 9 : c.pos === "MDC" || c.pos === "LAT" ? 5 : 0);
  const cands = c.stars.map((s) => ({
    n: s.n,
    s: s.ovr * 0.45 + rndF(6.9, 8.3) * 6 + rnd(6, 32) * 0.6 + rnd(2, 13) * 0.4 + (chance(0.55) ? rnd(1, 4) : 0) * 5 +
      (chance(0.14) ? 18 : chance(0.18) ? 7 : 0) + rndF(0, 10) + (chance(0.08) ? 10 : 0)
  }));
  cands.push({ n: c.name, s: score, me: true });
  cands.sort((a, b) => b.s - a.s);
  const rank = cands.findIndex((x) => x.me) + 1;
  c.bdHist = c.bdHist || [];
  c.bdHist.push({ no: S.no, rank });
  const medals = ["🥇", "🥈", "🥉", "4.", "5."];
  let text = `👑 ${bold("BALLON D'OR")}\n` + cands.slice(0, 5).map((x, i) => `${medals[i]} ${x.n}${x.me ? " (toi)" : ""}`).join("\n");
  const won = rank === 1;
  if (won) { addHonor(c, "ballon", "Ballon d'Or 👑"); text += "\n🎉 TU REMPORTES LE BALLON D'OR !!!"; }
  else text += `\n📍 Tu termines ${ord(rank)} du classement.`;
  return { text, won, rank };
}

// ─── mise à jour du monde à la fin d'une saison ───
function updateWorld(c, myRows) {
  const myKey = c.s.lk;
  const order = {};
  PLAY_LEAGUES.forEach((k) => {
    order[k] = k === myKey && myRows ? myRows.map((r) => r.id) : quickOrder(c, c.mem[k]);
  });
  PLAY_LEAGUES.forEach((k) => {
    const o = order[k], n = o.length;
    o.forEach((id, i) => {
      let dv = rndF(-3, 3);
      if (i < 3) dv += 0.6;
      if (i >= n - 3) dv -= 0.6;
      c.drift[id] = clamp((c.drift[id] || 0) * 0.75 + dv, -9, 9);
    });
  });
  CLUBS.filter((x) => LEAGUES[x.l].ext).forEach((x) => (c.drift[x.id] = clamp((c.drift[x.id] || 0) * 0.8 + rnd(-2, 2), -9, 9)));
  // promotions et relégations
  PLAY_LEAGUES.forEach((k) => {
    const L = LEAGUES[k];
    if (L.tier !== 1 || !L.pair) return;
    const up = L.pair, mv = L.mv;
    const rel = order[k].slice(-mv), pro = order[up].slice(0, mv);
    c.mem[k] = order[k].filter((id) => !rel.includes(id)).concat(pro);
    c.mem[up] = order[up].filter((id) => !pro.includes(id)).concat(rel);
    order[k] = [...c.mem[k]];
    order[up] = [...c.mem[up]];
  });
  PLAY_LEAGUES.forEach((k) => (c.last[k] = order[k]));
}

function endSeason(c) {
  return c.level === "academy" ? endAcademySeason(c) : endProSeason(c);
}

function endProSeason(c) {
  const S = c.s, st = S.st, L = LEAGUES[S.lk];
  const rows = standings(S.lg.table);
  const total = rows.length;
  const pos = rows.findIndex((r) => r.id === c.club) + 1;
  const row = rows[pos - 1];
  const avgR = st.rn ? st.rs / st.rn : 0;
  const clubId = c.club;
  let t = head("🏁", `FIN DE SAISON ${S.label}`);
  t += `🏟️ ${bold(clubName(clubId))} • ${L.f} ${L.n}\n`;
  t += `📍 ${ord(pos)}/${total} • ${row.pts} pts • ${row.w}V ${row.d}N ${row.l}D • ${row.gf}-${row.ga}\n`;
  if (pos === 1) { addHonor(c, "ligue", `Champion — ${L.n}`); t += `🏆 ${bold("CHAMPION !")}\n`; }
  const q = SPOTS[S.lk];
  if (q && L.tier === 1) {
    let tx = null;
    if (L.conf === "UEFA") {
      if (pos <= q[0]) tx = "Ligue des Champions ⭐";
      else if (pos <= q[0] + q[1]) tx = "Ligue Europa 🟠";
      else if (pos <= q[0] + q[1] + q[2]) tx = "Ligue Conférence 🟢";
    } else if (pos <= q[0]) tx = EURO_NAMES[{ CONMEBOL: "lib", AFC: "acl", CONCACAF: "ccc" }[L.conf]];
    if (tx) t += `🎟️ Qualifié : ${tx}\n`;
  }
  if (L.pair) {
    if (L.tier === 1 && pos > total - L.mv) t += `⬇️ ${bold("RELÉGUÉ")} en ${LEAGUES[L.pair].n}...\n`;
    if (L.tier === 2 && pos <= L.mv) t += `⬆️ ${bold("PROMU")} en ${LEAGUES[L.pair].n} !\n`;
  }
  S.cupDefs.forEach((d) => { const s = S.cups[d.key]; t += `🏆 ${d.name} : ${s.res || "éliminé"}\n`; });
  if (S.euro) t += `${S.euro.ic} ${S.euro.name} : ${S.euro.res || "terminé"}\n`;

  t += `\n📊 ${bold("TA SAISON")}\n${st.m} matchs • ${st.g} ⚽ • ${st.a} 🅰️ • note ${avgR ? fmt1(avgR) : "—"} • ${st.motm} MVP\n`;
  t += `⏱️ ${st.min} min • 🟨 ${st.yc} • 🟥 ${st.rc}`;
  if (c.pos === "GB" || c.pos === "DC") t += ` • 🧱 ${st.cs} clean sheets`;
  let tb = 0;
  if (S.intl.m) t += `\n🌍 Sélection : ${S.intl.m} match(s) • ${S.intl.g} but(s) • ${S.intl.a} passe(s)`;
  if (S.tour) { t += `\n${S.tour.ic} ${S.tour.name} : ${tourSummary(S.tour)}`; tb = tourBonus(S.tour); }

  const teamTitles = S.honors.length;
  const aw = seasonAwards(c, S, avgR, pos);
  if (aw.length) t += `\n\n🏅 ${bold("RÉCOMPENSES")}\n${aw.join("\n")}`;
  const bd = ballonDor(c, S, avgR, tb, teamTitles);
  if (bd) t += `\n\n${bd.text}`;

  // réputation, finances
  const repD = Math.round(((avgR ? (avgR - 6.5) * 6 : -2) + S.honors.length * 3 + (bd && bd.won ? 12 : 0) + (st.m < S.lg.R * 0.25 ? -3 : 0) + (c.items.media ? 3 : 0)) * (L.tier === 1 ? 1 : 0.6));
  c.rep = clamp(c.rep + repD, 0, 100);
  let spInc = 0;
  c.sponsors.forEach((s) => (spInc += s.income));
  c.sponsors = c.sponsors.filter((s) => --s.years > 0);
  const prizes = S.honors.length * 150000 + (bd && bd.won ? 1500000 : 0);
  c.money += spInc + prizes;
  t += `\n\n💰 ${bold("FINANCES")} : salaire ${money(c.contract.wage)}/an${spInc ? ` • sponsors ${money(spInc)}` : ""}${prizes ? ` • primes ${money(prizes)}` : ""}`;
  t += `\n🌟 Réputation ${c.rep}/100 (${repD >= 0 ? "+" : ""}${repD}) • 💼 Fortune ${money(c.money)}`;

  // historique et progression
  c.history.push({ no: S.no, label: S.label, club: clubName(clubId), lk: S.lk, pos, total, m: st.m, g: st.g, a: st.a, avg: avgR ? fmt1(avgR) : "—", ovr: c.ovr, age: c.age, honors: [...S.honors] });
  S.news.forEach((n) => addNews(c, n));
  const { before, oldOvr } = develop(c);
  const diffs = ATTR_KEYS.filter((k) => POS[c.pos].w[k]).map((k) => ({ k, d: c.a[k] - before[k] }));
  const ups = diffs.filter((x) => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
  const downs = diffs.filter((x) => x.d < 0).sort((a, b) => a.d - b.d).slice(0, 2);
  c.age++;
  c.seasonNo++;
  c.seasonsPlayed++;
  c.contract.years = Math.max(0, c.contract.years - 1);
  c.yearsAtClub++;
  t += `\n\n🎂 ${bold(c.age + " ans")} • ⭐ ${oldOvr} ➜ ${c.ovr} (${c.ovr - oldOvr >= 0 ? "+" : ""}${c.ovr - oldOvr}) • potentiel ${c.pot}`;
  if (ups.length) t += `\n📈 ${ups.map((x) => `${ATTRS[x.k][0]} +${x.d}`).join(" • ")}`;
  if (downs.length) t += `\n📉 ${downs.map((x) => `${ATTRS[x.k][0]} ${x.d}`).join(" • ")}`;

  // monde
  updateWorld(c, rows);
  ageStars(c);
  const newLg = leagueKeyOf(c, clubId);
  if (newLg !== S.lk) t += `\n🔄 ${clubName(clubId)} évoluera en ${LEAGUES[newLg].n} la saison prochaine.`;
  c.inj.left = Math.max(0, c.inj.left - 6);
  c.susp = 0; c.ycAcc = 0; c.fit = 100; c.pending = null;
  c.morale = clamp(Math.round((c.morale + 70) / 2), 20, 95);
  c.form = clamp(c.form, 55, 70);
  if (c.loan) {
    const parent = c.loan.parent;
    t += `\n↩️ Fin du prêt : tu retournes à ${bold(clubName(parent))}.`;
    c.club = parent; c.loan = null; c.yearsAtClub = 0;
  }

  if (c.age >= 40 || (c.age >= 38 && c.ovr < 62) || (c.age >= 36 && c.ovr < 55)) {
    t += `\n\n🧓 Ton corps dit stop. ${bold("Retraite obligatoire.")}\n\n${retireCareer(c, true)}`;
    return t;
  }
  c.phase = "window";
  c.offers = genOffers(c, "summer");
  c.sponsorOffers = genSponsorOffers(c);
  t += `\n\n📨 ${bold("MERCATO D'ÉTÉ OUVERT")} : ${c.offers.length} offre(s)`;
  if (c.contract.years <= 0) t += `\n⚠️ Ton contrat est arrivé à terme : tu dois signer quelque part !`;
  if (c.sponsorOffers.length) t += `\n💼 ${c.sponsorOffers.length} offre(s) de sponsors (${P()}foot sponsors)`;
  t += `\n📌 ${P()}foot offres`;
  return t;
}

// ─── académie ───
function endAcademySeason(c) {
  const S = c.s, st = S.st, Y = S.youth;
  const avgR = st.rn ? st.rs / st.rn : 0;
  let t = head("🎓", `FIN DE SAISON U19 ${S.label}`);
  t += `🏟️ ${bold(clubName(c.club))} U19 • ${Y.w}V ${Y.d}N ${Y.l}D\n`;
  t += `📊 ${st.m} matchs • ${st.g} ⚽ • ${st.a} 🅰️ • note ${avgR ? fmt1(avgR) : "—"} • ${st.motm} MVP\n`;
  const { oldOvr } = develop(c);
  c.age++;
  c.seasonNo++;
  c.seasonsPlayed++;
  t += `\n🎂 ${bold(c.age + " ans")} • ⭐ ${oldOvr} ➜ ${c.ovr} • potentiel ${c.pot}\n`;
  c.history.push({ no: S.no, label: S.label, club: clubName(c.club) + " U19", lk: S.lk, pos: 0, total: 0, m: st.m, g: st.g, a: st.a, avg: avgR ? fmt1(avgR) : "—", ovr: c.ovr, age: c.age - 1, honors: [] });
  updateWorld(c, null);
  ageStars(c);
  c.inj.left = 0; c.susp = 0; c.fit = 100; c.form = 60;

  const cl = c.club;
  const evalV = c.ovr + (c.pot - c.ovr) * 0.35;
  const need = cs(c, cl) * 0.78 - 6;
  let promote = (c.age >= 17 && evalV >= need) || evalV >= need + 7;
  if (!promote && c.age >= 19 && evalV >= need - 4) promote = true;
  const release = !promote && c.age >= 19;
  t += `\n🔎 ${bold("BILAN DE L'ACADÉMIE")}\n`;
  if (promote) {
    c.level = "pro";
    c.contract = { wage: wageFor(c, cl), years: 3, goalBonus: 0, clause: null };
    c.contract.goalBonus = Math.round(c.contract.wage * 0.004);
    c.rep = clamp(c.rep + 3, 0, 100);
    addNews(c, `🎉 Premier contrat professionnel à ${clubName(cl)} !`);
    t += `🎉 ${bold("PREMIER CONTRAT PRO")} à ${clubName(cl)} : ${money(c.contract.wage)}/an pendant 3 ans !\n🌟 Tu rejoins le groupe professionnel.`;
    startNextSeason(c);
    return t;
  }
  if (release) {
    c.level = "pro";
    c.contract = { wage: 30000, years: 0, goalBonus: 0, clause: null };
    c.phase = "window";
    c.offers = genOffers(c, "release");
    t += `💔 ${clubName(cl)} ne te propose pas de contrat pro. Il faut rebondir ailleurs !\n\n📨 ${c.offers.length} club(s) s'intéressent à toi.\n📌 ${P()}foot offres`;
    return t;
  }
  c.contract.years = Math.max(2, c.contract.years - 1);
  t += `⏳ Le club veut te voir progresser encore : tu restes à l'académie une saison de plus.\n💡 Objectif : ${Math.round(need)} de niveau projeté (toi : ${Math.round(evalV)}).`;
  startNextSeason(c);
  return t;
}
// ===== END PART 10/16 =====

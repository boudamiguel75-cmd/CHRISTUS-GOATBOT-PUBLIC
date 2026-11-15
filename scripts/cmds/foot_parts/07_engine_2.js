// ===== FOOT PART 07/16 =====
// ─── conséquences du match sur le joueur ───
function applyMatchResult(c, ctx, res) {
  const S = c.s, p = res.p;
  const notes = [];

  if (p.minutes > 0) c.fit = clamp(c.fit - (p.minutes / 90) * (14 + (c.age >= 30 ? 3 : 0) - (c.items.physio ? 2 : 0)), 15, 100);
  if (p.inj) {
    c.inj = { left: p.inj.d, name: p.inj.n };
    c.form = clamp(c.form - 5, 5, 100);
    notes.push(`🩹 BLESSURE : ${p.inj.n} — absent ${p.inj.d} match(s).`);
    S.news.push(`🩹 Blessure : ${p.inj.n} (${p.inj.d} matchs).`);
  } else if (c.inj.left > 0) {
    c.inj.left--;
    if (c.inj.left === 0) notes.push("💪 Tu es rétabli et de nouveau disponible !");
  }
  if (p.rc) {
    c.susp = chance(0.15) ? 2 : 1;
    notes.push(`🟥 Expulsion : ${c.susp} match(s) de suspension.`);
  } else if (p.status === "suspendu") c.susp = Math.max(0, c.susp - 1);
  if (p.yc === 1 && !p.rc && !ctx.isNat) {
    c.ycAcc++;
    if (c.ycAcc >= 5) {
      c.ycAcc = 0;
      c.susp = Math.max(c.susp, 1);
      notes.push("🟨 5e carton jaune : suspendu pour le prochain match.");
    }
  }

  // statistiques
  const ST = ctx.isNat ? S.intl : S.st;
  if (p.minutes > 0) ST.m++;
  ST.g += p.goals;
  ST.a += p.assists;
  if (!ctx.isNat) {
    ST.min += p.minutes;
    ST.yc += p.yc > 0 ? 1 : 0;
    ST.rc += p.rc;
    ST.motm += p.motm ? 1 : 0;
    ST.sh += p.shots;
    ST.sot += p.sot;
    ST.kp += p.kp;
    if (p.cleanSheet && (c.pos === "GB" || c.pos === "DC" || c.pos === "LAT")) ST.cs++;
    if (p.rating !== null) { ST.rs += p.rating; ST.rn++; }
    if (!ctx.academy) {
      S.tm++;
      if (res.won) ST.w++; else if (res.lost) ST.l++; else ST.d++;
      const T = c.tot;
      if (p.minutes > 0) T.m++;
      T.g += p.goals; T.a += p.assists; T.min += p.minutes; T.yc += p.yc > 0 ? 1 : 0; T.rc += p.rc; T.motm += p.motm ? 1 : 0;
      if (p.rating !== null) { T.rs += p.rating; T.rn++; }
      if (p.cleanSheet && (c.pos === "GB" || c.pos === "DC" || c.pos === "LAT")) T.cs++;
    }
  } else if (p.minutes > 0) {
    c.intl.caps++;
    c.intl.goals += p.goals;
    c.intl.assists += p.assists;
  }
  if (ctx.comp && ctx.lgMatch && !ctx.isNat && !ctx.academy) { S.st.lg += p.goals; S.st.la += p.assists; }

  // forme, moral, confiance, fans
  if (p.rating !== null) {
    c.form = clamp(Math.round(c.form + (p.rating - 6.6) * 4), 5, 100);
    if (!ctx.academy && !ctx.isNat) c.trust = clamp(c.trust + (p.rating - 6.5) * 1.2, 0, 100);
    c.morale += (res.won ? 3 : res.lost ? -3 : 0) + (p.rating >= 8 ? 2 : p.rating < 5.5 ? -2 : 0) + (p.goals ? 2 : 0);
    c.fans += p.goals * 1.5 + (p.rating >= 8 ? 1 : 0) - (p.rc ? 3 : 0) - (p.rating < 5.5 ? 1 : 0);
  } else if (!ctx.isNat && !ctx.academy) {
    c.form = clamp(c.form - 1, 5, 100);
    c.trust = clamp(c.trust - 0.4, 0, 100);
    c.morale += (res.won ? 1 : res.lost ? -1.5 : 0) - (p.status === "sur le banc" ? 1 : 0);
  }
  c.morale = clamp(c.morale, 5, 100);
  c.fans = clamp(c.fans, 0, 100);
  c.tokens = Math.min(5, c.tokens + 0.6);

  // argent : salaire à chaque journée de championnat, primes à chaque match
  if (!ctx.isNat && !ctx.academy) {
    if (ctx.lgMatch && S.lg) c.money += c.contract.wage / S.lg.R;
    if (p.minutes > 0) c.money += c.contract.wage * 0.002;
    c.money += (c.contract.goalBonus || 0) * p.goals;
  } else if (ctx.academy && ctx.lgMatch) c.money += c.contract.wage / 14;

  if (p.goals >= 3) { notes.push(p.goals >= 4 ? "🎩 POKER ! Quatre buts !" : "🎩 TRIPLÉ ! Ballon de match offert !"); S.news.push(`🎩 ${p.goals >= 4 ? "Poker" : "Triplé"} contre ${ctx.opp.n}.`); }
  if (p.motm) c.fans = clamp(c.fans + 1, 0, 100);
  return notes;
}

// ─── rapport de match ───
function evLine(c, ctx, e) {
  const t = minLabel(e);
  if (e.k === "yc") return `🟨 ${t} Carton jaune pour ${c.name}`;
  if (e.k === "rc") return `🟥 ${t} ${c.name} est expulsé${e.second ? " (2e jaune)" : ""} !`;
  if (e.k === "inj") return `🩹 ${t} ${c.name} sort sur blessure`;
  if (e.type === "var") return `📺 ${t} But annulé par la VAR (${e.shooter})`;
  if (e.pen && e.type !== "goal") return `🧤 ${t} Penalty ${e.type === "save" ? "arrêté" : "raté"} (${e.me ? "ton tir !" : e.shooter})`;
  if (e.type !== "goal") return null;
  if (e.team === "my") {
    const who = e.me ? `🔥 ${c.name}` : e.shooter;
    const ass = e.assMe ? " — passe de toi 🅰️" : e.ass ? ` — passe de ${e.ass}` : "";
    return `⚽ ${t} But de ${who}${e.pen ? " (pen.)" : ""}${ass}`;
  }
  return `🥅 ${t} But de ${e.shooter} (${ctx.opp.n})${e.pen ? " (pen.)" : ""}`;
}

function matchReport(c, ctx, res, notes, extra) {
  const my = ctx.my, op = ctx.opp, p = res.p, T = res.team;
  let t = head(ctx.academy ? "🎓" : ctx.isNat ? "🌍" : "⚽", ctx.academy ? "MATCH U19" : "MATCH");
  t += `🏆 ${ctx.comp}${ctx.stage ? " • " + ctx.stage : ""}\n`;
  const hn = ctx.home ? my : op, an = ctx.home ? op : my;
  const hs = ctx.home ? res.fMy : res.fOp, as = ctx.home ? res.fOp : res.fMy;
  t += `🏟️ ${hn.fl ? hn.fl + " " : ""}${bold(hn.n)} ${hs}-${as} ${bold(an.n)}${an.fl ? " " + an.fl : ""}\n`;
  const sub = [];
  sub.push(`MT ${ctx.home ? res.htMy : res.htOp}-${ctx.home ? res.htOp : res.htMy}`);
  if (res.et) sub.push("après prolongations");
  if (res.shoot) sub.push(`tab ${ctx.home ? res.shoot.my : res.shoot.opp}-${ctx.home ? res.shoot.opp : res.shoot.my}`);
  if (ctx.agg) sub.push(`cumul ${ctx.agg.my + res.fMy}-${ctx.agg.opp + res.fOp}`);
  t += `⏱️ ${sub.join(" • ")}\n`;
  const lines = res.events.map((e) => evLine(c, ctx, e)).filter(Boolean);
  if (lines.length) t += `${LINE}\n${lines.slice(0, 12).join("\n")}\n`;
  t += `${LINE}\n📊 Possession ${T.poss}%-${100 - T.poss}% • Tirs ${T.shMy}-${T.shOp} (cadrés ${T.sotMy}-${T.sotOp})\n`;
  t += `🎯 xG ${fmt1(T.xgMy)}-${fmt1(T.xgOp)} • Corners ${T.cornMy}-${T.cornOp}\n${LINE}\n`;
  t += `👤 ${bold("TA PERFORMANCE")}\n`;
  if (p.minutes > 0) {
    t += `${p.starter ? "🟢 Titulaire" : "🟡 Remplaçant"} • ${p.minutes} min\n`;
    t += `⭐ Note : ${fmt1(p.rating)}${p.motm ? " 👑 HOMME DU MATCH" : ""}\n`;
    const bits = [];
    if (p.goals) bits.push(`⚽ ${p.goals} but${p.goals > 1 ? "s" : ""}`);
    if (p.assists) bits.push(`🅰️ ${p.assists} passe${p.assists > 1 ? "s" : ""} déc.`);
    if (p.shots) bits.push(`🎯 ${p.shots} tir${p.shots > 1 ? "s" : ""} (${p.sot} cadré${p.sot > 1 ? "s" : ""})`);
    if (p.kp) bits.push(`🔑 ${p.kp} passe${p.kp > 1 ? "s" : ""} clé${p.kp > 1 ? "s" : ""}`);
    if (c.pos === "GB") { bits.push(`🧤 ${p.saves} arrêt${p.saves > 1 ? "s" : ""}`); if (p.cleanSheet) bits.push("🧱 cage inviolée"); }
    else {
      if (p.tackles) bits.push(`🦵 ${p.tackles} tacle${p.tackles > 1 ? "s" : ""}`);
      if (p.inter) bits.push(`✋ ${p.inter} interception${p.inter > 1 ? "s" : ""}`);
      if (p.dribA) bits.push(`🌀 dribbles ${p.dribW}/${p.dribA}`);
      if (p.cleanSheet && ["DC", "LAT"].includes(c.pos)) bits.push("🧱 clean sheet");
    }
    t += (bits.length ? bits.join(" • ") + "\n" : "") + `📨 Passes ${Math.round((p.passes * p.passAcc) / 100)}/${p.passes} (${p.passAcc}%) • 🏃 ${p.km} km\n`;
    t += p.rating >= 9 ? "🔥 Performance légendaire !\n" : p.rating >= 8 ? "👑 Match de patron.\n" : p.rating >= 7 ? "💪 Prestation solide.\n" : p.rating >= 6 ? "😐 Match correct, sans plus.\n" : "😬 Un match à oublier vite.\n";
  } else t += `🚫 Tu n'as pas joué (${p.status}).\n`;
  (notes || []).forEach((n) => (t += n + "\n"));
  (extra || []).forEach((n) => (t += n + "\n"));
  t += `🔥 Forme ${Math.round(c.form)}% • 😊 Moral ${Math.round(c.morale)}% • 🔋 Fraîcheur ${Math.round(c.fit)}%`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════════
//  DÉROULEMENT : matchs, compétitions, tournois internationaux, événements
// ═══════════════════════════════════════════════════════════════════════
const MONTHS = ["Août", "Septembre", "Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin"];
const monthOf = (wk) => MONTHS[clamp(Math.floor((wk - 1) / 4), 0, 10)];

function addNews(c, t) {
  c.news.push({ no: c.seasonNo, t });
  if (c.news.length > 40) c.news.shift();
}
function addHonor(c, key, label) {
  c.cnt[key] = (c.cnt[key] || 0) + 1;
  c.s.honors.push(label);
  c.honors.push({ no: c.seasonNo, age: c.age, club: clubName(c.club), label });
  addNews(c, `🏆 ${label}`);
}

function myTeam(c, academy) {
  return { id: c.club, n: clubName(c.club) + (academy ? " U19" : ""), s: cs(c, c.club) * (academy ? 0.72 : 1), fl: clubFlag(c, c.club) };
}

function playFixture(c, spec) {
  const ctx = Object.assign({}, spec);
  ctx.my = spec.my || myTeam(c, spec.academy);
  ctx.startProb = startProb(c, ctx);
  if (spec.academy) ctx.subProb = 0.4;
  c.fit = clamp(c.fit + 12 + (c.items.physio ? 3 : 0), 0, 100);
  const res = simulateMatch(c, ctx);
  const notes = applyMatchResult(c, ctx, res);
  return { ctx, res, notes };
}

function lineOf(ctx, res, tag) {
  const p = res.p;
  const ic = res.won ? "✅" : res.draw ? "🟰" : "❌";
  let s = `${ic} ${tag} ${ctx.my.n} ${res.fMy}-${res.fOp} ${ctx.opp.n}`;
  if (res.shoot) s += ` (tab ${res.shoot.my}-${res.shoot.opp})`;
  s += p.rating !== null ? ` • ${fmt1(p.rating)}${p.goals ? " ⚽" + p.goals : ""}${p.assists ? " 🅰️" + p.assists : ""}` : " • absent";
  return s;
}

function packResult(c, S, f, tag, extra, it) {
  const { ctx, res, notes } = f;
  const ev = maybeEvent(c, ctx);
  return {
    text: matchReport(c, ctx, res, notes, extra) + ev.text,
    line: lineOf(ctx, res, tag),
    ch: res.won ? "V" : res.draw ? "N" : "D",
    g: res.p.goals, a: res.p.assists, r: res.p.rating,
    mon: monthOf(it.wk), stop: ev.stop || false
  };
}

// ─── lecture du calendrier : joue le prochain élément ───
function playNext(c) {
  const S = c.s;
  let prefix = "";
  if (c.pending) prefix = resolveEvent(c, 0, true) + "\n\n";
  for (let guard = 0; guard < 400; guard++) {
    if (S.idx >= S.cal.length) {
      const text = endSeason(c);
      return { text: prefix + text, line: "", ended: true, stop: true };
    }
    const it = S.cal[S.idx];
    S.wk = it.wk;
    const r = playItem(c, S, it);
    if (r === null) continue;
    r.text = prefix + r.text;
    return r;
  }
  return { text: "⚠️ Calendrier vide.", line: "", stop: true };
}
// ===== END PART 07/16 =====

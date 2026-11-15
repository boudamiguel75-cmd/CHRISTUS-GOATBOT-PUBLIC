// ===== FOOT PART 06/16 =====
function genShots(lam, from, to) {
  const n = clamp(poisson((lam / 0.125) * rndF(0.9, 1.1)), 2, 30);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = from ? { m: rnd(from, to), add: 0 } : rollMinute();
    t.xg = clamp(-Math.log(1 - Math.random()) * 0.113 + 0.012, 0.012, 0.78);
    out.push(t);
  }
  return out;
}

function shootout(c, playerOn, myS, opS) {
  const pc = clamp(0.76 + (myS - opS) / 400, 0.68, 0.84);
  let po = clamp(0.76 - (myS - opS) / 400, 0.68, 0.84);
  if (c.pos === "GB" && playerOn) po = clamp(po - (c.ovr - 65) / 400, 0.55, 0.8);
  const meTakes = playerOn && c.pos !== "GB" && chance(0.35 + c.a.pen / 250);
  const meIdx = rnd(0, 4);
  let a = 0, b = 0, me = null;
  for (let i = 0; i < 5; i++) {
    const mine = i === meIdx && meTakes;
    const ok = chance(mine ? clamp(0.62 + c.a.pen / 300, 0.6, 0.93) : pc);
    if (mine) me = ok ? "scored" : "missed";
    if (ok) a++;
    if (chance(po)) b++;
  }
  let guard = 0;
  while (a === b) {
    const x = chance(pc), y = chance(po);
    if (x) a++;
    if (y) b++;
    if (++guard > 20) { if (chance(0.5)) a++; else b++; }
  }
  return { my: a, opp: b, me };
}

function computeRating(c, R) {
  const pos = c.pos;
  let r = 6.0;
  if (pos === "GB") {
    r += R.saves * 0.16 + R.penSave * 0.9 - R.conc * 0.28 + (R.cleanSheet ? 0.65 : 0) + R.assists * 0.6 + R.goals * 1.5;
  } else {
    const gW = pos === "BU" ? 0.85 : pos === "AIL" || pos === "MOC" ? 0.95 : 1.1;
    const csW = { DC: 0.55, LAT: 0.4, MDC: 0.3, MC: 0.15 }[pos] || 0;
    r += R.goals * gW + R.assists * 0.6 + R.kp * 0.12 + Math.max(0, R.sot - R.goals) * 0.05 + R.dribW * 0.05 +
      R.tackles * 0.07 + R.inter * 0.07 - Math.max(0, R.shots - R.sot) * 0.03 + (R.cleanSheet ? csW : 0) -
      (R.conc >= 3 && csW > 0 ? 0.35 : 0) - R.penMiss * 0.5;
  }
  r += R.result > 0 ? 0.35 : R.result < 0 ? -0.3 : 0;
  r += (c.form - 50) / 250 + rndF(-0.5, 0.5);
  if (R.rc) r -= 1.5;
  if (R.minutes < 45) r = 6.2 + (r - 6.2) * (0.55 + 0.5 * (R.minutes / 90));
  return Math.round(clamp(r, 3.2, 10) * 10) / 10;
}

// ctx : { my:{n,s,fl}, opp:{n,s,fl}, home, neutral, ko:"none|single|leg1|leg2", agg:{my,opp},
//         startProb, subProb, academy, isNat, comp, stage }
function simulateMatch(c, ctx) {
  const pos = c.pos, A = c.a, PP = POS[pos];
  const my = ctx.my, op = ctx.opp;
  const home = !!ctx.home;
  const hb = ctx.neutral ? 0 : 2.2;
  const mode = ctx.ko || "none";

  // 1) disponibilité et temps de jeu
  let status = "", minutes = 0, starter = false;
  if (c.inj.left > 0) status = `blessé (${c.inj.name})`;
  else if (c.susp > 0) status = "suspendu";
  else if (chance(ctx.startProb)) {
    starter = true;
    minutes = 90;
    if (c.fit < 55 && chance(0.7)) minutes = rnd(50, 75);
    else if (chance(0.15)) minutes = rnd(58, 88);
  } else if (chance(ctx.subProb == null ? 0.5 : ctx.subProb)) minutes = rnd(8, 35);
  else status = "sur le banc";
  let from = 0, to = 0;
  if (minutes > 0) { from = starter ? 1 : 91 - minutes; to = starter ? minutes : 90; }
  const mf0 = minutes / 90;

  // 2) cartons et blessure en cours de match
  let yc = 0, rc = 0, cardMin = 0, inj = null, injMin = 0;
  if (minutes > 0) {
    if (chance(PP.yc * (0.7 + A.agg / 110) * mf0)) {
      yc = 1;
      cardMin = rnd(from, to);
      if (chance(0.045)) { yc = 2; rc = 1; }
    } else if (chance(0.006 * mf0)) { rc = 1; cardMin = rnd(from, to); }
    if (rc) to = Math.min(to, cardMin);
    const pI = (0.006 + 0.012 * mf0) * (c.fit < 50 ? 1.8 : c.fit < 70 ? 1.25 : 1) * (c.items.physio ? 0.7 : 1) *
      (c.items.nutri ? 0.85 : 1) * (c.age >= 31 ? 1.3 : 1) * (ctx.academy ? 0.7 : 1);
    if (chance(pI)) {
      inj = rollInjury();
      injMin = rnd(from, Math.max(from, to));
      to = Math.min(to, injMin);
    }
  }

  // 3) forces en présence
  const mf1 = minutes > 0 ? Math.max(to - from + 1, 1) / 90 : 0;
  const impact = minutes > 0 ? (c.ovr - (my.s - 6)) * 0.05 * mf1 : 0;
  const cond = minutes > 0 ? ((c.morale - 50) * 0.02 + (c.form - 50) * 0.03 - (c.fit < 60 ? (60 - c.fit) * 0.05 : 0)) * mf1 : 0;
  const myS = my.s + impact + cond + (home ? hb : 0);
  const opS = op.s + (!home ? hb : 0);
  const d = myS - opS;
  const lamMy = clamp(1.28 * Math.exp(0.024 * d) * Math.exp(rndF(-0.15, 0.15)), 0.18, 4.4);
  const lamOp = clamp(1.15 * Math.exp(-0.024 * d) * Math.exp(rndF(-0.15, 0.15)), 0.15, 4.0);

  // 4) équipes fictives
  const mates = Array.from({ length: 10 }, shortName);
  const oppMates = Array.from({ length: 10 }, shortName);
  const MW = [0.17, 0.15, 0.12, 0.1, 0.09, 0.08, 0.05, 0.05, 0.04, 0.03];
  const pickMate = (list) => {
    let r = Math.random() * 0.88;
    for (let i = 0; i < 10; i++) { r -= MW[i]; if (r <= 0) return list[i]; }
    return list[9];
  };
  const pickOther = (list, not) => {
    let n = pickMate(list), g = 0;
    while (n === not && g++ < 8) n = pickMate(list);
    return n;
  };
  const onPitch = (m) => minutes > 0 && m >= from && m <= to;
  const finF = clamp(A.fin / 72, 0.65, 1.3) * (c.items.boots ? 1.05 : 1) * (1 + (c.morale - 50) / 600);
  const pShoot = clamp(PP.sh * clamp((A.fin * 0.6 + A.pwr * 0.2 + A.lng * 0.2) / 70, 0.65, 1.25), 0, 0.55);
  const pAss = clamp(PP.kp * clamp((A.vis * 0.45 + A.shp * 0.25 + A.crs * 0.15 + A.lpa * 0.15) / 70, 0.55, 1.5) * (c.items.boots ? 1.05 : 1), 0, 0.5);
  const gkF = pos === "GB" ? clamp(72 / Math.max(40, c.ovr), 0.6, 1.35) : 1;
  const penMe = pos !== "GB" && A.pen >= 66 && c.ovr >= my.s - 6 && chance(0.85);
  const pl = { shots: 0, sot: 0, goals: 0, assists: 0, kp: 0, saves: 0, conc: 0, penGoal: 0, penMiss: 0, penSave: 0 };
  const shotEv = [];

  const doMyShot = (s, isPen) => {
    const me = onPitch(s.m) && (isPen ? penMe : chance(pShoot));
    const p = isPen ? (me ? clamp(0.62 + A.pen / 300, 0.6, 0.93) : 0.77) : me ? clamp(s.xg * finF, 0.01, 0.95) : s.xg;
    const goal = chance(p);
    const varNo = goal && chance(isPen ? 0.02 : 0.035);
    const ev = {
      m: s.m, add: s.add || 0, team: "my", pen: !!isPen, me, shooter: me ? c.name : pickMate(mates), xg: isPen ? 0.77 : s.xg,
      type: goal ? (varNo ? "var" : "goal") : chance(isPen ? 0.7 : 0.3 + s.xg * 1.1) ? "save" : "miss", ass: null, assMe: false
    };
    const valid = ev.type === "goal";
    if (!isPen && !me && chance(0.72)) {
      if (onPitch(s.m) && chance(pAss)) {
        ev.assMe = true;
        ev.ass = c.name;
        if (valid) pl.assists++; else pl.kp++;
      } else if (valid) ev.ass = pickOther(mates, ev.shooter);
    }
    if (me) {
      pl.shots++;
      if (ev.type !== "miss") pl.sot++;
      if (valid) { pl.goals++; if (isPen) pl.penGoal++; }
      else if (isPen) pl.penMiss++;
    }
    shotEv.push(ev);
  };

  const doOpShot = (s, isPen) => {
    const gkOn = pos === "GB" && onPitch(s.m);
    const p = isPen ? clamp(0.78 - (gkOn ? (c.ovr - 65) / 220 : 0), 0.5, 0.85) : clamp(s.xg * (gkOn ? gkF : 1), 0.008, 0.9);
    const goal = chance(p);
    const varNo = goal && chance(isPen ? 0.02 : 0.035);
    const type = goal ? (varNo ? "var" : "goal") : chance(isPen ? 0.7 : 0.3 + s.xg * 1.1) ? "save" : "miss";
    const ev = { m: s.m, add: s.add || 0, team: "op", pen: !!isPen, shooter: pickMate(oppMates), xg: isPen ? 0.77 : s.xg, type };
    if (type === "goal" && onPitch(s.m)) pl.conc++;
    if (gkOn && type === "save") { pl.saves++; if (isPen) pl.penSave++; }
    shotEv.push(ev);
  };

  const penP = (lf, la) => clamp(0.13 + (lf - la) * 0.025, 0.05, 0.3);
  genShots(lamMy).forEach((s) => doMyShot(s, false));
  genShots(lamOp).forEach((s) => doOpShot(s, false));
  if (chance(penP(lamMy, lamOp))) doMyShot({ ...rollMinute(), xg: 0.77 }, true);
  if (chance(penP(lamOp, lamMy))) doOpShot({ ...rollMinute(), xg: 0.77 }, true);

  // 5) score, prolongations, tirs au but
  const cnt = (team, lo, hi) => shotEv.filter((e) => e.team === team && e.type === "goal" && e.m >= lo && e.m <= hi).length;
  const gMy = cnt("my", 1, 90), gOp = cnt("op", 1, 90);
  const aggMy0 = ctx.agg ? ctx.agg.my : 0, aggOp0 = ctx.agg ? ctx.agg.opp : 0;
  let et = false, shoot = null, etOn = false;
  if ((mode === "single" || mode === "leg2") && gMy + aggMy0 === gOp + aggOp0) {
    et = true;
    etOn = minutes > 0 && to >= 90 && chance(0.85);
    if (etOn) to = 120;
    genShots(lamMy * 0.33, 91, 120).forEach((s) => doMyShot(s, false));
    genShots(lamOp * 0.33, 91, 120).forEach((s) => doOpShot(s, false));
  }
  const fMy = cnt("my", 1, 120), fOp = cnt("op", 1, 120);
  if (et && fMy + aggMy0 === fOp + aggOp0) shoot = shootout(c, etOn, myS, opS);
  if (minutes > 0) minutes = Math.max(1, to - from + 1);

  let advance = null;
  if (mode === "single" || mode === "leg2") {
    const aMy = aggMy0 + fMy, aOp = aggOp0 + fOp;
    advance = aMy !== aOp ? aMy > aOp : shoot.my > shoot.opp;
  }
  const won = shoot ? shoot.my > shoot.opp : fMy > fOp;
  const lost = shoot ? shoot.my < shoot.opp : fMy < fOp;
  const draw = !shoot && fMy === fOp;
  const ht = `${cnt("my", 1, 45)}-${cnt("op", 1, 45)}`;
  const htMy = cnt("my", 1, 45), htOp = cnt("op", 1, 45);

  // 6) statistiques d'équipe
  const mine = shotEv.filter((e) => e.team === "my"), theirs = shotEv.filter((e) => e.team === "op");
  const onT = (a) => a.filter((e) => e.type !== "miss").length;
  const team = {
    poss: Math.round(clamp(50 + (myS - opS) * 0.55 + rnd(-6, 6), 28, 72)),
    shMy: mine.length, shOp: theirs.length, sotMy: onT(mine), sotOp: onT(theirs),
    xgMy: mine.reduce((a, e) => a + e.xg, 0), xgOp: theirs.reduce((a, e) => a + e.xg, 0),
    cornMy: poisson(mine.length * 0.42), cornOp: poisson(theirs.length * 0.42)
  };

  // 7) statistiques individuelles
  const mf = minutes / 90;
  const cleanSheet = minutes >= 60 && fOp === 0 && shotEv.filter((e) => e.team === "op" && e.type === "goal" && onPitch(e.m)).length === 0;
  const pst = {
    status, minutes, starter, from, to, yc, rc, inj, injMin, cleanSheet, ...pl,
    passes: minutes > 0 ? Math.round(rnd(24, 52) * PP.ps * mf * (0.9 + A.shp / 300)) : 0,
    passAcc: minutes > 0 ? clamp(Math.round(62 + A.shp / 4 + rnd(-6, 6) + (pos === "DC" ? 8 : pos === "BU" ? -6 : 0)), 50, 96) : 0,
    dribA: 0, dribW: 0, tackles: 0, inter: 0, km: 0, rating: null, motm: false
  };
  if (minutes > 0) {
    pst.dribA = poisson(PP.drb * mf);
    pst.dribW = Math.round(pst.dribA * clamp(0.25 + A.dri / 180 + rndF(-0.1, 0.1), 0.15, 0.85));
    pst.tackles = poisson(PP.tk * mf * clamp(A.tak / 65, 0.5, 1.5));
    pst.inter = poisson(PP.tk * 0.6 * mf * clamp(A.int / 65, 0.5, 1.5));
    pst.km = Math.round((pos === "GB" ? 4.2 : 8.4 + A.sta / 45 + (["MC", "AIL", "LAT", "MDC"].includes(pos) ? 1.1 : 0)) * mf * 10) / 10;
    pst.rating = computeRating(c, { ...pst, result: won ? 1 : lost ? -1 : 0, minutes });
    pst.motm = pst.rating >= 8.7 || (pst.rating >= 8.2 && won && pst.goals >= 2);
  }

  // 8) événements affichés
  const events = [...shotEv];
  if (yc && !rc) events.push({ k: "yc", m: cardMin, add: 0 });
  if (yc === 1 && rc) events.push({ k: "yc", m: cardMin, add: 0 });
  if (yc === 2) { events.push({ k: "yc", m: Math.max(from, cardMin - 15), add: 0 }); events.push({ k: "rc", m: cardMin, add: 0, second: true }); }
  else if (rc) events.push({ k: "rc", m: cardMin, add: 0 });
  if (inj) events.push({ k: "inj", m: injMin, add: 0 });
  events.sort((x, y) => tkey(x) - tkey(y));

  return { p: pst, events, gMy, gOp, fMy, fOp, et, shoot, advance, won, lost, draw, ht, htMy, htOp, team, myS, opS };
}
// ===== END PART 06/16 =====

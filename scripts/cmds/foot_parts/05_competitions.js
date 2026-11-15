// ===== FOOT PART 05/16 =====
function setupEuro(c, ep) {
  const E = {
    key: ep.key, name: EURO_NAMES[ep.key], ic: EURO_ICON[ep.key], type: ep.type, pool: ep.pool,
    stage: ep.type === "lp" ? "lp" : "r16", md: 0, tie: null, field: [], fx: [], winnersAI: [],
    champ: null, outAt: null, rank: null, top8: [], po: [], table: null
  };
  if (ep.type === "lp") {
    const sorted = [...ep.pool].sort((a, b) => cs(c, b) - cs(c, a));
    const potSize = Math.ceil(sorted.length / 4);
    const fx = [];
    for (let i = 0; i < 4; i++) {
      const pot = sorted.slice(i * potSize, (i + 1) * potSize).filter((id) => id !== c.club);
      const homeFirst = chance(0.5);
      shuffle(pot).slice(0, 2).forEach((id, j) => fx.push({ opp: id, home: j === 0 ? homeFirst : !homeFirst }));
    }
    E.fx = shuffle(fx);
    E.table = newTable(ep.pool);
  } else {
    E.field = shuffle(ep.pool);
  }
  return E;
}

function euroItems(E, push) {
  const W = E.type === "lp" ? EURO_WEEKS_EU : EURO_WEEKS_KO;
  Object.keys(W).forEach((st) => {
    W[st].forEach((wk, i) => {
      if (st === "lp") push({ k: "E", st, md: i }, wk, 0.4);
      else push({ k: "E", st, leg: i + 1, legs: W[st].length }, wk, 0.4);
    });
  });
}

const aiWin = (c, x, y) => (chance(1 / (1 + Math.exp(-(cs(c, x) - cs(c, y)) / 8))) ? x : y);

function simKnockout(c, field) {
  let f = [...field];
  while (f.length > 1) {
    const s = shuffle(f), w = [];
    for (let i = 0; i + 1 < s.length; i += 2) w.push(aiWin(c, s[i], s[i + 1]));
    if (s.length % 2) w.push(s[s.length - 1]);
    f = w;
  }
  return f[0] || null;
}

function poWinners(c, E) {
  const seeded = E.po.slice(0, Math.floor(E.po.length / 2));
  const un = shuffle(E.po.slice(seeded.length));
  return seeded.map((s, i) => (un[i] ? aiWin(c, s, un[i]) : s));
}

// fin de la phase de ligue : classement final et suite du parcours
function finishLeaguePhase(c, E) {
  const rows = standings(E.table);
  E.rankIds = rows.map((r) => r.id);
  E.rank = E.rankIds.indexOf(c.club) + 1;
  E.top8 = E.rankIds.slice(0, 8);
  E.po = E.rankIds.slice(8, 24);
  if (E.rank <= 8) {
    E.stage = "r16";
    E.field = [...E.top8, ...poWinners(c, E)];
  } else if (E.rank <= 24) {
    E.stage = "po";
  } else {
    E.stage = "elim";
    E.outAt = "lp";
    E.champ = simKnockout(c, [...E.top8, ...poWinners(c, E)]);
  }
}

// tirage de la double confrontation / du match à élimination directe
function createEuroTie(c, E) {
  const st = E.stage;
  let pairs = [];
  if (st === "po") {
    const seeded = E.po.slice(0, Math.floor(E.po.length / 2));
    const un = shuffle(E.po.slice(seeded.length));
    pairs = seeded.map((s, i) => [s, un[i]]).filter((p) => p[1]);
  } else if (st === "r16" && E.type === "lp") {
    const un = shuffle(E.field.filter((id) => !E.top8.includes(id)));
    pairs = E.top8.map((s, i) => [s, un[i]]).filter((p) => p[1]);
  } else {
    const f = shuffle(E.field);
    for (let i = 0; i + 1 < f.length; i += 2) pairs.push([f[i], f[i + 1]]);
  }
  let opp = null;
  const winners = [];
  pairs.forEach(([x, y]) => {
    if (x === c.club) opp = y;
    else if (y === c.club) opp = x;
    else winners.push(aiWin(c, x, y));
  });
  if (!opp) opp = pick(E.field.filter((id) => id !== c.club)) || E.top8[0];
  E.winnersAI = winners;
  E.tie = { opp, aggMy: 0, aggOpp: 0, played: 0, firstHome: chance(0.5) };
  return E.tie;
}

// l'équipe du joueur a gagné ou perdu sa confrontation
function euroAdvance(c, E, win) {
  const list = E.type === "lp" ? STAGES_LP : STAGES_KO;
  const was = E.stage;
  const opp = E.tie ? E.tie.opp : null;
  if (win) {
    if (was === "f") { E.stage = "champ"; E.champ = c.club; }
    else {
      E.stage = list[list.indexOf(was) + 1];
      E.field = [...E.winnersAI, c.club];
      if (was === "po") E.field = [...E.top8, ...E.field];
    }
  } else {
    E.outAt = was;
    E.stage = "elim";
    if (was === "f") E.champ = opp;
    else {
      let field = [...E.winnersAI, opp];
      if (was === "po" && E.type === "lp") field = [...E.top8, ...field];
      E.champ = simKnockout(c, field);
    }
  }
  E.tie = null;
}

// journée de phase de ligue : le reste du tableau joue lui aussi
function euroMatchday(c, E, oppId, gf, ga) {
  tSide(E.table[c.club], gf, ga);
  if (E.table[oppId]) tSide(E.table[oppId], ga, gf);
  E.pool.forEach((id) => {
    if (id === c.club || id === oppId) return;
    const others = E.pool.filter((x) => x !== id && x !== c.club);
    const o = pick(others);
    const home = chance(0.5);
    const [g1, g2] = home ? aiScore(cs(c, id), cs(c, o)) : (() => { const r = aiScore(cs(c, o), cs(c, id)); return [r[1], r[0]]; })();
    tSide(E.table[id], g1, g2);
  });
}

// ─── sélection nationale & tournois ───
function tournamentKind(c, no) {
  const y = seasonEndYear(no);
  if (y >= 2030 && (y - 2030) % 4 === 0) return "WC";
  if (y % 2 === 0 && CONT_TOURNAMENT[natOf(c).conf]) return "CT";
  return null;
}

const callupProb = (c) => clamp((c.ovr + c.rep / 15 - (natOf(c).s - 10)) / 8, 0, 0.97);

function intlOpp(c) {
  const n = natOf(c);
  return wpick(NATIONS.filter((x) => x.n !== n.n), (x) => 1 / (1 + Math.abs(x.s - n.s) / 10));
}

function setupTournament(c, kind) {
  const nat = natOf(c);
  const wc = kind === "WC";
  const T = {
    kind, name: wc ? "Coupe du Monde" : CONT_TOURNAMENT[nat.conf], ic: wc ? "🌍" : "🏆",
    stage: "g", gi: 0, pts: 0, gf: 0, ga: 0, opps: [], alive: true, res: null, champ: null, last: null, matches: []
  };
  const pq = wc ? clamp(0.2 + (nat.s - 45) / 50, 0.1, 0.985) : clamp(0.35 + (nat.s - 45) / 60, 0.25, 0.995);
  if (!chance(pq)) { T.res = "nq"; T.alive = false; return T; }
  if (c.inj.left >= 4) { T.res = "inj"; T.alive = false; return T; }
  if (!chance(callupProb(c))) { T.res = "ns"; T.alive = false; return T; }
  let pool = NATIONS.filter((x) => x.n !== nat.n && (wc || x.conf === nat.conf));
  if (pool.length < 14) pool = NATIONS.filter((x) => x.n !== nat.n && (x.conf === nat.conf || x.s >= 68));
  pool.sort((a, b) => b.s - a.s);
  T.pool = pool.map((x) => x.n);
  const third = Math.max(1, Math.floor(pool.length / 3));
  T.opps = [pick(pool.slice(0, third)), pick(pool.slice(third, third * 2)), pick(pool.slice(third * 2))].map((x) => x.n);
  T.ko = wc ? ["R32", "R16", "QF", "SF", "F"] : ["R16", "QF", "SF", "F"];
  return T;
}
const natByName = (n) => NATIONS.find((x) => x.n === n);
const KO_LABEL = { R32: "16es de finale", R16: "8es de finale", QF: "Quarts de finale", SF: "Demi-finale", F: "Finale" };

function tourKnockoutOpp(c, T) {
  const idx = T.ko.indexOf(T.stage);
  const K = [40, 24, 14, 8, 6][idx + (T.ko.length === 4 ? 1 : 0)] || 6;
  const nat = natOf(c);
  const cand = T.pool.map(natByName).filter((x) => x && x.n !== nat.n && x.n !== T.last).slice(0, Math.min(K, T.pool.length));
  return pick(cand.length ? cand : [intlOpp(c)]);
}

function tourPickChampion(c, T, mine) {
  if (mine) return natOf(c).n;
  const cand = T.pool ? T.pool.slice(0, 8).map(natByName).filter(Boolean) : NATIONS.slice(0, 8);
  return wpick(cand, (x) => Math.pow(x.s / 60, 5)).n;
}

// ─── construction d'une saison ───
//  opts.mid  : fraction de la saison déjà jouée (transfert hivernal)
//  opts.carry: ancienne saison dont on reprend les statistiques
function buildSeason(c, opts) {
  opts = opts || {};
  const no = c.seasonNo;
  const lk = leagueKeyOf(c, c.club);
  const L = LEAGUES[lk];
  const ids = c.mem[lk];
  const S = {
    no, label: seasonLabel(no), lk, cal: [], idx: 0, tm: 0, honors: [], news: [], cups: {}, cupDefs: [], euro: null,
    tour: null, lg: null, youth: null, wk: 0, mid: !!opts.mid,
    st: { m: 0, g: 0, a: 0, rs: 0, rn: 0, yc: 0, rc: 0, motm: 0, min: 0, w: 0, d: 0, l: 0, cs: 0, lg: 0, la: 0, sh: 0, sot: 0, kp: 0 },
    intl: { m: 0, g: 0, a: 0 }
  };
  if (opts.carry) {
    const o = opts.carry;
    S.st = o.st; S.tm = o.tm; S.honors = o.honors; S.news = o.news; S.intl = o.intl; S.wk = o.wk;
    S.prevClubs = (o.prevClubs || []).concat([c.prevClubId || null]).filter(Boolean);
  }
  c.s = S;
  c.rival = rnd(-4, 4);
  const items = [];
  const push = (it, wk, tie) => { it.wk = wk; it.o = wk + tie; items.push(it); };

  // ── académie : 14 matchs U19 ──
  if (c.level === "academy") {
    const others = shuffle(ids.filter((id) => id !== c.club));
    S.youth = { w: 0, d: 0, l: 0, n: 14 };
    for (let i = 0; i < 14; i++) push({ k: "Y", i, opp: others[i % others.length], home: i % 2 === 0 }, 3 + i * 2.6, 0.8);
    S.cal = items.sort((a, b) => a.o - b.o);
    return S;
  }

  // ── championnat ──
  const rounds = L.fmt === "rand" ? randomRounds(ids, L.games) : roundRobin(ids);
  S.lg = { rounds, table: newTable(ids), R: rounds.length };
  let start = 0;
  if (opts.mid) {
    start = Math.floor(opts.mid * rounds.length);
    for (let r = 0; r < start; r++) {
      rounds[r].forEach(([h, a]) => {
        const [gh, ga] = aiScore(cs(c, h), cs(c, a));
        tApply(S.lg.table, h, a, gh, ga);
      });
    }
  }
  for (let r = start; r < rounds.length; r++) push({ k: "L", r }, 1 + (r * 39) / rounds.length, 0.8);

  if (!opts.mid) {
    // ── coupes nationales ──
    (CUPS[L.ct] || []).forEach((d) => {
      S.cupDefs.push(d);
      S.cups[d.key] = { alive: true, rd: 0, tie: null, faced: [] };
      for (let rd = 0; rd < d.R; rd++) {
        const wk = d.w0 + (rd * (d.w1 - d.w0)) / (d.R - 1);
        const legs = d.two && rd === d.R - 2 ? 2 : 1;
        for (let leg = 1; leg <= legs; leg++) push({ k: "C", ck: d.key, rd, leg, legs }, wk + (leg - 1) * 1.4, 0.5);
      }
    });
    // ── Europe / continent ──
    const ep = euroPoolFor(c);
    if (ep) {
      S.euro = setupEuro(c, ep);
      euroItems(S.euro, push);
    }
    push({ k: "W" }, 22.6, 0.7);
  }

  // ── sélection : trêves internationales ──
  if (c.age >= 17) [8.6, 14.6, 27.6].forEach((wk, i) => { if (wk > S.wk) push({ k: "I", i, called: null, p: 0 }, wk, 0.9); });
  const tk = tournamentKind(c, no);
  if (tk && c.age >= 17) push({ k: "T", kind: tk }, 41, 0);

  S.cal = items.sort((a, b) => a.o - b.o);
  return S;
}

// ═══════════════════════════════════════════════════════════════════════
//  MOTEUR DE MATCH : tirs, xG, penalties, VAR, cartons, blessures, prolongations
// ═══════════════════════════════════════════════════════════════════════
const INJURIES = [
  { n: "Contusion", w: 28, d: [1, 2] }, { n: "Entorse de la cheville", w: 22, d: [2, 5] }, { n: "Élongation", w: 16, d: [2, 4] },
  { n: "Déchirure musculaire", w: 14, d: [4, 8] }, { n: "Blessure au genou", w: 8, d: [5, 10] }, { n: "Fracture du pied", w: 5, d: [8, 14] },
  { n: "Commotion cérébrale", w: 4, d: [1, 3] }, { n: "Rupture des ligaments croisés", w: 3, d: [26, 38] }
];
function rollInjury() {
  const t = wpick(INJURIES, (x) => x.w);
  return { n: t.n, d: rnd(t.d[0], t.d[1]) };
}

const rollMinute = () => {
  const m = rnd(1, 90);
  return { m, add: m === 45 || m === 90 ? rnd(1, 4) : 0 };
};
const tkey = (e) => e.m + (e.add || 0) / 10;
const minLabel = (e) => `${e.m}${e.add ? "+" + e.add : ""}'`;
// ===== END PART 05/16 =====

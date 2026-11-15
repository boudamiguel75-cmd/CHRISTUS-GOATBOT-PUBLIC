// ===== FOOT PART 04/16 =====
// ─── MONDE : forces des clubs, appartenance aux championnats ───
function cs(c, id) {
  const cl = CLUB_MAP[id];
  return (cl ? cl.s : 55) + ((c.drift && c.drift[id]) || 0);
}
function leagueKeyOf(c, id) {
  for (const k in c.mem) if (c.mem[k].includes(id)) return k;
  return CLUB_MAP[id] ? CLUB_MAP[id].l : null;
}
const clubName = (id) => (CLUB_MAP[id] ? CLUB_MAP[id].n : "Club inconnu");
const clubFlag = (c, id) => {
  const k = leagueKeyOf(c, id);
  return k && LEAGUES[k] ? LEAGUES[k].f : "";
};
const natOf = (c) => NATIONS[c.nat];

function orderByStrength(c, ids) {
  return ids.map((id) => ({ id, v: cs(c, id) + rnd(-4, 4) })).sort((a, b) => b.v - a.v).map((x) => x.id);
}

function newStar(young) {
  const age = young ? rnd(18, 20) : rnd(21, 33);
  const ovr = young ? rnd(66, 78) : rnd(78, 92);
  return { n: genName(), age, ovr, pot: young ? rnd(84, 94) : ovr + rnd(0, 3) };
}
function ageStars(c) {
  c.stars.forEach((s) => {
    s.age++;
    if (s.age <= 24) s.ovr = Math.min(s.pot || 94, s.ovr + rnd(1, 4));
    else if (s.age <= 29) s.ovr += rnd(-1, 2);
    else s.ovr -= rnd(0, 3);
  });
  c.stars = c.stars.filter((s) => s.age < 37 && s.ovr >= 74);
  while (c.stars.length < 12) c.stars.push(newStar(true));
}

function initWorld(c) {
  c.mem = {};
  c.drift = {};
  c.last = {};
  PLAY_LEAGUES.forEach((k) => (c.mem[k] = CLUBS.filter((x) => x.l === k).map((x) => x.id)));
  PLAY_LEAGUES.forEach((k) => (c.last[k] = orderByStrength(c, c.mem[k])));
  c.stars = Array.from({ length: 12 }, () => newStar(false));
}

// ─── VALEUR, SALAIRE, RÔLE ───
function marketValue(c) {
  let v = 1.6e6 * Math.exp((c.ovr - 50) * 0.115);
  v *= c.age <= 20 ? 1.35 : c.age <= 24 ? 1.15 : c.age <= 28 ? 1 : c.age <= 30 ? 0.75 : c.age <= 32 ? 0.5 : 0.3;
  if (c.age <= 24 && c.pot > c.ovr) v *= 1 + (c.pot - c.ovr) / 45;
  const yrs = c.contract ? c.contract.years : 3;
  v *= yrs <= 1 ? 0.6 : yrs === 2 ? 0.85 : 1;
  v *= 1 + c.rep / 300;
  if (c.level === "academy") v *= 0.15;
  return Math.max(50000, Math.round(v / 10000) * 10000);
}

function wageFor(c, clubId) {
  const cl = CLUB_MAP[clubId];
  const lg = LEAGUES[leagueKeyOf(c, clubId) || cl.l] || LEAGUES[cl.l];
  const base = 90000 * Math.exp((c.ovr - 50) * 0.105);
  const club = Math.pow(cs(c, clubId) / 70, 2) * (lg.coef || 0.5);
  const w = base * club * (1 + c.rep / 150) * (c.items.agent ? 1.12 : 1);
  return Math.max(30000, Math.round(w / 10000) * 10000);
}

function roleFromOvr(ovr, clubStr, rival) {
  const d = ovr - (clubStr - 6 + (rival || 0));
  if (d >= 6) return "Star";
  if (d >= 2) return "Joueur clé";
  if (d >= -3) return "Titulaire";
  if (d >= -9) return "Rotation";
  return "Remplaçant";
}
const roleOf = (c) => (c.level === "academy" ? "Académie" : roleFromOvr(c.ovr, cs(c, c.club), c.rival));

// probabilité d'être titulaire
function startProb(c, ctx) {
  if (ctx.isNat) {
    const n = natOf(c);
    return clamp(0.5 + (c.ovr + c.rep / 15 - (n.s - 8)) * 0.05, 0.05, 0.95);
  }
  if (ctx.academy) return clamp(0.72 + (c.ovr - (ctx.my.s - 8)) * 0.03, 0.3, 0.97);
  const base = ctx.my.s - 6 + (c.rival || 0);
  let p = 0.55 + (c.ovr - base) * 0.05 + (c.trust - 50) / 250 + (c.loan ? 0.1 : 0);
  if (ctx.rotation) p -= 0.17;
  if (c.fit < 45) p -= 0.15;
  return clamp(p, 0.03, 0.99);
}

function legacy(c) {
  const k = c.cnt;
  return Math.round(
    (k.ballon || 0) * 150 + (k.mondial || 0) * 80 + (k.continental || 0) * 30 + (k.ucl || 0) * 40 +
    (k.uel || 0) * 12 + (k.ligue || 0) * 12 + (c.honors.length) * 4 +
    c.tot.g * 0.4 + c.tot.a * 0.2 + c.peak + c.intl.caps * 0.15
  );
}

function createCareer(uid, d) {
  const arch = ARCH[d.arch];
  const pro = d.mode === "pro";
  const start = rnd(arch.start[0], arch.start[1]) + (pro ? 7 : 0);
  const a = genAttrs(d.pos, start, d.arch);
  const c = {
    uid, name: d.name, nat: d.nat, pos: d.pos, foot: d.foot, arch: d.arch, age: pro ? 18 : 16,
    a, ovr: calcOvr(a, d.pos), pot: 0, club: d.club, level: pro ? "pro" : "academy",
    contract: null, loan: null, money: 20000, rep: 2, morale: 70, form: 60, fit: 100, trust: 50, fans: 40,
    focus: null, tokens: 3, seasonNo: 1, phase: "season", offers: [], items: {}, sponsors: [], sponsorOffers: [],
    honors: [], cnt: {}, tot: { m: 0, g: 0, a: 0, min: 0, motm: 0, yc: 0, rc: 0, rs: 0, rn: 0, cs: 0 },
    intl: { caps: 0, goals: 0, assists: 0 }, history: [], news: [], inj: { left: 0, name: "" }, susp: 0, ycAcc: 0,
    pending: null, evCool: 8, rival: rnd(-3, 3), transferReq: false, captain: false, yearsAtClub: 0, mem: {}, drift: {}, last: {},
    stars: [], s: null, created: Date.now(), lastPen: 0, lastDaily: 0, peak: 0, seasonsPlayed: 0
  };
  c.pot = clamp(rnd(arch.pot[0], arch.pot[1]), c.ovr + 6, 97);
  c.peak = c.ovr;
  initWorld(c);
  c.contract = { wage: pro ? wageFor(c, d.club) : 15000, years: 3, goalBonus: 0, clause: null };
  buildSeason(c);
  DB.players[uid] = c;
  saveDB();
  return c;
}

// ═══════════════════════════════════════════════════════════════════════
//  CALENDRIER & COMPÉTITIONS
// ═══════════════════════════════════════════════════════════════════════

// ─── championnat : tirage des journées (aller-retour, méthode du cercle) ───
function roundRobin(ids) {
  const t = shuffle(ids);
  if (t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      let h = t[i], a = t[n - 1 - i];
      if (h === null || a === null) continue;
      if ((r + i) % 2 === 1) [h, a] = [a, h];
      pairs.push([h, a]);
    }
    rounds.push(pairs);
    t.splice(1, 0, t.pop());
  }
  const first = shuffle(rounds);
  const second = shuffle(rounds).map((r) => r.map(([h, a]) => [a, h]));
  return [...first, ...second];
}

function randomRounds(ids, games) {
  const rounds = [];
  for (let r = 0; r < games; r++) {
    const t = shuffle(ids), pairs = [];
    for (let i = 0; i + 1 < t.length; i += 2) pairs.push([t[i], t[i + 1]]);
    rounds.push(pairs);
  }
  return rounds;
}

// ─── classements ───
const newTable = (ids) => {
  const t = {};
  ids.forEach((id) => (t[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, f: [] }));
  return t;
};
function tSide(row, gf, ga) {
  row.p++; row.gf += gf; row.ga += ga;
  if (gf > ga) { row.w++; row.pts += 3; row.f.push("V"); }
  else if (gf < ga) { row.l++; row.f.push("D"); }
  else { row.d++; row.pts++; row.f.push("N"); }
  if (row.f.length > 5) row.f.shift();
}
function tApply(t, h, a, gh, ga) {
  if (t[h]) tSide(t[h], gh, ga);
  if (t[a]) tSide(t[a], ga, gh);
}
const standings = (t) =>
  Object.values(t).sort((x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || (x.id < y.id ? -1 : 1));

// score d'un match entre deux équipes gérées par l'IA
function aiScore(sh, sa) {
  const d = sh - sa;
  return [poisson(clamp(1.45 * Math.exp(0.026 * d), 0.25, 4.4)), poisson(clamp(1.15 * Math.exp(-0.026 * d), 0.2, 4))];
}
function simLeagueRound(c, S, r) {
  (S.lg.rounds[r] || []).forEach(([h, a]) => {
    if (h === c.club || a === c.club) return;
    const [gh, ga] = aiScore(cs(c, h), cs(c, a));
    tApply(S.lg.table, h, a, gh, ga);
  });
}

// classement « rapide » d'un autre championnat (fin de saison)
function quickOrder(c, ids) {
  const mean = avg(ids.map((id) => cs(c, id)));
  return ids
    .map((id) => ({ id, v: (cs(c, id) - mean) * 1.15 + rnd(-9, 9) }))
    .sort((a, b) => b.v - a.v)
    .map((x) => x.id);
}

// ─── coupes nationales ───
const teamOf = (c, id) => ({ id, n: clubName(id), s: cs(c, id), fl: clubFlag(c, id) });

function cupOpp(c, d, rd, faced) {
  const myTier = LEAGUES[leagueKeyOf(c, c.club)].tier;
  const ok = (id) => id !== c.club && !(faced || []).includes(id);
  const t1 = (c.mem[d.ct + "1"] || []).filter(ok);
  const t2 = (c.mem[d.ct + "2"] || []).filter(ok);
  const f = d.R > 1 ? rd / (d.R - 1) : 1;
  const r = Math.random();
  let kind;
  if (f < 0.34) kind = myTier === 1 ? (r < 0.4 ? "am" : r < 0.8 ? "t2" : "t1") : r < 0.5 ? "am" : r < 0.85 ? "t2" : "t1";
  else if (f < 0.67) kind = myTier === 1 ? (r < 0.12 ? "am" : r < 0.35 ? "t2" : "t1") : r < 0.3 ? "t2" : "t1";
  else kind = "t1";
  if (d.key === "lc" && kind === "am") kind = "t2";
  if (kind === "t2" && !t2.length) kind = "am";
  if (kind === "am") return genAmateur();
  const pool = kind === "t1" ? t1 : t2;
  if (!pool.length) return genAmateur();
  const id = wpick(pool, (x) => Math.pow(cs(c, x) / 60, f > 0.67 ? 4 : 1));
  return teamOf(c, id);
}

// ─── compétitions continentales ───
function uefaPools(c) {
  const used = new Set();
  const out = { ucl: [], uel: [], uecl: [] };
  ["ucl", "uel", "uecl"].forEach((key, ti) => {
    PLAY_LEAGUES.forEach((k) => {
      const L = LEAGUES[k];
      if (L.conf !== "UEFA" || L.tier !== 1 || !SPOTS[k]) return;
      const n = SPOTS[k][ti] || 0;
      let got = 0;
      for (const id of c.last[k]) {
        if (got >= n) break;
        if (used.has(id)) continue;
        used.add(id); out[key].push(id); got++;
      }
    });
  });
  const stream = CLUBS.filter((x) => LEAGUES[x.l].ext && LEAGUES[x.l].conf === "UEFA").sort((a, b) => cs(c, b.id) - cs(c, a.id)).map((x) => x.id);
  for (let p = 0; p < 20; p++) {
    PLAY_LEAGUES.forEach((k) => {
      const L = LEAGUES[k];
      if (L.conf === "UEFA" && L.tier === 1 && SPOTS[k] && c.last[k][p] && !used.has(c.last[k][p])) stream.push(c.last[k][p]);
    });
  }
  ["ucl", "uel", "uecl"].forEach((key) => {
    while (out[key].length < 36 && stream.length) {
      const id = stream.shift();
      if (used.has(id)) continue;
      used.add(id); out[key].push(id);
    }
  });
  return out;
}

function contPool(c, conf) {
  const pool = [];
  PLAY_LEAGUES.forEach((k) => {
    if (LEAGUES[k].conf === conf && SPOTS[k]) pool.push(...c.last[k].slice(0, SPOTS[k][0]));
  });
  const ext = CLUBS.filter((x) => LEAGUES[x.l].ext && LEAGUES[x.l].conf === conf).sort((a, b) => cs(c, b.id) - cs(c, a.id));
  for (const x of ext) { if (pool.length >= 16) break; pool.push(x.id); }
  return pool;
}

function euroPoolFor(c) {
  const lk = leagueKeyOf(c, c.club);
  const L = LEAGUES[lk];
  if (L.tier !== 1 || !SPOTS[lk]) return null;
  if (L.conf === "UEFA") {
    const pools = uefaPools(c);
    for (const key of ["ucl", "uel", "uecl"]) if (pools[key].includes(c.club)) return { key, pool: pools[key], type: "lp" };
    return null;
  }
  const key = { CONMEBOL: "lib", AFC: "acl", CONCACAF: "ccc" }[L.conf];
  const pool = contPool(c, L.conf);
  return pool.includes(c.club) ? { key, pool, type: "ko" } : null;
}

const STAGES_LP = ["lp", "po", "r16", "qf", "sf", "f"];
const STAGES_KO = ["r16", "qf", "sf", "f"];
const EURO_WEEKS_EU = { lp: [5, 7, 10, 12, 15, 17, 22, 23], po: [25.2, 26.2], r16: [29.2, 30.2], qf: [33.2, 34.2], sf: [36.2, 37.2], f: [40.2] };
const EURO_WEEKS_KO = { r16: [17.2, 18.2], qf: [25.2, 26.2], sf: [32.2, 33.2], f: [39.2] };
// ===== END PART 04/16 =====

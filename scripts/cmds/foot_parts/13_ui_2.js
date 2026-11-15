// ===== FOOT PART 13/16 =====
function statsText(c) {
  let t = head("📈", "STATISTIQUES DE CARRIÈRE");
  const T = c.tot;
  t += `⚽ ${T.m} matchs • ${T.g} buts • ${T.a} passes décisives\n⏱️ ${T.min} min • ⭐ note moy. ${T.rn ? (T.rs / T.rn).toFixed(2) : "—"}\n`;
  t += `👑 ${T.motm} homme(s) du match • 🟨 ${T.yc} • 🟥 ${T.rc}${c.pos === "GB" || c.pos === "DC" || c.pos === "LAT" ? " • 🧱 " + T.cs + " clean sheets" : ""}\n`;
  t += `🧢 ${c.intl.caps} sélections • ${c.intl.goals} buts • ${c.intl.assists} passes\n`;
  if (c.bdHist && c.bdHist.length) {
    const best = Math.min(...c.bdHist.map((x) => x.rank));
    t += `👑 Ballon d'Or : ${c.cnt.ballon || 0} trophée(s) • meilleur classement ${ord(best)} • ${c.bdHist.filter((x) => x.rank <= 3).length} podium(s)\n`;
  }
  if (c.history.length) {
    t += `\n📅 ${bold("HISTORIQUE")}\n`;
    c.history.slice(-8).forEach((h) => (t += `${h.label} • ${h.club} • ${h.age}a • ${h.m}m ${h.g}⚽ ${h.a}🅰️ • ${h.avg}${h.pos ? " • " + ord(h.pos) : ""}${h.honors.length ? " 🏆" + h.honors.length : ""}\n`));
  }
  return t.trim();
}

function palmaresText(c) {
  let t = head("🏆", "PALMARÈS");
  if (!c.honors.length) return t + "Aucun titre pour l'instant. Continue de travailler !";
  const g = {};
  c.honors.forEach((h) => (g[h.label] = (g[h.label] || 0) + 1));
  Object.keys(g).forEach((k) => (t += `🏅 ${k}${g[k] > 1 ? " ×" + g[k] : ""}\n`));
  t += `\n📜 ${bold("DERNIERS TITRES")}\n`;
  c.honors.slice(-5).forEach((h) => (t += `${seasonLabel(h.no)} • ${h.club} • ${h.label}\n`));
  return t.trim();
}

function contractText(c) {
  const k = c.contract;
  let t = head("📃", "CONTRAT");
  t += `🏟️ ${clubName(c.club)}${c.loan ? ` (prêt — propriétaire : ${clubName(c.loan.parent)})` : ""}\n`;
  t += `💶 ${money(k.wage)}/an (${money(k.wage / 52)}/semaine)\n⏳ ${k.years} an(s) restant(s)\n`;
  t += `⚽ Prime par but : ${money(k.goalBonus || 0)}\n🔓 Clause libératoire : ${k.clause ? money(k.clause) : "aucune"}\n`;
  t += `📋 Rôle actuel : ${roleOf(c)}\n💎 Valeur marchande : ${money(marketValue(c))}`;
  if (c.sponsors.length) t += `\n\n💼 ${bold("SPONSORS")}\n` + c.sponsors.map((s) => `• ${s.brand} (${s.k}) — ${money(s.income)}/an • ${s.years} an(s)`).join("\n");
  return t;
}

function sponsorsText(c) {
  let t = head("💼", "SPONSORS");
  t += c.sponsors.length ? c.sponsors.map((s) => `✅ ${s.brand} (${s.k}) — ${money(s.income)}/an • ${s.years} an(s)`).join("\n") : "Aucun sponsor actuellement.";
  t += `\n\n${bold("OFFRES")}\n`;
  if (!c.sponsorOffers.length) t += c.rep < 15 ? "Il te faut au moins 15 de réputation pour attirer des marques." : "Aucune offre pour le moment (elles arrivent à chaque fin de saison).";
  else t += c.sponsorOffers.map((o, i) => `${i + 1}. ${o.brand} (${o.k}) — ${money(o.income)}/an • ${o.years} an(s)`).join("\n") + `\n\n📌 ${P()}foot sponsor <n°>`;
  return t;
}

function shopText(c) {
  let t = head("🛍️", "BOUTIQUE") + `💰 ${money(c.money)}\n\n`;
  SHOP.forEach((s, i) => (t += `${i + 1}. ${s.ic} ${bold(s.n)} — ${money(s.price)} ${c.items[s.id] ? "✅" : ""}\n   ${s.desc}\n`));
  return t + `\n📌 ${P()}foot acheter <n°>`;
}

function newsText(c) {
  let t = head("📰", "ACTUALITÉS");
  const list = [...c.news.slice(-8).map((n) => `${seasonLabel(n.no)} • ${n.t}`)];
  if (c.s) c.s.news.slice(-6).forEach((n) => list.push(`${c.s.label} • ${n}`));
  return t + (list.length ? list.slice(-10).join("\n") : "Rien à signaler pour le moment.");
}

function ballonText(c) {
  const S = c.s;
  if (c.level !== "pro" || !S.lg) return "👑 Le Ballon d'Or est réservé aux professionnels !";
  const st = S.st, L = LEAGUES[S.lk];
  const prog = clamp(S.idx / Math.max(1, S.cal.length), 0.08, 1);
  const avgR = st.rn ? st.rs / st.rn : 6.2;
  const k = 38 / S.lg.R;
  const score = c.ovr * 0.45 + avgR * 6 + (st.g / prog) * (c.pos === "BU" ? 0.55 : 0.8) * k + (st.a / prog) * 0.4 * k + S.honors.filter((h) => !/Meilleur|Joueur de la saison|Équipe type|Gant|Golden/.test(h)).length * 5 + (cs(c, c.club) - 70) * 0.2 + (L.tier === 1 ? L.coef * 3 : -6);
  const cands = c.stars.map((s) => ({ n: s.n, s: s.ovr * 0.45 + 7.6 * 6 + 19 * 0.6 + 7.5 * 0.4 + 7.7 + 5 + 7 })).concat([{ n: c.name, s: score, me: true }]).sort((a, b) => b.s - a.s);
  const rank = cands.findIndex((x) => x.me) + 1;
  let t = head("👑", "COURSE AU BALLON D'OR") + `📅 Saison ${S.label} • ${Math.round(prog * 100)}% jouée\n\n`;
  cands.slice(0, 5).forEach((x, i) => (t += `${i + 1}. ${x.n}${x.me ? " (toi)" : ""} — ${Math.round(x.s)} pts\n`));
  if (rank > 5) t += `…\n${rank}. ${c.name} (toi) — ${Math.round(score)} pts\n`;
  return t + `\n📍 Estimation actuelle : ${ord(rank)}\n💡 Note, buts, titres et ton niveau comptent. Les trophées européens pèsent lourd !`;
}

function offersText(c) {
  const winter = c.phase === "winter";
  let t = head(winter ? "❄️" : "📨", winter ? "OFFRES D'HIVER" : "MERCATO — OFFRES");
  t += `💎 Valeur : ${money(marketValue(c))} • 📃 ${c.contract.years > 0 ? c.contract.years + " an(s) restant(s)" : "contrat EXPIRÉ"} • ${money(c.contract.wage)}/an\n\n`;
  const ic = { renew: "🔁 Prolongation", transfer: "🆕 Transfert", free: "🆓 Libre", loan: "🔄 Prêt" };
  c.offers.forEach((o, i) => {
    const role = roleFromOvr(c.ovr, cs(c, o.club), c.rival);
    t += `${i + 1}. ${ic[o.type]} — ${bold(clubName(o.club))} ${clubFlag(c, o.club)}\n`;
    t += `   💶 ${money(o.wage)}/an • ${o.type === "loan" ? "1 an (prêt)" : o.years + " ans"} • rôle ${role} • force ${Math.round(cs(c, o.club))}`;
    if (o.fee) t += `\n   💰 Indemnité : ${money(o.fee)}`;
    if (o.bonus) t += ` • prime ${money(o.bonus)}`;
    if (o.neg) t += " • ✍️ négocié";
    t += "\n";
  });
  if (!c.offers.length) t += "Aucune offre pour le moment.\n";
  t += `\n📌 ${P()}foot accepter <n°> • negocier <n°>`;
  if (c.contract.years > 0 && !winter) t += `\n📌 ${P()}foot rester (garder ton contrat actuel)`;
  if (c.sponsorOffers && c.sponsorOffers.length && !winter) t += `\n💼 ${c.sponsorOffers.length} offre(s) de sponsors : ${P()}foot sponsors`;
  return t;
}

function topText() {
  let t = head("🏛️", "PANTHÉON DU FOOT");
  const medals = ["🥇", "🥈", "🥉"];
  t += `${bold("LÉGENDES")}\n`;
  if (!DB.hof.length) t += "Aucune légende pour l'instant.\n";
  DB.hof.slice(0, 10).forEach((h, i) => (t += `${medals[i] || i + 1 + "."} ${h.name} ${h.nat} — ${h.score} pts\n   ${h.g}⚽ ${h.a}🅰️ • 🏆${h.titles} • 👑${h.ballon} • 🧢${h.caps || 0}\n`));
  const act = Object.values(DB.players).sort((a, b) => legacy(b) - legacy(a)).slice(0, 10);
  t += `\n${bold("CARRIÈRES EN COURS")}\n`;
  if (!act.length) t += "Aucune carrière active.\n";
  act.forEach((p, i) => (t += `${medals[i] || i + 1 + "."} ${p.name} ${natOf(p).f} — ${legacy(p)} pts • ⭐${p.ovr} • ${clubName(p.club)}\n`));
  return t.trim();
}

// ─── simulation de plusieurs matchs ───
function simulate(c, opt) {
  const groups = [];
  let cur = null, stopText = "";
  const extra = [];
  const tot = { n: 0, g: 0, a: 0, V: 0, N: 0, D: 0, rs: 0, rn: 0 };
  const limit = opt.n || 300;
  let startMon = null;
  for (let i = 0; i < limit; i++) {
    if (c.phase !== "season") break;
    if (opt.mode === "mois") {
      const nx = c.s.cal[c.s.idx];
      if (nx) { const m = monthOf(nx.wk); if (!startMon) startMon = m; else if (m !== startMon) break; }
    }
    const r = playNext(c);
    if (r.line && !r.ch && !r.stop) extra.push(r.line);
    if (r.line && r.ch) {
      if (!cur || cur.mon !== r.mon) { cur = { mon: r.mon, ch: [], g: 0, a: 0, rs: 0, rn: 0 }; groups.push(cur); }
      cur.ch.push(r.ch); cur.g += r.g; cur.a += r.a;
      if (r.r != null) { cur.rs += r.r; cur.rn++; tot.rs += r.r; tot.rn++; }
      tot.n++; tot.g += r.g; tot.a += r.a; tot[r.ch]++;
    }
    if (r.ended || r.stop) { stopText = r.text; break; }
  }
  let t = head("⏩", "SIMULATION");
  groups.forEach((g) => {
    t += `📅 ${g.mon} : ${g.ch.join(" ")} • ⚽${g.g} 🅰️${g.a}${g.rn ? " • ⭐" + fmt1(g.rs / g.rn) : ""}\n`;
  });
  extra.forEach((l) => (t += `${l}\n`));
  if (!tot.n) t += "Aucun match joué.\n";
  else t += `${LINE}\n📋 ${tot.n} matchs : ${tot.V}V ${tot.N}N ${tot.D}D • ⚽ ${tot.g} • 🅰️ ${tot.a}${tot.rn ? " • ⭐ " + fmt1(tot.rs / tot.rn) : ""}\n`;
  if (stopText) t += `\n${stopText}`;
  else t += `\n📌 ${P()}foot sim pour continuer`;
  return t;
}

// ─── envoi de messages longs ───
async function sendLong(message, text) {
  const MAX = 1900;
  if (text.length <= MAX) return message.reply(text);
  const parts = [];
  let cur = "";
  text.split("\n").forEach((ln) => {
    if (cur && (cur + "\n" + ln).length > MAX) { parts.push(cur); cur = ln; }
    else cur = cur ? cur + "\n" + ln : ln;
  });
  if (cur) parts.push(cur);
  for (const p of parts) await message.reply(p);
}

// ═══════════════════════════════════════════════════════════════════════
//  CRÉATION DU JOUEUR (menus)
// ═══════════════════════════════════════════════════════════════════════
const menuNat = () => {
  let t = head("🆕", "CRÉATION — NATIONALITÉ") + "Étape 2/8 — tape le numéro ou le nom du pays :\n";
  let last = "";
  NATIONS.forEach((n, i) => {
    if (n.conf !== last) { t += `\n${bold(n.conf)}\n`; last = n.conf; }
    t += `${i + 1}. ${n.f} ${n.n}\n`;
  });
  return t.trim();
};
const menuPos = () => head("🆕", "CRÉATION — POSTE") + "Étape 3/8 — ton poste :\n" + POS_ORDER.map((k, i) => `${i + 1}. ${POS[k].ic} ${POS[k].n}`).join("\n");
const menuFoot = () => head("🆕", "CRÉATION — PIED FORT") + "Étape 4/8 :\n1. Droitier\n2. Gaucher";
const menuArch = () => head("🆕", "CRÉATION — PROFIL") + "Étape 5/8 — ton profil :\n" + Object.keys(ARCH).map((k) => `${k}. ${ARCH[k].ic} ${ARCH[k].n} — ${ARCH[k].desc}`).join("\n");
const menuLeague = () => head("🆕", "CRÉATION — CHAMPIONNAT") + "Étape 6/8 — choisis un championnat (numéro) ou tape directement le NOM d'un club :\n" + PLAY_LEAGUES.map((k, i) => `${i + 1}. ${LEAGUES[k].f} ${LEAGUES[k].n} (${RAW[k].length} clubs)`).join("\n");
const menuClubs = (lk) => head("🆕", `CRÉATION — CLUB (${LEAGUES[lk].n})`) + "Étape 7/8 — ton club formateur :\n" + CLUBS.filter((x) => x.l === lk).map((x, i) => `${i + 1}. ${x.n} (${x.s})`).join("\n");
const menuMode = (id) => head("🆕", "CRÉATION — DÉBUTS") + `Club : ${bold(clubName(id))}\nÉtape 8/8 :\n1. 🎓 Académie à 16 ans (carrière complète, plus dure)\n2. 💼 Pro dès 18 ans (niveau de départ plus élevé)`;

function findNation(q, raw) {
  const i = parseInt(raw);
  if (!isNaN(i) && String(i) === raw.trim()) return NATIONS[i - 1] || null;
  const n = norm(raw);
  if (n.length < 3) return null;
  return NATIONS.find((x) => norm(x.n) === n) || NATIONS.find((x) => norm(x.n).startsWith(n)) || NATIONS.find((x) => norm(x.n).includes(n)) || null;
}
// ===== END PART 13/16 =====

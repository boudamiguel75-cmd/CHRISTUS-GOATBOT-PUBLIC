// ===== FOOT PART 08/16 =====
function playItem(c, S, it) {
  switch (it.k) {
    // ── académie ──
    case "Y": {
      const opp = { id: it.opp, n: clubName(it.opp) + " U19", s: cs(c, it.opp) * 0.72, fl: clubFlag(c, it.opp) };
      const f = playFixture(c, { opp, home: it.home, comp: "Championnat U19", stage: `J${it.i + 1}/14`, academy: true, lgMatch: true });
      S.idx++;
      const Y = S.youth;
      if (f.res.won) Y.w++; else if (f.res.lost) Y.l++; else Y.d++;
      return packResult(c, S, f, `U19 J${it.i + 1}`, [`🎓 Bilan U19 : ${Y.w}V ${Y.d}N ${Y.l}D`], it);
    }
    // ── championnat ──
    case "L": {
      const pair = S.lg.rounds[it.r].find(([h, a]) => h === c.club || a === c.club);
      if (!pair) { simLeagueRound(c, S, it.r); S.idx++; return null; }
      const home = pair[0] === c.club;
      const oppId = home ? pair[1] : pair[0];
      const L = LEAGUES[S.lk];
      const f = playFixture(c, { opp: teamOf(c, oppId), home, comp: L.n, stage: `J${it.r + 1}/${S.lg.R}`, lgMatch: true });
      S.idx++;
      tApply(S.lg.table, pair[0], pair[1], home ? f.res.fMy : f.res.fOp, home ? f.res.fOp : f.res.fMy);
      simLeagueRound(c, S, it.r);
      const rows = standings(S.lg.table);
      const pos = rows.findIndex((r) => r.id === c.club) + 1;
      const row = rows[pos - 1];
      const gd = row.gf - row.ga;
      return packResult(c, S, f, `J${it.r + 1}`, [`📍 ${L.n} : ${ord(pos)} • ${row.pts} pts (${gd >= 0 ? "+" : ""}${gd}) • ${row.f.join(" ")}`], it);
    }
    // ── coupes nationales ──
    case "C": {
      const d = S.cupDefs.find((x) => x.key === it.ck);
      const st = S.cups[it.ck];
      if (!st || !st.alive || st.rd !== it.rd) { S.idx++; return null; }
      if (it.leg === 1) {
        st.tie = { opp: cupOpp(c, d, it.rd, st.faced), aggMy: 0, aggOpp: 0, firstHome: chance(0.5) };
        st.faced.push(st.tie.opp.id);
      }
      const tie = st.tie;
      const final = it.rd === d.R - 1;
      const ko = it.legs === 2 ? (it.leg === 1 ? "leg1" : "leg2") : "single";
      const home = final ? true : it.legs === 2 ? (it.leg === 1 ? tie.firstHome : !tie.firstHome) : tie.firstHome;
      const stageLabel = roundName(d.R, it.rd) + (it.legs === 2 ? (it.leg === 1 ? " (aller)" : " (retour)") : "");
      const f = playFixture(c, {
        opp: tie.opp, home, neutral: final, comp: d.name, stage: stageLabel, ko,
        agg: ko === "leg2" ? { my: tie.aggMy, opp: tie.aggOpp } : null, rotation: it.rd < d.R - 3
      });
      S.idx++;
      tie.aggMy += f.res.fMy;
      tie.aggOpp += f.res.fOp;
      let msg;
      if (ko === "leg1") msg = `↩️ Match retour à venir (cumul ${tie.aggMy}-${tie.aggOpp}).`;
      else {
        if (f.res.advance) {
          st.rd++;
          if (final) { st.alive = false; st.res = "vainqueur 🏆"; addHonor(c, d.key, `${d.name} 🏆`); msg = `🏆 TU REMPORTES LA ${d.name.toUpperCase()} !`; }
          else msg = `✅ Qualifié pour le tour suivant : ${roundName(d.R, it.rd + 1)}.`;
        } else {
          st.alive = false;
          st.res = `éliminé en ${roundName(d.R, it.rd).toLowerCase()}`;
          msg = `❌ Éliminé de ${d.name}.`;
        }
        st.tie = null;
      }
      return packResult(c, S, f, d.key.toUpperCase(), [msg], it);
    }
    // ── Europe / continent ──
    case "E": {
      const E = S.euro;
      if (!E || E.stage === "elim" || E.stage === "champ" || E.stage !== it.st) { S.idx++; return null; }
      if (it.st === "lp") {
        const fx = E.fx[it.md];
        if (!fx) { S.idx++; return null; }
        const f = playFixture(c, { opp: teamOf(c, fx.opp), home: fx.home, comp: `${E.name} ${E.ic}`, stage: `Phase de ligue • J${it.md + 1}/8` });
        S.idx++;
        euroMatchday(c, E, fx.opp, f.res.fMy, f.res.fOp);
        E.md++;
        const rows = standings(E.table);
        const pos = rows.findIndex((r) => r.id === c.club) + 1;
        const row = rows[pos - 1];
        const extra = [`📍 ${E.name} : ${ord(pos)}/${rows.length} • ${row.pts} pts`];
        if (E.md >= 8) {
          finishLeaguePhase(c, E);
          if (E.stage === "r16") extra.push(`✅ ${ord(E.rank)} de la phase de ligue : qualifié directement en 8es de finale !`);
          else if (E.stage === "po") extra.push(`🎟️ ${ord(E.rank)} : tu disputes les barrages.`);
          else { extra.push(`❌ ${ord(E.rank)} : éliminé dès la phase de ligue.`); E.res = "éliminé en phase de ligue"; }
        }
        return packResult(c, S, f, `${E.key.toUpperCase()} J${it.md + 1}`, extra, it);
      }
      if (!E.tie) createEuroTie(c, E);
      const tie = E.tie;
      const final = it.st === "f";
      const legs = it.legs;
      const ko = legs === 2 ? (it.leg === 1 ? "leg1" : "leg2") : "single";
      const home = final ? true : legs === 2 ? (it.leg === 1 ? tie.firstHome : !tie.firstHome) : tie.firstHome;
      const opp = teamOf(c, tie.opp);
      const f = playFixture(c, {
        opp, home, neutral: final, comp: `${E.name} ${E.ic}`, stage: STAGE_NAMES[it.st] + (legs === 2 ? (it.leg === 1 ? " (aller)" : " (retour)") : ""),
        ko, agg: ko === "leg2" ? { my: tie.aggMy, opp: tie.aggOpp } : null
      });
      S.idx++;
      tie.aggMy += f.res.fMy;
      tie.aggOpp += f.res.fOp;
      let msg;
      if (ko === "leg1") msg = `↩️ Match retour à venir (cumul ${tie.aggMy}-${tie.aggOpp}).`;
      else {
        const win = f.res.advance;
        euroAdvance(c, E, win);
        if (E.stage === "champ") { E.res = "vainqueur 🏆"; addHonor(c, E.key, `${E.name} ${E.ic}`); msg = `🏆 TU REMPORTES LA ${E.name.toUpperCase()} !!!`; }
        else if (E.stage === "elim") { E.res = `éliminé en ${STAGE_NAMES[E.outAt].toLowerCase()}`; msg = `❌ Éliminé en ${STAGE_NAMES[E.outAt].toLowerCase()}.`; }
        else msg = `✅ Qualifié : prochain tour → ${STAGE_NAMES[E.stage]}.`;
      }
      return packResult(c, S, f, E.key.toUpperCase(), [msg], it);
    }
    // ── trêve internationale ──
    case "I": {
      if (it.called === null) {
        it.called = c.level === "pro" && c.inj.left < 3 && chance(callupProb(c));
        if (!it.called) addNews(c, "📵 Tu n'es pas convoqué en sélection cette fois-ci.");
      }
      if (!it.called) { S.idx++; return null; }
      const nat = natOf(c);
      const o = intlOpp(c);
      const qual = S.cal.some((x) => x.k === "T");
      const f = playFixture(c, {
        my: { id: "nat", n: nat.n, s: nat.s, fl: nat.f }, opp: { n: o.n, s: o.s + rnd(-2, 2), fl: o.f },
        home: chance(0.5), comp: qual ? "Éliminatoires" : pick(["Ligue des Nations", "Match amical"]), stage: "Sélection nationale", isNat: true
      });
      it.p++;
      if (it.p >= 2) S.idx++;
      const extra = it.p === 1 ? ["📞 Tu as été convoqué avec " + nat.f + " " + nat.n + " !"] : [];
      extra.push(`🧢 Sélections : ${c.intl.caps} • Buts : ${c.intl.goals}`);
      const r = packResult(c, S, f, "🌍", extra, it);
      return r;
    }
    // ── mercato d'hiver ──
    case "W": {
      S.idx++;
      c.phase = "winter";
      c.offers = genOffers(c, "winter");
      return { text: `${head("❄️", "MERCATO D'HIVER")}Le mois de janvier est là : le marché des transferts rouvre !\n\n${offersText(c)}\n\n📌 ${P()}foot continuer — poursuivre la saison sans bouger`, line: "❄️ Mercato d'hiver ouvert", mon: "Janvier", stop: true };
    }
    // ── grand tournoi ──
    case "T": {
      if (!S.tour) {
        S.tour = setupTournament(c, it.kind);
        const T = S.tour;
        if (!T.alive) {
          S.idx++;
          const why = { nq: `${natOf(c).f} ${natOf(c).n} ne s'est pas qualifié pour le tournoi.`, inj: "Tu es forfait pour le tournoi (blessure).", ns: "Tu n'as pas été retenu dans la liste finale." }[T.res];
          addNews(c, `❌ ${T.name} : ${why}`);
          return { text: `${head(T.ic, T.name.toUpperCase())}${why}`, line: `${T.ic} ${T.name} : ${why}`, mon: "Juin", stop: false };
        }
        const nat = natOf(c);
        return {
          text: `${head(T.ic, T.name.toUpperCase())}🎉 ${nat.f} ${bold(nat.n)} est qualifié et tu fais partie des 26 !\n🧢 Groupe : ${T.opps.map((n) => natByName(n).f + " " + n).join(", ")}\n\n📌 ${P()}foot match — lancer le tournoi`,
          line: `${T.ic} ${T.name} : tu es sélectionné !`, mon: "Juin", stop: true
        };
      }
      const T = S.tour;
      if (!T.alive) { S.idx++; return null; }
      return playTourMatch(c, S, it);
    }
  }
  S.idx++;
  return null;
}

function playTourMatch(c, S, it) {
  const T = S.tour, nat = natOf(c);
  let opp, stageLabel, ko = "none";
  if (T.stage === "g") { opp = natByName(T.opps[T.gi]); stageLabel = `Groupe • match ${T.gi + 1}/3`; }
  else { opp = tourKnockoutOpp(c, T); stageLabel = KO_LABEL[T.stage]; ko = "single"; }
  const f = playFixture(c, {
    my: { id: "nat", n: nat.n, s: nat.s, fl: nat.f }, opp: { n: opp.n, s: opp.s + (T.stage === "g" ? 0 : rnd(-1, 3)), fl: opp.f },
    home: false, neutral: true, comp: `${T.name} ${T.ic}`, stage: stageLabel, isNat: true, ko
  });
  const res = f.res;
  const extra = [];
  T.last = opp.n;
  if (T.stage === "g") {
    T.gi++;
    T.pts += res.fMy > res.fOp ? 3 : res.fMy === res.fOp ? 1 : 0;
    if (T.gi >= 3) {
      const ok = T.pts >= 4 || (T.pts === 3 && chance(0.5));
      if (ok) { T.stage = T.ko[0]; extra.push(`✅ Groupe terminé avec ${T.pts} pts : qualifié pour les ${KO_LABEL[T.stage].toLowerCase()} !`); }
      else { T.alive = false; T.res = "groupe"; T.champ = tourPickChampion(c, T, false); extra.push(`❌ Groupe terminé avec ${T.pts} pts : éliminé.`); }
    } else extra.push(`📈 Points : ${T.pts}`);
  } else if (res.advance) {
    const i = T.ko.indexOf(T.stage);
    if (T.stage === "F") {
      T.alive = false; T.res = "champion"; T.champ = natOf(c).n;
      addHonor(c, T.kind === "WC" ? "mondial" : "continental", `${T.name} ${T.ic}`);
      extra.push(`🏆 ${bold("CHAMPION !")} ${nat.f} ${nat.n} remporte ${T.kind === "WC" ? "la" : "le"} ${T.name} !`);
    } else { T.stage = T.ko[i + 1]; extra.push(`✅ Qualifié pour les ${KO_LABEL[T.stage].toLowerCase()}.`); }
  } else {
    T.alive = false;
    T.res = T.stage === "F" ? "finale" : KO_LABEL[T.stage].toLowerCase();
    T.champ = tourPickChampion(c, T, false);
    extra.push(T.stage === "F" ? "🥈 Finaliste malheureux..." : `❌ Éliminé en ${KO_LABEL[T.stage].toLowerCase()}.`);
  }
  extra.push(`🧢 Sélections : ${c.intl.caps} • Buts : ${c.intl.goals}`);
  S.news.push(`${T.ic} ${T.name} : ${stageLabel} vs ${opp.n} ${res.fMy}-${res.fOp}.`);
  return packResult(c, S, f, T.ic, extra, it);
}
// ===== END PART 08/16 =====

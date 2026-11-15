// ===== FOOT PART 16/16 =====
async function footOnChat ({ event, message, usersData }) {
    const uid = event.senderID;
    const raw = String(event.body || "").trim();
    if (!raw || isCmdCall(raw)) return;
    const reply = (t) => sendLong(message, t);
    const s = sessions[uid];

    // réponse rapide à un événement en attente (1, 2 ou 3)
    if (!s) {
      const c0 = DB.players[uid];
      if (c0 && c0.pending && /^[1-3]$/.test(raw)) {
        const t = resolveEvent(c0, parseInt(raw) - 1, false);
        saveDB();
        return reply(t);
      }
      return;
    }
    if (event.messageID && s.armed === event.messageID) return;
    const body = norm(raw);

    if (body === "annuler" || body === "cancel") {
      delete sessions[uid];
      return reply("🚪 Action annulée.");
    }

    // ─── confirmations ───
    if (s.type === "confirm") {
      const c = DB.players[uid];
      if (!c) { delete sessions[uid]; return; }
      if (["oui", "o", "yes"].includes(body)) {
        delete sessions[uid];
        if (s.action === "retire") return reply(retireCareer(c, false));
        delete DB.players[uid];
        saveDB();
        return reply("🗑️ Carrière supprimée. Tape foot creer pour repartir de zéro.");
      }
      if (["non", "n", "no"].includes(body)) { delete sessions[uid]; return reply("👍 Annulé, ta carrière continue."); }
      return;
    }

    // ─── tirs au but ───
    if (s.type === "pen") {
      const c = DB.players[uid];
      if (!c) { delete sessions[uid]; return; }
      const map = { 1: "G", g: "G", gauche: "G", 2: "C", c: "C", centre: "C", 3: "D", d: "D", droite: "D" };
      const shot = map[body];
      if (!shot) return reply("❌ Réponds par 1 (gauche), 2 (centre) ou 3 (droite).");
      const keeper = pick(["G", "C", "D"]);
      const names = { G: "à gauche", C: "au centre", D: "à droite" };
      const sk = c.a.pen;
      let out;
      if (keeper === shot) {
        if (chance(clamp(0.65 - (sk - 60) / 300, 0.35, 0.8))) out = `🧤 Arrêt ! Le gardien plonge ${names[keeper]} et repousse !`;
        else { s.score++; out = `⚽ BUT ! Le gardien devine ${names[keeper]} mais ta frappe est trop puissante !`; }
      } else if (chance(clamp(0.88 + (sk - 60) / 500, 0.7, 0.96))) { s.score++; out = `⚽ BUT ! Gardien parti ${names[keeper]}, tu frappes ${names[shot]} !`; }
      else out = "😬 Tir à côté ! Quelle occasion gâchée.";
      if (s.round >= 5) {
        const reward = Math.round(s.score * 60000 * (1 + c.rep / 100));
        c.money += reward;
        c.lastPen = Date.now();
        delete sessions[uid];
        saveDB();
        return reply(`${out}\n\n🏁 ${bold("FIN DE LA SÉRIE")} : ${s.score}/5\n💰 Gain : ${money(reward)}\n💼 Solde : ${money(c.money)}`);
      }
      s.round++;
      return reply(`${out}\n\n📊 Score : ${s.score}\n🎯 Tir ${s.round}/5 — 1 = Gauche • 2 = Centre • 3 = Droite`);
    }

    // ─── création ───
    if (s.type === "create") {
      const d = s.data;
      if (s.step === "name") {
        let name = raw.replace(/\s+/g, " ").slice(0, 24);
        if (body === "moi") {
          try { const u = await usersData.get(uid); name = (u && u.name) || "Joueur"; } catch (e) { name = "Joueur"; }
        }
        if (name.length < 2) return reply("❌ Le nom doit contenir au moins 2 caractères.");
        d.name = name;
        s.step = "nat";
        return reply(`✅ Nom : ${bold(name)}\n\n${menuNat()}`);
      }
      if (s.step === "nat") {
        const n = findNation(body, raw);
        if (!n) return reply("❌ Pays introuvable. Tape un numéro de la liste ou le nom du pays.");
        d.nat = NATIONS.indexOf(n);
        s.step = "pos";
        return reply(`✅ Nationalité : ${n.f} ${n.n}\n\n${menuPos()}`);
      }
      if (s.step === "pos") {
        const i = parseInt(body);
        if (isNaN(i) || i < 1 || i > POS_ORDER.length) return reply(`❌ Choisis un numéro entre 1 et ${POS_ORDER.length}.`);
        d.pos = POS_ORDER[i - 1];
        s.step = "foot";
        return reply(`✅ Poste : ${POS[d.pos].n}\n\n${menuFoot()}`);
      }
      if (s.step === "foot") {
        if (body !== "1" && body !== "2") return reply("❌ Réponds 1 (droitier) ou 2 (gaucher).");
        d.foot = body === "1" ? "d" : "g";
        s.step = "arch";
        return reply(`✅ Pied fort : ${body === "1" ? "droit" : "gauche"}\n\n${menuArch()}`);
      }
      if (s.step === "arch") {
        const i = parseInt(body);
        if (isNaN(i) || !ARCH[i]) return reply("❌ Choisis un numéro entre 1 et 5.");
        d.arch = i;
        s.step = "league";
        return reply(`✅ Profil : ${ARCH[i].ic} ${ARCH[i].n}\n\n${menuLeague()}`);
      }
      if (s.step === "league") {
        const i = parseInt(body);
        if (!isNaN(i) && String(i) === body) {
          if (i < 1 || i > PLAY_LEAGUES.length) return reply(`❌ Choisis un numéro entre 1 et ${PLAY_LEAGUES.length}.`);
          s.lk = PLAY_LEAGUES[i - 1];
          s.step = "club";
          return reply(menuClubs(s.lk));
        }
        const hits = CLUBS.filter((x) => !LEAGUES[x.l].ext && norm(x.n).includes(body));
        if (!hits.length) return reply("❌ Aucun club trouvé. Tape un numéro de championnat ou un autre nom de club.");
        if (hits.length === 1) { d.club = hits[0].id; s.step = "mode"; return reply(menuMode(d.club)); }
        s.matches = hits.slice(0, 12).map((x) => x.id);
        s.step = "clubmatch";
        return reply(head("🔎", "CLUBS TROUVÉS") + s.matches.map((id, k) => `${k + 1}. ${clubName(id)} ${LEAGUES[CLUB_MAP[id].l].f}`).join("\n") + "\n\nChoisis un numéro.");
      }
      if (s.step === "clubmatch") {
        const i = parseInt(body);
        if (isNaN(i) || i < 1 || i > s.matches.length) return reply(`❌ Choisis un numéro entre 1 et ${s.matches.length}.`);
        d.club = s.matches[i - 1];
        s.step = "mode";
        return reply(menuMode(d.club));
      }
      if (s.step === "club") {
        const list = CLUBS.filter((x) => x.l === s.lk);
        const i = parseInt(body);
        if (isNaN(i) || i < 1 || i > list.length) return reply(`❌ Choisis un numéro entre 1 et ${list.length}.`);
        d.club = list[i - 1].id;
        s.step = "mode";
        return reply(menuMode(d.club));
      }
      if (s.step === "mode") {
        if (body !== "1" && body !== "2") return reply("❌ Réponds 1 (académie) ou 2 (pro dès 18 ans).");
        d.mode = body === "1" ? "academy" : "pro";
        delete sessions[uid];
        if (DB.players[uid]) return reply("⚠️ Tu as déjà une carrière.");
        const c = createCareer(uid, d);
        return reply(introText(c));
      }
    }
}

module.exports = { config: FOOT_CONFIG, onStart: footOnStart, onChat: footOnChat };
// ===== END PART 16/16 =====

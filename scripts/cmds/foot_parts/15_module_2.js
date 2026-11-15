// ===== FOOT PART 15/16 =====
async function footOnStart ({ message, event, args, usersData }) {
    const uid = event.senderID;
    delete sessions[uid];
    const reply = (t) => sendLong(message, t);
    const c = DB.players[uid];
    const sub = norm(args[0] || "aide");
    const rest = args.slice(1);
    const need = () => reply(noCareer());
    const phaseMsg = () => {
      if (c.phase === "window") return `📨 Le mercato est ouvert !\n📌 ${P()}foot offres puis ${P()}foot accepter <n°>`;
      if (c.phase === "winter") return `❄️ Mercato d'hiver ouvert !\n📌 ${P()}foot offres, ${P()}foot accepter <n°> ou ${P()}foot continuer`;
      return null;
    };

    switch (sub) {
      case "aide": case "help": case "menu": case "commandes":
        return reply(helpText());

      case "creer": case "create": case "new": case "start": case "nouvelle": {
        if (c) return reply(`⚠️ Tu as déjà une carrière (${c.name}).\n📌 ${P()}foot supprimer pour recommencer.`);
        sessions[uid] = { type: "create", step: "name", data: {}, armed: event.messageID };
        return reply(head("🆕", "CRÉATION DU JOUEUR") + "Étape 1/8 — Quel est le nom de ton joueur ?\n(tape « moi » pour utiliser ton pseudo, « annuler » pour quitter)");
      }

      case "profil": case "p": case "joueur":
        return c ? reply(profileText(c)) : need();
      case "attributs": case "attr": case "competences": case "stat": case "qualites":
        return c ? reply(attrsText(c)) : need();

      case "match": case "m": case "jouer": case "play": {
        if (!c) return need();
        const pm = phaseMsg();
        if (pm) return reply(pm);
        const r = playNext(c);
        saveDB();
        return reply(r.text);
      }

      case "sim": case "simuler": {
        if (!c) return need();
        const pm = phaseMsg();
        if (pm) return reply(pm);
        const a = norm(rest[0] || "");
        const opt = /^\d+$/.test(a) ? { n: clamp(parseInt(a), 1, 300) } : a === "mois" ? { mode: "mois" } : {};
        const t = simulate(c, opt);
        saveDB();
        return reply(t);
      }

      case "continuer": case "continue": case "reprendre": {
        if (!c) return need();
        if (c.phase !== "winter") return reply(c.phase === "window" ? `📨 Le mercato d'été est ouvert : ${P()}foot offres` : "▶️ Rien à reprendre : tu es en pleine saison !");
        c.phase = "season";
        c.offers = [];
        saveDB();
        return reply(`▶️ Tu restes dans ton club et la saison reprend !\n📌 ${P()}foot match`);
      }

      case "calendrier": case "cal": case "agenda":
        if (!c) return need();
        return reply(c.phase === "season" ? calText(c) : "📨 Le mercato est ouvert : la saison n'a pas encore repris.");
      case "classement": case "table": case "ligue": case "cl":
        if (!c) return need();
        return reply(c.phase === "season" ? tableText(c) : "📨 Le mercato est ouvert : la saison n'a pas encore repris.");
      case "europe": case "euro": case "ldc":
        if (!c) return need();
        return reply(euroText(c));
      case "coupe": case "coupes": case "cup":
        if (!c) return need();
        return reply(cupText(c));
      case "ballondor": case "ballon": case "bd":
        return c ? reply(ballonText(c)) : need();
      case "stats": case "carriere": case "bilan":
        return c ? reply(statsText(c)) : need();
      case "palmares": case "trophees": case "titres":
        return c ? reply(palmaresText(c)) : need();
      case "actu": case "news": case "journal":
        return c ? reply(newsText(c)) : need();
      case "contrat":
        return c ? reply(contractText(c)) : need();

      case "entrainer": case "entrainement": case "train": case "t": {
        if (!c) return need();
        const key = resolveTrain(rest.join(" "), c.pos);
        if (!key) return reply(`❌ Attribut inconnu.\n📌 ${P()}foot entrainer <attribut ou catégorie : vit, tir, pas, tech, def, phy>\n🏋️ Séances : ${Math.floor(c.tokens)}`);
        const t = train(c, key);
        saveDB();
        return reply(t);
      }

      case "focus": {
        if (!c) return need();
        const m = { vit: "VIT", vitesse: "VIT", tir: "TIR", pas: "PAS", passes: "PAS", tech: "DRI", technique: "DRI", def: "DEF", defense: "DEF", phy: "PHY", physique: "PHY", gk: "GK", gardien: "GK", aucun: null, off: null };
        const k = norm(rest[0]);
        if (!(k in m)) return reply(`🎯 Focus actuel : ${c.focus ? CATS[c.focus] : "aucun"}\n📌 ${P()}foot focus <vit|tir|pas|tech|def|phy|aucun>\nLe focus accélère la progression de la catégorie choisie en fin de saison.`);
        c.focus = m[k];
        saveDB();
        return reply(c.focus ? `🎯 Focus d'entraînement : ${bold(CATS[c.focus])}. Tes progrès dans cette catégorie seront accélérés.` : "🎯 Focus désactivé.");
      }

      case "offres": case "mercato": case "transferts":
        if (!c) return need();
        if (c.phase === "season") return reply("📨 Le mercato est fermé : il ouvre en janvier et en fin de saison.");
        return reply(offersText(c));

      case "accepter": case "signer": {
        if (!c) return need();
        if (c.phase === "season") return reply("📨 Le mercato est fermé.");
        const n = parseInt(rest[0]);
        if (isNaN(n) || n < 1 || n > c.offers.length) return reply(`❌ Numéro invalide (1 à ${c.offers.length}).`);
        const o = c.offers[n - 1];
        const r = acceptOffer(c, o);
        if (!r.ok) { saveDB(); return reply(r.text); }
        const wasWinter = c.phase === "winter";
        if (wasWinter) { if (r.moved) winterMove(c); else { c.phase = "season"; c.offers = []; } }
        else startNextSeason(c);
        saveDB();
        return reply(`${r.text}\n\n🌅 ${bold(wasWinter ? "LA SAISON CONTINUE" : "SAISON " + c.s.label)} — ${P()}foot match pour jouer !`);
      }

      case "negocier": case "negociation": {
        if (!c) return need();
        if (c.phase === "season") return reply("📨 Le mercato est fermé.");
        const n = parseInt(rest[0]);
        if (isNaN(n) || n < 1 || n > c.offers.length) return reply(`❌ Numéro invalide (1 à ${c.offers.length}).`);
        const msg = negotiateOffer(c, c.offers[n - 1]);
        c.offers = c.offers.filter((o) => !o.withdrawn);
        saveDB();
        return reply(msg + "\n\n" + offersText(c));
      }

      case "rester": {
        if (!c) return need();
        if (c.phase === "season") return reply("📨 Le mercato est fermé.");
        if (c.phase === "winter") { c.phase = "season"; c.offers = []; saveDB(); return reply("▶️ Tu restes et la saison reprend !"); }
        const o = c.offers.find((x) => x.type === "renew");
        if (o) { const r = acceptOffer(c, o); startNextSeason(c); saveDB(); return reply(`${r.text}\n\n🌅 ${bold("SAISON " + c.s.label)} — ${P()}foot match pour jouer !`); }
        if (c.contract.years > 0) { startNextSeason(c); saveDB(); return reply(`🔁 Tu gardes ton contrat à ${bold(clubName(c.club))}.\n\n🌅 ${bold("SAISON " + c.s.label)} — ${P()}foot match pour jouer !`); }
        return reply("❌ Ton club ne propose pas de prolongation. Choisis une autre offre.");
      }

      case "prolonger": case "prolongation": {
        if (!c) return need();
        if (c.phase !== "season") return reply("📨 Utilise plutôt les offres du mercato.");
        const t = renewMidSeason(c);
        saveDB();
        return reply(t);
      }

      case "demander": case "transfert": case "depart": {
        if (!c) return need();
        const t = requestTransfer(c);
        saveDB();
        return reply(t);
      }

      case "sponsors": case "sponsor": {
        if (!c) return need();
        if (sub === "sponsor" && rest[0]) {
          const t = acceptSponsor(c, parseInt(rest[0]) - 1);
          saveDB();
          return reply(t);
        }
        return reply(sponsorsText(c));
      }

      case "boutique": case "shop": case "magasin":
        return c ? reply(shopText(c)) : need();

      case "acheter": case "achat": case "buy": {
        if (!c) return need();
        const n = parseInt(rest[0]);
        if (isNaN(n) || n < 1 || n > SHOP.length) return reply(`❌ Numéro invalide (1 à ${SHOP.length}).`);
        const it = SHOP[n - 1];
        if (c.items[it.id]) return reply("✅ Tu possèdes déjà cet objet.");
        if (c.money < it.price) return reply(`❌ Fonds insuffisants : il te manque ${money(it.price - c.money)}.`);
        c.money -= it.price;
        c.items[it.id] = true;
        if (it.id === "villa") c.morale = clamp(c.morale + 8, 5, 100);
        if (it.id === "car") c.rep = clamp(c.rep + 4, 0, 100);
        if (it.id === "found") { c.rep = clamp(c.rep + 8, 0, 100); c.fans = clamp(c.fans + 10, 0, 100); }
        saveDB();
        return reply(`🛍️ ${it.ic} ${bold(it.n)} acheté pour ${money(it.price)} !\n${it.desc}\n💰 Solde : ${money(c.money)}`);
      }

      case "choix": case "choisir": case "event": {
        if (!c) return need();
        if (!c.pending) return reply("🎭 Aucun événement en attente.");
        const t = resolveEvent(c, parseInt(rest[0]) - 1 || 0, false);
        saveDB();
        return reply(t);
      }

      case "penalty": case "penalties": case "pen": {
        if (!c) return need();
        const wait = c.lastPen + 3 * 60 * 1000 - Date.now();
        if (wait > 0) return reply(`⏳ Reviens dans ${Math.ceil(wait / 60000)} min pour une nouvelle séance de tirs au but.`);
        sessions[uid] = { type: "pen", round: 1, score: 0, armed: event.messageID };
        return reply(head("🥅", "TIRS AU BUT") + "5 tirs face au gardien.\nChoisis ta zone : 1 = Gauche • 2 = Centre • 3 = Droite\n\n🎯 Tir 1/5 — où tires-tu ?");
      }

      case "daily": case "bonus": case "quotidien": {
        if (!c) return need();
        const wait = c.lastDaily + 20 * 60 * 60 * 1000 - Date.now();
        if (wait > 0) return reply(`⏳ Bonus déjà récupéré. Reviens dans ${Math.ceil(wait / 3600000)} h.`);
        const gain = 50000 + c.ovr * 1500;
        c.money += gain;
        c.tokens = Math.min(6, c.tokens + 2);
        c.form = clamp(c.form + 8, 5, 100);
        c.fit = clamp(c.fit + 10, 0, 100);
        c.lastDaily = Date.now();
        saveDB();
        return reply(`🎁 ${bold("BONUS QUOTIDIEN")}\n💰 +${money(gain)}\n🏋️ +2 séances (${Math.floor(c.tokens)})\n🔥 +8 forme • 🔋 +10 fraîcheur`);
      }

      case "top": case "pantheon": case "legendes":
        return reply(topText());

      case "retraite": case "retire": {
        if (!c) return need();
        if (c.age < 32) return reply(`❌ Trop jeune pour raccrocher (32 ans minimum, tu en as ${c.age}).`);
        sessions[uid] = { type: "confirm", action: "retire", armed: event.messageID };
        return reply(`🎖️ Prendre ta retraite à ${c.age} ans ? C'est définitif.\nRéponds « oui » pour confirmer ou « non » pour annuler.`);
      }

      case "supprimer": case "reset": case "delete": {
        if (!c) return need();
        sessions[uid] = { type: "confirm", action: "delete", armed: event.messageID };
        return reply(`⚠️ Supprimer définitivement la carrière de ${c.name} ? (aucune entrée au Panthéon)\nRéponds « oui » pour confirmer ou « non » pour annuler.`);
      }

      default:
        return reply(`❌ Commande inconnue.\n📌 ${P()}foot aide pour la liste complète.`);
    }
}
// ===== END PART 15/16 =====

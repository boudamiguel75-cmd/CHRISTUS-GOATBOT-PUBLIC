/**
 * @author Master Charbel
 * Commande « foot » — carrière de footballeur (version découpée en plusieurs fichiers).
 *
 * Ce fichier assemble automatiquement les morceaux du dossier foot_parts/ quand le bot démarre.
 * Installation : mets ce fichier ET le dossier foot_parts/ (tous les fichiers) côte à côte, dans scripts/cmds/ :
 *     scripts/cmds/foot.js
 *     scripts/cmds/foot_parts/01_core.js ... 16_module_3.js  (les 16 fichiers)
 * Chaque morceau commence par « FOOT PART NN/TT » et finit par « END PART NN/TT » :
 * si une copie est interrompue ou si un fichier manque, le bot affiche une erreur claire.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DIR = path.join(__dirname, "foot_parts");
const START = /^\/\/ ===== FOOT PART (\d+)\/(\d+) =====\s*$/;
const END = /^\/\/ ===== END PART (\d+)\/(\d+) =====\s*$/;

function assemble() {
	if (!fs.existsSync(DIR))
		throw new Error(`[foot] Dossier manquant : ${DIR}`);
	const files = fs.readdirSync(DIR).filter(f => /^\d+.*\.js$/.test(f)).sort();
	if (!files.length)
		throw new Error("[foot] Aucun fichier dans foot_parts/");

	const parts = files.map(f => {
		const text = fs.readFileSync(path.join(DIR, f), "utf8");
		const lines = text.replace(/\s+$/, "").split("\n");
		const a = START.exec(lines[0]);
		const b = END.exec(lines[lines.length - 1]);
		if (!a)
			throw new Error(`[foot] ${f} : la première ligne est absente ou modifiée (copie incomplète ?)`);
		if (!b)
			throw new Error(`[foot] ${f} : fichier incomplet, la fin est manquante. Recopie-le en entier.`);
		if (a[1] !== b[1] || a[2] !== b[2])
			throw new Error(`[foot] ${f} : marqueurs de début et de fin incohérents`);
		return { f, i: Number(a[1]), total: Number(a[2]), text };
	});

	const total = parts[0].total;
	if (parts.some(p => p.total !== total))
		throw new Error("[foot] Des fichiers de foot_parts/ viennent de versions différentes");
	for (let i = 1; i <= total; i++) {
		const n = parts.filter(p => p.i === i).length;
		if (n === 0)
			throw new Error(`[foot] Partie ${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")} manquante dans foot_parts/ (il faut les ${total} fichiers)`);
		if (n > 1)
			throw new Error(`[foot] La partie ${String(i).padStart(2, "0")} existe en double dans foot_parts/`);
	}

	parts.sort((x, y) => x.i - y.i);
	const code = parts.map(p => p.text).join("\n");
	// toutes les parties partagent la même portée, comme dans un fichier unique
	const fn = vm.compileFunction(code, ["require", "module", "exports", "__dirname", "__filename"], {
		filename: path.join(DIR, "foot.assemble.js")
	});
	const mod = { exports: {} };
	fn(require, mod, mod.exports, __dirname, __filename);
	return mod.exports;
}

module.exports = assemble();

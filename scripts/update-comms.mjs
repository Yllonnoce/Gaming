#!/usr/bin/env node
/**
 * Fetch VDO.Ninja's Comms app and write a lightly patched copy to
 * public/comms.html, which is what Noisy Room opens.
 *
 * Comms is a single HTML file that wraps VDO.Ninja in an iframe and draws the
 * group buttons itself. Hosting our own copy lets us change the one thing it
 * has no switch for -- the "group: " prefix on every button -- and pin the
 * version we've tested. Everything else (assets, the audio engine) still
 * comes from vdo.ninja.
 *
 * Every replacement must match exactly the number of times it did when the
 * patch was written, so an upstream change that moves the code fails loudly
 * here instead of silently shipping a half-patched page.
 *
 *   npm run update-comms
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UPSTREAM = "https://vdo.ninja/comms.html";
const ORIGIN = "https://vdo.ninja";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/comms.html");

/** [find, replace, expected count, why] */
const PATCHES = [
  // Assets are referenced relative to vdo.ninja; point them back there.
  ['"./thirdparty/', `"${ORIGIN}/thirdparty/`, 3, "script and stylesheet paths"],
  ['"./media/', `"${ORIGIN}/media/`, 5, "icon paths"],
  // When not served from comms.cam, Comms loads the audio engine from
  // ./index.html, which does not exist here. Send both branches to vdo.ninja.
  ['"./index.html?"', `"${ORIGIN}/?"`, 1, "iframe source when self-hosted"],
  // The change we host a copy for: buttons read "Table", not "group: Table".
  ['name.innerHTML = "group: "+groupID;', "name.innerHTML = groupID;", 1, "button label"],
  ['name.innerHTML = "group: "+nn;', "name.innerHTML = nn;", 1, "button label after rename"],
  ['"<br /><small>group: "+groupID+"</small>"', '"<br /><small>"+groupID+"</small>"', 2, "aliased button's small print"],
  ["<title>Comms app</title>", "<title>Noisy Room · audio</title>", 1, "tab title"],
];

const response = await fetch(UPSTREAM);
if (!response.ok) throw new Error(`${UPSTREAM} responded ${response.status}`);
let html = await response.text();

for (const [find, replace, expected, why] of PATCHES) {
  const count = html.split(find).length - 1;
  if (count !== expected) {
    throw new Error(
      `Patch "${why}" expected ${expected} match(es) for ${JSON.stringify(find)} but found ${count}. ` +
        "Upstream Comms has changed; review the patch list before updating.",
    );
  }
  html = html.split(find).join(replace);
}

/**
 * Comms is AGPL-3.0 (https://github.com/steveseguin/vdo.ninja/blob/master/LICENCE.md),
 * which requires modified copies served to users to be publicly available.
 * This file *is* the source, and the patch list above is the modification;
 * both live in this repository. The notice below says so to anyone who views
 * the page's source.
 */
const banner =
  `<!--\n  VDO.Ninja Comms (${UPSTREAM}), copyright Stephen Seguin, licensed AGPL-3.0:\n` +
  `  https://github.com/steveseguin/vdo.ninja/blob/master/LICENCE.md\n` +
  `  Modified for Game Night by scripts/update-comms.mjs on ${new Date().toISOString().slice(0, 10)}\n` +
  `  (button labels, asset paths, title). The patch list and this copy are in the\n` +
  `  Game Night repository alongside this file.\n` +
  `  Do not edit by hand: re-run "npm run update-comms" and adjust the patch list there instead.\n-->\n`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, banner + html);
console.log(`wrote ${OUT} (${html.length} bytes, ${PATCHES.length} patches applied)`);

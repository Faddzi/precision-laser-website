// Trims the icon fonts to the glyphs the site uses (output: fonts/web/*.woff2).
// Re-run this after adding a NEW icon class to a page: add its class name to the list below.
// Source fonts live in _legacy/fonts (full sets).  Run:  cd tools && npm install && npm run icons
import subsetFont from "subset-font";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const css = (f) => readFileSync(root + f, "utf8");
const faCss = css("src/css/font-awesome.min.css"), tiCss = css("src/css/themify-icons.css"), etCss = css("src/css/et-line-icons.css");

const BS = String.fromCharCode(92); // backslash
function codepoint(cssText, cls) {
  const marker = "." + cls + ":before";
  const at = cssText.indexOf(marker);
  if (at < 0) throw new Error("no rule for " + cls);
  const block = cssText.slice(at, cssText.indexOf("}", at));
  const i = block.indexOf("content");
  const q = block.indexOf(BS, i);
  return parseInt(block.slice(q + 1).match(/^[0-9a-fA-F]+/)[0], 16);
}
const sets = {
  "fa-solid-900.woff2": { out: "fa-solid.woff2", src: faCss, cls: ["fa-angle-down", "fa-angle-up", "fa-crosshairs", "fa-envelope", "fa-file-invoice-dollar", "fa-map-marker-alt", "fa-phone", "fa-play-circle", "fa-trophy"] },
  "fa-regular-400.woff2": { out: "fa-regular.woff2", src: faCss, cls: ["fa-clock"] },
  "fa-brands-400.woff2": { out: "fa-brands.woff2", src: faCss, cls: ["fa-facebook-f", "fa-instagram", "fa-twitter", "fa-whatsapp"] },
  "themify.woff": { out: "themify.woff2", src: tiCss, cls: ["ti-arrow-left", "ti-arrow-right", "ti-arrow-up", "ti-zoom-in"] },
  "et-line.woff": { out: "et-line.woff2", src: etCss, cls: ["icon-chat", "icon-envelope", "icon-map-pin", "icon-megaphone"] },
};
for (const [file, s] of Object.entries(sets)) {
  const cps = s.cls.map((c) => codepoint(s.src, c));
  const buf = readFileSync(root + "_legacy/fonts/" + file);
  const out = await subsetFont(buf, String.fromCodePoint(...cps), { targetFormat: "woff2" });
  writeFileSync(root + "fonts/web/" + s.out, out);
  console.log(file.padEnd(22), (buf.length / 1024).toFixed(1).padStart(6) + "KB ->", String(out.length).padStart(5) + " bytes");
}

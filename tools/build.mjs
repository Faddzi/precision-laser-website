// Builds the files the website actually loads:
//   css/site.min.css       theme CSS + src/css/plcs.css   (unused rules removed, minified)
//   css/responsive.min.css src/css/responsive.css         (unused rules removed, minified)
//   js/site.min.js         src/js/site.js                 (minified)
// css/customstyle.css is NOT built - it is loaded as-is, so small style edits need no build.
// Run:  cd tools && npm install && npm run build
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PurgeCSS } from "purgecss";
import { minify as minifyCss } from "csso";
import { minify as minifyJs } from "terser";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (f) => readFileSync(root + f, "utf8");
const kb = (n) => (n / 1024).toFixed(1) + "KB";
const pages = readdirSync(root).filter((f) => f.endsWith(".html")).map((f) => root + f);

// Icon fonts: point @font-face at the subset files (only the icons the site uses; see subset_icons.mjs).
const ICON_FONTS = [
  [/@font-face\{font-family:"Font Awesome 5 Brands"[^}]*\}/, '@font-face{font-family:"Font Awesome 5 Brands";font-style:normal;font-weight:400;font-display:block;src:url(../fonts/web/fa-brands.woff2) format("woff2")}'],
  [/@font-face\{font-family:"Font Awesome 5 Free";font-style:normal;font-weight:400[^}]*\}/, '@font-face{font-family:"Font Awesome 5 Free";font-style:normal;font-weight:400;font-display:block;src:url(../fonts/web/fa-regular.woff2) format("woff2")}'],
  [/@font-face\{font-family:"Font Awesome 5 Free";font-style:normal;font-weight:900[^}]*\}/, '@font-face{font-family:"Font Awesome 5 Free";font-style:normal;font-weight:900;font-display:block;src:url(../fonts/web/fa-solid.woff2) format("woff2")}'],
  [/@font-face\s*\{\s*font-family:\s*'themify';[^}]*\}/, "@font-face{font-family:'themify';font-weight:normal;font-style:normal;font-display:block;src:url(../fonts/web/themify.woff2) format('woff2')}"],
  [/@font-face\s*\{\s*font-family:\s*'et-line';[^}]*\}/, "@font-face{font-family:'et-line';font-weight:normal;font-style:normal;font-display:block;src:url(../fonts/web/et-line.woff2) format('woff2')}"],
];

const SAFELIST = {
  standard: ["html", "body", /^(show|collapse|collapsing|collapsed|active|sticky|header-appear|animated|open|in|js|no-js)$/, /^is-/, /^plcs-/, /^fa-angle-/],
  greedy: [/^mfp-/],
};

async function buildCss(files, out) {
  let raw = "", rawSize = 0;
  for (const f of files) {
    let c = read(f);
    rawSize += c.length;
    if (f.endsWith("style.css")) c = c.replace("@import url('fonts.css');", read("src/css/fonts.css"));
    raw += c + "\n";
  }
  if (files.some((f) => f.endsWith("font-awesome.min.css"))) {
    for (const [re, rep] of ICON_FONTS) {
      if (!re.test(raw)) throw new Error("icon @font-face not found: " + re);
      raw = raw.replace(re, rep);
    }
  }
  const purged = await new PurgeCSS().purge({
    content: [...pages, root + "src/js/site.js"],
    css: [{ raw }],
    keyframes: true,
    fontFace: false,
    variables: false,
    safelist: SAFELIST,
  });
  const css = minifyCss(purged[0].css, { restructure: false }).css;
  writeFileSync(root + out, css);
  console.log(`${out.padEnd(24)} ${kb(rawSize)} -> ${kb(css.length)}`);
}

await buildCss(["animate.css", "bootstrap.min.css", "et-line-icons.css", "font-awesome.min.css", "themify-icons.css", "bootsnav.css", "style.css", "plcs.css"].map((f) => "src/css/" + f), "css/site.min.css");
await buildCss(["src/css/responsive.css"], "css/responsive.min.css");

const src = read("src/js/site.js");
const js = await minifyJs(src, { compress: { passes: 2 }, mangle: true, format: { comments: /^!/ } });
writeFileSync(root + "js/site.min.js", js.code);
console.log(`${"js/site.min.js".padEnd(24)} ${kb(src.length)} -> ${kb(js.code.length)}`);

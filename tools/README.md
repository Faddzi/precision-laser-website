# Website tools (not part of the published site)

## What to upload to the live server
Upload: the `.html` files, `css/`, `js/`, `images/`, `fonts/`, `PHPMailer-master/`, `msg.php`, `.htaccess`,
`robots.txt`, `sitemap.xml`. (`sendmail.php` already lives on the server and holds the mail password.)

Do **not** upload: `tools/`, `src/`, `_legacy/`, `.github/`, `.gitignore`.

## Everyday edits
* Text, links, phone numbers, images: edit the `.html` files directly.
* Small style changes: edit `css/customstyle.css` (loaded as-is, no build needed).
  After editing any CSS or JS file, raise the number in `?v=6` (find/replace across the `.html` files) so
  visitors' browsers fetch the new version.
* New photos: save them as WebP (e.g. at squoosh.app), at the size they are shown, and give every `<img>` its
  `width` and `height`, an `alt` description, and `loading="lazy"` unless it is at the very top of the page.

## When you change the theme CSS or `src/js/site.js`
The site loads minified copies. Edit the sources in `src/`, then rebuild:

    cd tools
    npm install        (first time only; needs Node.js)
    npm run build      (rewrites css/site.min.css, css/responsive.min.css, js/site.min.js)

The build removes CSS rules that no page uses. If you add a class that does not appear in any `.html`
file (or is added by `site.js`), add it to the `safelist` in `build.mjs`.

## Adding a new icon
Icons come from trimmed font files (`fonts/web/`) that contain only the icons currently used.
Add the icon's class name to the matching list in `subset_icons.mjs`, run `npm run icons`, then `npm run build`.

## Folders
* `src/`      editable sources for the built CSS/JS
* `_legacy/`  the original theme scripts, slider, fonts and CSS, kept only for reference/rollback

# Contributing

Bug reports and patches are welcome. This is a deliberately small
plugin, so the bar for new features is high: anything that would add a
settings screen, a database write, an external request, or a JavaScript
dependency is almost certainly out of scope.

## Getting set up

```bash
git clone https://github.com/PrasunBannerjee/simple-read-more.git
cd simple-read-more
composer install
```

Symlink or copy the folder into a local WordPress install's
`wp-content/plugins/` directory. The folder name must stay
`simple-read-more`.

## Before opening a pull request

```bash
composer run lint
```

PHPCS runs the WordPress Coding Standards ruleset in
[`phpcs.xml.dist`](phpcs.xml.dist). `composer run lint:fix` autofixes
most whitespace and formatting findings. CI also runs the official
WordPress.org Plugin Check action, so it is worth running that locally
via the [Plugin Check plugin](https://wordpress.org/plugins/plugin-check/)
if you are touching plugin headers, escaping, or enqueues.

## Things that are easy to get wrong here

- **Do not rename CSS classes.** `srm-marker` in particular is
  public API: the documentation tells users to paste
  `<span class="srm-marker"></span>` into raw HTML widgets. Renaming
  it silently breaks every page doing that.
- **Do not move elements out of their parent in the JS.** The whole
  point of this design is that elements collapse in place. See the
  architecture note in
  [`includes/class-simple-read-more-assets.php`](includes/class-simple-read-more-assets.php)
  before changing anything in `assets/js/simple-read-more.js`.
- **Do not add styling to `.srm-toggle`.** Color, underline, and
  font are deliberately left unset so the toggles inherit the site's own
  link styling. Setting them here starts fights with themes.
- **Keep the version in three places in sync**: the `Version:` header in
  `simple-read-more.php`, `Stable tag:` in `readme.txt`, and the
  changelog entries. The build script enforces the first two.

## Tests

There is a browser-based DOM test harness at `tests/manual/index.html`. It
exercises the real `assets/css` and `assets/js` files and asserts 32
properties of the resulting DOM: which elements get collapsed, that the
twin element in a mid-sentence split copies attributes but not the id,
that list and table children stay direct children, that `inert` is added
and removed correctly, and that collapse ids stay unique.

```bash
node bin/serve-tests.js
# then open http://localhost:8731/tests/manual/
```

It has to be served over HTTP rather than opened as a `file://` URL,
since the page loads the assets as separate files. A summary line at the
top of the page reports pass/fail counts.

That harness does not cover WordPress integration, so please also check
by hand:

- `[readmore]` alone on its own line, in the block editor.
- The same, in a Classic Editor text block.
- `<span class="srm-marker"></span>` inside a raw HTML block.
- A marker followed by a bulleted list, a numbered list, and a table.
- A marker placed mid-sentence rather than on its own line.
- Keyboard only: Tab to the toggle, activate with Enter, then with
  Space. Confirm you cannot Tab into the section while it is collapsed.
- A theme with its own strong link styling, to confirm the toggles still
  inherit it.

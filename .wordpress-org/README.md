# WordPress.org directory assets

Nothing in this folder ships inside the plugin zip. These files live in
the `assets/` directory of the plugin's **SVN** repository on
WordPress.org, which is separate from the plugin's own code, and are
what the directory listing page renders and previews from.

## Required — done

`assets/icon-256x256.png`, `assets/icon-128x128.png`,
`assets/banner-772x250.png`, and `assets/banner-1544x500.png` in this
folder are the real, final files. Commit them as-is to
`https://plugins.svn.wordpress.org/simple-read-more/assets/` when the
plugin is submitted.

| File | Size | Source |
| --- | --- | --- |
| `assets/icon-256x256.png` | 256 × 256 | Downscaled from the brand kit's `Logo-icon-only-dark.png` (2400×2400), the ink-on-white mark. |
| `assets/icon-128x128.png` | 128 × 128 | Same source, downscaled again. |
| `assets/banner-772x250.png` | 772 × 250 | Rebuilt from `banner.svg`, with one change from the delivered file — see below. |
| `assets/banner-1544x500.png` | 1544 × 500 | Rebuilt from `banner-retina.svg`, same change. |

**One deliberate edit from the delivered brand kit.** Both banner SVGs
ship with "SIMPLE READ MORE" outlined directly into the artwork, sitting
in the exact calm left third the guide's own rules reserve for
WordPress's title overlay:

> "No type in the artwork — the directory renders the plugin name and
> author over the calm left third." / "Don't put the plugin name inside
> the icon or the banner artwork."

Shipping the banner as delivered would put the plugin's title on the
image twice — once baked into the pixels, once again as WordPress's own
overlay — which is exactly what that rule exists to prevent. The
outlined title path was a single, cleanly separable SVG element, so it
was removed before rasterizing; everything else (ink ground, mark, the
full-width strike) is untouched. **Confirmed:** the banners ship
without the baked-in title.

**One judgment call on the icon.** WordPress.org doesn't support a
separate icon for dark mode, only one file, so a choice had to be made
between the ink-on-white mark and the paper-on-ink one. Went with
ink-on-white — that's the version built for light grounds, and the
Plugins screen and search results are white or light grey in the
overwhelming majority of real installs, dark admin color schemes
included (only the directory's own dark mode, which is rarer, is the
edge case this doesn't cover). **Confirmed:** the icon ships as the
ink-on-white mark.

## Recommended

| File | Notes |
| --- | --- |
| `assets/screenshot-1.png` | Front end, collapsed: the "Read More" link with the rest of the content hidden. |
| `assets/screenshot-2.png` | Front end, expanded: "Read Less" at the end of the revealed text. |
| `assets/screenshot-3.png` | The `[readmore]` marker on its own line in the block editor. |

**Done.** Each file matches, in order, a caption under
`== Screenshots ==` in `readme.txt`. The directory takes the captions
from there, so if you add, remove, or reorder an image, update that
section to match; a caption with no image shows up as a broken gallery.

All three were taken at 1280px wide (saved at 1.25x, so 1600px) from
a stock WordPress install running Twenty Twenty-Five, with the plugin
loaded from this repository. The demo page is a made-up community
garden, so no real site or brand appears in them.

## Live Preview blueprint

`blueprints/blueprint.json` in this folder is committed to SVN as
`assets/blueprints/blueprint.json`. It boots a WordPress Playground
instance, installs and activates the plugin from the directory, creates
a demo page that uses the marker, and sets that page as the front page,
so the preview opens on a working example rather than an empty site.

Two things are needed for the public **Preview** button to appear:

1. A valid `blueprint.json` at that path. Until then there is no button.
2. A committer must set the plugin preview to "public" from the
   plugin's **Advanced** view. Before that, only committers see it, as a
   **Test Preview** button.

The blueprint installs the plugin by its `simple-read-more` slug from
wordpress.org, so it only works once the plugin is approved and live.

## Constraints

- Banners: JPG or PNG. Icons: PNG, JPG, GIF, or SVG with a PNG
  fallback. Screenshots: PNG or JPG. No WebP or AVIF anywhere.
- All filenames must be lowercase.
- Size ceilings: 4 MB per banner, 1 MB per icon, 10 MB per screenshot.
  Staying well under those is better; the directory serves them
  uncompressed.
- Avoid putting small text in the banner. It is scaled down heavily on
  mobile and becomes unreadable.
- Do not use the WordPress logo, the Elementor logo, or any other
  trademark you do not own. This is one of the more common reasons a
  submission gets bounced.

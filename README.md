# Simple Read More

A WordPress plugin that splits any content into a visible part and a collapsible "Read More / Read Less" part, using a single shortcode. No settings screen, no database writes, no dependencies, no external requests — that's a description of the mechanism, not a marketing line. There is genuinely nothing else to configure.

> The canonical, user-facing documentation is [`readme.txt`](readme.txt), which is what renders on WordPress.org. This file covers the repository itself.

## How it works

Type `[readmore]` on its own line anywhere in your content. Everything after that point starts collapsed behind a "Read More" link. Clicking it expands the content and places a "Read Less" link at the *end* of the revealed text, rather than back where the reader clicked.

For widgets that do not process shortcodes, paste `<span class="srm-marker"></span>` instead. It behaves identically.

The shortcode renders nothing but that empty marker span. All splitting, wrapping, and animation happens client-side, which is what keeps the plugin editor-agnostic.

### The design constraint worth knowing

The obvious implementation creates a new container and moves the hidden paragraphs into it. That breaks typography on a meaningful number of sites, because theme and page-builder CSS frequently targets paragraphs by their position in the markup, so a relocated paragraph stops matching its own rules.

This plugin never relocates an element out of its original parent. Each element that needs to hide becomes a self-contained collapsible unit *in place*, keeping its tag, classes, id, and position. Lists and tables, whose children must remain direct children, are wrapped from the outside instead. The full reasoning is in the architecture note at the top of [`includes/class-simple-read-more-assets.php`](includes/class-simple-read-more-assets.php).

## Repository layout

```
simple-read-more/
├── simple-read-more.php          Plugin header, constants, bootstrap
├── readme.txt                    WordPress.org listing (the real docs)
├── LICENSE                       GPL-2.0
├── includes/
│   ├── class-simple-read-more.php            Orchestrator
│   ├── class-simple-read-more-shortcode.php  [readmore]
│   └── class-simple-read-more-assets.php     Enqueue + labels
├── assets/
│   ├── css/simple-read-more.css  Layout and collapse animation
│   └── js/simple-read-more.js    All DOM behaviour
├── languages/simple-read-more.pot
├── docs/usage-manual.html        Standalone illustrated manual
├── tests/manual/                 Browser DOM test harness
├── bin/                          Build + test-server scripts
└── .wordpress-org/               Spec for the directory's banner/icon/screenshots
```

`assets/` here holds files that actually ship. The WordPress.org *directory* assets (banner, icon, screenshots) live in `.wordpress-org/` and are committed to SVN separately, never to the plugin zip.

## Extending it

```php
// Relabel every toggle on the site.
add_filter( 'simple_read_more_labels', function ( $labels ) {
	$labels['more'] = 'Show More';
	$labels['less'] = 'Show Less';
	return $labels;
} );

// Skip loading the CSS and JS where the plugin is not used.
add_filter( 'simple_read_more_enqueue_assets', function ( $enqueue ) {
	return is_singular( 'post' );
} );
```

The constants `SIMPLE_READ_MORE_LABEL_MORE` and `SIMPLE_READ_MORE_LABEL_LESS` can also be defined in `wp-config.php`.

## Development

```bash
composer install
composer run lint        # PHPCS against WordPress Coding Standards
composer run lint:fix    # PHPCBF autofix
composer run build       # produces build/simple-read-more-<version>.zip
```

On Windows without Git Bash, use the PowerShell build script instead:

```powershell
powershell -ExecutionPolicy Bypass -File bin\build-zip.ps1
```

There is also a browser-based DOM test harness that runs the real asset files and asserts 32 properties of the resulting markup:

```bash
node bin/serve-tests.js
# then open http://localhost:8731/tests/manual/
```

CI runs PHP syntax linting on 7.2 and 8.4, PHPCS, and the official [Plugin Check](https://wordpress.org/plugins/plugin-check/) action, which mirrors the automated half of the WordPress.org review.

### Releasing

1. Bump the version in **both** `simple-read-more.php` (`Version:`) and `readme.txt` (`Stable tag:`). The build script refuses to run if they disagree, because WordPress.org serves whatever `Stable tag` points at.
2. Add a `== Changelog ==` entry and an `== Upgrade Notice ==` entry in `readme.txt`.
3. Run `composer run build` and test the resulting zip on a clean install.
4. Tag the release, then commit to the WordPress.org SVN `trunk/` and copy to `tags/<version>/`.

## Compatibility

| | |
| --- | --- |
| WordPress | 5.8+ |
| PHP | 7.2+ |
| Editors | Block editor, Classic Editor, page builders |
| Browsers | Evergreen browsers. Requires `inert` attribute support. |

Elementor is a trademark of Elementor Ltd. This project is independent and is not affiliated with, endorsed by, or sponsored by them.

## License

GPL-2.0-or-later. See [`LICENSE`](LICENSE).

=== Simple Read More ===
Contributors: PrasunBannerjee
Tags: read more, read less, expand, collapse, shortcode
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.2
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

One shortcode splits your content into a visible part and a collapsible "Read More" part. No settings screen, because there's nothing to configure.

== Description ==

Type `[readmore]` where you want your content to stop. That's the entire plugin.

Everything before the marker stays visible. Everything after it collapses behind a "Read More" link, and expands smoothly in place when clicked, with a "Read Less" link appearing at the *end* of the revealed text, right where the reader's eyes already are.

There is no settings screen. That's not a missing feature — it's the point. A settings screen is a promise that something might go wrong without it, and one more surface that has to keep working across every WordPress version forever. This plugin does one job, the same way for everyone: install it, activate it, type a shortcode. No options to learn, no options to migrate when you update, nothing to configure wrong.

= What "lightweight" actually means here =

No database writes. No admin page. No external requests. No JavaScript library, no build step, no dependencies of any kind. The plugin does not create an options row, a database table, a cron event, or a single byte of stored data — activating it is the entire installation, and deactivating it leaves nothing behind.

= Why it does not break your layout =

The obvious way to build a "read more" is to create a new container and move the hidden paragraphs into it. That quietly breaks typography on a lot of sites, because theme and page-builder CSS often targets paragraphs by their exact position in the markup. Move a paragraph three levels deeper into a new `div` and those rules stop matching, so the revealed text renders in a different size or spacing than the text above it.

This plugin never relocates your elements. Each one that needs to hide becomes a self-contained collapsible unit *in place*, keeping its original tag, classes, id, and position. Any CSS that matched it before still matches it. Lists and tables, whose children must stay direct children to render bullets and rows correctly, are handled with a separate wrapping strategy that leaves the element itself completely intact.

= Accessibility =

* Both toggles are real links, marked up so screen readers announce them as buttons, since they reveal content on the same page rather than navigating anywhere.
* Fully keyboard operable: Tab to focus, Enter or Space to activate.
* `aria-expanded` and `aria-controls` are kept in sync, so assistive technology always announces the current state.
* Collapsed sections carry the `inert` attribute, so keyboard users cannot Tab into links or form fields that are invisible on screen.
* The expand animation is skipped automatically for visitors whose system is set to "reduce motion".

= Works with =

The block editor, the Classic Editor, and page builders, including Elementor's free Text Editor widget. For any widget that does not process shortcodes, such as a raw HTML widget, paste `<span class="srm-marker"></span>` instead; it behaves identically.

Elementor is a trademark of Elementor Ltd. This plugin is an independent project and is not affiliated with, endorsed by, or sponsored by them.

= For developers =

The one thing worth changing — the link wording — lives in a filter rather than a screen, so it survives updates instead of being wiped by them:

`add_filter( 'simple_read_more_labels', function ( $labels ) {
	$labels['more'] = 'Show More';
	$labels['less'] = 'Show Less';
	return $labels;
} );`

A second filter, `simple_read_more_enqueue_assets`, returns false to skip loading the CSS and JS on pages that don't need it.

Development happens in the open at [github.com/PrasunBannerjee/simple-read-more](https://github.com/PrasunBannerjee/simple-read-more).

== Installation ==

1. In your WordPress admin, go to **Plugins → Add New Plugin**.
2. Search for **Simple Read More**, then click **Install Now** and **Activate**.
3. Type `[readmore]` on its own line anywhere in your content, at the point you want the split.

That's it. There's no step 4 — no settings page opens, because none exists.

To install manually instead, upload the `simple-read-more` folder to `/wp-content/plugins/`, then activate it from the **Plugins** screen.

== Frequently Asked Questions ==

= How do I use it? =

Type `[readmore]` on its own line, at the point where you want content to start hiding. Everything after that point collapses behind a "Read More" link.

= Where's the settings page? =

There isn't one. The plugin has exactly one behavior, so there's nothing to choose between. The handful of things that are genuinely worth adjusting — wording, animation speed, link color — are covered below, and each takes one filter or one CSS rule rather than a screen full of options.

= Nothing happens, and `[readmore]` shows up literally on the page =

The widget you are using does not process shortcodes. Paste `<span class="srm-marker"></span>` instead, which does exactly the same thing.

= Can I use more than one on the same page? =

Yes, but put each one in its own text block or widget. Two markers inside a single block will not split independently, because the second marker sits inside the content the first one has already collapsed.

= How do I change the wording to "Show More" and "Show Less"? =

Add this to your child theme's `functions.php`:

`add_filter( 'simple_read_more_labels', function ( $labels ) {
	$labels['more'] = 'Show More';
	$labels['less'] = 'Show Less';
	return $labels;
} );`

You can also define `SIMPLE_READ_MORE_LABEL_MORE` and `SIMPLE_READ_MORE_LABEL_LESS` in `wp-config.php`. Both approaches survive plugin updates; editing the plugin file directly does not.

= How do I restyle the "Read More" link? =

By design, the plugin sets no color, underline, or font on the toggles, so they inherit your theme's existing link styling automatically. To override that, add your own rule in **Appearance → Customize → Additional CSS**:

`.srm-toggle {
	color: #2563eb;
	text-decoration: none;
}`

= How do I change the animation speed? =

Target the same class from Additional CSS:

`.srm-hide-el {
	transition: grid-template-rows 0.6s ease-in-out;
}`

= Does it work with caching and minification plugins? =

Yes. If the animation ever stops working after you install one, exclude this plugin's CSS and JS from "combine and minify", or clear the cache.

= Does it collect any data? =

No. It makes no external requests, sets no cookies, and writes nothing to the database.

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
Initial release.

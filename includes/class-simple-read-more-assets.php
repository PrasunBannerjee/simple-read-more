<?php
/**
 * Front-end asset registration.
 *
 * @package SimpleReadMore
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues the stylesheet and script that do the actual work, and
 * hands the script its two labels.
 *
 * ====================================================================
 * ARCHITECTURE NOTE
 * ====================================================================
 * The obvious way to build a collapsible section is to create one new
 * wrapper and physically move every hidden paragraph into it. That
 * approach breaks typography and spacing on real sites, because
 * builder and theme CSS can target paragraphs by their exact original
 * position in the markup (for example a direct-child rule scoped to
 * the widget container). Once a paragraph is relocated three levels
 * deep into a brand new div, that kind of rule stops matching, and the
 * paragraph silently falls back to browser-default typography instead.
 *
 * So this implementation never relocates an existing element out of
 * its original parent. Each element that needs to hide becomes a
 * self-contained collapsible unit IN PLACE: only its own children move
 * (into one small inner wrapper nested inside itself), while the
 * element itself keeps its exact original tag, classes, id, and
 * position in the page. Any CSS that ever matched that element,
 * however it was written, keeps matching it.
 *
 * Two cases cannot work that way and are handled separately:
 *
 * - <ul>/<ol>/<table> elements have children (<li>/<tr>) that MUST
 *   stay direct children to render bullets/numbering/table layout
 *   correctly, so their own children are never touched. Instead the
 *   whole element is wrapped from the OUTSIDE by one extra div, which
 *   keeps the element itself fully intact and only affects rules that
 *   target it via its exact ancestor chain, a much rarer pattern than
 *   rules that target the element directly.
 * - Elements with no children at all (for example a standalone image)
 *   have nothing to move, so they use the same outside-wrap fallback.
 *
 * A marker placed in the MIDDLE of a paragraph, rather than alone on
 * its own line, is handled by splitting that paragraph in two at the
 * marker: the original keeps everything before the marker completely
 * untouched, and a new twin element (same tag, same class/style
 * attributes) takes everything after it. The twin then goes through
 * the exact same in-place collapse treatment as any other hidden
 * element above.
 *
 * Splitting this way is also what keeps the "Read Less" link from
 * landing mid-sentence: it is always inserted as a new sibling AFTER a
 * real block element, never spliced into a run of inline text, so a
 * line break before it is guaranteed by ordinary block layout rather
 * than by any special-case CSS.
 *
 * @since 1.0.0
 */
final class Simple_Read_More_Assets {

	/**
	 * Shared handle for both the stylesheet and the script.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const HANDLE = 'simple-read-more';

	/**
	 * Hook the enqueue callback.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue' ) );
	}

	/**
	 * Enqueue the CSS and JS on the front end.
	 *
	 * Note on why this loads on every front-end view rather than
	 * conditionally: page builders commonly store their page content
	 * in post meta rather than in the normal post_content field, so a
	 * has_shortcode() check against get_the_content() does not
	 * reliably detect usage on builder-built pages. Since the combined
	 * CSS+JS footprint here is only a few KB with zero external
	 * requests, loading it site wide on the front end is simpler and
	 * safer than trying to detect usage, and has no meaningful effect
	 * on Core Web Vitals.
	 *
	 * Sites that would still rather gate it can return false from the
	 * `simple_read_more_enqueue_assets` filter.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function enqueue() {
		if ( is_admin() ) {
			return;
		}

		/**
		 * Filters whether the front-end assets are enqueued at all.
		 *
		 * Returning false anywhere the plugin is not in use skips both
		 * files entirely. Note that the shortcode still renders its
		 * marker; without the script the marker is simply inert and
		 * invisible, and all content stays visible.
		 *
		 * @since 1.0.0
		 *
		 * @param bool $enqueue Whether to enqueue. Default true.
		 */
		if ( ! apply_filters( 'simple_read_more_enqueue_assets', true ) ) {
			return;
		}

		wp_enqueue_style(
			self::HANDLE,
			SIMPLE_READ_MORE_URL . 'assets/css/simple-read-more.css',
			array(),
			self::asset_version( 'assets/css/simple-read-more.css' )
		);

		/*
		 * Deferred, because nothing here needs to run during parsing:
		 * the script only reads the finished DOM. The array form of the
		 * last argument needs WordPress 6.3; on 5.8 through 6.2 the
		 * array is simply truthy, which is read as the old $in_footer
		 * boolean, so those versions still get exactly the footer
		 * script they got before.
		 */
		wp_enqueue_script(
			self::HANDLE,
			SIMPLE_READ_MORE_URL . 'assets/js/simple-read-more.js',
			array(),
			self::asset_version( 'assets/js/simple-read-more.js' ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		$labels = self::get_labels();

		wp_add_inline_script(
			self::HANDLE,
			'window.simpleReadMoreConfig = ' . wp_json_encode(
				array(
					'labelMore' => $labels['more'],
					'labelLess' => $labels['less'],
				)
			) . ';',
			'before'
		);
	}

	/**
	 * Resolve the two toggle labels.
	 *
	 * Both constants are always defined, since the main plugin file
	 * defines them before this class is loaded.
	 *
	 * The shipped defaults are passed through translation so the
	 * plugin can be localised normally. A label the site owner has
	 * actually changed, by editing the constant in the main plugin
	 * file or by defining it in wp-config.php, is used verbatim and
	 * never translated, since it is already in the wording they want.
	 *
	 * @since 1.0.0
	 *
	 * @return array{more:string,less:string} Resolved labels.
	 */
	private static function get_labels() {
		$more = SIMPLE_READ_MORE_LABEL_MORE;
		$less = SIMPLE_READ_MORE_LABEL_LESS;

		if ( 'Read More' === $more ) {
			$more = __( 'Read More', 'simple-read-more' );
		}
		if ( 'Read Less' === $less ) {
			$less = __( 'Read Less', 'simple-read-more' );
		}

		$labels = array(
			'more' => $more,
			'less' => $less,
		);

		/**
		 * Filters the "Read More" and "Read Less" labels.
		 *
		 * The update-safe way to relabel every toggle on the site.
		 *
		 * @since 1.0.0
		 *
		 * @param array{more:string,less:string} $labels Resolved labels.
		 */
		$labels = apply_filters( 'simple_read_more_labels', $labels );

		return array(
			'more' => isset( $labels['more'] ) ? (string) $labels['more'] : $more,
			'less' => isset( $labels['less'] ) ? (string) $labels['less'] : $less,
		);
	}

	/**
	 * Build a cache-busting version string for an asset.
	 *
	 * The file's own modification time is preferred over the plugin
	 * version because the documented way to restyle this plugin is to
	 * edit the CSS file directly. Without this, a site owner's edit
	 * would keep serving from visitors' browser caches until the next
	 * plugin release. Falls back to the plugin version if the file
	 * cannot be stat'ed.
	 *
	 * @since 1.0.0
	 *
	 * @param string $relative_path Path to the asset, relative to the plugin root.
	 * @return string Version string.
	 */
	private static function asset_version( $relative_path ) {
		$absolute_path = SIMPLE_READ_MORE_PATH . $relative_path;

		if ( file_exists( $absolute_path ) ) {
			$modified_time = filemtime( $absolute_path );
			if ( $modified_time ) {
				return SIMPLE_READ_MORE_VERSION . '.' . $modified_time;
			}
		}

		return SIMPLE_READ_MORE_VERSION;
	}
}

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
	 * Whether something on the current page has asked for the assets.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	private static $is_needed = false;

	/**
	 * Hook the asset loading and the marker detection.
	 *
	 * The CSS and JS load only on views that actually use the plugin,
	 * never site wide. Two things count as use:
	 *
	 * 1. The [readmore] shortcode rendering. The shortcode calls
	 *    {@see Simple_Read_More_Assets::request()} itself, so this
	 *    works wherever shortcodes run, including page builders that
	 *    keep their content in post meta rather than post_content.
	 *    That is also why detection happens while content renders,
	 *    rather than by inspecting post_content up front with
	 *    has_shortcode(), which misses builder pages.
	 * 2. A hand-pasted `srm-marker` span, which runs no plugin code of
	 *    its own. A plain substring check on the rendered output of the
	 *    usual places such a span ends up catches it: post content,
	 *    blocks (which also covers block templates and block widgets),
	 *    classic text widgets, and Elementor widgets. The check is a
	 *    single strpos() per call, and those filters already run
	 *    whether or not this plugin is active.
	 *
	 * Anywhere else, a site can load the assets on every view with the
	 * `simple_read_more_load_everywhere` filter.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue' ) );

		add_filter( 'the_content', array( __CLASS__, 'detect_marker' ), 20 );
		add_filter( 'render_block', array( __CLASS__, 'detect_marker' ), 20 );
		add_filter( 'widget_text', array( __CLASS__, 'detect_marker' ), 20 );
		add_filter( 'elementor/widget/render_content', array( __CLASS__, 'detect_marker' ), 20 );
	}

	/**
	 * Ask for the assets on the current page.
	 *
	 * Safe to call any number of times, and at any point during the
	 * page. Content can render before `wp_enqueue_scripts` fires
	 * (block themes render the whole template before wp_head()), in
	 * which case the request is remembered and honoured when that hook
	 * runs. If it renders afterwards, the files are enqueued on the
	 * spot; WordPress prints a stylesheet enqueued that late in the
	 * footer, which is still before the deferred script runs, because
	 * a script waits for any stylesheet above it to load.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function request() {
		if ( is_admin() ) {
			return;
		}

		self::$is_needed = true;

		if ( did_action( 'wp_enqueue_scripts' ) ) {
			self::enqueue();
		}
	}

	/**
	 * Request the assets if a piece of rendered output holds a marker.
	 *
	 * Hooked as a filter, so it always hands the output back unchanged.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $content Rendered output.
	 * @return mixed The same output.
	 */
	public static function detect_marker( $content ) {
		if ( ! self::$is_needed && is_string( $content ) && false !== strpos( $content, Simple_Read_More_Shortcode::MARKER_CLASS ) ) {
			self::request();
		}

		return $content;
	}

	/**
	 * Enqueue the assets on `wp_enqueue_scripts`, if anything needs them.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function maybe_enqueue() {
		/**
		 * Filters whether the assets load on every front-end view.
		 *
		 * By default the CSS and JS load only on views that use the
		 * shortcode or a marker the plugin can see. Return true to load
		 * them everywhere instead, for the rare setup where a marker is
		 * pasted somewhere the plugin cannot see it, such as a raw HTML
		 * field inside a page builder other than Elementor.
		 *
		 * @since 1.0.0
		 *
		 * @param bool $load_everywhere Whether to load on every view. Default false.
		 */
		if ( apply_filters( 'simple_read_more_load_everywhere', false ) ) {
			self::$is_needed = true;
		}

		if ( self::$is_needed ) {
			self::enqueue();
		}
	}

	/**
	 * Enqueue the CSS and JS, with the label config ahead of the script.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private static function enqueue() {
		if ( wp_script_is( self::HANDLE, 'enqueued' ) ) {
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

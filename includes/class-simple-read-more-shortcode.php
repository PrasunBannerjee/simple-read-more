<?php
/**
 * The [readmore] shortcode.
 *
 * @package SimpleReadMore
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers [readmore] and renders it as a single empty marker span.
 *
 * Output is intentionally nothing but that marker. All actual
 * splitting, wrapping, and animation logic happens client side in JS,
 * so the shortcode stays valid no matter which widget, block, or
 * editor renders it, and produces no visible output of its own if the
 * script is ever unavailable.
 *
 * @since 1.0.0
 */
final class Simple_Read_More_Shortcode {

	/**
	 * Shortcode tag.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const TAG = 'readmore';

	/**
	 * CSS class the front-end script looks for.
	 *
	 * This one is effectively public API: the documentation tells site
	 * owners to paste `<span class="srm-marker"></span>` by hand into
	 * widgets that do not run shortcodes. Renaming it in a future
	 * release would silently break every page doing that, so treat it
	 * as fixed.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const MARKER_CLASS = 'srm-marker';

	/**
	 * Hook the shortcode.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function register() {
		add_shortcode( self::TAG, array( __CLASS__, 'render' ) );
	}

	/**
	 * Render the marker.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string,mixed>|string $atts    Shortcode attributes. Unused; the
	 *                                            shortcode takes none.
	 * @param string|null                $content Enclosed content. Unused; the
	 *                                            shortcode is self-closing.
	 * @return string Marker markup.
	 */
	public static function render( $atts = array(), $content = null ) {
		unset( $atts, $content );

		return '<span class="' . esc_attr( self::MARKER_CLASS ) . '" aria-hidden="true"></span>';
	}
}

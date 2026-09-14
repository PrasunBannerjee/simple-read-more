<?php
/**
 * Plugin Name:       Simple Read More
 * Plugin URI:        https://github.com/PrasunBannerjee/simple-read-more
 * Description:       Adds a [readmore] shortcode, and a matching HTML marker, that splits any content into a visible part and a collapsible "Read More / Read Less" part. No settings, no dependencies.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.2
 * Author:            Prasun Bannerjee
 * Author URI:        https://github.com/PrasunBannerjee
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       simple-read-more
 * Domain Path:       /languages
 *
 * @package SimpleReadMore
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ====================================================================
 * LABEL CONFIGURATION
 * ====================================================================
 * Change the two strings below to update every "Read More / Read Less"
 * instance across the entire site.
 *
 * IMPORTANT: editing this file directly means your change is
 * overwritten the next time the plugin updates. To make the change
 * permanent, either define the constants in wp-config.php instead, or
 * use the `simple_read_more_labels` filter from your child theme's
 * functions.php:
 *
 *     add_filter( 'simple_read_more_labels', function ( $labels ) {
 *         $labels['more'] = 'Show More';
 *         $labels['less'] = 'Show Less';
 *         return $labels;
 *     } );
 *
 * Both options are documented in readme.txt and docs/usage-manual.html.
 */
if ( ! defined( 'SIMPLE_READ_MORE_LABEL_MORE' ) ) {
	define( 'SIMPLE_READ_MORE_LABEL_MORE', 'Read More' );
}
if ( ! defined( 'SIMPLE_READ_MORE_LABEL_LESS' ) ) {
	define( 'SIMPLE_READ_MORE_LABEL_LESS', 'Read Less' );
}

/**
 * Plugin metadata constants. Not intended to be edited.
 */
define( 'SIMPLE_READ_MORE_VERSION', '1.0.0' );
define( 'SIMPLE_READ_MORE_FILE', __FILE__ );
define( 'SIMPLE_READ_MORE_PATH', plugin_dir_path( __FILE__ ) );
define( 'SIMPLE_READ_MORE_URL', plugin_dir_url( __FILE__ ) );

require_once SIMPLE_READ_MORE_PATH . 'includes/class-simple-read-more.php';
require_once SIMPLE_READ_MORE_PATH . 'includes/class-simple-read-more-shortcode.php';
require_once SIMPLE_READ_MORE_PATH . 'includes/class-simple-read-more-assets.php';

/**
 * Boot the plugin.
 *
 * Runs on `plugins_loaded` so any theme or plugin that wants to
 * redefine the label constants, or hook the label filter, has already
 * had a chance to load.
 *
 * @since 1.0.0
 *
 * @return void
 */
function simple_read_more_bootstrap() {
	Simple_Read_More::instance()->run();
}
add_action( 'plugins_loaded', 'simple_read_more_bootstrap' );

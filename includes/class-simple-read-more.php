<?php
/**
 * Plugin orchestrator.
 *
 * @package SimpleReadMore
 */

// Block direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wires the plugin's two moving parts together: the shortcode that
 * prints the marker, and the assets that act on it.
 *
 * This class deliberately holds no state and stores nothing in the
 * database. The plugin has no settings screen and creates no options,
 * tables, post meta, cron events, or transients, which is also why it
 * ships no uninstall.php: deactivating and deleting it leaves nothing
 * behind.
 *
 * There is deliberately no load_plugin_textdomain() call. WordPress
 * has loaded translations just in time, from the directory named by
 * the plugin header's Domain Path, since 4.6, so an explicit call
 * would only duplicate work core already does. Translations still
 * resolve from /languages and from translate.wordpress.org.
 *
 * @since 1.0.0
 */
final class Simple_Read_More {

	/**
	 * Single shared instance.
	 *
	 * @since 1.0.0
	 * @var Simple_Read_More|null
	 */
	private static $instance = null;

	/**
	 * Guards against `run()` being called more than once.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	private $has_run = false;

	/**
	 * Private constructor; use {@see Simple_Read_More::instance()}.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {}

	/**
	 * Retrieve the shared instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Simple_Read_More
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register every hook the plugin uses.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run() {
		if ( $this->has_run ) {
			return;
		}
		$this->has_run = true;

		Simple_Read_More_Shortcode::register();
		Simple_Read_More_Assets::register();
	}
}

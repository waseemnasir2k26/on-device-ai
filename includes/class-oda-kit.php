<?php
/**
 * Core loader.
 *
 * @package On_Device_AI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class. Singleton.
 */
final class ODA_Kit {

	/**
	 * Single instance.
	 *
	 * @var ODA_Kit|null
	 */
	private static $instance = null;

	/**
	 * Default settings.
	 *
	 * @var array
	 */
	const DEFAULTS = array(
		'enable_proofread' => 1,
		'enable_rewrite'   => 1,
		'enable_summarize' => 1,
		'enable_meta'      => 1,
		'enable_prompt'    => 1,
		'default_tone'     => 'as-is',
	);

	/**
	 * Get the singleton.
	 *
	 * @return ODA_Kit
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Wire hooks.
	 */
	private function __construct() {
		require_once ODA_DIR . 'includes/class-oda-settings.php';
		new ODA_Settings();

		add_action( 'init', array( $this, 'load_textdomain' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_filter( 'plugin_action_links_' . ODA_BASENAME, array( $this, 'action_links' ) );
	}

	/**
	 * Load translations.
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'on-device-ai', false, dirname( ODA_BASENAME ) . '/languages' );
	}

	/**
	 * Enqueue the block-editor plugin script + styles.
	 */
	public function enqueue_editor_assets() {
		$deps = array(
			'wp-plugins',
			'wp-editor',
			'wp-edit-post',
			'wp-element',
			'wp-components',
			'wp-data',
			'wp-block-editor',
			'wp-i18n',
			'wp-notices',
		);

		wp_enqueue_script( 'oda-editor', ODA_URL . 'assets/editor.js', $deps, ODA_VERSION, true );
		wp_enqueue_style( 'oda-editor', ODA_URL . 'assets/editor.css', array( 'wp-components' ), ODA_VERSION );

		if ( function_exists( 'wp_set_script_translations' ) ) {
			wp_set_script_translations( 'oda-editor', 'on-device-ai' );
		}

		$settings = wp_parse_args( get_option( 'oda_settings', array() ), self::DEFAULTS );
		wp_add_inline_script(
			'oda-editor',
			'window.ODA_SETTINGS = ' . wp_json_encode( $settings ) . ';',
			'before'
		);
	}

	/**
	 * Read a setting with default fallback.
	 *
	 * @param string $key Setting key.
	 * @return mixed
	 */
	public static function get_setting( $key ) {
		$settings = wp_parse_args( get_option( 'oda_settings', array() ), self::DEFAULTS );
		return isset( $settings[ $key ] ) ? $settings[ $key ] : '';
	}

	/**
	 * Add a "Settings" link on the plugins screen.
	 *
	 * @param array $links Existing links.
	 * @return array
	 */
	public function action_links( $links ) {
		$url  = admin_url( 'options-general.php?page=on-device-ai' );
		$link = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'on-device-ai' ) . '</a>';
		array_unshift( $links, $link );
		return $links;
	}
}

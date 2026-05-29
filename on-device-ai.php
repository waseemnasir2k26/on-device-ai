<?php
/**
 * Plugin Name:       On-Device AI — Private Writing Assistant
 * Plugin URI:        https://github.com/waseemnasir2k26/on-device-ai
 * Description:       AI writing help inside the WordPress block editor — proofread, rewrite, change tone, summarize, generate meta — powered by Chrome's built-in AI (Gemini Nano). No API key, no per-token cost, no cloud: the model runs on the writer's own device. Your draft never leaves the browser.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Waseem Nasir (SkynetLabs)
 * Author URI:        https://www.skynetjoe.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       on-device-ai
 * Domain Path:       /languages
 *
 * @package On_Device_AI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ODA_VERSION', '1.0.0' );
define( 'ODA_FILE', __FILE__ );
define( 'ODA_DIR', plugin_dir_path( __FILE__ ) );
define( 'ODA_URL', plugin_dir_url( __FILE__ ) );
define( 'ODA_BASENAME', plugin_basename( __FILE__ ) );

require_once ODA_DIR . 'includes/class-oda-kit.php';

/**
 * Boot the plugin.
 *
 * @return ODA_Kit
 */
function oda_kit() {
	return ODA_Kit::instance();
}

oda_kit();

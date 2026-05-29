<?php
/**
 * Uninstall cleanup.
 *
 * @package On_Device_AI
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'oda_settings' );

<?php
/**
 * Settings page.
 *
 * @package On_Device_AI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings → On-Device AI.
 */
class ODA_Settings {

	const OPTION = 'oda_settings';
	const GROUP  = 'oda_group';

	/**
	 * Hook admin.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_page' ) );
		add_action( 'admin_init', array( $this, 'register' ) );
	}

	/**
	 * Register the options page.
	 */
	public function add_page() {
		add_options_page(
			__( 'On-Device AI', 'on-device-ai' ),
			__( 'On-Device AI', 'on-device-ai' ),
			'manage_options',
			'on-device-ai',
			array( $this, 'render' )
		);
	}

	/**
	 * Register setting + sanitizer.
	 */
	public function register() {
		register_setting(
			self::GROUP,
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => ODA_Kit::DEFAULTS,
			)
		);
	}

	/**
	 * Sanitize settings.
	 *
	 * @param array $input Raw input.
	 * @return array
	 */
	public function sanitize( $input ) {
		$out = array();
		foreach ( array( 'enable_proofread', 'enable_rewrite', 'enable_summarize', 'enable_meta', 'enable_prompt' ) as $flag ) {
			$out[ $flag ] = empty( $input[ $flag ] ) ? 0 : 1;
		}
		$allowed_tones      = array( 'as-is', 'more-formal', 'more-casual' );
		$tone               = isset( $input['default_tone'] ) ? sanitize_key( $input['default_tone'] ) : 'as-is';
		$out['default_tone'] = in_array( $tone, $allowed_tones, true ) ? $tone : 'as-is';
		return $out;
	}

	/**
	 * Render the settings page.
	 */
	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s = wp_parse_args( get_option( self::OPTION, ODA_Kit::DEFAULTS ), ODA_Kit::DEFAULTS );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'On-Device AI — Private Writing Assistant', 'on-device-ai' ); ?></h1>
			<p style="max-width:720px;">
				<?php esc_html_e( 'This plugin adds an AI panel to the block editor that runs on Chrome\'s built-in AI (Gemini Nano) — directly on the writer\'s device. No API key, no per-token cost, and your draft never leaves the browser.', 'on-device-ai' ); ?>
			</p>

			<div class="notice notice-info inline" style="max-width:720px;">
				<p>
					<strong><?php esc_html_e( 'Requirements:', 'on-device-ai' ); ?></strong>
					<?php esc_html_e( 'Desktop Chrome 138+ (or Edge) with built-in AI enabled. On first use the browser downloads the on-device model once. Where built-in AI is unavailable, the panel shows a friendly notice instead of failing.', 'on-device-ai' ); ?>
					<a href="https://developer.chrome.com/docs/ai/built-in" target="_blank" rel="noopener"><?php esc_html_e( 'Learn how to enable it', 'on-device-ai' ); ?></a>
				</p>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( self::GROUP ); ?>
				<h2 class="title"><?php esc_html_e( 'Editor tools', 'on-device-ai' ); ?></h2>
				<table class="form-table" role="presentation">
					<?php
					$toggles = array(
						'enable_proofread' => __( 'Proofread (grammar + spelling)', 'on-device-ai' ),
						'enable_rewrite'   => __( 'Rewrite / change tone', 'on-device-ai' ),
						'enable_summarize' => __( 'Summarize the post', 'on-device-ai' ),
						'enable_meta'      => __( 'Generate meta description / excerpt', 'on-device-ai' ),
						'enable_prompt'    => __( 'Free prompt (ask anything)', 'on-device-ai' ),
					);
					foreach ( $toggles as $key => $label ) :
						?>
						<tr>
							<th scope="row"><?php echo esc_html( $label ); ?></th>
							<td>
								<label>
									<input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[<?php echo esc_attr( $key ); ?>]" value="1" <?php checked( ! empty( $s[ $key ] ) ); ?> />
									<?php esc_html_e( 'Show in editor', 'on-device-ai' ); ?>
								</label>
							</td>
						</tr>
					<?php endforeach; ?>
					<tr>
						<th scope="row"><label for="oda_tone"><?php esc_html_e( 'Default rewrite tone', 'on-device-ai' ); ?></label></th>
						<td>
							<select id="oda_tone" name="<?php echo esc_attr( self::OPTION ); ?>[default_tone]">
								<?php
								$tones = array(
									'as-is'       => __( 'Keep tone (just improve)', 'on-device-ai' ),
									'more-formal' => __( 'More formal', 'on-device-ai' ),
									'more-casual' => __( 'More casual', 'on-device-ai' ),
								);
								foreach ( $tones as $val => $label ) :
									?>
									<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $s['default_tone'], $val ); ?>><?php echo esc_html( $label ); ?></option>
								<?php endforeach; ?>
							</select>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<p style="color:#646970;border-top:1px solid #dcdcde;padding-top:14px;max-width:720px;">
				<?php
				printf(
					/* translators: %s: SkynetLabs link */
					esc_html__( 'Free and open source. Built by %s.', 'on-device-ai' ),
					'<a href="https://www.skynetjoe.com" target="_blank" rel="noopener">SkynetLabs</a>'
				);
				?>
			</p>
		</div>
		<?php
	}
}

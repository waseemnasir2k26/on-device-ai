/**
 * On-Device AI — block-editor plugin.
 *
 * No build step: uses the global `wp.*` packages + Chrome's built-in AI
 * (Proofreader / Rewriter / Summarizer / Writer / LanguageModel).
 * Everything runs on the user's device — no network, no API key.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.element || ( ! wp.editor && ! wp.editPost ) ) {
		return;
	}

	var el       = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var useState = wp.element.useState;
	var __       = wp.i18n.__;
	var C        = wp.components;
	var data     = wp.data;

	// PluginSidebar moved from wp.edit-post to wp.editor in WP 6.6+. Prefer the
	// new location, fall back to the old one for 6.3–6.5.
	var editorPkg = wp.editor || {};
	var editPost  = wp.editPost || {};

	var registerPlugin            = wp.plugins.registerPlugin;
	var PluginSidebar             = editorPkg.PluginSidebar || editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem = editorPkg.PluginSidebarMoreMenuItem || editPost.PluginSidebarMoreMenuItem;

	if ( ! PluginSidebar || ! registerPlugin ) {
		return;
	}

	var settings = window.ODA_SETTINGS || {};

	/* ---------- capability detection ---------- */
	function caps() {
		return {
			proofreader: ( typeof self !== 'undefined' ) && ( 'Proofreader' in self ),
			rewriter:    ( typeof self !== 'undefined' ) && ( 'Rewriter' in self ),
			summarizer:  ( typeof self !== 'undefined' ) && ( 'Summarizer' in self ),
			writer:      ( typeof self !== 'undefined' ) && ( 'Writer' in self ),
			prompt:      ( typeof self !== 'undefined' ) && ( 'LanguageModel' in self )
		};
	}

	function anySupported() {
		var c = caps();
		return c.proofreader || c.rewriter || c.summarizer || c.writer || c.prompt;
	}

	/* ---------- editor helpers ---------- */
	function getSelectedBlock() {
		var be = data.select( 'core/block-editor' );
		if ( ! be ) {
			return null;
		}
		return be.getSelectedBlock();
	}

	function blockText( block ) {
		if ( ! block || ! block.attributes ) {
			return '';
		}
		var raw = block.attributes.content;
		// RichText values may be objects in newer cores — normalise to string.
		if ( raw && typeof raw === 'object' && typeof raw.toString === 'function' ) {
			raw = raw.toString();
		}
		raw = ( raw == null ) ? '' : String( raw );
		var tmp = document.createElement( 'div' );
		tmp.innerHTML = raw;
		return ( tmp.textContent || tmp.innerText || '' ).trim();
	}

	function postPlainText() {
		var ed = data.select( 'core/editor' );
		var html = ed ? ed.getEditedPostContent() : '';
		var tmp = document.createElement( 'div' );
		tmp.innerHTML = html || '';
		return ( tmp.textContent || tmp.innerText || '' ).replace( /\s+/g, ' ' ).trim();
	}

	function escapeHtml( s ) {
		return String( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
	}

	function applyToBlock( clientId, text ) {
		// `content` is an HTML-sourced attribute — escape so AI output is shown
		// as literal text, not parsed as markup.
		data.dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, { content: escapeHtml( text ) } );
	}

	function setExcerpt( text ) {
		data.dispatch( 'core/editor' ).editPost( { excerpt: text } );
	}

	function notify( msg, type ) {
		var n = data.dispatch( 'core/notices' );
		if ( n ) {
			n.createNotice( type || 'info', msg, { type: 'snackbar', isDismissible: true } );
		}
	}

	/* ---------- AI session helper ---------- */
	// Creates a session for a global built-in-AI class, reporting download %.
	function withSession( Ctor, opts, onProgress ) {
		// Promise.resolve wrapper so a synchronous throw (e.g. Ctor missing)
		// routes to .catch() instead of leaving the UI stuck on "Thinking…".
		return Promise.resolve().then( function () {
			if ( ! Ctor || typeof Ctor.availability !== 'function' ) {
				throw new Error( 'unavailable' );
			}
			return Ctor.availability();
		} ).then( function ( avail ) {
			if ( avail === 'unavailable' ) {
				throw new Error( 'unavailable' );
			}
			var o = {};
			for ( var k in opts ) {
				if ( Object.prototype.hasOwnProperty.call( opts, k ) ) {
					o[ k ] = opts[ k ];
				}
			}
			o.monitor = function ( m ) {
				m.addEventListener( 'downloadprogress', function ( e ) {
					var pct = e && e.loaded ? Math.round( e.loaded * 100 ) : 0;
					if ( onProgress ) {
						onProgress( pct );
					}
				} );
			};
			return Ctor.create( o );
		} );
	}

	function destroy( session ) {
		try {
			if ( session && typeof session.destroy === 'function' ) {
				session.destroy();
			}
		} catch ( e ) {} // eslint-disable-line no-empty
	}

	/* ---------- the sidebar UI ---------- */
	function Panel() {
		var busyState     = useState( false );
		var busy          = busyState[ 0 ];
		var setBusy       = busyState[ 1 ];
		var progressState = useState( null );
		var progress      = progressState[ 0 ];
		var setProgress   = progressState[ 1 ];
		var toneState     = useState( settings.default_tone || 'as-is' );
		var tone          = toneState[ 0 ];
		var setTone       = toneState[ 1 ];
		var resultState   = useState( '' );
		var result        = resultState[ 0 ];
		var setResult     = resultState[ 1 ];
		var modalState    = useState( false );
		var modalOpen     = modalState[ 0 ];
		var setModalOpen  = modalState[ 1 ];
		var actionState   = useState( '' ); // which action produced the result
		var lastAction    = actionState[ 0 ];
		var setLastAction = actionState[ 1 ];
		var promptState   = useState( '' );
		var promptText    = promptState[ 0 ];
		var setPromptText = promptState[ 1 ];

		var c = caps();

		function onProgress( pct ) {
			setProgress( pct );
		}

		function start() {
			setBusy( true );
			setProgress( null );
		}

		function done() {
			setBusy( false );
			setProgress( null );
		}

		function fail( e ) {
			done();
			if ( e && e.message === 'unavailable' ) {
				notify( __( 'Built-in AI is not available in this browser yet.', 'on-device-ai' ), 'error' );
			} else {
				notify( __( 'On-device AI request failed. Try again.', 'on-device-ai' ), 'error' );
			}
		}

		function openResult( text, action ) {
			setResult( text );
			setLastAction( action );
			setModalOpen( true );
			done();
		}

		/* --- actions --- */
		function doProofread() {
			var block = getSelectedBlock();
			var text  = blockText( block );
			if ( ! text ) {
				notify( __( 'Select a paragraph or heading first.', 'on-device-ai' ), 'warning' );
				return;
			}
			start();
			var s;
			withSession( self.Proofreader, {}, onProgress )
				.then( function ( session ) { s = session; return session.proofread( text ); } )
				.then( function ( r ) {
					destroy( s );
					var corrected = ( r && r.correctedInput ) ? r.correctedInput : ( typeof r === 'string' ? r : text );
					openResult( corrected, 'block' );
				} )
				.catch( function ( e ) { destroy( s ); fail( e ); } );
		}

		function doRewrite() {
			var block = getSelectedBlock();
			var text  = blockText( block );
			if ( ! text ) {
				notify( __( 'Select a paragraph or heading first.', 'on-device-ai' ), 'warning' );
				return;
			}
			start();
			var s;
			withSession( self.Rewriter, { tone: tone, format: 'plain-text', length: 'as-is' }, onProgress )
				.then( function ( session ) { s = session; return session.rewrite( text, { context: 'Improve clarity and flow. Keep the meaning.' } ); } )
				.then( function ( r ) { destroy( s ); openResult( String( r ), 'block' ); } )
				.catch( function ( e ) { destroy( s ); fail( e ); } );
		}

		function doSummarize() {
			var text = postPlainText();
			if ( text.length < 40 ) {
				notify( __( 'Write a bit more before summarizing.', 'on-device-ai' ), 'warning' );
				return;
			}
			start();
			var s;
			withSession( self.Summarizer, { type: 'tldr', format: 'plain-text', length: 'short' }, onProgress )
				.then( function ( session ) { s = session; return session.summarize( text ); } )
				.then( function ( r ) { destroy( s ); openResult( String( r ), 'summary' ); } )
				.catch( function ( e ) { destroy( s ); fail( e ); } );
		}

		function doMeta() {
			var text = postPlainText();
			if ( text.length < 40 ) {
				notify( __( 'Write a bit more before generating a meta description.', 'on-device-ai' ), 'warning' );
				return;
			}
			start();
			var s;
			withSession( self.Summarizer, { type: 'teaser', format: 'plain-text', length: 'short' }, onProgress )
				.then( function ( session ) { s = session; return session.summarize( text, { context: 'Write a compelling ~155 character SEO meta description.' } ); } )
				.then( function ( r ) { destroy( s ); openResult( String( r ).slice( 0, 200 ), 'meta' ); } )
				.catch( function ( e ) { destroy( s ); fail( e ); } );
		}

		function doPrompt() {
			var p = ( promptText || '' ).trim();
			if ( ! p ) {
				notify( __( 'Type a prompt first.', 'on-device-ai' ), 'warning' );
				return;
			}
			start();
			var s;
			withSession( self.LanguageModel, {}, onProgress )
				.then( function ( session ) { s = session; return session.prompt( p ); } )
				.then( function ( r ) { destroy( s ); openResult( String( r ), 'prompt' ); } )
				.catch( function ( e ) { destroy( s ); fail( e ); } );
		}

		/* --- apply result --- */
		function applyResult() {
			if ( lastAction === 'meta' ) {
				setExcerpt( result );
				notify( __( 'Saved as the post excerpt.', 'on-device-ai' ), 'success' );
			} else if ( lastAction === 'block' ) {
				var block = getSelectedBlock();
				if ( block ) {
					applyToBlock( block.clientId, result );
					notify( __( 'Block updated.', 'on-device-ai' ), 'success' );
				}
			} else {
				// summary / prompt → copy to clipboard.
				copyResult();
			}
			setModalOpen( false );
		}

		function copyResult() {
			if ( navigator.clipboard && navigator.clipboard.writeText ) {
				navigator.clipboard.writeText( result );
				notify( __( 'Copied to clipboard.', 'on-device-ai' ), 'success' );
			}
		}

		/* --- render --- */
		var rows = [];

		if ( ! anySupported() ) {
			rows.push(
				el( C.Notice, { status: 'warning', isDismissible: false, key: 'unsupported' },
					__( 'Chrome\'s built-in AI is not detected. Use desktop Chrome 138+ (or Edge) with built-in AI enabled. Your content stays private either way.', 'on-device-ai' )
				)
			);
		} else {
			rows.push(
				el( C.Notice, { status: 'success', isDismissible: false, key: 'ready' },
					__( 'On-device AI ready. Nothing you write is sent to a server.', 'on-device-ai' )
				)
			);
		}

		if ( busy ) {
			rows.push(
				el( 'div', { key: 'busy', style: { display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' } },
					el( C.Spinner, null ),
					el( 'span', null, progress != null ? __( 'Downloading model…', 'on-device-ai' ) + ' ' + progress + '%' : __( 'Thinking…', 'on-device-ai' ) )
				)
			);
		}

		if ( settings.enable_rewrite && c.rewriter ) {
			rows.push(
				el( C.SelectControl, {
					key: 'tone',
					label: __( 'Rewrite tone', 'on-device-ai' ),
					value: tone,
					disabled: busy,
					options: [
						{ label: __( 'Keep tone (just improve)', 'on-device-ai' ), value: 'as-is' },
						{ label: __( 'More formal', 'on-device-ai' ), value: 'more-formal' },
						{ label: __( 'More casual', 'on-device-ai' ), value: 'more-casual' }
					],
					onChange: setTone
				} )
			);
		}

		function btn( key, label, handler, show ) {
			if ( ! show ) {
				return null;
			}
			return el( C.Button, {
				key: key,
				variant: 'secondary',
				disabled: busy,
				onClick: handler,
				style: { marginBottom: '8px', width: '100%', justifyContent: 'center' }
			}, label );
		}

		rows.push( btn( 'proofread', __( 'Proofread selected block', 'on-device-ai' ), doProofread, settings.enable_proofread && c.proofreader ) );
		rows.push( btn( 'rewrite', __( 'Rewrite selected block', 'on-device-ai' ), doRewrite, settings.enable_rewrite && c.rewriter ) );
		rows.push( btn( 'summarize', __( 'Summarize post', 'on-device-ai' ), doSummarize, settings.enable_summarize && c.summarizer ) );
		rows.push( btn( 'meta', __( 'Generate meta description', 'on-device-ai' ), doMeta, settings.enable_meta && c.summarizer ) );

		if ( settings.enable_prompt && c.prompt ) {
			rows.push(
				el( C.TextareaControl, {
					key: 'prompt-input',
					label: __( 'Ask the on-device model', 'on-device-ai' ),
					value: promptText,
					disabled: busy,
					onChange: setPromptText,
					placeholder: __( 'e.g. Suggest 5 title ideas for this post', 'on-device-ai' )
				} )
			);
			rows.push( btn( 'prompt-run', __( 'Run prompt', 'on-device-ai' ), doPrompt, true ) );
		}

		var modal = null;
		if ( modalOpen ) {
			modal = el( C.Modal, {
				title: __( 'On-Device AI result', 'on-device-ai' ),
				onRequestClose: function () { setModalOpen( false ); },
				key: 'modal'
			},
				el( C.TextareaControl, {
					value: result,
					rows: 8,
					onChange: setResult
				} ),
				el( 'div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
					el( C.Button, { variant: 'primary', onClick: applyResult },
						lastAction === 'meta' ? __( 'Save as excerpt', 'on-device-ai' )
							: ( lastAction === 'block' ? __( 'Replace block text', 'on-device-ai' ) : __( 'Copy', 'on-device-ai' ) )
					),
					el( C.Button, { variant: 'tertiary', onClick: copyResult }, __( 'Copy', 'on-device-ai' ) ),
					el( C.Button, { variant: 'tertiary', onClick: function () { setModalOpen( false ); } }, __( 'Close', 'on-device-ai' ) )
				)
			);
		}

		return el( C.PanelBody, { title: __( 'On-Device AI', 'on-device-ai' ), initialOpen: true },
			rows,
			modal
		);
	}

	function Sidebar() {
		return el( Fragment, null,
			el( PluginSidebarMoreMenuItem, { target: 'oda-sidebar' }, __( 'On-Device AI', 'on-device-ai' ) ),
			el( PluginSidebar, { name: 'oda-sidebar', title: __( 'On-Device AI', 'on-device-ai' ), icon: 'superhero-alt' },
				el( Panel, null )
			)
		);
	}

	registerPlugin( 'on-device-ai', { render: Sidebar } );
} )( window.wp );

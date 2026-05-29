=== On-Device AI — Private Writing Assistant (Chrome Built-in AI) ===
Contributors: skynetlabs
Tags: ai, gutenberg, writing-assistant, proofreading, privacy
Requires at least: 6.3
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI writing help in the block editor — proofread, rewrite, summarize, generate meta. Runs on Chrome's built-in AI (Gemini Nano). No API key, no cost, no cloud.

== Description ==

Every other AI writing plugin sends your draft to OpenAI (or similar) and bills you per token. **On-Device AI does neither.**

It adds an AI panel to the WordPress block editor that uses **Chrome's built-in AI (Gemini Nano)** — a model that runs **directly on the writer's own device**. There is **no API key to paste, no per-token cost, and no cloud round-trip.** Your unpublished draft never leaves the browser.

= What you can do =

* **Proofread** the selected block (grammar + spelling) and review the fix before applying.
* **Rewrite** the selected block — keep the tone, or make it more formal / more casual.
* **Summarize** the whole post into a short TL;DR.
* **Generate a meta description / excerpt** and save it to the post with one click.
* **Free prompt** — ask the on-device model anything about your draft.

Every result opens in a review panel first — nothing is changed without your confirmation.

= Why on-device matters =

* **$0 forever** — no metered API, no subscription, no usage caps.
* **Private by design** — drafts, client content, and unpublished work stay on the device.
* **Works offline** once the model is downloaded.

= Requirements =

Desktop **Chrome 138+** (or a Chromium browser such as Edge) with built-in AI available. On first use the browser downloads the on-device model once (a few GB, one time). Where built-in AI is unavailable, the panel shows a clear notice instead of breaking — the rest of WordPress is unaffected.

== Installation ==

1. Upload the `on-device-ai` folder to `/wp-content/plugins/`, or install via the Plugins screen.
2. Activate the plugin.
3. Open any post in the block editor — click the **On-Device AI** icon (top-right toolbar) to open the panel.
4. (Optional) Settings → On-Device AI to choose which tools appear.

== Frequently Asked Questions ==

= Does my content get sent to a server or an AI company? =

No. The model runs on the writer's own device through the browser's built-in AI. Nothing is uploaded.

= Do I need an API key or a paid account? =

No. There is no key and no per-use cost — that is the whole point.

= It says built-in AI is not available. Why? =

Built-in AI requires a recent desktop Chromium browser (Chrome 138+) with the feature enabled, and a one-time on-device model download. On unsupported browsers the panel simply shows a notice.

= Does it work in the Classic Editor? =

The panel is built for the block editor (Gutenberg). The Classic Editor is not supported.

== Changelog ==

= 1.0.0 =
* Initial release: proofread, rewrite/tone, summarize, meta description, and free-prompt tools in the block editor, powered by Chrome's built-in AI. Review-before-apply for every result.

== Upgrade Notice ==

= 1.0.0 =
First release.

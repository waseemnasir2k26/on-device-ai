# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026.09] - 2026-09-16

- Maintenance review of on-device-ai — a WordPress plugin that adds a private writing assistant (proofread, rewrite/tone, summarize, meta description, free prompt) to the block editor using Chrome's built-in Gemini Nano APIs, so no API key and no cloud call are involved.
- Status: plugin version 1.0.0 (header in `on-device-ai.php`, stable tag 1.0.0 in `readme.txt`), requires WordPress 6.3+ / PHP 7.4+ and desktop Chrome 138+; GPL-2.0-or-later, with a loader singleton and a settings screen in `includes/`, and a no-build Gutenberg plugin in `assets/editor.js`.
- Reviewed September 2026: docs refreshed, versioned as v2026.09. No PHP, JS or CSS was changed, and the plugin header version was deliberately left at 1.0.0 since no code changed.
- Known gaps: no CHANGELOG before this release (now created); no automated tests or CI; no build step or linting config; unsupported browsers fall back to a notice only, which is documented but not test-covered.

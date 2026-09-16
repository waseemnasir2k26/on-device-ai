# On-Device AI — Private Writing Assistant for WordPress

> AI writing help **inside the block editor** — proofread, rewrite, change tone, summarize, generate meta — powered by **Chrome's built-in AI (Gemini Nano)**. No API key. No per-token cost. No cloud. Your draft never leaves the browser.

[![License: GPL v2+](https://img.shields.io/badge/License-GPLv2%2B-blue.svg)](LICENSE)
![WordPress](https://img.shields.io/badge/WordPress-6.3%2B-21759B?logo=wordpress&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4?logo=php&logoColor=white)
![No API cost](https://img.shields.io/badge/API_cost-%240-2EA043)
![On-device](https://img.shields.io/badge/runs-on--device-9D4EDD)

---

## Status

Last reviewed: September 2026 · release v2026.09

## Why this is different

Every other WordPress AI plugin sends your draft to OpenAI (or similar) and **bills you per token**. This one uses [**Chrome's built-in AI**](https://developer.chrome.com/docs/ai/built-in) — the Gemini Nano model that ships *inside the browser* and runs **on the writer's own machine**.

- 🔑 **No API key** to paste or leak
- 💸 **$0 forever** — no metered API, no subscription, no caps
- 🔒 **Private by design** — unpublished drafts / client content stay on-device
- ✈️ **Works offline** once the model is downloaded

> At time of writing, WordPress AI plugins all require a paid cloud key. This is built to be the first that doesn't.

## What it does

| Tool | Action |
|---|---|
| **Proofread** | Fix grammar + spelling on the selected block |
| **Rewrite / tone** | Improve the selected block — keep tone, or go more formal / casual |
| **Summarize** | TL;DR of the whole post |
| **Meta description** | Generate an SEO excerpt and save it to the post |
| **Free prompt** | Ask the on-device model anything about your draft |

Every result opens in a **review panel first** — nothing changes without your confirmation.

## How it works

```
Block editor  →  window built-in AI (Proofreader / Rewriter / Summarizer / LanguageModel)
                 └─ Gemini Nano, on-device, no network call
              →  review modal  →  you apply to block / save as excerpt / copy
```

No build step: the editor plugin is plain JS over the global `wp.*` packages + the browser's built-in AI APIs.

## Requirements

Desktop **Chrome 138+** (or Chromium-based Edge) with built-in AI enabled; a one-time on-device model download on first use. On unsupported browsers the panel shows a friendly notice — WordPress is otherwise unaffected.

## Install

1. Copy `on-device-ai` into `wp-content/plugins/` (or zip → Plugins → Add New → Upload).
2. Activate.
3. Open a post → click the **On-Device AI** icon in the editor's top-right toolbar.
4. Optional: **Settings → On-Device AI** to toggle tools.

## Structure

```
on-device-ai/
├── on-device-ai.php            # Bootstrap + editor-asset enqueue
├── uninstall.php
├── readme.txt                  # wp.org readme
├── includes/
│   ├── class-oda-kit.php       # Loader (singleton)
│   └── class-oda-settings.php  # Settings → On-Device AI
└── assets/
    ├── editor.js               # Gutenberg plugin (no build) + built-in AI calls
    └── editor.css
```

## License

GPL-2.0-or-later. Built by [SkynetLabs](https://www.skynetjoe.com). PRs welcome.

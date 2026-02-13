# ⚛️ Atomic to Lichess

**A Firefox extension to let you easily send Chess.com variant games to lichess analysis with one click**

Everything below this is a claude code overview of what this about, sorry for the slop. Reach out if you have questions.


[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/otisp/atomic-chess-analysis)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Firefox](https://img.shields.io/badge/Firefox-57%2B-orange.svg)](https://www.mozilla.org/firefox/)

## ✨ Features

- **🚀 One-Click Transfer** - Send any Chess.com Atomic game to Lichess instantly
- **🔄 Automatic Pasting** - PGN is automatically pasted into Lichess analysis
- **⚡ Auto-Submit** - Form automatically submits - analysis starts immediately
- **📢 Smart Notifications** - Beautiful toast notifications for all actions
- **🎯 Contextual Button** - Button appears right next to Chess.com's download button
- **🎨 Modern UI** - Clean icon-based button that matches Chess.com's style
- **🔒 Privacy-Focused** - No data collection, no settings stored, zero tracking
- **⚡ Lightweight** - Under 2,000 lines of code, minimal permissions

## 📦 Installation

### From Firefox Add-ons (Recommended)

*Coming soon - awaiting Mozilla review*

### Manual Installation (Development)

1. **Download or clone this repository:**
   ```bash
   git clone https://github.com/yourusername/atomic-chess-analysis.git
   cd atomic-chess-analysis
   ```

2. **Open Firefox** and navigate to `about:debugging#/runtime/this-firefox`

3. **Click "Load Temporary Add-on"**

4. **Select the `manifest.json`** file from the repository folder

5. **Done!** 🎉

> **Note:** Temporary add-ons are removed when Firefox restarts. For permanent installation, package as .xpi or install from Firefox Add-ons.

## 🎯 Usage

### Quick Start

1. **Visit a Chess.com Atomic game**
   - Play a game or view any completed atomic game
   - URL format: `https://www.chess.com/variants/atomic/game/{game-id}`

2. **Find the button**
   - Look in the moves panel (where the download/trash buttons are)
   - You'll see a green **⚛** (atomic symbol) icon

3. **Click it!**
   - Extracts the game PGN
   - Opens Lichess in a new tab
   - Auto-pastes and auto-submits
   - Analysis starts immediately

### Button States

The button icon changes to show status:

- **⚛ (green)** - Ready to send
- **⟳ (orange)** - Processing/loading
- **✓ (green)** - Success!
- **✗ (red)** - Error occurred

### Where's the Button?

The button appears in the **moves controls panel**, right next to Chess.com's download and trash buttons:

```
[Moves List]
┌─────────────────────────┐
│ 14. Rxe7#               │
│                         │
│ 27/27                   │
│                         │
│ [⬇] [🗑] [⚛] ← HERE!   │
└─────────────────────────┘
```

## 🐛 Troubleshooting

### Button doesn't appear

**Possible causes:**
- Not on an Atomic game page
- Game moves panel hasn't loaded yet
- Extension not loaded/enabled

**Solutions:**
1. Ensure you're on a URL matching: `https://www.chess.com/variants/atomic/game/*`
2. Wait for the game to fully load
3. Check `about:addons` to verify extension is enabled
4. Check browser console (F12) for errors

### "Clipboard access denied" error

**Cause:** Firefox requires explicit clipboard permission.

**Solution:**
1. Click the 🔒 lock icon in the address bar
2. Find "Use the clipboard" permission
3. Change to "Allow"
4. Refresh the page

### Lichess tab opens but nothing happens

**Possible causes:**
- Clipboard permissions not granted on Lichess
- Network issue

**Solutions:**
1. Grant clipboard **read** permission on lichess.org (see above)
2. Try manually pasting (Ctrl+V) if auto-paste fails
3. Check your network connection

### Button shows error (✗)

**What to do:**
1. Open browser console (F12) to see the error
2. Try clicking the button again
3. Refresh the Chess.com page and try again
4. [Report the issue](https://github.com/yourusername/atomic-chess-analysis/issues) with console errors

## 🔐 Privacy & Permissions

### Required Permissions

- **`clipboardRead`** - To read PGN from clipboard on Lichess
- **`clipboardWrite`** - To copy PGN to clipboard on Chess.com
- **`https://www.chess.com/*`** - To inject the button on Chess.com game pages
- **`https://lichess.org/*`** - To auto-paste PGN on Lichess analysis page

### Privacy Guarantee

- ✅ **Zero data collection** - No telemetry, analytics, or tracking
- ✅ **No settings stored** - Extension works with sensible defaults
- ✅ **No external requests** - All processing happens in your browser
- ✅ **No account access** - Doesn't touch your Chess.com or Lichess accounts
- ✅ **Open source** - Full transparency, audit the code yourself

## 🛠️ Development

### Prerequisites

- Firefox 57+ (or Developer Edition)
- Git
- Text editor

### Project Structure

```
atomic-chess-analysis/
├── manifest.json              # Extension manifest (Manifest V2)
├── src/
│   ├── content_chesscom.js   # Chess.com content script
│   ├── content_lichess.js    # Lichess content script
│   └── shared/
│       ├── constants.js      # Configuration constants
│       ├── dom-utils.js      # DOM helper functions
│       ├── notifications.js  # Toast notification system
│       └── pgn-validator.js  # PGN validation
├── icons/                     # Extension icons (16, 48, 128px)
├── README.md                  # This file
└── LICENSE                    # MIT License
```

### Architecture

**Simple and focused:**
- No build step - pure JavaScript
- No dependencies - vanilla JS only
- No storage - stateless operation
- Content scripts only - no background worker
- Modular design - shared utilities

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/atomic-chess-analysis.git
cd atomic-chess-analysis

# Load in Firefox
# 1. Go to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select manifest.json

# Make changes to the code
# Reload extension in about:debugging to test
```

### Testing

**Manual testing workflow:**

1. **Chess.com test:**
   - Visit https://www.chess.com/variants/atomic/game/[any-game-id]
   - Verify ⚛ button appears next to download button
   - Click and verify it extracts PGN correctly

2. **Lichess test:**
   - Verify new tab opens at lichess.org/paste
   - Check that PGN auto-pastes
   - Verify form auto-submits

3. **Error testing:**
   - Test with clipboard permissions denied
   - Test on non-game pages (button shouldn't appear)
   - Test with network offline

4. **Console checks:**
   - Look for `[Atomic→Lichess]` log messages
   - Ensure no errors in normal operation

### Debugging

**Enable debug logging** (in constants.js):
```javascript
export const LOG_CONFIG = {
  PREFIX: '[Atomic→Lichess]',
  ENABLE_DEBUG: true, // Set to true for verbose logs
};
```

**Check logs in:**
- Content scripts: Page console (F12)
- Extension errors: Browser console (Ctrl+Shift+J)

### Building for Release

```bash
# Create a .xpi package
cd atomic-chess-analysis
zip -r atomic-to-lichess-v1.0.0.xpi * \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x ".claude/*"
```

## 🤝 Contributing

Contributions welcome! Here's how:

### Reporting Bugs

1. Check [existing issues](https://github.com/yourusername/atomic-chess-analysis/issues)
2. Create a new issue with:
   - Firefox version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)

### Suggesting Features

1. Open an issue with the "enhancement" label
2. Describe the feature and use case
3. Discuss implementation approach

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use modern JavaScript (ES6+)
- Keep functions small and focused
- Add JSDoc comments for functions
- Use meaningful variable names
- Follow existing code patterns

## 📝 Changelog

### Version 1.0.0 (2024-02-13) - Initial Release

**Core Features:**
- One-click transfer from Chess.com Atomic games to Lichess analysis
- Contextual button placement (next to Chess.com's download button)
- Icon-based design matching Chess.com's style
- Auto-paste and auto-submit on Lichess
- Beautiful toast notifications for user feedback
- PGN validation and error handling

**Architecture:**
- Simple, lightweight design (under 2,000 lines)
- No settings or configuration needed (just works!)
- No storage permission required
- Content scripts only (no background worker)
- Manifest V2 for maximum Firefox compatibility

**Privacy:**
- Zero data collection
- No tracking or analytics
- All processing happens locally
- Minimal permissions (clipboard + host access only)

## 📄 License

MIT License - see below for details:

```
MIT License

Copyright (c) 2024 Otis Peterson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **Chess.com** - For providing an excellent platform for atomic chess
- **Lichess** - For the best free, open-source chess analysis tools
- **Atomic Chess Community** - For feedback and support

## 📬 Contact

- **Issues:** [GitHub Issues](https://github.com/otisp/atomic-chess-analysis/issues)
- **Discussions:** [GitHub Discussions](https://github.com/otisp/atomic-chess-analysis/discussions)

---

<div align="center">

**Made with ❤️ for the Atomic Chess community**

**Simple. Fast. Private.**

[Report Bug](https://github.com/otisp/atomic-chess-analysis/issues) · [Request Feature](https://github.com/otisp/atomic-chess-analysis/issues)

</div>

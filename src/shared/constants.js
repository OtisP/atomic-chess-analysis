/**
 * Central configuration and constants for Atomic to Lichess extension
 * All magic numbers, selectors, and configuration values in one place
 */

/**
 * DOM Selectors for Chess.com
 * Primary selectors with fallbacks for robustness
 */
const CHESS_COM_SELECTORS = {
  // PGN download button selectors (ordered by priority)
  PGN_BUTTON_PRIMARY: '.moves-btn-icon.moves-reset',
  PGN_BUTTON_FALLBACK: '[aria-label="Download"]',
  PGN_BUTTON_FALLBACK_2: '.icon-font-chess.download',
  PGN_BUTTON_CONTAINER: '.moves-controls',

  // Game board and container selectors
  GAME_BOARD: '.container-four-board-wrapper',
  GAME_CONTAINER: '[class*="board"]',

  // Data attributes for PGN extraction
  PGN_DATA_LINK: 'a[href^="data:text/plain"]',
};

/**
 * DOM Selectors for Lichess
 */
const LICHESS_SELECTORS = {
  // Paste page elements
  PASTE_TEXTAREA: 'textarea.form-control',
  PASTE_TEXTAREA_FALLBACK: 'textarea',
  PASTE_FORM: 'form.form3',
  PASTE_SUBMIT_BUTTON: 'button[type="submit"]',

  // Analysis board elements
  ANALYSIS_BOARD: '.analyse__board',
};

/**
 * Timeout values (in milliseconds)
 */
const TIMEOUTS = {
  // Maximum time to wait for DOM elements to appear
  ELEMENT_WAIT: 5000,

  // Notification display duration
  NOTIFICATION_DURATION: 5000,
  NOTIFICATION_ERROR_DURATION: 8000,

  // Debounce delay for button clicks
  BUTTON_DEBOUNCE: 300,

  // Retry intervals
  RETRY_INTERVAL: 100,
  MAX_RETRIES: 50, // Combined with RETRY_INTERVAL = 5 seconds max
};

/**
 * Button positioning and styling
 */
const BUTTON_CONFIG = {
  // Default position (fixed positioning)
  DEFAULT_TOP: 20,
  DEFAULT_RIGHT: 20,

  // Button dimensions
  MIN_WIDTH: 140,
  PADDING: '10px 15px',

  // Z-index to ensure visibility
  Z_INDEX: 9999,

  // Border radius
  BORDER_RADIUS: '5px',
};

/**
 * Notification configuration
 */
const NOTIFICATION_CONFIG = {
  // Position
  POSITION_TOP: 20,
  POSITION_RIGHT: 20,

  // Z-index
  Z_INDEX: 10000,

  // Animation duration
  ANIMATION_DURATION: 300,

  // Max width
  MAX_WIDTH: 350,
};

/**
 * Variant detection patterns
 * Maps variant names to URL patterns
 */
const VARIANT_PATTERNS = {
  atomic: /chess\.com\/variants?\/atomic\/game/i,
  crazyhouse: /chess\.com\/variants?\/crazyhouse\/game/i,
  threeCheck: /chess\.com\/variants?\/3-?check\/game/i,
  kingOfTheHill: /chess\.com\/variants?\/king-?of-?the-?hill\/game/i,
  // Add more variants as needed
};

/**
 * Lichess variant URL mappings
 * Maps Chess.com variant names to Lichess variant codes
 */
const LICHESS_VARIANT_CODES = {
  atomic: 'atomic',
  crazyhouse: 'crazyhouse',
  threeCheck: 'threeCheck',
  kingOfTheHill: 'kingOfTheHill',
};

/**
 * Error messages for user display
 */
const ERROR_MESSAGES = {
  PGN_NOT_FOUND: 'Game data not found. Please ensure the game is fully loaded.',
  PGN_BUTTON_NOT_FOUND: 'Download button not found. The Chess.com interface may have changed.',
  CLIPBOARD_WRITE_DENIED: 'Clipboard access denied. Please check browser permissions.',
  CLIPBOARD_READ_DENIED: 'Could not read clipboard. Please check browser permissions or paste manually.',
  LICHESS_TAB_FAILED: 'Could not open Lichess tab. Please check if pop-ups are blocked.',
  TEXTAREA_NOT_FOUND: 'Paste area not found. Please try manually.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  INVALID_PGN: 'Invalid game data format. Please try downloading the PGN manually.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
};

/**
 * Success messages for user display
 */
const SUCCESS_MESSAGES = {
  PGN_EXTRACTED: 'Game data extracted successfully!',
  SENT_TO_LICHESS: 'Game sent to Lichess!',
  PASTED_SUCCESSFULLY: 'Game data pasted successfully!',
  READY_FOR_ANALYSIS: 'Ready for analysis!',
};

/**
 * Loading messages for user display
 */
const LOADING_MESSAGES = {
  EXTRACTING_PGN: 'Extracting game data...',
  OPENING_LICHESS: 'Opening Lichess...',
  PASTING_DATA: 'Pasting game data...',
  SUBMITTING_FORM: 'Loading analysis...',
  PROCESSING: 'Processing...',
};

// Settings removed - extension now works with sensible defaults only

/**
 * Regular expressions for validation
 */
const REGEX_PATTERNS = {
  // Basic PGN validation (checks for required headers and moves)
  PGN_HEADER: /\[(\w+)\s+"([^"]+)"\]/,
  PGN_MOVE: /\d+\.\s*(?:[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQK])?|O-O(?:-O)?)[+#]?/,

  // URL patterns
  CHESS_COM_GAME_URL: /chess\.com\/.*\/game\/\d+/,
  LICHESS_URL: /lichess\.org/,

  // Data URL for PGN extraction
  DATA_URL_PGN: /^data:text\/plain;charset=utf-8,(.+)$/,
};

/**
 * Extension metadata
 */
const EXTENSION_INFO = {
  NAME: 'Atomic to Lichess',
  VERSION: '1.0.0',
  GITHUB_URL: 'https://github.com/otisp/atomic-chess-analysis',
  SUPPORT_URL: 'https://github.com/otisp/atomic-chess-analysis/issues',
};

/**
 * Logging configuration
 */
const LOG_CONFIG = {
  PREFIX: '[Atomic→Lichess]',
  ENABLE_DEBUG: true, // Set to false in production
};

/**
 * Helper function to log with consistent prefix
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {...any} args - Arguments to log
 */
function log(level, ...args) {
  if (!LOG_CONFIG.ENABLE_DEBUG && level === 'debug') return;

  const method = console[level] || console.log;
  method(LOG_CONFIG.PREFIX, ...args);
}

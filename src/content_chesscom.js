/**
 * Chess.com Content Script
 * Adds "Send to Lichess" button to atomic chess games
 */

// Button reference for cleanup
let sendButton = null;
let isProcessing = false;
let buttonObserver = null;

/**
 * Main entry point
 */
async function initialize() {
  log('info', 'Initializing Chess.com extension');

  try {
    // Ensure we're on a game page
    if (!REGEX_PATTERNS.CHESS_COM_GAME_URL.test(window.location.href)) {
      log('debug', 'Not on a game page, skipping initialization');
      return;
    }

    // Wait for game board to load
    await waitForElement(
      [CHESS_COM_SELECTORS.GAME_BOARD, CHESS_COM_SELECTORS.GAME_CONTAINER],
      10000 // 10 second timeout for game board
    );

    log('debug', 'Game board loaded');

    // Inject the "Send to Lichess" button (may fall back to fixed if controls aren't ready)
    injectButton();

    // Watch for moves controls to appear/change so we can inject the button
    // into the proper location when it becomes available
    observeMovesControls();

    log('info', 'Initialization complete');
  } catch (error) {
    log('error', 'Initialization failed:', error);
  }
}

/**
 * Inject the "Send to Lichess" button
 */
function injectButton() {
  // Check if button already exists
  if (document.querySelector('#atomic-to-lichess-btn')) {
    log('debug', 'Button already exists');
    return;
  }

  // Find the moves controls container
  const movesControls = document.querySelector('.moves-controls .moves-controls-row');

  if (!movesControls) {
    log('warn', 'Moves controls not found, falling back to fixed position');
    injectButtonFixed();
    return;
  }

  // Create button container (matching Chess.com's style)
  const buttonContainer = createElement('div', {
    attrs: {
      class: 'moves-btn-icon',
      id: 'atomic-to-lichess-btn-container',
      title: 'Send this game to Lichess for analysis',
    },
    styles: {
      cursor: 'pointer',
    },
  });

  // Create icon span (matching Chess.com's icon style)
  const iconSpan = createElement('span', {
    attrs: {
      class: 'moves-icon icon-font-chess',
      id: 'atomic-to-lichess-btn',
    },
    styles: {
      color: '#4CAF50',
      fontSize: '20px',
      fontWeight: 'bold',
      transition: 'color 0.2s ease',
    },
    text: '⚛',  // Atomic symbol
  });

  buttonContainer.appendChild(iconSpan);
  sendButton = buttonContainer;

  // Add hover effect
  buttonContainer.addEventListener('mouseenter', () => {
    if (!isProcessing) {
      iconSpan.style.color = '#45a049';
    }
  });

  buttonContainer.addEventListener('mouseleave', () => {
    if (!isProcessing) {
      iconSpan.style.color = '#4CAF50';
    }
  });

  // Add click handler with debounce
  buttonContainer.addEventListener('click', debounce(handleButtonClick, 300));

  // Insert after the download button
  const downloadButton = movesControls.querySelector('.moves-btn-icon.moves-reset');
  if (downloadButton) {
    downloadButton.parentNode.insertBefore(buttonContainer, downloadButton.nextSibling);
  } else {
    // Fallback: append to the end of the row
    movesControls.appendChild(buttonContainer);
  }

  log('info', 'Button injected successfully next to download button');
}

/**
 * Inject button in fixed position (fallback)
 */
function injectButtonFixed() {
  sendButton = createElement('button', {
    attrs: {
      id: 'atomic-to-lichess-btn',
      type: 'button',
      title: 'Send this game to Lichess for analysis',
    },
    styles: {
      position: 'fixed',
      top: `${BUTTON_CONFIG.DEFAULT_TOP}px`,
      right: `${BUTTON_CONFIG.DEFAULT_RIGHT}px`,
      zIndex: BUTTON_CONFIG.Z_INDEX,
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    text: '⚛ Lichess',
  });

  sendButton.addEventListener('click', debounce(handleButtonClick, 300));
  document.body.appendChild(sendButton);
  log('info', 'Button injected in fixed position (fallback)');
}

/**
 * Handle button click event
 */
async function handleButtonClick() {
  if (isProcessing) {
    log('debug', 'Already processing, ignoring click');
    return;
  }

  log('info', 'Send to Lichess button clicked');
  isProcessing = true;

  let notificationId = null;

  try {
    // Update button to loading state
    updateButtonState('loading');

    // Show loading notification
    notificationId = showLoading(LOADING_MESSAGES.EXTRACTING_PGN);

    // Extract PGN
    const pgn = await extractPGN();

    if (!pgn) {
      throw new Error(ERROR_MESSAGES.PGN_NOT_FOUND);
    }

    log('debug', `PGN extracted, length: ${pgn.length} characters`);

    // Update notification
    updateNotification(notificationId, LOADING_MESSAGES.OPENING_LICHESS, 'loading');

    // Sanitize PGN before copying (fixes resignation/timeout comments breaking import)
    const cleanPGN = sanitizePGN(pgn);

    // Copy PGN to clipboard
    await copyToClipboard(cleanPGN);

    // Open Lichess in new tab
    await openLichessTab();

    // Update button to success state
    updateButtonState('success');

    // Show success notification
    updateNotification(notificationId, SUCCESS_MESSAGES.SENT_TO_LICHESS, 'success', 3000);

    // Reset button after delay
    setTimeout(() => {
      updateButtonState('idle');
      isProcessing = false;
    }, 2000);

  } catch (error) {
    log('error', 'Error processing game:', error);

    // Update button to error state
    updateButtonState('error');

    // Show error notification
    if (notificationId) {
      updateNotification(notificationId, error.message || ERROR_MESSAGES.GENERIC_ERROR, 'error', 8000);
    } else {
      showError(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }

    // Reset button after delay
    setTimeout(() => {
      updateButtonState('idle');
      isProcessing = false;
    }, 3000);
  }
}

/**
 * Extract PGN from the Chess.com page
 * @returns {Promise<string>} - PGN string
 */
async function extractPGN() {
  log('debug', 'Attempting to extract PGN');

  return new Promise((resolve, reject) => {
    // Find PGN download button
    const pgnButton = querySelectorFallback([
      CHESS_COM_SELECTORS.PGN_BUTTON_PRIMARY,
      CHESS_COM_SELECTORS.PGN_BUTTON_FALLBACK,
      CHESS_COM_SELECTORS.PGN_BUTTON_FALLBACK_2,
    ]);

    if (!pgnButton) {
      log('error', 'PGN button not found');
      reject(new Error(ERROR_MESSAGES.PGN_BUTTON_NOT_FOUND));
      return;
    }

    log('debug', 'PGN button found, setting up interceptor');

    // Set up download interceptor
    let interceptorRemoved = false;

    function interceptDownload(e) {
      const target = e.target;

      // Check if this is the PGN download link
      if (target.tagName === 'A' && target.href && target.href.startsWith('data:text/plain')) {
        e.preventDefault();
        e.stopPropagation();

        log('debug', 'PGN download intercepted');

        try {
          // Extract PGN from data URL
          const match = target.href.match(REGEX_PATTERNS.DATA_URL_PGN);

          if (!match) {
            throw new Error('Invalid data URL format');
          }

          const pgn = decodeURIComponent(match[1]);

          // Clean up interceptor
          if (!interceptorRemoved) {
            document.removeEventListener('click', interceptDownload, true);
            interceptorRemoved = true;
          }

          log('debug', 'PGN extracted successfully');
          resolve(pgn);
        } catch (error) {
          // Clean up interceptor
          if (!interceptorRemoved) {
            document.removeEventListener('click', interceptDownload, true);
            interceptorRemoved = true;
          }

          log('error', 'Failed to extract PGN from data URL:', error);
          reject(new Error(ERROR_MESSAGES.INVALID_PGN));
        }
      }
    }

    // Add interceptor
    document.addEventListener('click', interceptDownload, true);

    // Set timeout for extraction
    const timeoutId = setTimeout(() => {
      if (!interceptorRemoved) {
        document.removeEventListener('click', interceptDownload, true);
        interceptorRemoved = true;
      }
      log('error', 'PGN extraction timeout');
      reject(new Error(ERROR_MESSAGES.PGN_NOT_FOUND));
    }, 5000);

    // Click the PGN button
    try {
      pgnButton.click();
      log('debug', 'PGN button clicked');
    } catch (error) {
      clearTimeout(timeoutId);
      if (!interceptorRemoved) {
        document.removeEventListener('click', interceptDownload, true);
        interceptorRemoved = true;
      }
      log('error', 'Failed to click PGN button:', error);
      reject(new Error(ERROR_MESSAGES.PGN_BUTTON_NOT_FOUND));
    }
  });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
  log('debug', 'Copying to clipboard');

  try {
    await navigator.clipboard.writeText(text);
    log('debug', 'Copied to clipboard successfully');
  } catch (error) {
    log('error', 'Failed to copy to clipboard:', error);
    throw new Error(ERROR_MESSAGES.CLIPBOARD_WRITE_DENIED);
  }
}

/**
 * Open Lichess paste page in new tab
 */
async function openLichessTab() {
  log('debug', 'Opening Lichess tab');

  try {
    const newTab = window.open('https://lichess.org/paste', '_blank');

    if (!newTab) {
      throw new Error('Failed to open new tab');
    }

    log('debug', 'Lichess tab opened successfully');
  } catch (error) {
    log('error', 'Failed to open Lichess tab:', error);
    throw new Error(ERROR_MESSAGES.LICHESS_TAB_FAILED);
  }
}

/**
 * Update button state (idle, loading, success, error)
 * @param {string} state - Button state
 */
function updateButtonState(state) {
  if (!sendButton) return;

  const iconSpan = sendButton.querySelector('.moves-icon') || sendButton;

  switch (state) {
    case 'loading':
      iconSpan.textContent = '⟳';  // Spinning arrow
      iconSpan.style.color = '#FF9800';
      sendButton.style.cursor = 'wait';
      sendButton.style.pointerEvents = 'none';
      break;

    case 'success':
      iconSpan.textContent = '✓';  // Checkmark
      iconSpan.style.color = '#4CAF50';
      sendButton.style.cursor = 'default';
      break;

    case 'error':
      iconSpan.textContent = '✗';  // X mark
      iconSpan.style.color = '#f44336';
      sendButton.style.cursor = 'pointer';
      sendButton.style.pointerEvents = 'auto';
      break;

    case 'idle':
    default:
      iconSpan.textContent = '⚛';  // Atomic symbol
      iconSpan.style.color = '#4CAF50';
      sendButton.style.cursor = 'pointer';
      sendButton.style.pointerEvents = 'auto';
      break;
  }
}

/**
 * Watch for moves controls to appear or change in the DOM.
 * Chess.com may not have the moves controls ready when we first initialize
 * (e.g., during a live game), and recreates them when a game ends.
 * This observer detects those changes and injects our button.
 */
function observeMovesControls() {
  // Disconnect any existing observer
  if (buttonObserver) {
    buttonObserver.disconnect();
  }

  // Watch document.body since the game container itself may not exist yet
  buttonObserver = new MutationObserver(debounce(() => {
    const buttonExists = document.querySelector('#atomic-to-lichess-btn');
    const movesControls = document.querySelector('.moves-controls .moves-controls-row');

    if (!buttonExists && movesControls) {
      // Moves controls appeared but our button isn't in the DOM — inject it
      log('info', 'Moves controls detected, injecting button');
      sendButton = null;
      injectButton();
    } else if (!buttonExists && !movesControls) {
      // Neither exists — nothing to do yet
    } else if (buttonExists && movesControls && !movesControls.querySelector('#atomic-to-lichess-btn-container')) {
      // Button exists (maybe fixed fallback) but moves controls appeared —
      // remove the fallback and inject into the proper location
      log('info', 'Moves controls appeared, re-injecting button into proper location');
      if (sendButton && sendButton.parentNode) {
        removeElement(sendButton);
      }
      sendButton = null;
      injectButton();
    }
  }, 500));

  buttonObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  log('debug', 'MutationObserver set up for moves controls');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (buttonObserver) {
    buttonObserver.disconnect();
  }
  if (sendButton) {
    removeElement(sendButton);
  }
});

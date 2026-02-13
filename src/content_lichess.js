/**
 * Lichess Paste Page Content Script
 * Automatically pastes PGN from clipboard and submits for analysis
 */

// Run guard to prevent multiple executions
let hasRun = false;

/**
 * Main entry point for Lichess paste page
 */
async function initializeLichessPaste() {
  // Only run on /paste pages
  if (location.pathname !== '/paste') {
    log('debug', 'Not on paste page, skipping initialization');
    return;
  }

  // Prevent multiple executions
  if (hasRun) {
    log('debug', 'Script already executed, skipping');
    return;
  }
  hasRun = true;

  log('info', 'Initializing Lichess paste functionality');

  let notificationId = null;

  try {
    // Show loading notification
    notificationId = showLoading(LOADING_MESSAGES.PASTING_DATA);

    // Wait for textarea to appear (with timeout)
    const textarea = await waitForTextarea();

    if (!textarea) {
      log('error', 'Textarea not found');
      throw new Error(ERROR_MESSAGES.TEXTAREA_NOT_FOUND);
    }

    // Paste PGN from clipboard
    await pastePGN(textarea);

    // Auto-submit (always enabled)
    updateNotification(notificationId, LOADING_MESSAGES.SUBMITTING_FORM, 'loading');
    await submitForm(textarea);
    updateNotification(notificationId, SUCCESS_MESSAGES.READY_FOR_ANALYSIS, 'success', 3000);

    log('info', 'Lichess paste completed successfully');
  } catch (error) {
    log('error', 'Error in Lichess paste:', error);

    // Show error notification
    if (notificationId) {
      updateNotification(notificationId, error.message || ERROR_MESSAGES.GENERIC_ERROR, 'error', 8000);
    } else {
      showError(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }
}

/**
 * Wait for the paste textarea to appear
 * @returns {Promise<HTMLTextAreaElement>}
 */
async function waitForTextarea() {
  log('debug', 'Waiting for textarea...');

  try {
    const textarea = await waitForElement(
      [LICHESS_SELECTORS.PASTE_TEXTAREA, LICHESS_SELECTORS.PASTE_TEXTAREA_FALLBACK],
      TIMEOUTS.ELEMENT_WAIT
    );

    log('debug', 'Textarea found');
    return textarea;
  } catch (error) {
    log('error', 'Textarea not found within timeout');
    throw new Error(ERROR_MESSAGES.TEXTAREA_NOT_FOUND);
  }
}

/**
 * Paste PGN from clipboard into textarea
 * @param {HTMLTextAreaElement} textarea
 */
async function pastePGN(textarea) {
  log('debug', 'Reading from clipboard...');

  try {
    // Read from clipboard
    const text = await navigator.clipboard.readText();

    if (!text || text.trim().length === 0) {
      throw new Error('Clipboard is empty');
    }

    log('debug', `Clipboard content length: ${text.length} characters`);

    // Set textarea value
    textarea.value = text;

    // Trigger input event (some forms need this)
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    log('info', 'PGN pasted successfully');
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      log('error', 'Clipboard permission denied');
      throw new Error(ERROR_MESSAGES.CLIPBOARD_READ_DENIED);
    } else {
      log('error', 'Failed to read clipboard:', error);
      throw new Error(ERROR_MESSAGES.CLIPBOARD_READ_DENIED);
    }
  }
}

/**
 * Submit the form to start analysis
 * @param {HTMLTextAreaElement} textarea
 */
async function submitForm(textarea) {
  log('debug', 'Attempting to submit form...');

  try {
    // Find the form
    const form = textarea.form || textarea.closest('form');

    if (!form) {
      log('warn', 'Form not found, trying to find submit button');

      // Try to find submit button as fallback
      const submitButton = document.querySelector(LICHESS_SELECTORS.PASTE_SUBMIT_BUTTON);
      if (submitButton) {
        log('debug', 'Clicking submit button');
        submitButton.click();
        return;
      }

      log('error', 'No form or submit button found');
      return; // Don't throw error, just skip auto-submit
    }

    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    log('debug', 'Submitting form');
    form.submit();

    log('info', 'Form submitted successfully');
  } catch (error) {
    log('error', 'Failed to submit form:', error);
    // Don't throw error - auto-submit failure is not critical
  }
}

// Settings removed - auto-submit is always enabled


// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLichessPaste);
} else {
  // DOM already loaded
  initializeLichessPaste();
}

/**
 * DOM utility functions for reliable element detection and manipulation
 */



/**
 * Wait for an element to appear in the DOM using MutationObserver
 * This is more efficient than polling with setInterval
 *
 * @param {string|string[]} selectors - CSS selector(s) to wait for (can be array of fallbacks)
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {Element} root - Root element to search within (default: document)
 * @returns {Promise<Element>} - Resolves with the element when found, rejects on timeout
 */
function waitForElement(selectors, timeout = TIMEOUTS.ELEMENT_WAIT, root = document) {
  return new Promise((resolve, reject) => {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

    // Try to find element immediately
    for (const selector of selectorArray) {
      const element = root.querySelector(selector);
      if (element) {
        log('debug', `Element found immediately: ${selector}`);
        resolve(element);
        return;
      }
    }

    log('debug', `Waiting for element: ${selectorArray.join(' OR ')}`);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      log('warn', `Timeout waiting for element: ${selectorArray.join(' OR ')}`);
      reject(new Error(`Element not found within ${timeout}ms: ${selectorArray.join(' OR ')}`));
    }, timeout);

    // Set up MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const selector of selectorArray) {
        const element = root.querySelector(selector);
        if (element) {
          log('debug', `Element found via observer: ${selector}`);
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(element);
          return;
        }
      }
    });

    // Start observing
    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Query selector with fallback options
 * Tries multiple selectors in order and returns the first match
 *
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {Element} root - Root element to search within (default: document)
 * @returns {Element|null} - First matching element or null
 */
function querySelectorFallback(selectors, root = document) {
  for (const selector of selectors) {
    try {
      const element = root.querySelector(selector);
      if (element) {
        log('debug', `Element found with selector: ${selector}`);
        return element;
      }
    } catch (error) {
      log('warn', `Invalid selector: ${selector}`, error);
    }
  }
  log('warn', `No element found for any selector: ${selectors.join(', ')}`);
  return null;
}

/**
 * Wait for multiple elements to appear
 * Resolves when ALL elements are found or rejects on timeout
 *
 * @param {Object} selectorMap - Object mapping names to selectors
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {Element} root - Root element to search within (default: document)
 * @returns {Promise<Object>} - Resolves with object mapping names to elements
 */
async function waitForElements(selectorMap, timeout = TIMEOUTS.ELEMENT_WAIT, root = document) {
  const results = {};
  const promises = Object.entries(selectorMap).map(async ([name, selector]) => {
    const element = await waitForElement(selector, timeout, root);
    results[name] = element;
  });

  await Promise.all(promises);
  return results;
}

/**
 * Wait for an element to be removed from the DOM
 * Useful for waiting for loading spinners to disappear
 *
 * @param {string} selector - CSS selector to wait for removal
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {Element} root - Root element to search within (default: document)
 * @returns {Promise<void>} - Resolves when element is removed or not present
 */
function waitForElementRemoval(selector, timeout = TIMEOUTS.ELEMENT_WAIT, root = document) {
  return new Promise((resolve, reject) => {
    const element = root.querySelector(selector);

    // If element doesn't exist, resolve immediately
    if (!element) {
      log('debug', `Element already absent: ${selector}`);
      resolve();
      return;
    }

    log('debug', `Waiting for element removal: ${selector}`);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      log('warn', `Timeout waiting for element removal: ${selector}`);
      reject(new Error(`Element still present after ${timeout}ms: ${selector}`));
    }, timeout);

    // Set up MutationObserver
    const observer = new MutationObserver(() => {
      if (!root.querySelector(selector)) {
        log('debug', `Element removed: ${selector}`);
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve();
      }
    });

    // Start observing
    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Check if element is visible (not display:none or hidden)
 *
 * @param {Element} element - Element to check
 * @returns {boolean} - True if element is visible
 */
function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetParent !== null;
}

/**
 * Wait for element to become visible
 *
 * @param {string} selector - CSS selector
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {Element} root - Root element to search within (default: document)
 * @returns {Promise<Element>} - Resolves when element is visible
 */
async function waitForVisibleElement(selector, timeout = TIMEOUTS.ELEMENT_WAIT, root = document) {
  const element = await waitForElement(selector, timeout, root);

  return new Promise((resolve, reject) => {
    if (isElementVisible(element)) {
      resolve(element);
      return;
    }

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not visible within ${timeout}ms: ${selector}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      if (isElementVisible(element)) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    observer.observe(element.parentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Safely remove an element from the DOM
 *
 * @param {string|Element} selectorOrElement - CSS selector or element to remove
 * @param {Element} root - Root element to search within (default: document)
 */
function removeElement(selectorOrElement, root = document) {
  try {
    const element = typeof selectorOrElement === 'string'
      ? root.querySelector(selectorOrElement)
      : selectorOrElement;

    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      log('debug', `Element removed: ${typeof selectorOrElement === 'string' ? selectorOrElement : element.id || element.className}`);
    }
  } catch (error) {
    log('warn', 'Error removing element:', error);
  }
}

/**
 * Create element with attributes and styles
 *
 * @param {string} tagName - HTML tag name
 * @param {Object} options - Options object
 * @param {Object} options.attrs - Attributes to set
 * @param {Object} options.styles - CSS styles to apply
 * @param {string} options.text - Text content
 * @param {string} options.html - HTML content
 * @param {Element[]} options.children - Child elements to append
 * @returns {Element} - Created element
 */
function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  // Set attributes
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });
  }

  // Set styles
  if (options.styles) {
    Object.assign(element.style, options.styles);
  }

  // Set content
  if (options.text) {
    element.textContent = options.text;
  } else if (options.html) {
    element.innerHTML = options.html;
  }

  // Append children
  if (options.children) {
    options.children.forEach(child => {
      if (child) element.appendChild(child);
    });
  }

  return element;
}

/**
 * Debounce function calls
 * Useful for preventing rapid repeated actions (like button clicks)
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = TIMEOUTS.BUTTON_DEBOUNCE) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Run function with error boundary
 * Catches errors and logs them, preventing them from breaking the extension
 *
 * @param {Function} func - Function to run
 * @param {string} context - Context description for error logging
 * @returns {Promise<any>} - Result of function or null on error
 */
async function safeExecute(func, context = 'unknown') {
  try {
    return await func();
  } catch (error) {
    log('error', `Error in ${context}:`, error);
    return null;
  }
}

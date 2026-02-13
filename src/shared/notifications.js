/**
 * Toast Notification System
 * Custom toast notifications for user feedback
 */

// Track active notifications
const activeNotifications = new Map();
let notificationCounter = 0;

/**
 * Show a success notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: auto-dismiss after 5s)
 * @returns {string} - Notification ID
 */
function showSuccess(message, duration = TIMEOUTS.NOTIFICATION_DURATION) {
  return showNotification(message, 'success', duration);
}

/**
 * Show an error notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: auto-dismiss after 8s)
 * @returns {string} - Notification ID
 */
function showError(message, duration = TIMEOUTS.NOTIFICATION_ERROR_DURATION) {
  return showNotification(message, 'error', duration);
}

/**
 * Show an info notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: auto-dismiss after 5s)
 * @returns {string} - Notification ID
 */
function showInfo(message, duration = TIMEOUTS.NOTIFICATION_DURATION) {
  return showNotification(message, 'info', duration);
}

/**
 * Show a loading notification (does not auto-dismiss)
 * @param {string} message - Message to display
 * @returns {string} - Notification ID
 */
function showLoading(message) {
  return showNotification(message, 'loading', 0); // 0 = no auto-dismiss
}

/**
 * Update an existing notification
 * @param {string} id - Notification ID
 * @param {string} message - New message
 * @param {string} type - New type (success, error, info, loading)
 * @param {number} duration - New duration (0 = no auto-dismiss)
 */
function updateNotification(id, message, type = null, duration = null) {
  const notification = activeNotifications.get(id);

  if (!notification) {
    log('warn', `Cannot update notification ${id}: not found`);
    return;
  }

  // Update message
  const messageElement = notification.element.querySelector('.atl-notification-message');
  if (messageElement) {
    messageElement.textContent = message;
  }

  // Update type if provided
  if (type && type !== notification.type) {
    notification.element.classList.remove(`atl-notification-${notification.type}`);
    notification.element.classList.add(`atl-notification-${type}`);
    notification.type = type;

    // Update icon
    const iconElement = notification.element.querySelector('.atl-notification-icon');
    if (iconElement) {
      iconElement.textContent = getIconForType(type);
    }
  }

  // Update duration if provided
  if (duration !== null) {
    // Clear existing timeout
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
      notification.timeoutId = null;
    }

    // Set new timeout if duration > 0
    if (duration > 0) {
      notification.timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
  }
}

/**
 * Dismiss a notification
 * @param {string} id - Notification ID
 */
function dismissNotification(id) {
  const notification = activeNotifications.get(id);

  if (!notification) {
    log('debug', `Cannot dismiss notification ${id}: not found`);
    return;
  }

  log('debug', `Dismissing notification ${id}`);

  // Clear timeout
  if (notification.timeoutId) {
    clearTimeout(notification.timeoutId);
  }

  // Add exit animation
  notification.element.style.animation = `atlSlideOut ${NOTIFICATION_CONFIG.ANIMATION_DURATION}ms ease-in forwards`;

  // Remove after animation
  setTimeout(() => {
    removeElement(notification.element);
    activeNotifications.delete(id);
    repositionNotifications();
  }, NOTIFICATION_CONFIG.ANIMATION_DURATION);
}

/**
 * Dismiss all notifications
 */
function dismissAllNotifications() {
  const ids = Array.from(activeNotifications.keys());
  ids.forEach(id => dismissNotification(id));
}

/**
 * Show a notification
 * @param {string} message - Message to display
 * @param {string} type - Type (success, error, info, loading)
 * @param {number} duration - Duration in ms (0 = no auto-dismiss)
 * @returns {string} - Notification ID
 */
function showNotification(message, type, duration) {
  const id = `atl-notification-${++notificationCounter}`;

  log('debug', `Showing ${type} notification: ${message}`);

  // Ensure container exists
  ensureContainer();

  // Create notification element
  const element = createNotificationElement(id, message, type);

  // Get container
  const container = document.getElementById('atl-notification-container');
  container.appendChild(element);

  // Store reference
  const notification = {
    id,
    element,
    type,
    timeoutId: null,
  };

  activeNotifications.set(id, notification);

  // Set auto-dismiss if duration > 0
  if (duration > 0) {
    notification.timeoutId = setTimeout(() => {
      dismissNotification(id);
    }, duration);
  }

  // Position notifications
  repositionNotifications();

  return id;
}

/**
 * Create notification element
 * @param {string} id - Notification ID
 * @param {string} message - Message
 * @param {string} type - Type
 * @returns {HTMLElement}
 */
function createNotificationElement(id, message, type) {
  const icon = getIconForType(type);

  const element = createElement('div', {
    attrs: {
      id,
      class: `atl-notification atl-notification-${type}`,
      role: 'alert',
    },
    styles: {
      animation: `atlSlideIn ${NOTIFICATION_CONFIG.ANIMATION_DURATION}ms ease-out`,
    },
  });

  // Icon
  const iconElement = createElement('div', {
    attrs: { class: 'atl-notification-icon' },
    text: icon,
  });

  // Message
  const messageElement = createElement('div', {
    attrs: { class: 'atl-notification-message' },
    text: message,
  });

  // Close button (not for loading notifications)
  let closeButton = null;
  if (type !== 'loading') {
    closeButton = createElement('button', {
      attrs: {
        class: 'atl-notification-close',
        type: 'button',
        'aria-label': 'Close notification',
      },
      text: '×',
    });

    closeButton.addEventListener('click', () => {
      dismissNotification(id);
    });
  }

  // Assemble
  element.appendChild(iconElement);
  element.appendChild(messageElement);
  if (closeButton) {
    element.appendChild(closeButton);
  }

  return element;
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - Icon character
 */
function getIconForType(type) {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'info':
      return 'ℹ';
    case 'loading':
      return '⟳';
    default:
      return '•';
  }
}

/**
 * Ensure notification container exists
 */
function ensureContainer() {
  if (document.getElementById('atl-notification-container')) {
    return;
  }

  log('debug', 'Creating notification container');

  const container = createElement('div', {
    attrs: { id: 'atl-notification-container' },
    styles: {
      position: 'fixed',
      top: `${NOTIFICATION_CONFIG.POSITION_TOP}px`,
      right: `${NOTIFICATION_CONFIG.POSITION_RIGHT}px`,
      zIndex: NOTIFICATION_CONFIG.Z_INDEX,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    },
  });

  document.body.appendChild(container);

  // Inject CSS if not already present
  injectStyles();
}

/**
 * Reposition all active notifications
 */
function repositionNotifications() {
  const container = document.getElementById('atl-notification-container');
  if (!container) return;

  // Notifications are stacked vertically using flexbox, no manual positioning needed
  log('debug', `Active notifications: ${activeNotifications.size}`);
}

/**
 * Inject CSS styles for notifications
 */
function injectStyles() {
  if (document.getElementById('atl-notification-styles')) {
    return;
  }

  const styles = `
    .atl-notification {
      background: white;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: ${NOTIFICATION_CONFIG.MAX_WIDTH}px;
      pointer-events: auto;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      border-left: 4px solid #ccc;
    }

    .atl-notification-success {
      border-left-color: #4CAF50;
    }

    .atl-notification-error {
      border-left-color: #f44336;
    }

    .atl-notification-info {
      border-left-color: #2196F3;
    }

    .atl-notification-loading {
      border-left-color: #FF9800;
    }

    .atl-notification-icon {
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .atl-notification-success .atl-notification-icon {
      color: #4CAF50;
    }

    .atl-notification-error .atl-notification-icon {
      color: #f44336;
    }

    .atl-notification-info .atl-notification-icon {
      color: #2196F3;
    }

    .atl-notification-loading .atl-notification-icon {
      color: #FF9800;
      animation: atlSpin 1s linear infinite;
    }

    .atl-notification-message {
      flex: 1;
      color: #333;
    }

    .atl-notification-close {
      background: none;
      border: none;
      color: #999;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .atl-notification-close:hover {
      color: #333;
    }

    @keyframes atlSlideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes atlSlideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    @keyframes atlSpin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;

  const styleElement = createElement('style', {
    attrs: { id: 'atl-notification-styles' },
    text: styles,
  });

  document.head.appendChild(styleElement);

  log('debug', 'Notification styles injected');
}

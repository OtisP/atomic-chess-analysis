/**
 * PGN Validator Module
 * Validates and sanitizes PGN format
 */



/**
 * Required PGN headers
 */
const REQUIRED_HEADERS = ['Event', 'Site', 'Date', 'White', 'Black', 'Result'];

/**
 * Optional but common PGN headers
 */
const OPTIONAL_HEADERS = [
  'WhiteElo',
  'BlackElo',
  'TimeControl',
  'Variant',
  'ECO',
  'Opening',
  'Termination',
  'Round',
  'Annotator',
];

/**
 * Validate PGN format
 * @param {string} pgn - PGN string to validate
 * @returns {Object} - Validation result { valid: boolean, errors: string[], warnings: string[] }
 */
function validatePGN(pgn) {
  const errors = [];
  const warnings = [];

  if (!pgn || typeof pgn !== 'string') {
    errors.push('PGN is empty or invalid type');
    return { valid: false, errors, warnings };
  }

  const trimmedPGN = pgn.trim();

  if (trimmedPGN.length === 0) {
    errors.push('PGN is empty');
    return { valid: false, errors, warnings };
  }

  // Check for required headers
  const headers = extractHeaders(trimmedPGN);

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers[requiredHeader]) {
      errors.push(`Missing required header: ${requiredHeader}`);
    }
  }

  // Check for moves section
  const hasMoves = checkForMoves(trimmedPGN);
  if (!hasMoves) {
    warnings.push('No moves found in PGN');
  }

  // Check for result consistency
  if (headers.Result) {
    const validResults = ['1-0', '0-1', '1/2-1/2', '*'];
    if (!validResults.includes(headers.Result)) {
      warnings.push(`Unusual result format: ${headers.Result}`);
    }
  }

  // Check for variant header (important for atomic chess)
  if (!headers.Variant) {
    warnings.push('No Variant header found (should be "atomic" for atomic chess)');
  } else if (headers.Variant.toLowerCase() !== 'atomic') {
    warnings.push(`Variant is "${headers.Variant}" (expected "atomic")`);
  }

  const valid = errors.length === 0;

  if (valid) {
    log('debug', 'PGN validation passed');
  } else {
    log('warn', 'PGN validation failed:', errors);
  }

  return { valid, errors, warnings };
}

/**
 * Extract headers from PGN
 * @param {string} pgn - PGN string
 * @returns {Object} - Headers object
 */
function extractHeaders(pgn) {
  const headers = {};
  const lines = pgn.split('\n');

  for (const line of lines) {
    const match = line.match(REGEX_PATTERNS.PGN_HEADER);
    if (match) {
      const [, key, value] = match;
      headers[key] = value;
    }
  }

  return headers;
}

/**
 * Check if PGN contains moves
 * @param {string} pgn - PGN string
 * @returns {boolean} - True if moves found
 */
function checkForMoves(pgn) {
  // Look for move numbers (e.g., "1.", "2.", etc.)
  const movePattern = /\d+\.\s*[a-zA-Z]/;
  return movePattern.test(pgn);
}

/**
 * Sanitize PGN
 * Removes potentially harmful content and normalizes format
 * @param {string} pgn - PGN string to sanitize
 * @returns {string} - Sanitized PGN
 */
function sanitizePGN(pgn) {
  if (!pgn || typeof pgn !== 'string') {
    return '';
  }

  let sanitized = pgn;

  // Remove any HTML tags (just in case)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any script tags (extra safety)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\r/g, '\n');

  // Remove excessive blank lines (more than 2)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Format PGN for display
 * @param {string} pgn - PGN string
 * @returns {string} - Formatted PGN
 */
function formatPGN(pgn) {
  const sanitized = sanitizePGN(pgn);
  const lines = sanitized.split('\n');
  const formatted = [];

  let inHeaders = true;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      if (inHeaders) {
        // Empty line marks end of headers
        inHeaders = false;
        formatted.push('');
      }
      continue;
    }

    if (REGEX_PATTERNS.PGN_HEADER.test(trimmedLine)) {
      // Header line
      formatted.push(trimmedLine);
    } else {
      // Moves line
      formatted.push(trimmedLine);
    }
  }

  return formatted.join('\n');
}

/**
 * Get PGN info (quick overview)
 * @param {string} pgn - PGN string
 * @returns {Object} - PGN info object
 */
function getPGNInfo(pgn) {
  const headers = extractHeaders(pgn);
  const hasMoves = checkForMoves(pgn);

  return {
    white: headers.White || 'Unknown',
    black: headers.Black || 'Unknown',
    result: headers.Result || '*',
    date: headers.Date || 'Unknown',
    variant: headers.Variant || 'Standard',
    event: headers.Event || 'Unknown',
    hasMoves,
    headerCount: Object.keys(headers).length,
  };
}

/**
 * Check if PGN is for atomic variant
 * @param {string} pgn - PGN string
 * @returns {boolean} - True if atomic variant
 */
function isAtomicPGN(pgn) {
  const headers = extractHeaders(pgn);
  const variant = headers.Variant || '';
  return variant.toLowerCase().includes('atomic');
}

/**
 * Extract moves from PGN (without headers)
 * @param {string} pgn - PGN string
 * @returns {string} - Moves only
 */
function extractMoves(pgn) {
  const lines = pgn.split('\n');
  const moveLines = [];

  let inMoves = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      if (moveLines.length > 0) {
        inMoves = true;
      }
      continue;
    }

    if (!REGEX_PATTERNS.PGN_HEADER.test(trimmedLine)) {
      inMoves = true;
    }

    if (inMoves) {
      moveLines.push(trimmedLine);
    }
  }

  return moveLines.join(' ');
}

/**
 * Count moves in PGN
 * @param {string} pgn - PGN string
 * @returns {number} - Number of moves (half-moves)
 */
function countMoves(pgn) {
  const moves = extractMoves(pgn);

  // Count move numbers (e.g., "1.", "2.", etc.)
  const moveNumbers = moves.match(/\d+\./g);

  if (!moveNumbers) {
    return 0;
  }

  // Each move number represents a full move (white + black)
  // So we need to count actual moves (not just move numbers)
  const tokens = moves.split(/\s+/);
  let count = 0;

  for (const token of tokens) {
    // Check if token is a move (not a move number or result)
    if (token && !token.endsWith('.') && !['1-0', '0-1', '1/2-1/2', '*'].includes(token)) {
      // Skip annotations and comments
      if (!token.startsWith('{') && !token.startsWith('(') && !token.includes('$')) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Validate and prepare PGN for Lichess
 * @param {string} pgn - PGN string
 * @returns {Object} - { valid: boolean, pgn: string, error: string|null }
 */
function prepareForLichess(pgn) {
  // Sanitize first
  const sanitized = sanitizePGN(pgn);

  // Validate
  const validation = validatePGN(sanitized);

  if (!validation.valid) {
    return {
      valid: false,
      pgn: null,
      error: validation.errors[0] || 'Invalid PGN format',
    };
  }

  // Format for Lichess
  const formatted = formatPGN(sanitized);

  return {
    valid: true,
    pgn: formatted,
    error: null,
  };
}

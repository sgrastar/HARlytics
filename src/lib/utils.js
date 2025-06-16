/**
 * Formats a Date object into a UTC timestamp string
 * 
 * @param {Date} date - The date object to format
 * @param {boolean} [excludeMilliseconds=false] - If true, milliseconds will be excluded from the output
 * @returns {string} Formatted timestamp string (e.g., "2025-03-11 12:34:56.789" or "2025-03-11 12:34:56")
 */
export function formatTimestamp(date, excludeMilliseconds = false) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  
  if (excludeMilliseconds) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else {
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
}

/**
 * Truncates text to a specified maximum length
 * @param {*} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength) {
  if (!text) return ""; // Return empty string for null or undefined
  const str = String(text); // Convert to string for numbers etc.
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Escapes special characters for Mermaid diagram syntax
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for Mermaid diagrams
 */
export const escapeForMermaid = (text) => {
  if (!text) return "";

  return (
    text
      // Existing escape processing
      .replace(/\\/g, "\\\\") // Backslash
      .replace(/\$/g, "\\$") // Dollar sign
      .replace(/\#/g, "\\#") // Hash sign
      .replace(/\_/g, "\\_") // Underscore
      .replace(/\~/g, "\\~") // Tilde
      .replace(/\*/g, "\\*") // Asterisk
      .replace(/\+/g, "\\+") // Plus sign
      .replace(/\=/g, "\\=") // Equals sign
      .replace(/\|/g, "\\|") // Vertical bar
      .replace(/\[/g, "\\[") // Opening square bracket
      .replace(/\]/g, "\\]") // Closing square bracket
      .replace(/\{/g, "\\{") // Opening curly brace
      .replace(/\}/g, "\\}") // Closing curly brace
      .replace(/\(/g, "\\(") // Opening parenthesis
      .replace(/\)/g, "\\)") // Closing parenthesis
      .replace(/\>/g, "\\>") // Greater than sign
      .replace(/\</g, "\\<") // Less than sign
      .replace(/\n/g, "\\n") // Newline
      .replace(/\r/g, "\\r") // Carriage return
      .replace(/\t/g, "\\t") // Tab
      .replace(/\'/g, "\\'") // Single quote
      .replace(/\"/g, '\\"') // Double quote
      .replace(/:/g, "&#58;") // Colon
      .replace(/;/g, "&#59;") // Semicolon
      .replace(/@/g, "&#64;") // At sign
      .replace(/&(?![#a-zA-Z0-9]+;)/g, "&amp;")
  ); // Unescaped ampersand
};

/**
 * Processes complex values by truncating and escaping
 * @param {string} str - String to process
 * @param {number} length - Maximum length before truncation
 * @returns {string} Processed string
 */
export function truncateAndEscape(str, length) {
  if (!str) return "";

  // Simplify complex values like font query parameters
  if (str.includes(";") && str.includes("@")) {
    return "[Complex Value]";
  }

  return escapeForMermaid(truncateText(str, length));
}

// export function httpStatusCSSClass(statusNo) {
//   if (100 <= statusNo && statusNo <= 199) {
//     return "info"; // Information responses
//   } else if (200 <= statusNo && statusNo <= 299) {
//     return "success"; // Successful responses
//   } else if (300 <= statusNo && statusNo <= 399) {
//     return "redirect"; // Redirection responses
//   } else if (400 <= statusNo && statusNo <= 499) {
//     return "cliError"; // Client-side error responses
//   } else if (500 <= statusNo && statusNo <= 599) {
//     return "srvError"; // Server-side error responses
//   } else {
//     return "other";
//   }
// }

/**
 * Returns CSS classes for HTTP status code styling
 * @param {number} status - HTTP status code
 * @returns {string} CSS class string for the status code
 */
export function httpStatusCSSClass(status) {
  if (!status) return "other";
  
  if (status >= 100 && status < 200) {
    return "info text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900";
  } else if (status >= 200 && status < 300) {
    return "success text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900";
  } else if (status >= 300 && status < 400) {
    return "redirect text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900";
  } else if (status >= 400 && status < 500) {
    return "cliError text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900";
  } else if (status >= 500 && status < 600) {
    return "srvError text-white dark:text-white bg-red-600 dark:bg-red-700";
  } else {
    return "other text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-700";
  }
}

/**
 * Returns CSS classes for priority level styling
 * @param {string} priority - Priority level (VeryLow, Low, Medium, High, VeryHigh)
 * @returns {string} CSS class string for the priority level
 */
export function priorityCSSClass(priority){
  if (priority === "VeryLow") {
    return "verylow text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900 font-bold";
  } else if (priority === "Low" || priority === "low") {
    return "low text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900";
  } else if (priority === "Medium" || priority === "medium") {
    return "medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900";
  } else if (priority === "High" || priority === "high") {
    return "high text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900";
  } else if (priority === "VeryHigh" || priority === "veryhigh") {
    return "veryhigh text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900 font-bold";
    // } else if (priority === "VeryHigh") {
    // return "srvError text-white dark:text-white bg-red-600 dark:bg-red-700";

  } else {
    return "other text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-700";
  }
}

/**
 * Formats time in milliseconds to human-readable format
 * @param {number} time - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "123ms", "1.23s", "1min 23s")
 */
export function formatTime(time) {
  if (time < 1000) {
    return `${Math.floor(time)}ms`;
  } else if (time < 60000) {
    // Display in seconds (less than 60 seconds)
    const seconds = time / 1000;
    // Handle edge cases like 59.99 seconds properly
    return `${Math.min(seconds, 59.99).toFixed(2)}s`;
  } else if (time < 3600000) {
    // Display in minutes and seconds (less than 60 minutes)
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    // Prevent seconds from being 60
    if (seconds === 60) {
      return `${minutes + 1}min 00s`;
    }
    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  } else {
    // Display in hours, minutes, and seconds
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${hours}h ${String(minutes).padStart(2, "0")}min ${String(
      seconds
    ).padStart(2, "0")}s`;
  }
}

/**
 * Formats bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted byte string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatBytes(bytes) {
  // Check for undefined, NaN, or invalid values
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === -1) {
    return "-";
  }
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const sign = Math.sign(bytes);
  bytes = Math.abs(bytes);

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  // Always apply toFixed to show 1 decimal place
  const value = (bytes / Math.pow(1024, i)).toFixed(1);
  // console.log('bytes:'+bytes+" / " + sign < 0 ? "-" + value + " " + units[i] : value + " " + units[i])

  return sign < 0 ? "-" + value + " " + units[i] : value + " " + units[i];
}

/**
 * Exports data to CSV file
 * @param {Array<Array>} data - 2D array of data rows
 * @param {Array<string>} headers - Column headers
 * @param {string} logFilename - Base filename
 * @param {string} suffix - Filename suffix
 */
export function exportToCSV(data, headers, logFilename, suffix) {
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      row
        .map(String)
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", logFilename + suffix + ".csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Splits text into chunks of specified length
 * @param {string} text - Text to split
 * @param {number} length - Length of each chunk
 * @returns {Array<string>} Array of text chunks
 */
export function splitByLength(text, length) {
  const lines = [];
  for (let i = 0; i < text.length; i += length) {
    lines.push(text.slice(i, i + length));
  }
  return lines;
}

/**
 * Parses Cache-Control header into an object
 * @param {string} cacheControlHeader - Cache-Control header value
 * @returns {Object} Parsed cache control directives
 */
export function parseCacheControl(cacheControlHeader) {
  // Return empty object for empty string or undefined
  if (!cacheControlHeader) {
    return {};
  }

  const directives = cacheControlHeader
    .split(",")
    .map((directive) => directive.trim());
  const parsedDirectives = {};

  for (const directive of directives) {
    // Skip empty items
    if (!directive) {
      continue;
    }

    const [key, value] = directive.split("=");
    const trimmedKey = key.trim();

    // Skip if key is empty
    if (!trimmedKey) {
      continue;
    }

    parsedDirectives[trimmedKey] = value ? parseInt(value, 10) : true;
  }

  return parsedDirectives;
}

/**
 * Checks if a response is cached based on age and cache control
 * @param {number|null} ageInSeconds - Age of the response in seconds
 * @param {Object} parsedCacheControl - Parsed cache control directives
 * @returns {boolean} True if response is cached
 */
export function isResponseCached(ageInSeconds, parsedCacheControl) {
  if (ageInSeconds !== null) {
    return true;
  }
  if (parsedCacheControl["no-cache"] || parsedCacheControl["no-store"]) {
    return false;
  }
  if (parsedCacheControl["max-age"] || parsedCacheControl["s-maxage"]) {
    return true;
  }
  return false;
}

/**
 * Calculates resource cache freshness for Browser & CDN
 * @param {Object} entry - HAR file entry
 * @returns {Object} Browser and CDN cache status
 */
export function calculateFreshness(entry) {
  // Get necessary header information
  const headers = entry.response.headers || [];
  const cacheControlHeader = headers.find(h => h.name.toLowerCase() === 'cache-control')?.value || '';
  const expiresHeader = headers.find(h => h.name.toLowerCase() === 'expires')?.value || '';
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
  const xCacheHeader = headers.find(h => h.name.toLowerCase() === 'x-cache')?.value || '';
  const cfCacheStatusHeader = headers.find(h => h.name.toLowerCase() === 'cf-cache-status')?.value || '';
  
  // Get response time (in milliseconds)
  let responseTime;
  if (dateHeader) {
    responseTime = new Date(dateHeader).getTime();
  } else if (entry.startedDateTime) {
    responseTime = new Date(entry.startedDateTime).getTime();
  } else {
    responseTime = Date.now() - 100000;
  }
  
  const currentTime = Date.now();
  
  // Extract max-age and s-maxage from Cache-Control
  let maxAge = null;
  let sMaxAge = null;
  
  const maxAgeMatch = cacheControlHeader.match(/max-age=(\d+)/i);
  if (maxAgeMatch && maxAgeMatch[1]) {
    maxAge = parseInt(maxAgeMatch[1], 10);
  }
  
  const sMaxAgeMatch = cacheControlHeader.match(/s-maxage=(\d+)/i);
  if (sMaxAgeMatch && sMaxAgeMatch[1]) {
    sMaxAge = parseInt(sMaxAgeMatch[1], 10);
  }
  
  // Calculate expiration from Expires header
  let expiresTime = null;
  if (expiresHeader) {
    expiresTime = new Date(expiresHeader).getTime();
  }
  
  // Calculate browser cache status
  let browserStatus = 'Unknown';
  let browserExpiryTime = null;
  
  if (cacheControlHeader.includes('no-store') || cacheControlHeader.includes('no-cache')) {
    browserStatus = 'Not Cacheable';
  } else if (maxAge !== null) {
    browserExpiryTime = responseTime + (maxAge * 1000);
    browserStatus = currentTime < browserExpiryTime ? 'Fresh' : 'Stale';
  } else if (expiresTime) {
    browserExpiryTime = expiresTime;
    browserStatus = currentTime < browserExpiryTime ? 'Fresh' : 'Stale';
  }
  
  // Calculate CDN cache status
  let cdnStatus = 'Unknown';
  let cdnExpiryTime = null;
  let cdnProvider = null;
  
  // Identify CDN provider
  if (cfCacheStatusHeader) {
    cdnProvider = 'Cloudflare';
  } else if (xCacheHeader && xCacheHeader.includes('cloudfront')) {
    cdnProvider = 'CloudFront';
  } else if (xCacheHeader) {
    cdnProvider = 'Fastly/Other';
  }
  
  // For Cloudflare
  if (cdnProvider === 'Cloudflare') {
    switch (cfCacheStatusHeader.toUpperCase()) {
      case 'HIT':
        // Resource found in Cloudflare's cache
        cdnStatus = 'Fresh';
        break;
      case 'MISS':
        // Not cached but freshly fetched from origin so Fresh
        cdnStatus = 'Fresh';
        break;
      case 'EXPIRED':
        // Found in cache but expired, refetched from origin
        cdnStatus = 'Fresh'; // Refetched from origin so ultimately Fresh
        break;
      case 'STALE':
        // Expired but served from cache as origin unreachable
        cdnStatus = 'Stale';
        break;
      case 'BYPASS':
        // Cache bypassed (no-cache, private, max-age=0, etc.)
        cdnStatus = 'Not Cacheable';
        break;
      case 'REVALIDATED':
        // Expiration revalidated
        cdnStatus = 'Fresh';
        break;
      case 'UPDATING':
        // Expired but popular resource so updating
        cdnStatus = 'Fresh';
        break;
      case 'DYNAMIC':
        // Resource determined to be non-cacheable
        cdnStatus = 'Not Cacheable';
        break;
      case 'NONE':
      case 'UNKNOWN':
        // Non-cacheable (Worker response, redirect, WAF block, etc.)
        cdnStatus = 'Not Cacheable';
        break;
      default:
        cdnStatus = 'Unknown';
    }
  }
  // For CloudFront (existing logic)
  else if (cdnProvider === 'CloudFront') {
    if (xCacheHeader.includes('Miss from cloudfront')) {
      cdnStatus = 'Fresh';
    } else if (xCacheHeader.includes('Hit from cloudfront')) {
      cdnStatus = 'Fresh';
    } else if (xCacheHeader.includes('RefreshHit from cloudfront')) {
      cdnStatus = 'Fresh';
    } else if (xCacheHeader.includes('Error from cloudfront')) {
      cdnStatus = 'Unknown';
    }
  }
  // Fastly or other CDN
  else if (cdnProvider === 'Fastly/Other') {
    if (xCacheHeader.includes('Hit')) {
      cdnStatus = 'Fresh';
    } else if (xCacheHeader.includes('Miss')) {
      cdnStatus = 'Fresh';
    }
  }
  // If no x-cache or cf-cache-status headers, use normal cache calculation
  else {
    if (cacheControlHeader.includes('no-store')) {
      cdnStatus = 'Not Cacheable';
    } else if (sMaxAge !== null) {
      cdnExpiryTime = responseTime + (sMaxAge * 1000);
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    } else if (maxAge !== null) {
      // If no s-maxage, CDN also uses max-age
      cdnExpiryTime = responseTime + (maxAge * 1000);
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    } else if (expiresTime) {
      cdnExpiryTime = expiresTime;
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    }
  }
  
  // Return result as object
  return {
    browser: {
      status: browserStatus,
      expiryTime: browserExpiryTime,
      ttl: browserExpiryTime ? Math.floor((browserExpiryTime - currentTime) / 1000) : null
    },
    cdn: {
      status: cdnStatus,
      provider: cdnProvider,
      expiryTime: cdnExpiryTime,
      ttl: cdnExpiryTime ? Math.floor((cdnExpiryTime - currentTime) / 1000) : null,
      xCache: xCacheHeader,
      cfCacheStatus: cfCacheStatusHeader
    },
  };
}

/**
 * Function that returns a description for an HTTP status code
 * 
 * @param {number|null} statusCode - The HTTP status code
 * @returns {string} A string combining the status code and its description (e.g. "401 Unauthorized")
 * @throws {Error} If an invalid status code is provided
 */
export function getHttpStatusDescription(statusCode) {
  // Array of HTTP status codes and their descriptions
  const httpStatusDescriptions = [
    // 1xx Informational
    { code: 100, description: "Continue" },
    { code: 101, description: "Switching Protocols" },
    { code: 102, description: "Processing" },
    { code: 103, description: "Early Hints" },
    
    // 2xx Success
    { code: 200, description: "OK" },
    { code: 201, description: "Created" },
    { code: 202, description: "Accepted" },
    { code: 203, description: "Non-Authoritative Information" },
    { code: 204, description: "No Content" },
    { code: 205, description: "Reset Content" },
    { code: 206, description: "Partial Content" },
    { code: 207, description: "Multi-Status" },
    { code: 208, description: "Already Reported" },
    { code: 226, description: "IM Used" },
    
    // 3xx Redirection
    { code: 300, description: "Multiple Choices" },
    { code: 301, description: "Moved Permanently" },
    { code: 302, description: "Found" },
    { code: 303, description: "See Other" },
    { code: 304, description: "Not Modified" },
    { code: 305, description: "Use Proxy" },
    { code: 307, description: "Temporary Redirect" },
    { code: 308, description: "Permanent Redirect" },
    
    // 4xx Client Error
    { code: 400, description: "Bad Request" },
    { code: 401, description: "Unauthorized" },
    { code: 402, description: "Payment Required" },
    { code: 403, description: "Forbidden" },
    { code: 404, description: "Not Found" },
    { code: 405, description: "Method Not Allowed" },
    { code: 406, description: "Not Acceptable" },
    { code: 407, description: "Proxy Authentication Required" },
    { code: 408, description: "Request Timeout" },
    { code: 409, description: "Conflict" },
    { code: 410, description: "Gone" },
    { code: 411, description: "Length Required" },
    { code: 412, description: "Precondition Failed" },
    { code: 413, description: "Payload Too Large" },
    { code: 414, description: "URI Too Long" },
    { code: 415, description: "Unsupported Media Type" },
    { code: 416, description: "Range Not Satisfiable" },
    { code: 417, description: "Expectation Failed" },
    { code: 418, description: "I'm a teapot" },
    { code: 421, description: "Misdirected Request" },
    { code: 422, description: "Unprocessable Entity" },
    { code: 423, description: "Locked" },
    { code: 424, description: "Failed Dependency" },
    { code: 425, description: "Too Early" },
    { code: 426, description: "Upgrade Required" },
    { code: 428, description: "Precondition Required" },
    { code: 429, description: "Too Many Requests" },
    { code: 431, description: "Request Header Fields Too Large" },
    { code: 451, description: "Unavailable For Legal Reasons" },
    
    // 5xx Server Error
    { code: 500, description: "Internal Server Error" },
    { code: 501, description: "Not Implemented" },
    { code: 502, description: "Bad Gateway" },
    { code: 503, description: "Service Unavailable" },
    { code: 504, description: "Gateway Timeout" },
    { code: 505, description: "HTTP Version Not Supported" },
    { code: 506, description: "Variant Also Negotiates" },
    { code: 507, description: "Insufficient Storage" },
    { code: 508, description: "Loop Detected" },
    { code: 510, description: "Not Extended" },
    { code: 511, description: "Network Authentication Required" }
  ];

  // Handle null, undefined, or empty status code
  if (statusCode === null || statusCode === undefined || statusCode === '') {
    return "0 No Status Code Provided";
  }
  
  // Convert status code to number type
  const code = Number(statusCode);
  
  // Handle 0 status code case
  if (code === 0) {
    return "0 No Response";
  }
  
  // Check for other invalid status codes
  if (isNaN(code) || code < 100 || code >= 600) {
    throw new Error(`Invalid HTTP status code: ${statusCode}`);
  }
  
  // Find the description that matches the status code
  const statusInfo = httpStatusDescriptions.find(status => status.code === code);
  
  // If no specific description is found, generate a generic category description
  if (!statusInfo) {
    let categoryDescription = "";
    if (code >= 100 && code < 200) {
      categoryDescription = "Informational";
    } else if (code >= 200 && code < 300) {
      categoryDescription = "Success";
    } else if (code >= 300 && code < 400) {
      categoryDescription = "Redirection";
    } else if (code >= 400 && code < 500) {
      categoryDescription = "Client Error";
    } else if (code >= 500 && code < 600) {
      categoryDescription = "Server Error";
    }
    
    return `${code} ${categoryDescription}`;
  }
  
  // Combine the status code and description and return
  return `${statusInfo.code} ${statusInfo.description}`;
}

/**
 * Determines the communication type based on entry characteristics
 * @param {Object} entry - HAR file entry
 * @returns {string} Communication type (e.g., "WS", "Doc", "CSS", "JS", etc.)
 */
export function getCommunicationType(entry) {
  //console.log(entry);
  if (entry._webSocketMessages) {
    return "WS";
  }

  if (entry.request?.url && (
    entry.request.url.endsWith('/favicon.ico') || 
    entry.request.url.toLowerCase().includes('favicon.ico')
  )) {
    return "Other";
  }
  
  const contentType = entry.response.content.mimeType;
  if (!contentType) {
    return "Other";
  }

  if (
    contentType.includes("image/svg+xml") ||
    contentType.includes("image/svg") ||
    (entry.request?.url && entry.request.url.toLowerCase().endsWith('.svg'))
  ) {
    return "Img";
  }
  
  // XMLbase Documents
  if (
    contentType.includes("html") ||
    contentType.includes("xhtml") ||
    contentType.includes("xml")
  ) {
    return "Doc";
  }

  // Manifest file
  if (contentType.includes("manifest")) {
    return "Manifest";
  }

  if (
    contentType.includes("manifest") ||
    contentType.includes("application/manifest+json") ||
    contentType.includes("text/cache-manifest")
  ) {
    return "Manifest";
  }

  if (
    contentType.includes("json") ||
    contentType.includes("application/ld+json") ||
    contentType.includes("application/schema+json") ||
    contentType.includes("application/geo+json")
  ) {
    return "Fetch/XHR";
  }

  if (
    contentType.includes("css") ||
    contentType.includes("text/css") ||
    contentType.includes("style")
  ) {
    return "CSS";
  }

  if (
    contentType.includes("javascript") ||
    contentType.includes("application/x-javascript") ||
    contentType.includes("application/ecmascript") ||
    contentType.includes("text/javascript") ||
    contentType.includes("module") ||
    entry.request.url.toLowerCase().endsWith('.js') ||
    entry.request.url.toLowerCase().endsWith('.mjs')
  ) {
    return "JS";
  }

  if (
    contentType.includes("font") ||
    contentType.includes("application/x-font") ||
    contentType.includes("application/font") ||
    contentType.includes("font/ttf") ||
    contentType.includes("font/otf") ||
    contentType.includes("font/woff") ||
    contentType.includes("font/woff2") ||
    entry.request.url.toLowerCase().match(/\.(ttf|otf|woff|woff2|eot)$/)
  ) {
    return "Font";
  }

  if (
    contentType.includes("audio") ||
    contentType.includes("video") ||
    contentType.includes("application/ogg") ||
    contentType.includes("application/x-mpegURL") ||
    contentType.includes("application/vnd.apple.mpegURL") ||
    contentType.includes("application/dash+xml") ||
    entry.request.url.toLowerCase().match(/\.(mp3|mp4|wav|ogg|m4a|m4v|webm|oga|ogv)$/)
    ) {
    return "Media";
  }

  if (
    contentType.includes("wasm") ||
    contentType.includes("application/wasm") ||
    (entry.request?.url && entry.request.url.toLowerCase().endsWith('.wasm'))
  ) {
    return "Wasm";
  }

  // Other type
  if (contentType.includes("json")) {
    return "Fetch/XHR";
  } else if (contentType.includes("css")) {
    return "CSS";
  } else if (contentType.includes("javascript")) {
    return "JS";
  } else if (contentType.includes("font")) {
    return "Font";
  } else if (contentType.includes("image")) {
    return "Img";
  } else if (contentType.includes("audio") || contentType.includes("video")) {
    return "Media";
  } else if (contentType.includes("wasm")) {
    return "Wasm";
  }

  return "Other";
}

/**
 * Extracts the top-level domain from a full domain
 * @param {string} domain - Full domain name
 * @returns {string} Top-level domain
 */
export function getTopDomain(domain) {
  const parts = domain.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return domain;
}

/**
 * Aggregates data by counting occurrences of a specific key
 * @param {Array} entries - Array of entries to aggregate
 * @param {string} key - Key to aggregate by
 * @returns {Array<{name: string, value: number}>} Aggregated data
 */
export function aggregateData(entries, key) {
  const aggregatedData = entries.reduce((acc, entry) => {
    const value = entry[key].replace(/\//g, "/");
    if (acc[value]) {
      acc[value]++;
    } else {
      acc[value] = 1;
    }
    return acc;
  }, {});

  return Object.entries(aggregatedData).map(([name, value]) => ({
    name,
    value,
  }));
}

/**
 * Copies the value of a textarea element to clipboard
 * @param {string} elemId - ID of the textarea element
 */
export function copyTextarea(elemId) {
  const element = document.getElementById(elemId);
  if (element && element.value) {
    navigator.clipboard.writeText(element.value);
  }
}

/**
 * Formats a GMT date string to UTC format
 * @param {string} gmtDateString - GMT date string
 * @returns {string} UTC formatted date string
 */
export function formatGMTtoUTC(gmtDateString) {
  if (!gmtDateString) return "";

  try {
    const date = new Date(gmtDateString);
    if (isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, -5).replace("T", " ");
  } catch {
    return "";
  }
}

/**
 * Formats a GMT date string to local time with timezone info
 * @param {string} gmtDateString - GMT date string
 * @returns {string} Local time string with timezone
 */
export function formatToLocalTime(gmtDateString) {
  if (!gmtDateString) return "";

  try {
    const date = new Date(gmtDateString);
    if (isNaN(date.getTime())) return "";

    // Get timezone name (e.g., 'JST')
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Get timezone offset (e.g., '+0900')
    const offset = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60))
      .toString()
      .padStart(2, "0");
    const offsetMinutes = Math.abs(offset % 60)
      .toString()
      .padStart(2, "0");
    const offsetSign = offset <= 0 ? "+" : "-";
    const offsetString = `${offsetSign}${offsetHours}${offsetMinutes}`;

    return `${date.toLocaleString()} (${timeZone}, UTC${offsetString})`;
  } catch {
    return "";
  }
}

/**
 * Formats POST data values for display
 * @param {*} value - Value to format
 * @returns {string} Formatted value string
 */
export function formatPostDataValue(value) {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return "[null]";
  }

  // Handle ArrayBuffer and TypedArray
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return "[Binary Data]";
  }

  // Handle objects and arrays
  if (typeof value === "object") {
    try {
      // For deeply nested objects, show summary only
      if (JSON.stringify(value).length > 1000) {
        return "[Complex Object]";
      }
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return "[Complex Object]";
    }
  }

  // Handle long text
  if (typeof value === "string") {
    // Try to decode potentially URL-encoded data
    try {
      const decoded = decodeURIComponent(value);
      // Use decoded result only if different from original and readable
      if (decoded !== value && /^[\x20-\x7E\s]+$/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      // Use original data if decoding fails
    }

    // Truncate text that's too long
    if (value.length > 500) {
      return value.substring(0, 500) + "... [Text Truncated]";
    }
    return value;
  }

  // Convert other primitive types to string as-is
  return String(value);
}

/**
 * Normalizes POST data for display
 * @param {Object} postData - POST data object
 * @returns {Array<{name: string, value: string}>} Normalized data array
 */
export function normalizePostData(postData) {
  if (!postData) return [];

  // Process based on mimeType
  const result = [];

  // Process based on Content-Type
  if (postData.mimeType) {
    result.push({
      name: "Content-Type",
      value: postData.mimeType,
    });
  }

  // For text/plain
  if (postData.text) {
    try {
      // Process URL-encoded data
      if (postData.mimeType?.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(postData.text);
        for (const [key, value] of params) {
          result.push({
            name: key,
            value: formatPostDataValue(value),
          });
        }
      } else {
        result.push({
          name: "Raw Data",
          value: formatPostDataValue(postData.text),
        });
      }
    } catch (e) {
      result.push({
        name: "Raw Data",
        value: formatPostDataValue(postData.text),
      });
    }
  }

  // If params exist (multipart form data, etc.)
  if (postData.params) {
    postData.params.forEach((param) => {
      result.push({
        name: param.name,
        value: formatPostDataValue(param.value),
      });
    });
  }

  return result;
}


/**
 * Parses POST data for display and analysis
 * @param {Object} postData - POST data object
 * @returns {Object|null} Parsed POST data or null
 */
export function parsePostData(postData) {
    if (!postData) {
      return null;
    }

    const mimeType = postData.mimeType
      ? postData.mimeType.split(";")[0].trim()
      : "";

    // Function to detect binary data
    const detectBinaryFormat = (data) => {
      const signatures = {
        // GZIP
        gzip: data.startsWith("\x1F\x8B"),
        // ZIP
        zip: data.startsWith("PK\x03\x04"),
        // PDF
        pdf: data.startsWith("%PDF"),
        // PNG
        png: data.startsWith("\x89PNG"),
        // JPEG
        jpeg: data.startsWith("\xFF\xD8\xFF"),
        // GIF
        gif: data.startsWith("GIF87a") || data.startsWith("GIF89a"),
        // Brotli
        brotli: data.startsWith("\xCE\xB2\xCF\x81"),
        // Zstandard
        zstd: data.startsWith("\x28\xB5\x2F\xFD"),
        // LZMA
        lzma: data.startsWith("\x5D\x00\x00"),
        // Protobuf
        protobuf: /[\x00-\x1F]/.test(data) && !/[\x20-\x7E]/.test(data),
      };

      for (const [format, detect] of Object.entries(signatures)) {
        if (detect) return format;
      }
      return null;
    };

    // List of binary MIME types
    const binaryMimeTypes = [
      "application/octet-stream",
      "application/x-protobuf",
      "application/x-msgpack",
      // "application/x-www-form-urlencoded",
      "application/zip",
      "application/x-gzip",
      "application/pdf",
      "image/",
      "audio/",
      "video/",
      "application/x-binary",
    ];

    let requestPostData = null;
    try {
      // Detect binary data
      const isBinaryMimeType = binaryMimeTypes.some((type) =>
        mimeType.startsWith(type),
      );
      const binaryFormat = postData.text
        ? detectBinaryFormat(postData.text)
        : null;

      if (binaryFormat || isBinaryMimeType) {
        return {
          mimeType: mimeType,
          text: binaryFormat
            ? `[${binaryFormat.toUpperCase()} Data]`
            : "[Binary Data]",
          format: binaryFormat || "unknown",
          isBinary: true,
        };
      }

      if (mimeType === "application/x-www-form-urlencoded") {
        try {
          requestPostData = {
            mimeType: mimeType,
            text: decodeURIComponent(postData.text),
            params: postData.params.map((param) => ({
              name: decodeURIComponent(param.name),
              value: escapeForMermaid(decodeURIComponent(param.value)), // escapeForMermaidを直接使用
            })),
          };
        } catch (e) {
          requestPostData = {
            mimeType: mimeType,
            text: postData.text,
            params: postData.params,
          };
        }
      } else if (mimeType === "text/plain") {
        try {
          requestPostData = {
            mimeType: mimeType,
            text: escapeForMermaid(decodeURIComponent(postData.text)), // escapeForMermaidを直接使用
          };
        } catch (e) {
          requestPostData = {
            mimeType: mimeType,
            text: escapeForMermaid(postData.text), // escapeForMermaidを直接使用
          };
        }
      } else if (mimeType === "application/json") {
        try {
          const decodedText = decodeURIComponent(postData.text);
          const jsonData = JSON.parse(decodedText);
          requestPostData = {
            mimeType: mimeType,
            text: decodedText,
            params: Object.entries(jsonData).map(([name, value]) => ({
              name: decodeURIComponent(name),
              value: escapeForMermaid(String(value)), // escapeForMermaidを直接使用
            })),
          };
        } catch (error) {
          requestPostData = {
            mimeType: mimeType,
            text: postData.text,
            error: true,
          };
        }
      } else {
        if (mimeType === "" || mimeType === null) {
          requestPostData = null;
        } else {
          requestPostData = {
            mimeType: mimeType,
            text: "[Unsupported Data Type]",
            isUnsupported: true,
          };
        }
      }
    } catch (e) {
      console.error("Error in parsePostData:", e);
      return {
        mimeType: mimeType,
        text: "[Parse Error]",
        error: true,
      };
    }

    return requestPostData;
  }
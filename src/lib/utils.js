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

export function truncateText(text, maxLength) {
  if (!text) return ""; // nullやundefinedの場合は空文字を返す
  const str = String(text); // 数値などの場合も文字列に変換
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export const escapeForMermaid = (text) => {
  if (!text) return "";

  return (
    text
      // 既存のエスケープ処理
      .replace(/\\/g, "\\\\") // バックスラッシュ
      .replace(/\$/g, "\\$") // ドル記号
      .replace(/\#/g, "\\#") // ハッシュ記号
      .replace(/\_/g, "\\_") // アンダースコア
      .replace(/\~/g, "\\~") // チルダ
      .replace(/\*/g, "\\*") // アスタリスク
      .replace(/\+/g, "\\+") // プラス記号
      .replace(/\=/g, "\\=") // イコール記号
      .replace(/\|/g, "\\|") // バーティカルバー
      .replace(/\[/g, "\\[") // 開き角括弧
      .replace(/\]/g, "\\]") // 閉じ角括弧
      .replace(/\{/g, "\\{") // 開き波括弧
      .replace(/\}/g, "\\}") // 閉じ波括弧
      .replace(/\(/g, "\\(") // 開き丸括弧
      .replace(/\)/g, "\\)") // 閉じ丸括弧
      .replace(/\>/g, "\\>") // 大なり記号
      .replace(/\</g, "\\<") // 小なり記号
      .replace(/\n/g, "\\n") // 改行
      .replace(/\r/g, "\\r") // 復帰
      .replace(/\t/g, "\\t") // タブq
      .replace(/\'/g, "\\'") // シングルクォート
      .replace(/\"/g, '\\"') // ダブルクォート
      .replace(/:/g, "&#58;") // コロン
      .replace(/;/g, "&#59;") // セミコロン
      .replace(/@/g, "&#64;") // アットマーク
      .replace(/&(?![#a-zA-Z0-9]+;)/g, "&amp;")
  ); // エスケープされていないアンパサンド
};

// 複雑な値の処理用の関数
export function truncateAndEscape(str, length) {
  if (!str) return "";

  // フォントのクエリパラメータなど、複雑な値の場合は簡略化
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
    return "other";
  }
}

export function formatTime(time) {
  if (time < 1000) {
    return `${Math.floor(time)}ms`;
  } else if (time < 60000) {
    // 秒単位での表示（60秒未満）
    const seconds = time / 1000;
    // 59.99秒のような境界値を適切に処理
    return `${Math.min(seconds, 59.99).toFixed(2)}s`;
  } else if (time < 3600000) {
    // 分と秒での表示（60分未満）
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    // 秒が60になるのを防ぐ
    if (seconds === 60) {
      return `${minutes + 1}min 00s`;
    }
    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  } else {
    // 時、分、秒での表示
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${hours}h ${String(minutes).padStart(2, "0")}min ${String(
      seconds
    ).padStart(2, "0")}s`;
  }
}

export function formatBytes(bytes) {
  // undefinedやNaNのチェックを追加
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === -1) {
    return "-";
  }
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const sign = Math.sign(bytes);
  bytes = Math.abs(bytes);

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  // toFixedを必ず適用して、小数点以下1桁を表示
  const value = (bytes / Math.pow(1024, i)).toFixed(1);
  // console.log('bytes:'+bytes+" / " + sign < 0 ? "-" + value + " " + units[i] : value + " " + units[i])

  return sign < 0 ? "-" + value + " " + units[i] : value + " " + units[i];
}

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

export function splitByLength(text, length) {
  const lines = [];
  for (let i = 0; i < text.length; i += length) {
    lines.push(text.slice(i, i + length));
  }
  return lines;
}

export function parseCacheControl(cacheControlHeader) {
  // 空文字列や未定義の場合は空オブジェクトを返す
  if (!cacheControlHeader) {
    return {};
  }

  const directives = cacheControlHeader
    .split(",")
    .map((directive) => directive.trim());
  const parsedDirectives = {};

  for (const directive of directives) {
    // 空の項目をスキップ
    if (!directive) {
      continue;
    }

    const [key, value] = directive.split("=");
    const trimmedKey = key.trim();

    // キーが空の場合はスキップ
    if (!trimmedKey) {
      continue;
    }

    parsedDirectives[trimmedKey] = value ? parseInt(value, 10) : true;
  }

  return parsedDirectives;
}

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
 * リソースのキャッシュ鮮度（Browser & CDN）を計算するための関数
 * @param {Object} entry - HARファイルのエントリー
 * @returns {Object} ブラウザとCDNのキャッシュ状態
 */
export function calculateFreshness(entry) {
  // 必要なヘッダー情報を取得
  const headers = entry.response.headers || [];
  const cacheControlHeader = headers.find(h => h.name.toLowerCase() === 'cache-control')?.value || '';
  const expiresHeader = headers.find(h => h.name.toLowerCase() === 'expires')?.value || '';
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
  const xCacheHeader = headers.find(h => h.name.toLowerCase() === 'x-cache')?.value || '';
  const cfCacheStatusHeader = headers.find(h => h.name.toLowerCase() === 'cf-cache-status')?.value || '';
  
  // レスポンス時刻を取得 (ミリ秒単位)
  let responseTime;
  if (dateHeader) {
    responseTime = new Date(dateHeader).getTime();
  } else if (entry.startedDateTime) {
    responseTime = new Date(entry.startedDateTime).getTime();
  } else {
    responseTime = Date.now() - 100000;
  }
  
  const currentTime = Date.now();
  
  // Cache-Control から max-age と s-maxage を抽出
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
  
  // Expires ヘッダーから有効期限を計算
  let expiresTime = null;
  if (expiresHeader) {
    expiresTime = new Date(expiresHeader).getTime();
  }
  
  // ブラウザキャッシュの状態を計算
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
  
  // CDN キャッシュの状態を計算
  let cdnStatus = 'Unknown';
  let cdnExpiryTime = null;
  let cdnProvider = null;
  
  // CDNプロバイダーを特定
  if (cfCacheStatusHeader) {
    cdnProvider = 'Cloudflare';
  } else if (xCacheHeader && xCacheHeader.includes('cloudfront')) {
    cdnProvider = 'CloudFront';
  } else if (xCacheHeader) {
    cdnProvider = 'Fastly/Other';
  }
  
  // Cloudflareの場合
  if (cdnProvider === 'Cloudflare') {
    switch (cfCacheStatusHeader.toUpperCase()) {
      case 'HIT':
        // リソースがCloudflareのキャッシュで見つかった
        cdnStatus = 'Fresh';
        break;
      case 'MISS':
        // キャッシュされていないが、オリジンから新しく取得されたのでFresh
        cdnStatus = 'Fresh';
        break;
      case 'EXPIRED':
        // キャッシュ内で見つかったが期限切れ、オリジンから再取得
        cdnStatus = 'Fresh'; // オリジンから再取得したので結果的にFresh
        break;
      case 'STALE':
        // 期限切れだがオリジンに接続できないためキャッシュから提供
        cdnStatus = 'Stale';
        break;
      case 'BYPASS':
        // キャッシュがバイパスされた（no-cache, private, max-age=0など）
        cdnStatus = 'Not Cacheable';
        break;
      case 'REVALIDATED':
        // 有効期限の再検証が行われた
        cdnStatus = 'Fresh';
        break;
      case 'UPDATING':
        // 期限切れだが人気のあるリソースなので更新中
        cdnStatus = 'Fresh';
        break;
      case 'DYNAMIC':
        // キャッシュ対象外と判断されたリソース
        cdnStatus = 'Not Cacheable';
        break;
      case 'NONE':
      case 'UNKNOWN':
        // キャッシュ対象外（Workerレスポンス、リダイレクト、WAFブロックなど）
        cdnStatus = 'Not Cacheable';
        break;
      default:
        cdnStatus = 'Unknown';
    }
  }
  // CloudFrontの場合（既存のロジック）
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
  // Fastlyまたはその他のCDN
  else if (cdnProvider === 'Fastly/Other') {
    if (xCacheHeader.includes('Hit')) {
      cdnStatus = 'Fresh';
    } else if (xCacheHeader.includes('Miss')) {
      cdnStatus = 'Fresh';
    }
  }
  // x-cacheヘッダーもcf-cache-statusもない場合は通常のキャッシュ計算
  else {
    if (cacheControlHeader.includes('no-store')) {
      cdnStatus = 'Not Cacheable';
    } else if (sMaxAge !== null) {
      cdnExpiryTime = responseTime + (sMaxAge * 1000);
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    } else if (maxAge !== null) {
      // s-maxage がない場合は max-age を CDN も使用
      cdnExpiryTime = responseTime + (maxAge * 1000);
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    } else if (expiresTime) {
      cdnExpiryTime = expiresTime;
      cdnStatus = currentTime < cdnExpiryTime ? 'Fresh' : 'Stale';
    }
  }
  
  // 結果をオブジェクトとして返す
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

export function getTopDomain(domain) {
  const parts = domain.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return domain;
}

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

export function copyTextarea(elemId) {
  const element = document.getElementById(elemId);
  if (element && element.value) {
    navigator.clipboard.writeText(element.value);
  }
}

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

export function formatToLocalTime(gmtDateString) {
  if (!gmtDateString) return "";

  try {
    const date = new Date(gmtDateString);
    if (isNaN(date.getTime())) return "";

    // タイムゾーン名を取得（例：'JST'）
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // タイムゾーンのオフセットを取得（例：'+0900'）
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

export function formatPostDataValue(value) {
  // nullやundefinedの処理
  if (value === null || value === undefined) {
    return "[null]";
  }

  // ArrayBufferとTypedArrayの処理
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return "[Binary Data]";
  }

  // オブジェクトや配列の処理
  if (typeof value === "object") {
    try {
      // 深いネストされたオブジェクトの場合は概要のみ表示
      if (JSON.stringify(value).length > 1000) {
        return "[Complex Object]";
      }
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return "[Complex Object]";
    }
  }

  // 長いテキストの処理
  if (typeof value === "string") {
    // URLエンコードされている可能性のあるデータのデコードを試みる
    try {
      const decoded = decodeURIComponent(value);
      // デコードしたデータが元のデータと異なり、かつ読みやすい場合のみデコード結果を使用
      if (decoded !== value && /^[\x20-\x7E\s]+$/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      // デコードに失敗した場合は元のデータを使用
    }

    // 長すぎるテキストの truncate
    if (value.length > 500) {
      return value.substring(0, 500) + "... [Text Truncated]";
    }
    return value;
  }

  // その他の基本型はそのまま文字列化
  return String(value);
}

// postDataの表示用に整形する関数
export function normalizePostData(postData) {
  if (!postData) return [];

  // mimeTypeに基づいて適切な処理を行う
  const result = [];

  // Content-Type に基づく処理
  if (postData.mimeType) {
    result.push({
      name: "Content-Type",
      value: postData.mimeType,
    });
  }

  // text/plainの場合
  if (postData.text) {
    try {
      // URLエンコードされたデータの処理
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

  // paramsがある場合（マルチパートフォームデータなど）
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

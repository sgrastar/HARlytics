import { truncateText, splitByLength } from "$lib/utils";

// export function escapeForMermaid(str) {
//   return str.replace(/:/g, "&#58;").replace(/\n/g, "<br>");
// }

/**
 * Truncates and escapes string for Mermaid diagrams
 * @param {string} str - String to process
 * @param {number} length - Maximum length
 * @returns {string} Processed string
 */
export function truncateAndEscapeMarmaid(str, length) {
  if (!str) return "";
  return escapeForMermaid(truncateText(str, length));
}

/**
 * Generates Mermaid diagram header and title
 * @param {boolean} addTitle - Whether to add title
 * @param {string} sequenceTitle - Title text
 * @param {boolean} addAutoNumber - Whether to add auto-numbering
 * @returns {string} Mermaid code
 */
export function generateMermaidHeaderAndTitle(
  addTitle,
  sequenceTitle,
  addAutoNumber
) {
  let mermaidCode = "sequenceDiagram\n";
  if (addTitle && sequenceTitle) {
    mermaidCode += `title: ${sequenceTitle}\n`;
  }
  if (addAutoNumber) {
    mermaidCode += "autonumber\n";
  }
  return mermaidCode;
}

/**
 * Generates Mermaid request arrow
 * @param {Object} entry - HAR entry
 * @param {boolean} addLifeline - Whether to add lifeline
 * @param {boolean} reqShowMethod - Show HTTP method
 * @param {boolean} reqShowPath - Show URL path
 * @param {boolean} reqShowScheme - Show URL scheme
 * @param {boolean} reqShowSecFetchMode - Show Sec-Fetch-Mode header
 * @returns {string} Mermaid code
 */
export function generateMermaidRequest(
  entry,
  addLifeline,
  reqShowMethod,
  reqShowPath,
  reqShowScheme,
  reqShowSecFetchMode
) {
  let requestParts = [];
  
  // Add method if selected
  if (reqShowMethod) {
    requestParts.push(`[${entry.method}]`);
  }
  
  // Add path if selected
  if (reqShowPath) {
    const truncatedPath = truncateText(entry.path, 70);
    const processedPath = truncatedPath.split(/([#;])/).map((part, index, array) => {
      if (part === '#') {
        return '#35;';
      }
      if (part === ';') {
        const nextPart = array[index + 1] || '';
        if (nextPart.includes('=')) {
          return '#59;';
        }
        return '#59;';
      }
      return part;
    }).join('');
    requestParts.push(processedPath);
  }
  
  // Add scheme if selected
  if (reqShowScheme) {
    let scheme = 'unknown'; // Default value
    try {
      const urlObj = new URL(entry.url);
      scheme = urlObj.protocol.replace(/:$/, ''); // Remove trailing colon
    } catch (e) {
      console.warn(`Could not parse URL to extract scheme: ${entry.url}`, e);
      const schemeMatch = entry.url.match(/^([a-zA-Z0-9.+-]+):/);
      if (schemeMatch && schemeMatch[1]) {
        scheme = schemeMatch[1];
      }
    }
    requestParts.push(`scheme:${scheme}`);
  }
  
  // Add Sec-Fetch-Mode if selected
  if (reqShowSecFetchMode) {
    // Find the Sec-Fetch-Mode header
    const secFetchMode = entry.requestHeaderAll.find(
      header => header.name.toLowerCase() === 'sec-fetch-mode'
    )?.value || 'n/a';
    requestParts.push(`fetch-mode:${secFetchMode}`);
  }
  
  // Join all parts with spaces
  const requestArrow = requestParts.join(' ');

  let line = `Browser->>${entry.domain}: ${requestArrow}\n`;
  if (addLifeline) {
    line += `  activate ${entry.domain}\n`;
  }
  return line;
}

/**
 * Generates Mermaid query string note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestQueryString - Whether to add query string
 * @param {boolean} truncateQueryStrings - Whether to truncate
 * @param {number} truncateQueryStringsLength - Max length
 * @returns {string} Mermaid code
 */
export function generateMermaidQueryString(
  entry,
  addRequestQueryString,
  truncateQueryStrings,
  truncateQueryStringsLength
) {
  try {
    if (
      !addRequestQueryString ||
      !entry?.requestQueryString ||
      entry.requestQueryString.length === 0
    ) {
      return "";
    }

    // デバッグログ
    // console.log('Processing generateMermaidQueryString:', {
    //   domain: entry.domain,
    //   queryCount: entry.requestQueryString.length
    // });

    // 特別な処理が必要なクエリパラメータの検出
    const hasComplexQueries = entry.requestQueryString.some((q) => {
      const hasSpecialChars =
        q.value &&
        (//q.value.includes(";") ||
          //q.value.includes("@") ||
          //q.value.includes("%") ||
          q.value.includes("|") ||
          q.value.includes("{") ||
          q.value.includes("}"));
      if (hasSpecialChars) {
        // console.log('Found complex query parameter:', {
        //   name: q.name,
        //   valuePreview: q.value?.substring(0, 50)
        // });
      }
      return hasSpecialChars;
    });

    // クエリパラメータの処理
    const processedQueries = entry.requestQueryString.map((qString) => {
      try {
        const name = qString?.name || "";
        let value = qString?.value || "";

        // 複雑なクエリの場合は簡略化
        if (
          hasComplexQueries &&
          value &&
          (//value.includes(";") ||
            //value.includes("@") ||
            //value.includes("%") ||
            value.includes("|") ||
            value.includes("{") ||
            value.includes("}"))
        ) {
          value = "[Complex Value]";
        } else if (truncateQueryStrings) {
          // 通常の切り詰め処理
          return `${truncateAndEscapeMarmaid(
            name,
            truncateQueryStringsLength
          )}: ${truncateAndEscapeMarmaid(value, truncateQueryStringsLength)}`;
        }

        // 安全なエスケープ処理
        const escapedName = escapeForMermaid(name);
        const escapedValue =
          value === "[Complex Value]" ? value : escapeForMermaid(value);

        return `${escapedName}: ${escapedValue}`;
      } catch (e) {
        console.error('Error processing query parameter:', e);
        return '[Invalid Parameter]';
      }
    });

    const requestQueryStringString = processedQueries
      .filter(q => q) // 無効なエントリを除外
      .join("<br>");

    // 最終的なMermaidコードの生成
    const result = `note over ${escapeForMermaid(
      entry.domain
    )}: [Query String]<br>${requestQueryStringString}\n`;

    // 生成されたコードの検証
    const previewLength = Math.min(result.length, 100);
    // console.log('Generated Mermaid code preview:', {
    //   preview: result.substring(0, previewLength),
    //   totalLength: result.length,
    //   queryCount: processedQueries.length
    // });

    return result;

  } catch (error) {
    console.error("Error in generateMermaidQueryString:", {
      error: error.message,
      stack: error.stack,
      entryInfo: {
        domain: entry?.domain,
        queryCount: entry?.requestQueryString?.length,
      },
    });

    // エラー時は安全な出力を返す
    return `note over ${escapeForMermaid(
      entry?.domain || "unknown"
    )}: [Query String Processing Error]\n`;
  }
}

/**
 * Generates Mermaid POST data note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestPostData - Whether to add POST data
 * @param {boolean} truncatePostData - Whether to truncate
 * @param {number} truncatePostDataLength - Max length
 * @returns {string} Mermaid code
 */
export function generateMermaidPostData(
  entry,
  addRequestPostData,
  truncatePostData,
  truncatePostDataLength
) {
  try {
    if (!addRequestPostData || !entry?.requestPostData) {
      return "";
    }

    //console.log(entry.requestPostData);

    let postDataString = "";
    const mimeType = entry.requestPostData.mimeType || "unknown";

    if (entry.requestPostData.params) {
      postDataString = entry.requestPostData.params
        .map(param => {
          try {
            const name = param?.name || '';
            const value = param?.value || '';
            
            // 問題のある文字パターンをチェック
            const hasProblematicChars = value.match(/[\\=&]/);
            
            if (hasProblematicChars) {
              // URL エンコードされた値の場合は固定テキストで置換
              return `${name}: [URL-encoded value]`;
            }
            
            const escapedValue = escapeForMermaid(value);

            if (truncatePostData) {
              return `${truncateText(name, truncatePostDataLength)}: ${truncateText(escapedValue, truncatePostDataLength)}`;
            }
            return `${name}: ${escapedValue}`;
          } catch (e) {
            console.error('Error processing POST parameter:', e);
            return '[Invalid Parameter]';
          }
        })
        .filter(param => param)
        .join('<br>');
    } else if (entry.requestPostData.text) {
      if (mimeType.includes('json') || entry.requestPostData.text.trim().startsWith('{') || entry.requestPostData.text.trim().startsWith('\\{\\')) {
        postDataString = '[Complex JSON Data]';
      } else if (mimeType.includes('text/plain')) {
        const hasProblematicChars = entry.requestPostData.text.match(/[\\=&]/);
        
        if (hasProblematicChars) {
          postDataString = '[URL-encoded data]';
        } else {
          postDataString = escapeForMermaid(entry.requestPostData.text);
        }
      }else {
        const text = entry.requestPostData.text;
        if (truncatePostData) {
          postDataString = truncateText(escapeForMermaid(text), truncatePostDataLength);
        } else {
          postDataString = escapeForMermaid(text);
        }
      }
    }

    // MIMEタイプは常に表示し、パラメータがある場合のみ改行を追加
    return `note over ${escapeForMermaid(entry.domain)}: [postData] ${mimeType}${postDataString ? '<br>' + postDataString : ''}\n`;

  } catch (error) {
    console.error('Error in generateMermaidPostData:', error);
    return `note over ${escapeForMermaid(entry.domain)}: [Error processing POST data]\n`;
  }
}

/**
 * Escapes special characters for Mermaid syntax
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeForMermaid(str) {
  if (!str) return "";

  if (str.includes('&amp;')) {
    return str;
  }
  
  return str
  .replace(/#/g, "&#35;")
  //.replace(/;/g, '&#59;')
  .replace(/:/g, '&#58;')
  
  
  //.replace(/;/g, "&#59;")
  .replace(/(?<!&#\d{2,3});/g, '&#59;')
  .replace(/\\/g, '') 
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/\|/g, '&#124;')
    .replace(/\n/g, '<br>')
    //.replace(/@/g, '&#64;')
    //.replace(/%/g, '&#37;');
    //.replace(/&(?![#a-zA-Z0-9]+;)/g, '&amp;');
}

/**
 * Generates Mermaid request cookies note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestCookies - Whether to add cookies
 * @param {boolean} truncateReqCookie - Whether to truncate
 * @param {number} truncateReqCookieLength - Max length
 * @returns {string} Mermaid code
 */
export function generateMermaidRequestCookies(
  entry,
  addRequestCookies,
  truncateReqCookie,
  truncateReqCookieLength
) {
  if (addRequestCookies && entry.requestCookies.length > 0) {
    let cookieString = "";

    if (truncateReqCookie) {
      cookieString = entry.requestCookies
        .map(
          (cookie) =>
            `${truncateAndEscapeMarmaid(
              cookie.name,
              truncateReqCookieLength
            )}: ${truncateAndEscapeMarmaid(cookie.value, truncateReqCookieLength)}`
        )
        .join("<br>");
    } else {
      cookieString = entry.requestCookies
        .map((cookie) => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForMermaid(lines.join("<br>"));
        })
        .join("<br>");
    }
    return `note over ${entry.domain}: [Request Cookies]<br>${cookieString}\n`;
  }
  return "";
}

/**
 * Generates Mermaid response arrow
 * @param {Object} entry - HAR entry
 * @param {boolean} addLifeline - Whether to add lifeline
 * @param {boolean} resShowStatus - Show status code
 * @param {boolean} resShowMimeType - Show MIME type
 * @param {boolean} resShowPriority - Show priority
 * @param {boolean} resShowTimeFormatted - Show formatted time
 * @param {boolean} resShowTimeMs - Show time in ms
 * @param {boolean} resShowSizeFormatted - Show formatted size
 * @param {boolean} resShowSizeBytes - Show size in bytes
 * @param {Function} formatTime - Time formatter function
 * @param {Function} formatBytes - Bytes formatter function
 * @returns {string} Mermaid code
 */
export function generateMermaidResponse(
  entry, 
  addLifeline,
  resShowStatus,
  resShowMimeType,
  resShowPriority,
  resShowTimeFormatted,
  resShowTimeMs,
  resShowSizeFormatted,
  resShowSizeBytes,
  formatTime,
  formatBytes
) {
  let responseParts = [];
  
  // Add status if selected
  if (resShowStatus) {
    responseParts.push(`${entry.status}`);
  }
  
  // Add MIME type if selected
  if (resShowMimeType) {
    responseParts.push(`${entry.responseMimeType.replace(/;/g, "#59;")}`);
  }

  // Add priority if selected
  if (resShowPriority) {
    responseParts.push(`${entry.priority}`);
  }
  
  // Add time (formatted) if selected
  if (resShowTimeFormatted) {
    responseParts.push(`${formatTime(entry.time)}`);
  }
  
  // Add time (ms) if selected
  if (resShowTimeMs) {
    responseParts.push(`${Math.round(entry.time)}ms`);
  }
  
  // Add size (formatted) if selected
  if (resShowSizeFormatted) {
    responseParts.push(`${formatBytes(entry.responseContentLength)}`);
  }
  
  // Add size (bytes) if selected
  if (resShowSizeBytes) {
    responseParts.push(`${entry.responseContentLength}bytes`);
  }
  
  // Join all parts with spaces
  const responseArrow = responseParts.join(' - ');

  let responseCode = "";
  
  if (entry.status >= 300 && entry.status <= 399) {
    responseCode += `${entry.domain} -->> Browser: ${responseArrow}\n`;
  } else if (entry.status >= 400 && entry.status <= 599) {
    responseCode += `${entry.domain} --x Browser: ${responseArrow}\n`;
  } else {
    responseCode += `${entry.domain} ->> Browser: ${responseArrow}\n`;
  }

  if (addLifeline) {
    responseCode += `  deactivate ${entry.domain}\n`;
  }

  return responseCode;
}

/**
 * Generates Mermaid response cookies note
 * @param {Object} entry - HAR entry
 * @param {boolean} addResponseCookies - Whether to add cookies
 * @param {boolean} truncateResCookie - Whether to truncate
 * @param {number} truncateResCookieLength - Max length
 * @returns {string} Mermaid code
 */
export function generateMermaidResponseCookies(
  entry,
  addResponseCookies,
  truncateResCookie,
  truncateResCookieLength
) {
  if (addResponseCookies && entry.responseCookies.length > 0) {
    let cookieString = "";

    if (truncateResCookie) {
      cookieString = entry.responseCookies
        .map(
          (cookie) =>
            `${truncateAndEscapeMarmaid(
              cookie.name,
              truncateResCookieLength
            )}: ${truncateAndEscapeMarmaid(cookie.value, truncateResCookieLength)}`
        )
        .join("<br>");
    } else {
      cookieString = entry.responseCookies
        .map((cookie) => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForMermaid(lines.join("<br>"));
        })
        .join("<br>");
    }
    return `note over Browser: [Response Cookies]<br>${cookieString}\n`;
  }
  return "";
}

/**
 * Escapes special characters for PlantUML syntax
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeForPlantUML(str) {
  return str.replace(/:/g, "&#58;").replace(/\n/g, "\\n");
}

/**
 * Truncates and escapes string for PlantUML
 * @param {string} str - String to process
 * @param {number} length - Maximum length
 * @returns {string} Processed string
 */
function truncateAndEscapePlantUML(str, length) {
  return escapeForPlantUML(truncateText(str, length));
}

/**
 * Generates PlantUML diagram header and title
 * @param {boolean} addTitle - Whether to add title
 * @param {string} sequenceTitle - Title text
 * @param {boolean} addAutoNumber - Whether to add auto-numbering
 * @returns {string} PlantUML code
 */
export function generatePlantUMLHeaderAndTitle(
  addTitle,
  sequenceTitle,
  addAutoNumber
) {
  let plantUMLCode = "@startuml\n";
  if (addTitle && sequenceTitle) {
    plantUMLCode += `title ${sequenceTitle}\n`;
  }
  if (addAutoNumber) {
    plantUMLCode += "autonumber\n";
  }
  return plantUMLCode;
}

/**
 * Generates PlantUML request arrow
 * @param {Object} entry - HAR entry
 * @param {boolean} addLifeline - Whether to add lifeline
 * @param {boolean} reqShowMethod - Show HTTP method
 * @param {boolean} reqShowPath - Show URL path
 * @param {boolean} reqShowScheme - Show URL scheme
 * @param {boolean} reqShowSecFetchMode - Show Sec-Fetch-Mode header
 * @returns {string} PlantUML code
 */
export function generatePlantUMLRequest(
  entry,
  addLifeline,
  reqShowMethod,
  reqShowPath,
  reqShowScheme,
  reqShowSecFetchMode
) {
  let requestParts = [];
  
  // Add method if selected
  if (reqShowMethod) {
    requestParts.push(`[${entry.method}]`);
  }
  
  // Add path if selected
  if (reqShowPath) {
    const truncatedPath = truncateText(entry.path, 70);
    requestParts.push(truncatedPath);
  }
  
  // Add scheme if selected
  if (reqShowScheme) {
    let scheme = 'unknown'; // Default value
    try {
      const urlObj = new URL(entry.url);
      scheme = urlObj.protocol.replace(/:$/, ''); // Remove trailing colon
    } catch (e) {
      console.warn(`Could not parse URL to extract scheme: ${entry.url}`, e);
      const schemeMatch = entry.url.match(/^([a-zA-Z0-9.+-]+):/);
      if (schemeMatch && schemeMatch[1]) {
        scheme = schemeMatch[1];
      }
    }
    requestParts.push(`scheme:${scheme}`);
  }
  
  // Add Sec-Fetch-Mode if selected
  if (reqShowSecFetchMode) {
    // Find the Sec-Fetch-Mode header
    const secFetchMode = entry.requestHeaderAll.find(
      header => header.name.toLowerCase() === 'sec-fetch-mode'
    )?.value || 'n/a';
    
    requestParts.push(`fetch-mode:${secFetchMode}`);
  }
  
  // Join all parts with spaces
  const requestArrow = requestParts.join(' ');

  let line = `Browser -> "${entry.domain}": ${requestArrow}\n`;
  if (addLifeline) {
    line += `activate "${entry.domain}"\n`;
  }
  return line;
}

/**
 * Generates PlantUML query string note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestQueryString - Whether to add query string
 * @param {boolean} truncateQueryStrings - Whether to truncate
 * @param {number} truncateQueryStringsLength - Max length
 * @returns {string} PlantUML code
 */
export function generatePlantUMLQueryString(
  entry,
  addRequestQueryString,
  truncateQueryStrings,
  truncateQueryStringsLength
) {
  if (
    addRequestQueryString &&
    entry.requestQueryString &&
    entry.requestQueryString.length > 0
  ) {
    let requestQueryStringString = "";

    if (truncateQueryStrings) {
      requestQueryStringString = entry.requestQueryString
        .map(
          (Qstring) =>
            `${truncateAndEscapePlantUML(
              Qstring.name,
              truncateQueryStringsLength
            )}: ${truncateAndEscapePlantUML(
              Qstring.value,
              truncateQueryStringsLength
            )}`
        )
        .join("\\n");
    } else {
      requestQueryStringString = entry.requestQueryString
        .map((Qstring) => {
          const lines = splitByLength(`${Qstring.name}: ${Qstring.value}`, 50);
          return escapeForPlantUML(lines.join("\\n"));
        })
        .join("\\n");
    }
    return `note over "${entry.domain}": **[Query String]**\\n${requestQueryStringString}\n`;
  }
  return "";
}

/**
 * Generates PlantUML POST data note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestPostData - Whether to add POST data
 * @param {boolean} truncatePostData - Whether to truncate
 * @param {number} truncatePostDataLength - Max length
 * @returns {string} PlantUML code
 */
export function generatePlantUMLPostData(
  entry,
  addRequestPostData,
  truncatePostData,
  truncatePostDataLength
) {
  if (addRequestPostData && entry.requestPostData) {
    let postDataString = "";

    if (truncatePostData) {
      postDataString = entry.requestPostData.params
        ? entry.requestPostData.params
            .map(
              (param) =>
                `${truncateAndEscapePlantUML(
                  param.name,
                  truncatePostDataLength
                )}: ${truncateAndEscapePlantUML(
                  param.value,
                  truncatePostDataLength
                )}`
            )
            .join("\\n")
        : truncateAndEscapePlantUML(
            entry.requestPostData.text,
            truncatePostDataLength
          );
    } else {
      postDataString = entry.requestPostData.params
        ? entry.requestPostData.params
            .map((param) => {
              const lines = splitByLength(`${param.name}: ${param.value}`, 50);
              return escapeForPlantUML(lines.join("\\n"));
            })
            .join("\\n")
        : escapeForPlantUML(
            splitByLength(entry.requestPostData.text, 50).join("\\n")
          );
    }
    return `note over "${entry.domain}": **[postData]** ${entry.requestPostData.mimeType}\\n${postDataString}\n`;
  }
  return "";
}

/**
 * Generates PlantUML request cookies note
 * @param {Object} entry - HAR entry
 * @param {boolean} addRequestCookies - Whether to add cookies
 * @param {boolean} truncateReqCookie - Whether to truncate
 * @param {number} truncateReqCookieLength - Max length
 * @returns {string} PlantUML code
 */
export function generatePlantUMLRequestCookies(
  entry,
  addRequestCookies,
  truncateReqCookie,
  truncateReqCookieLength
) {
  if (addRequestCookies && entry.requestCookies.length > 0) {
    let cookieString = "";

    if (truncateReqCookie) {
      cookieString = entry.requestCookies
        .map(
          (cookie) =>
            `${truncateAndEscapePlantUML(
              cookie.name,
              truncateReqCookieLength
            )}: ${truncateAndEscapePlantUML(
              cookie.value,
              truncateReqCookieLength
            )}`
        )
        .join("\\n");
    } else {
      cookieString = entry.requestCookies
        .map((cookie) => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForPlantUML(lines.join("\\n"));
        })
        .join("\\n");
    }
    return `note over "${entry.domain}": **[Request Cookies]**\\n${cookieString}\n`;
  }
  return "";
}

/**
 * Generates PlantUML response arrow
 * @param {Object} entry - HAR entry
 * @param {boolean} addLifeline - Whether to add lifeline
 * @param {boolean} resShowStatus - Show status code
 * @param {boolean} resShowMimeType - Show MIME type
 * @param {boolean} resShowPriority - Show priority
 * @param {boolean} resShowTimeFormatted - Show formatted time
 * @param {boolean} resShowTimeMs - Show time in ms
 * @param {boolean} resShowSizeFormatted - Show formatted size
 * @param {boolean} resShowSizeBytes - Show size in bytes
 * @param {Function} formatTime - Time formatter function
 * @param {Function} formatBytes - Bytes formatter function
 * @returns {string} PlantUML code
 */
export function generatePlantUMLResponse(
  entry, 
  addLifeline,
  resShowStatus,
  resShowMimeType,
  resShowPriority,
  resShowTimeFormatted,
  resShowTimeMs,
  resShowSizeFormatted,
  resShowSizeBytes,
  formatTime,
  formatBytes
) {
  let responseParts = [];
  
  // Add status if selected
  if (resShowStatus) {
    responseParts.push(`${entry.status}`);
  }
  
  // Add MIME type if selected
  if (resShowMimeType) {
    responseParts.push(`${entry.responseMimeType}`);
  }
  
  // Add priority if selected
  if (resShowPriority && entry.priority) {
    responseParts.push(`P:${entry.priority}`);
  }

  // Add time (formatted) if selected
  if (resShowTimeFormatted) {
    responseParts.push(`${formatTime(entry.time)}`);
  }
  
  // Add time (ms) if selected
  if (resShowTimeMs) {
    responseParts.push(`${Math.round(entry.time)}ms`);
  }
  
  // Add size (formatted) if selected
  if (resShowSizeFormatted) {
    responseParts.push(`${formatBytes(entry.responseContentLength)}`);
  }
  
  // Add size (bytes) if selected
  if (resShowSizeBytes) {
    responseParts.push(`${entry.responseContentLength}bytes`);
  }
  
  // Join all parts with spaces
  const responseArrow = responseParts.join(' - ');

  let responseCode = "";
  
  if (entry.status >= 300 && entry.status <= 399) {
    responseCode += `"${entry.domain}" --> Browser: ${responseArrow}\n`;
  } else if (entry.status >= 400 && entry.status <= 599) {
    responseCode += `"${entry.domain}" --> Browser !!: ${responseArrow}\n`;
  } else {
    responseCode += `"${entry.domain}" -> Browser: ${responseArrow}\n`;
  }

  if (addLifeline) {
    responseCode += `deactivate "${entry.domain}"\n`;
  }

  return responseCode;
}

/**
 * Generates PlantUML response cookies note
 * @param {Object} entry - HAR entry
 * @param {boolean} addResponseCookies - Whether to add cookies
 * @param {boolean} truncateResCookie - Whether to truncate
 * @param {number} truncateResCookieLength - Max length
 * @returns {string} PlantUML code
 */
export function generatePlantUMLResponseCookies(
  entry,
  addResponseCookies,
  truncateResCookie,
  truncateResCookieLength
) {
  if (addResponseCookies && entry.responseCookies.length > 0) {
    let cookieString = "";

    if (truncateResCookie) {
      cookieString = entry.responseCookies
        .map(
          (cookie) =>
            `${truncateAndEscapePlantUML(
              cookie.name,
              truncateResCookieLength
            )}: ${truncateAndEscapePlantUML(
              cookie.value,
              truncateResCookieLength
            )}`
        )
        .join("\\n");
    } else {
      cookieString = entry.responseCookies
        .map((cookie) => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForPlantUML(lines.join("\\n"));
        })
        .join("\\n");
    }
    return `note over Browser: **[Response Cookies]**\\n${cookieString}\n`;
  }
  return "";
}
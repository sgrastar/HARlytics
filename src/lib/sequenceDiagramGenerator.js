import { truncateText, splitByLength } from '$lib/utils';

export function escapeForMermaid(str) {
  return str.replace(/:/g, '&#58;').replace(/\n/g, '<br>');
}

export function truncateAndEscape(str, length) {
  return escapeForMermaid(truncateText(str, length));
}

export function generateMermaidHeaderAndTitle(addTitle, sequenceTitle, addAutoNumber) {
    let mermaidCode = 'sequenceDiagram\n';
    if (addTitle && sequenceTitle) {
      mermaidCode += `title: ${sequenceTitle}\n`;
    }
    if (addAutoNumber) {
      mermaidCode += "autonumber\n";
    }
    return mermaidCode;
  }
  
  // BUG 一部のharファイルでエラー発生。修正
  export function generateMermaidQueryString(entry, addRequestQueryString, truncateQueryStrings, truncateQueryStringsLength) {
    try {
      if (!addRequestQueryString || !entry.requestQueryString || entry.requestQueryString.length === 0) {
        return '';
      }
  
      // デバッグログ
      // console.log('Processing generateMermaidQueryString:', {
      //   domain: entry.domain,
      //   queryCount: entry.requestQueryString.length
      // });
  
      // 特別な処理が必要なクエリパラメータの検出
      const hasComplexQueries = entry.requestQueryString.some(q => {
        const hasSpecialChars = q.value && (
          q.value.includes(';') || 
          q.value.includes('@') || 
          q.value.includes('%') ||
          q.value.includes('|') ||
          q.value.includes('{') ||
          q.value.includes('}')
        );
        if (hasSpecialChars) {
          // console.log('Found complex query parameter:', {
          //   name: q.name,
          //   valuePreview: q.value?.substring(0, 50)
          // });
        }
        return hasSpecialChars;
      });
  
      let requestQueryStringString = '';
  
      // クエリパラメータの処理
      const processedQueries = entry.requestQueryString.map(qString => {
        const name = qString.name || '';
        let value = qString.value || '';
  
        // 複雑なクエリの場合は簡略化
        if (hasComplexQueries && value && (
          value.includes(';') || 
          value.includes('@') ||
          value.includes('%') ||
          value.includes('|') ||
          value.includes('{') ||
          value.includes('}')
        )) {
          value = '[Complex Value]';
        } else if (truncateQueryStrings) {
          // 通常の切り詰め処理
          return `${truncateAndEscape(name, truncateQueryStringsLength)}: ${truncateAndEscape(value, truncateQueryStringsLength)}`;
        }
  
        // 安全なエスケープ処理
        const escapedName = escapeForMermaid(name);
        const escapedValue = value === '[Complex Value]' ? value : escapeForMermaid(value);
        
        return `${escapedName}: ${escapedValue}`;
      });
  
      requestQueryStringString = processedQueries.join('<br>');
  
      // 最終的なMermaidコードの生成
      const result = `note over ${escapeForMermaid(entry.domain)}: [Query String]<br>${requestQueryStringString}\n`;
  
      // 生成されたコードの検証
      const previewLength = Math.min(result.length, 100);
      // console.log('Generated Mermaid code preview:', {
      //   preview: result.substring(0, previewLength),
      //   totalLength: result.length,
      //   queryCount: processedQueries.length
      // });
  
      return result;
  
    } catch (error) {
      console.error('Error in generateMermaidQueryString:', {
        error: error.message,
        stack: error.stack,
        entryInfo: {
          domain: entry?.domain,
          queryCount: entry?.requestQueryString?.length
        }
      });
      
      // エラー時は安全な出力を返す
      return `note over ${escapeForMermaid(entry?.domain || 'unknown')}: [Query String Processing Error]\n`;
    }
  }

  export function generateMermaidPostData(entry, addRequestPostData, truncatePostData, truncatePostDataLength) {
    if (addRequestPostData && entry.requestPostData) {
      let postDataString = '';
  
      if (truncatePostData) {
        postDataString = entry.requestPostData.params
          ? entry.requestPostData.params.map(param => `${truncateAndEscape(param.name, truncatePostDataLength)}: ${truncateAndEscape(param.value, truncatePostDataLength)}`).join('<br>')
          : truncateAndEscape(entry.requestPostData.text, truncatePostDataLength);
      } else {
        postDataString = entry.requestPostData.params
          ? entry.requestPostData.params.map(param => {
              const lines = splitByLength(`${param.name}: ${param.value}`, 50);
              return escapeForMermaid(lines.join('<br>'));
            }).join('<br>')
          : escapeForMermaid(splitByLength(entry.requestPostData.text, 50).join('<br>'));
      }
      return `note over ${entry.domain}: [postData] ${entry.requestPostData.mimeType}<br>${postDataString}\n`;
    }
    return '';
  }

  export function generateMermaidRequestCookies(entry, addRequestCookies, truncateReqCookie, truncateReqCookieLength) {
    if (addRequestCookies && entry.requestCookies.length > 0) {
      let cookieString = '';
  
      if (truncateReqCookie) {
        cookieString = entry.requestCookies.map(cookie => 
          `${truncateAndEscape(cookie.name, truncateReqCookieLength)}: ${truncateAndEscape(cookie.value, truncateReqCookieLength)}`
        ).join('<br>');
      } else {
        cookieString = entry.requestCookies.map(cookie => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForMermaid(lines.join('<br>'));
        }).join('<br>');
      }
      return `note over ${entry.domain}: [Request Cookies]<br>${cookieString}\n`;
    }
    return '';
  }

  export function generateMermaidResponse(entry, addLifeline) {
    let responseCode = '';
    const responseArrow = `${entry.status} - ${entry.responseMimeType}`;
  
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


  export function generateMermaidResponseCookies(entry, addResponseCookies, truncateResCookie, truncateResCookieLength) {
    if (addResponseCookies && entry.responseCookies.length > 0) {
      let cookieString = '';
  
      if (truncateResCookie) {
        cookieString = entry.responseCookies.map(cookie => 
          `${truncateAndEscape(cookie.name, truncateResCookieLength)}: ${truncateAndEscape(cookie.value, truncateResCookieLength)}`
        ).join('<br>');
      } else {
        cookieString = entry.responseCookies.map(cookie => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForMermaid(lines.join('<br>'));
        }).join('<br>');
      }
      return `note over Browser: [Response Cookies]<br>${cookieString}\n`;
    }
    return '';
  }


  function escapeForPlantUML(str) {
    return str.replace(/:/g, '&#58;').replace(/\n/g, '\\n');
  }
  
  function truncateAndEscapePlantUML(str, length) {
    return escapeForPlantUML(truncateText(str, length));
  }
  
  export function generatePlantUMLHeaderAndTitle(addTitle, sequenceTitle, addAutoNumber) {
    let plantUMLCode = '@startuml\n';
    if (addTitle && sequenceTitle) {
      plantUMLCode += `title ${sequenceTitle}\n`;
    }
    if (addAutoNumber) {
      plantUMLCode += "autonumber\n";
    }
    return plantUMLCode;
  }
  
  export function generatePlantUMLQueryString(entry, addRequestQueryString, truncateQueryStrings, truncateQueryStringsLength) {
    if (addRequestQueryString && entry.requestQueryString && entry.requestQueryString.length > 0) {
      let requestQueryStringString = '';
      
      if (truncateQueryStrings) {
        requestQueryStringString = entry.requestQueryString.map(Qstring => 
          `${truncateAndEscapePlantUML(Qstring.name, truncateQueryStringsLength)}: ${truncateAndEscapePlantUML(Qstring.value, truncateQueryStringsLength)}`
        ).join('\\n');
      } else {
        requestQueryStringString = entry.requestQueryString.map(Qstring => {
          const lines = splitByLength(`${Qstring.name}: ${Qstring.value}`, 50);
          return escapeForPlantUML(lines.join('\\n'));
        }).join('\\n');
      }
      return `note over "${entry.domain}": **[Query String]**\\n${requestQueryStringString}\n`;
    }
    return '';
  }
  
  export function generatePlantUMLPostData(entry, addRequestPostData, truncatePostData, truncatePostDataLength) {
    if (addRequestPostData && entry.requestPostData) {
      let postDataString = '';
  
      if (truncatePostData) {
        postDataString = entry.requestPostData.params
          ? entry.requestPostData.params.map(param => `${truncateAndEscapePlantUML(param.name, truncatePostDataLength)}: ${truncateAndEscapePlantUML(param.value, truncatePostDataLength)}`).join('\\n')
          : truncateAndEscapePlantUML(entry.requestPostData.text, truncatePostDataLength);
      } else {
        postDataString = entry.requestPostData.params
          ? entry.requestPostData.params.map(param => {
              const lines = splitByLength(`${param.name}: ${param.value}`, 50);
              return escapeForPlantUML(lines.join('\\n'));
            }).join('\\n')
          : escapeForPlantUML(splitByLength(entry.requestPostData.text, 50).join('\\n'));
      }
      return `note over "${entry.domain}": **[postData]** ${entry.requestPostData.mimeType}\\n${postDataString}\n`;
    }
    return '';
  }
  
  export function generatePlantUMLRequestCookies(entry, addRequestCookies, truncateReqCookie, truncateReqCookieLength) {
    if (addRequestCookies && entry.requestCookies.length > 0) {
      let cookieString = '';
  
      if (truncateReqCookie) {
        cookieString = entry.requestCookies.map(cookie => 
          `${truncateAndEscapePlantUML(cookie.name, truncateReqCookieLength)}: ${truncateAndEscapePlantUML(cookie.value, truncateReqCookieLength)}`
        ).join('\\n');
      } else {
        cookieString = entry.requestCookies.map(cookie => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForPlantUML(lines.join('\\n'));
        }).join('\\n');
      }
      return `note over "${entry.domain}": **[Request Cookies]**\\n${cookieString}\n`;
    }
    return '';
  }
  
  export function generatePlantUMLResponse(entry, addLifeline) {
    let responseCode = '';
    const responseArrow = `${entry.status} - ${entry.responseMimeType}`;
  
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
  
  export function generatePlantUMLResponseCookies(entry, addResponseCookies, truncateResCookie, truncateResCookieLength) {
    if (addResponseCookies && entry.responseCookies.length > 0) {
      let cookieString = '';
  
      if (truncateResCookie) {
        cookieString = entry.responseCookies.map(cookie => 
          `${truncateAndEscapePlantUML(cookie.name, truncateResCookieLength)}: ${truncateAndEscapePlantUML(cookie.value, truncateResCookieLength)}`
        ).join('\\n');
      } else {
        cookieString = entry.responseCookies.map(cookie => {
          const lines = splitByLength(`${cookie.name}: ${cookie.value}`, 50);
          return escapeForPlantUML(lines.join('\\n'));
        }).join('\\n');
      }
      return `note over Browser: **[Response Cookies]**\\n${cookieString}\n`;
    }
    return '';
  }
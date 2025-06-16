/**
 * Validates HAR file content
 * @param {string | object} harContent - HAR file content (JSON string or parsed object)
 * @returns {{isValid: boolean, errors: Array<{path: string, message: string}>, parsedHar: object | null}}
 */
export function validateHar(harContent) {
    const errors = [];
    let harData;

    if (typeof harContent === 'string') {
        try {
            harData = JSON.parse(harContent);
        } catch (e) {
            errors.push({ path: '', message: `Invalid JSON format: ${e.message}` });
            return { isValid: false, errors, parsedHar: null };
        }
    } else if (typeof harContent === 'object' && harContent !== null) {
        harData = harContent;
    } else {
        errors.push({ path: '', message: 'Input must be a JSON string or a parsed HAR object.' });
        return { isValid: false, errors, parsedHar: null };
    }

    // 2. Check if 'log' object exists at root
    if (!harData.log || typeof harData.log !== 'object') {
        errors.push({ path: 'log', message: 'The "log" object is missing or has an invalid type.' });
        return { isValid: errors.length === 0, errors, parsedHar: harData };
    }

    const log = harData.log;

    // 3. Check required fields in 'log' object
    // if (typeof log.version !== 'string' || !log.version.match(/^\d+\.\d+$/)) {
    //     errors.push({ path: 'log.version', message: '"log.version" is required and must be a string like "1.1" or "1.2".' });
    // }

    // if (!log.creator || typeof log.creator !== 'object') {
    //     errors.push({ path: 'log.creator', message: 'The "log.creator" object is required.' });
    // } else {
    //     if (typeof log.creator.name !== 'string') {
    //         errors.push({ path: 'log.creator.name', message: '"log.creator.name" is required and must be a string.' });
    //     }
    //     if (typeof log.creator.version !== 'string') {
    //         errors.push({ path: 'log.creator.version', message: '"log.creator.version" is required and must be a string.' });
    //     }
    // }

    // if (log.browser && typeof log.browser !== 'object') {
    //     errors.push({ path: 'log.browser', message: 'If "log.browser" exists, it must be an object.' });
    // } else if (log.browser) {
    //     if (typeof log.browser.name !== 'string') {
    //         errors.push({ path: 'log.browser.name', message: '"log.browser.name" must be a string.' });
    //     }
    //     if (typeof log.browser.version !== 'string') {
    //         errors.push({ path: 'log.browser.version', message: '"log.browser.version" must be a string.' });
    //     }
    // }

    if (!log.entries || !Array.isArray(log.entries)) {
        errors.push({ path: 'log.entries', message: '"log.entries" is required and must be an array.' });
        if (errors.length > 0) return { isValid: false, errors, parsedHar: harData };
    } else {
        log.entries.forEach((entry, index) => {
            const entryPath = `log.entries[${index}]`;

            if (typeof entry !== 'object' || entry === null) {
                errors.push({ path: entryPath, message: 'Entry object is invalid.' });
                return;
            }

            if (typeof entry.startedDateTime !== 'string' || !isValidISO8601(entry.startedDateTime)) {
                errors.push({ path: `${entryPath}.startedDateTime`, message: '"startedDateTime" is required and must be an ISO 8601 formatted string.' });
            }
            // if (typeof entry.time !== 'number' || entry.time < 0) {
            //     errors.push({ path: `${entryPath}.time`, message: '"time" is required and must be a non-negative number.' });
            // }

            if (!entry.request || typeof entry.request !== 'object') {
                errors.push({ path: `${entryPath}.request`, message: 'The "request" object is required.' });
            } else {
                const req = entry.request;
                const reqPath = `${entryPath}.request`;
                if (typeof req.method !== 'string' || req.method.trim() === '') {
                    errors.push({ path: `${reqPath}.method`, message: '"method" is required and must be a non-empty string.' });
                }
                if (typeof req.url !== 'string' || req.url.trim() === '') {
                    errors.push({ path: `${reqPath}.url`, message: '"url" is required and must be a non-empty string.' });
                }
                if (typeof req.httpVersion !== 'string') {
                    errors.push({ path: `${reqPath}.httpVersion`, message: '"httpVersion" is required and must be a string.' });
                }
                if (!Array.isArray(req.headers)) {
                    errors.push({ path: `${reqPath}.headers`, message: '"headers" is required and must be an array.' });
                } else {
                    validateNameValueArray(req.headers, `${reqPath}.headers`, errors, "Header");
                }
                // if (!Array.isArray(req.queryString)) {
                //     errors.push({ path: `${reqPath}.queryString`, message: '"queryString" is required and must be an array.' });
                // } else {
                //     validateNameValueArray(req.queryString, `${reqPath}.queryString`, errors, "Query string parameter");
                // }
                if (req.postData && typeof req.postData !== 'object') {
                     errors.push({ path: `${reqPath}.postData`, message: 'If "postData" exists, it must be an object.' });
                } else if (req.postData) {
                    // Commented out because mimeType can be null in tools like Fiddler
                    // if (typeof req.postData.mimeType !== 'string') {
                    //     errors.push({ path: `${reqPath}.postData.mimeType`, message: '"postData.mimeType" is required and must be a string.' });
                    // }
                }
            }

            // Response object (continue checking required fields similarly)
            if (!entry.response || typeof entry.response !== 'object') {
                errors.push({ path: `${entryPath}.response`, message: 'The "response" object is required.' });
            } else {
                const res = entry.response;
                const resPath = `${entryPath}.response`;
                if (typeof res.status !== 'number') {
                    errors.push({ path: `${resPath}.status`, message: '"status" is required and must be a number.' });
                }
                // Commented out because statusText can be null in tools like Fiddler
                // if (typeof res.statusText !== 'string') {
                //     errors.push({ path: `${resPath}.statusText`, message: '"statusText" is required and must be a string.' });
                // }
                if (typeof res.httpVersion !== 'string') {
                    errors.push({ path: `${resPath}.httpVersion`, message: '"httpVersion" is required and must be a string.' });
                }
                if (!Array.isArray(res.headers)) {
                    errors.push({ path: `${resPath}.headers`, message: '"headers" is required and must be an array.' });
                } else {
                    validateNameValueArray(res.headers, `${resPath}.headers`, errors, "Header"); 
                }
                if (!res.content || typeof res.content !== 'object') {
                    errors.push({ path: `${resPath}.content`, message: 'The "content" object is required.' });
                } else {
                    if (typeof res.content.size !== 'number') {
                        errors.push({ path: `${resPath}.content.size`, message: '"content.size" is required and must be a number.' });
                    }
                    // Commented out because mimeType can be null in tools like Fiddler
                    // if (typeof res.content.mimeType !== 'string') {
                    //     errors.push({ path: `${resPath}.content.mimeType`, message: '"content.mimeType" is required and must be a string.' });
                    // }
                }
            }

            if (!entry.timings || typeof entry.timings !== 'object') {
                errors.push({ path: `${entryPath}.timings`, message: 'The "timings" object is required.' });
            } else {
                const timings = entry.timings;
                const timingsPath = `${entryPath}.timings`;
                const requiredTimings = ['send', 'wait', 'receive'];
                requiredTimings.forEach(timingName => {
                    // Commented out because timings values can be -1 in Charles
                    // if (typeof timings[timingName] !== 'number' || timings[timingName] < -1) {
                    //     errors.push({ path: `${timingsPath}.${timingName}`, message: `"${timingName}" is required and must be a number greater than or equal to -1.` });
                    // }
                });
            }

            if (entry.pageref && typeof entry.pageref !== 'string') {
                errors.push({ path: `${entryPath}.pageref`, message: 'If "pageref" exists, it must be a string.' });
            }
        });
    }

    if (log.pages) {
        if (!Array.isArray(log.pages)) {
            errors.push({ path: 'log.pages', message: 'If "log.pages" exists, it must be an array.' });
        } else {
            log.pages.forEach((page, index) => {
                const pagePath = `log.pages[${index}]`;
                if (typeof page !== 'object' || page === null) {
                    errors.push({ path: pagePath, message: 'Page object is invalid.' });
                    return;
                }
                // if (typeof page.startedDateTime !== 'string' || !isValidISO8601(page.startedDateTime)) {
                //     errors.push({ path: `${pagePath}.startedDateTime`, message: '"startedDateTime" is required and must be an ISO 8601 formatted string.' });
                // }
                if (typeof page.id !== 'string' || page.id.trim() === '') {
                    errors.push({ path: `${pagePath}.id`, message: '"id" is required and must be a non-empty string.' });
                }
                if (typeof page.title !== 'string') {
                    errors.push({ path: `${pagePath}.title`, message: '"title" is required and must be a string.' });
                }
                // Commented out because values can be -1 depending on timing 
                // if (!page.pageTimings || typeof page.pageTimings !== 'object') {
                //     errors.push({ path: `${pagePath}.pageTimings`, message: 'The "pageTimings" object is required.' });
                // } else {
                    
                //     if (page.pageTimings.onContentLoad !== undefined && (typeof page.pageTimings.onContentLoad !== 'number' || page.pageTimings.onContentLoad < -1)) {
                //          errors.push({ path: `${pagePath}.pageTimings.onContentLoad`, message: 'If "onContentLoad" exists, it must be a number greater than or equal to -1.' });
                //     }
                //      if (page.pageTimings.onLoad !== undefined && (typeof page.pageTimings.onLoad !== 'number' || page.pageTimings.onLoad < -1)) {
                //          errors.push({ path: `${pagePath}.pageTimings.onLoad`, message: 'If "onLoad" exists, it must be a number greater than or equal to -1.' });
                //     }
                // }
            });
        }
    }

    return { isValid: errors.length === 0, errors, parsedHar: harData };
}

/**
 * Helper: Validate array of name/value pairs
 * @param {Array} arr - Array to validate
 * @param {string} basePath - Base path for error reporting
 * @param {Array} errors - Error array to append to
 * @param {string} itemType - Type of item being validated
 */
function validateNameValueArray(arr, basePath, errors, itemType = "Item") {
    // if (!Array.isArray(arr)) {
    //     errors.push({ path: basePath, message: `Must be an array of ${itemType.toLowerCase()} objects.` });
    //     return;
    // }
    // arr.forEach((item, i) => {
    //     const itemPath = `${basePath}[${i}]`;
    //     if (typeof item !== 'object' || item === null) {
    //         errors.push({ path: itemPath, message: `${itemType} must be an object.` });
    //         return;
    //     }
    //     if (typeof item.name !== 'string') {
    //         errors.push({ path: `${itemPath}.name`, message: `"${itemType} name" is required and must be a string.` });
    //     }
    //     if (typeof item.value !== 'string') {
    //         errors.push({ path: `${itemPath}.value`, message: `"${itemType} value" is required and must be a string.` });
    //     }
    //     if (item.comment && typeof item.comment !== 'string') {
    //         errors.push({ path: `${itemPath}.comment`, message: `If "${itemType} comment" exists, it must be a string.` });
    //     }
    // });
}

/**
 * Helper: Simple validation for ISO 8601 datetime string
 * @param {string} str - String to validate
 * @returns {boolean} True if valid ISO 8601 format
 */
function isValidISO8601(str) {
    if (typeof str !== 'string') return false;
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
    return iso8601Regex.test(str);
}
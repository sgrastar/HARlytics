/**
 * CDN Analysis Module
 * Provides functionality to detect CDN providers, cache status, and detailed CDN information
 */

/**
 * Detects the CDN provider from HTTP response headers
 * @param {Object} entry - HAR entry object
 * @returns {string} Detected CDN provider name
 */
export const detectCDN = (entry) => {

      if (!entry || !entry.response) {
        return "None";
    }
    const headers = entry.response.headers || [];
    const serverHeader = headers.find(
      (header) => header.name.toLowerCase() === "server"
    )?.value || "";
  
    // Check for CDN-specific headers
    const hasCloudflareCDN = headers.some((header) =>
      header.name.toLowerCase() === "cf-ray" ||
      header.name.toLowerCase() === "cf-cache-status" ||
      serverHeader.toLowerCase().includes("cloudflare")
    );
  
    const hasAkamaiCDN = headers.some((header) =>
        header.name.toLowerCase() === "x-akamai-transformed" ||
        header.name.toLowerCase() === "x-cache-key" ||
        (header.name.toLowerCase() === "x-cache" &&
          (header.value.toLowerCase().includes("akamai") ||
          header.value.toLowerCase().includes("tcp_hit"))) ||
        serverHeader.toLowerCase().includes("akamai")
    );
  
    const hasFastlyCDN = headers.some((header) =>
        header.name.toLowerCase() === "x-fastly-request-id" ||
        serverHeader.toLowerCase().includes("fastly") ||
      (header.name.toLowerCase() === "x-tw-cdn" &&
      header.value.toLowerCase().includes("FT"))
    );
  
    const hasCloudFrontCDN = headers.some((header) =>
      header.name.toLowerCase() === "x-amz-cf-id" ||
      header.name.toLowerCase() === "x-amz-cf-pop"
    );
  
    const hasVarnishCDN = headers.some((header) =>
      header.name.toLowerCase() === "x-varnish" ||
      serverHeader.toLowerCase().includes("varnish")
    );
  
    const hasKeycdn = headers.some((header) =>
      (header.name.toLowerCase() === "x-cdn" &&
      header.value.toLowerCase().includes("keycdn")) ||
      serverHeader.toLowerCase().includes("keycdn")
    );
  
    const hasMaxCDN = headers.some((header) =>
      header.name.toLowerCase() === "x-cdn-pullzone" ||
      serverHeader.toLowerCase().includes("netdna")
    );
  
    const hasLimelight = headers.some((header) =>
      serverHeader.toLowerCase().includes("llnwd") ||
      header.name.toLowerCase() === "x-llnw-request-id"
    );
  
    const hasIncapsula = headers.some((header) =>
      header.name.toLowerCase() === "x-iinfo" ||
      (header.name.toLowerCase() === "x-cdn" &&
      header.value.toLowerCase().includes("incapsula"))
    );
  
    const hasRedbox = headers.some((header) =>
      (header.name.toLowerCase() === "x-powered-by" &&
      header.value.toLowerCase().includes("redbox"))
    );
  
    const hasAzureCDN = headers.some((header) =>
      header.name.toLowerCase() === "x-msedge-ref" ||
      (header.name.toLowerCase() === "x-cache" &&
      header.value.toLowerCase().includes("az"))
    );
  
    const hasGoogleCDN = headers.some((header) =>
        (header.name.toLowerCase() === "via" &&
        (header.value.toLowerCase().includes("google") ||
          header.value.toLowerCase().includes("gse") ||
          header.value.toLowerCase().includes("google frontend"))) ||
        serverHeader.toLowerCase().includes("google")
    );
  
    // Determine CDN type in priority order
    if (hasCloudflareCDN) return "Cloudflare";
    if (hasAkamaiCDN) return "Akamai";
    if (hasFastlyCDN) return "Fastly";
    if (hasCloudFrontCDN) return "CloudFront";
    if (hasVarnishCDN) return "Varnish";
    if (hasKeycdn) return "KeyCDN";
    if (hasMaxCDN) return "MaxCDN/StackPath";
    if (hasLimelight) return "Limelight";
    if (hasIncapsula) return "Incapsula";
    if (hasRedbox) return "REDBOX";
    if (hasAzureCDN) return "Azure CDN";
    if (hasGoogleCDN) return "Google Cloud CDN";
  
    // Detect from Via header
    const viaHeader = headers.find(
      (header) => header.name.toLowerCase() === "via"
    )?.value || "";
  
    if (viaHeader) {
      if (viaHeader.includes("cloudflare")) return "Cloudflare";
      if (viaHeader.includes("akamai")) return "Akamai";
      if (viaHeader.includes("fastly")) return "Fastly";
      if (viaHeader.includes("cloudfront")) return "CloudFront";
      //if (viaHeader.includes("varnish")) return "Varnish";
      if (viaHeader.includes("incapsula")) return "Incapsula";
      if (viaHeader.includes("redbox")) return "REDBOX";
      if (viaHeader.includes("cdn77")) return "CDN77";
    }
  
    // Simple domain-based detection
    const domain = entry.request?.url ? new URL(entry.request.url).hostname : "";
    if (domain.includes("akamaiedge") || domain.includes("akamai.net")) return "Akamai";
    if (domain.includes("cloudflare")) return "Cloudflare";
    if (domain.includes("fastly")) return "Fastly";
    if (domain.includes("cloudfront.net")) return "CloudFront";
    if (domain.includes("azureedge.net")) return "Azure CDN";
    if (domain.includes("googleusercontent") || domain.includes("gstatic"))
      return "Google Cloud CDN";
    if (domain.includes("cdn77.org")) return "CDN77";
    if (domain.includes("cdnvideo.ru")) return "CDNvideo";
    if (domain.includes("cachefly.net")) return "CacheFly";
  
    return "None";
  };
  
/**
 * Detects cache status and determines if response was served from CDN cache, disk cache, or origin
 * @param {Object} entry - HAR entry object
 * @param {string} provider - CDN provider name
 * @returns {Object} Cache status and information about whether content was served from CDN, disk cache, or origin
 */
export const detectCacheStatus = (entry, provider) => {
  const headers = entry.response?.headers || [];
  const result = {
    status: "Unknown",
    isFromCDN: false,
    isFromDiskCache: false,
    isFromOrigin: true // Default to origin unless evidence of caching
  };
  
  // Create a map for easier header lookup
  const headerMap = {};
  headers.forEach(header => {
    headerMap[header.name.toLowerCase()] = header.value;
  });

  // Check for browser disk cache indicators first
  // Note: fromDiskCache and _fromDiskCache are Chrome-specific HAR properties
  if (entry._fromDiskCache === true || entry.cache?.beforeRequest || 
      (entry._resourceType && entry.fromDiskCache === true)) {
    result.isFromDiskCache = true;
    result.isFromOrigin = false;
    result.status = "Browser Disk Cache";
    return result;
  }

  // Look for standard cache indicators
  const ageHeader = headerMap["age"];
  const hasAge = ageHeader !== undefined;
  const age = hasAge ? parseInt(ageHeader, 10) : 0;
  
  // Check if the response has a defined Content-Length of 0 but OK status
  // This can indicate a 304 Not Modified response (client cache validation)
  const contentLength = parseInt(headerMap["content-length"] || "0", 10);
  const status304 = entry.response?.status === 304;
  
  if (status304) {
    result.isFromDiskCache = true;
    result.isFromOrigin = false;
    result.status = "304 Not Modified (Browser Cache)";
    return result;
  }

  // Now check for CDN-specific cache indicators
  switch (provider) {
    case "Cloudflare":
      // Cloudflare cache status detection
      if ("cf-cache-status" in headerMap) {
        result.status = headerMap["cf-cache-status"];
        
        // Determine if content is served from CDN cache based on cf-cache-status values
        const cfStatus = headerMap["cf-cache-status"].toUpperCase();
        const cfCacheHit = ["HIT", "STALE", "UPDATING", "REVALIDATED"].includes(cfStatus);
        result.isFromCDN = cfCacheHit;
        result.isFromOrigin = !cfCacheHit && !result.isFromDiskCache;
      }
      break;
      
    case "Akamai":
      // Akamai cache status detection
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const akamaiCacheHit = (
          headerMap["x-cache"].toLowerCase().includes("hit") ||
          headerMap["x-cache"].toLowerCase().includes("tcp_hit")
        );
        result.isFromCDN = akamaiCacheHit;
        result.isFromOrigin = !akamaiCacheHit && !result.isFromDiskCache;
      }
      break;
      
    case "Fastly":
      // Fastly cache status detection
      if ("x-served-by" in headerMap && "x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const fastlyCacheHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = fastlyCacheHit;
        result.isFromOrigin = !fastlyCacheHit && !result.isFromDiskCache;
      }
      break;
      
    case "CloudFront":
      // CloudFront cache status detection
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const cloudFrontCacheHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = cloudFrontCacheHit;
        result.isFromOrigin = !cloudFrontCacheHit && !result.isFromDiskCache;
      }
      break;
      
    case "Varnish":
      // Varnish cache status detection
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const varnishXCacheHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = varnishXCacheHit;
        result.isFromOrigin = !varnishXCacheHit && !result.isFromDiskCache;
      } else if ("x-varnish" in headerMap) {
        // Multiple values in x-varnish header indicate a cache hit
        const varnishValues = headerMap["x-varnish"].split(" ");
        const varnishHit = varnishValues.length > 1;
        result.isFromCDN = varnishHit;
        result.isFromOrigin = !varnishHit && !result.isFromDiskCache;
        result.status = varnishHit ? "HIT" : "MISS";
      }
      break;
      
    case "KeyCDN":
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const keyCdnHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = keyCdnHit;
        result.isFromOrigin = !keyCdnHit && !result.isFromDiskCache;
      }
      break;
      
    case "MaxCDN/StackPath":
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const maxCdnHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = maxCdnHit;
        result.isFromOrigin = !maxCdnHit && !result.isFromDiskCache;
      } else if ("x-hw" in headerMap) {
        // StackPath specific header format check
        const xhw = headerMap["x-hw"].toLowerCase();
        // If ends with .c it's a cache hit, .p means proxy (miss)
        const stackPathHit = xhw.includes(".c") || xhw.includes(".hn");
        const stackPathMiss = xhw.includes(".p");
        result.isFromCDN = stackPathHit;
        result.isFromOrigin = stackPathMiss && !result.isFromDiskCache;
        result.status = stackPathHit ? "HIT" : (stackPathMiss ? "MISS" : "Unknown");
      }
      break;
      
    case "Azure CDN":
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const azureCdnHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = azureCdnHit;
        result.isFromOrigin = !azureCdnHit && !result.isFromDiskCache;
      }
      break;
      
    case "Google Cloud CDN":
      // Google CDN cache status detection
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const googleCdnHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = googleCdnHit;
        result.isFromOrigin = !googleCdnHit && !result.isFromDiskCache;
      } else if ("via" in headerMap && headerMap["via"].includes("google")) {
        // Estimation from Via header
        result.status = "Served via Google CDN";
        // Can't determine definitely, need to rely on other indicators
      }
      break;
      
    case "Incapsula":
      // Incapsula doesn't have direct cache status headers by default
      if ("x-iinfo" in headerMap && "incap-cache-status" in headerMap) {
        // If XRAY debug mode is enabled, will show cache status
        result.status = headerMap["incap-cache-status"];
        const incapsulaHit = headerMap["incap-cache-status"].toLowerCase() === "hit";
        result.isFromCDN = incapsulaHit;
        result.isFromOrigin = !incapsulaHit && !result.isFromDiskCache;
      } else if ("x-iinfo" in headerMap) {
        result.status = "Served by Incapsula";
        // Default to conservative assumption without incap-cache-status header
      }
      break;
      
    case "REDBOX":
      // REDBOX Japanese CDN
      if ("red-cache" in headerMap) {
        result.status = headerMap["red-cache"];
        const redboxHit = headerMap["red-cache"].toLowerCase() === "hit";
        result.isFromCDN = redboxHit;
        result.isFromOrigin = headerMap["red-cache"].toLowerCase() === "miss" || 
                             headerMap["red-cache"].toLowerCase() === "pass" ||
                             headerMap["red-cache"] === "-";
      }
      break;
      
    default:
      // Generic x-cache header check for other CDNs
      if ("x-cache" in headerMap) {
        result.status = headerMap["x-cache"];
        const genericCdnHit = headerMap["x-cache"].toLowerCase().includes("hit");
        result.isFromCDN = genericCdnHit;
        result.isFromOrigin = !genericCdnHit && !result.isFromDiskCache;
      }
  }

  // If we have Age header but haven't determined a cache source yet, 
  // it's likely a cached response (age header indicates time in cache)
  if (hasAge && age > 0 && !result.isFromCDN && !result.isFromDiskCache) {
    result.isFromCDN = true;  // Most likely a CDN cache hit
    result.isFromOrigin = false;
    if (result.status === "Unknown") {
      result.status = "Cached (Age: " + age + "s)";
    }
  }

  // Final check for cache-control, if we still don't know the cache status
  if (result.status === "Unknown" && "cache-control" in headerMap) {
    result.status = "Cache-Control: " + headerMap["cache-control"];
  }

  return result;
};
  
  /**
   * Extracts detailed CDN information from response headers
   * @param {Object} entry - HAR entry object
   * @param {string} provider - CDN provider name
   * @returns {Object} Detailed CDN information
   */
  export const extractCDNDetails = (entry, provider) => {
    const headers = entry.response?.headers || [];
    const details = {};
    
    // Create a map for easier header lookup
    const headerMap = {};
    headers.forEach(header => {
      headerMap[header.name.toLowerCase()] = header.value;
    });
  
    switch (provider) {
      case "Cloudflare":
        // Cloudflare details
        if ("cf-ray" in headerMap) {
          const rayParts = headerMap["cf-ray"].split("-");
          details.rayId = headerMap["cf-ray"];
          if (rayParts.length > 1) {
            details.datacenter = rayParts[1];
            details.edgeLocation = rayParts[1];
            details.requestId = rayParts[0];
          }
        }
        
        if ("cf-cache-status" in headerMap) {
          details.cacheStatus = headerMap["cf-cache-status"];
        }
        
        if ("cf-bgj" in headerMap) {
          details.bandwidthSaving = "Enabled";
        }
        
        break;
        
      case "CloudFront":
        // CloudFront details
        if ("x-amz-cf-pop" in headerMap) {
          details.edgeLocation = headerMap["x-amz-cf-pop"];
        }
        
        if ("x-amz-cf-id" in headerMap) {
          details.requestId = headerMap["x-amz-cf-id"];
        }
        
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        break;
        
      case "Fastly":
        // Fastly details
        if ("x-served-by" in headerMap) {
          details.servedBy = headerMap["x-served-by"];
          //https://www.fastly.com/documentation/reference/http/http-headers/X-Served-By/
          const servedByParts = headerMap["x-served-by"]
            .split(", ")
            .map(part => {
                const parts = part.split("-");
                return parts.slice(-2).join("-");
            })
            .join(",");
          details.edgeLocation = servedByParts;
        }
        
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        if ("x-fastly-request-id" in headerMap) {
          details.requestId = headerMap["x-fastly-request-id"];
        }else if ("x-request-id" in headerMap) {
          details.requestId = headerMap["x-request-id"];
        }
        
        break;
        
      case "Akamai":
        // Akamai details
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        if ("x-cache-key" in headerMap) {
          details.cacheKey = headerMap["x-cache-key"];
        }
        
        if ("x-cache-remote" in headerMap) {
          details.cacheRemote = headerMap["x-cache-remote"];
        }
        
        if ("x-akamai-request-id" in headerMap) {
          details.requestId = headerMap["x-akamai-request-id"];
        }else if ("x-request-id" in headerMap) {
          details.requestId = headerMap["x-request-id"];
        }
        
        break;
        
      case "Varnish":
        // Varnish details
        if ("x-varnish" in headerMap) {
          details.varnishId = headerMap["x-varnish"];
          
          // Check for multiple values (cache hit case)
          const varnishValues = headerMap["x-varnish"].split(" ");
          if (varnishValues.length > 1) {
            details.cacheHitId = varnishValues[0];
            details.lookupId = varnishValues[1];
          }
        }
        
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        break;
        
      case "Azure CDN":
        // Azure CDN details
        if ("x-msedge-ref" in headerMap) {
          details.edgeReference = headerMap["x-msedge-ref"];
          details.edgeLocation = headerMap["x-msedge-ref"];
        }
        
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        break;
        
      case "Google Cloud CDN":
        // Google Cloud CDN details
        if ("via" in headerMap) {
          details.via = headerMap["via"];
        }
        
        if ("x-cache" in headerMap) {
          details.cacheStatus = headerMap["x-cache"];
        }
        
        break;
        
      case "REDBOX":
        // REDBOX Japanese CDN details
        if ("red-cache" in headerMap) {
          details.cacheStatus = headerMap["red-cache"];
        }
        if ("via" in headerMap) {
            details.requestId = headerMap["via"];
        }
        break;

      // Add support for other CDN providers as needed
    }
    
    // Age header (time spent in cache)
    if ("age" in headerMap) {
      details.cacheAge = headerMap["age"];
    }
    
    // Store all CDN-related headers
    details.allCdnHeaders = {};
    
    // Collect headers that may be CDN-related
    const cdnRelatedPrefixes = ["cf-", "x-cache", "x-cdn", "x-edge", "x-amz-cf", 
      "x-served", "x-varnish", "x-fastly", "x-msedge", "via", "x-akamai", "red-"];
      
    for (const [name, value] of Object.entries(headerMap)) {
      if (cdnRelatedPrefixes.some(prefix => name.includes(prefix))) {
        details.allCdnHeaders[name] = value;
      }
    }
    
    return details;
  };
  
  /**
   * Main function to analyze CDN information from HAR entry
   * @param {Object} entry - HAR entry object
   * @returns {Object} Complete CDN analysis including provider, cache status, and details
   */
  export const analyzeCDN = (entry) => {
    const headers = entry.response?.headers || [];
    const result = {
      provider: "None",
      cacheStatus: "Unknown",
      isFromCDN: false,
      isFromDiskCache: false,
      isFromOrigin: true,
      details: {}
    };
  
    // Detect CDN provider
    result.provider = detectCDN(entry);
    
    // Get cache status and origin information based on provider
    if (result.provider !== "None") {
      // Determine cache status and if content was served from CDN
      const cacheInfo = detectCacheStatus(entry, result.provider);
      result.cacheStatus = cacheInfo.status;
      result.isFromCDN = cacheInfo.isFromCDN;
      result.isFromDiskCache = cacheInfo.isFromDiskCache;
      result.isFromOrigin = cacheInfo.isFromOrigin;
      
      // Extract detailed CDN information
      result.details = extractCDNDetails(entry, result.provider);
    } else {
      // Even if no CDN is detected, check if response might be from disk cache
      const cacheInfo = detectCacheStatus(entry, "None");
      result.isFromDiskCache = cacheInfo.isFromDiskCache;
      result.isFromOrigin = !result.isFromDiskCache;
      
      if (result.isFromDiskCache) {
        result.cacheStatus = cacheInfo.status;
      }
    }
    
    return result;
  };
  
  // Export all functions
  export default {
    analyzeCDN,
    detectCDN,
    detectCacheStatus,
    extractCDNDetails
  };
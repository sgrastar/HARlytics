/**
 * Estimates upload and download connection speeds from HAR entries
 * @param {Array} entries - Array of HAR entries
 * @returns {Object} Object containing upload and download speed statistics
 */
export function estimateConnectionSpeed(entries) {
  const validEntries = entries.filter((entry) => {
    return entry.status >= 200 && entry.status < 300;
  });

  const upSpeeds = validEntries
    .filter((entry) => entry.requestBodySize > 0 && entry.timings.send > 0)
    .map((entry) => {
      const bodySize = entry.requestBodySize;
      const time = entry.timings.send / 1000;
      const speed = (bodySize * 8) / time;
      return { speed, url: removeQueryString(entry.url) };
    });

  const downSpeeds = validEntries
    .filter((entry) => entry.responseBodySize > 0 && entry.timings.receive > 0)
    .map((entry) => {
      const bodySize = entry.responseBodySize;
      const time = entry.timings.receive / 1000;
      const speed = (bodySize * 8) / time;
      return { speed, url: removeQueryString(entry.url) };
    });

  const trimmedUpSpeeds = trimOutliers(upSpeeds.map((item) => item.speed));
  const trimmedDownSpeeds = trimOutliers(downSpeeds.map((item) => item.speed));

  const uploadData =
    upSpeeds.length > 0
      ? {
          maxSpeed: formatSpeed(
            Math.max(...upSpeeds.map((item) => item.speed))
          ),
          maxSpeedUrl: upSpeeds.find(
            (item) =>
              item.speed === Math.max(...upSpeeds.map((item) => item.speed))
          ).url,
          minSpeed: formatSpeed(
            Math.min(...upSpeeds.map((item) => item.speed))
          ),
          minSpeedUrl: upSpeeds.find(
            (item) =>
              item.speed === Math.min(...upSpeeds.map((item) => item.speed))
          ).url,
          avgSpeed: formatSpeed(getAverage(trimmedUpSpeeds)),
          medianSpeed: formatSpeed(getMedian(trimmedUpSpeeds)),
          trimmedAvgSpeed: formatSpeed(getAverage(trimmedUpSpeeds)),
          trimmedMedianSpeed: formatSpeed(getMedian(trimmedUpSpeeds)),
        }
      : {};

  const downloadData =
    downSpeeds.length > 0
      ? {
          maxSpeed: formatSpeed(
            Math.max(...downSpeeds.map((item) => item.speed))
          ),
          maxSpeedUrl: downSpeeds.find(
            (item) =>
              item.speed === Math.max(...downSpeeds.map((item) => item.speed))
          ).url,
          minSpeed: formatSpeed(
            Math.min(...downSpeeds.map((item) => item.speed))
          ),
          minSpeedUrl: downSpeeds.find(
            (item) =>
              item.speed === Math.min(...downSpeeds.map((item) => item.speed))
          ).url,
          avgSpeed: formatSpeed(getAverage(trimmedDownSpeeds)),
          medianSpeed: formatSpeed(getMedian(trimmedDownSpeeds)),
          trimmedAvgSpeed: formatSpeed(getAverage(trimmedDownSpeeds)),
          trimmedMedianSpeed: formatSpeed(getMedian(trimmedDownSpeeds)),
        }
      : {};

  return {
    upload: uploadData,
    download: downloadData,
  };
}

/**
 * Removes query string from URL
 * @param {string} url - URL to process
 * @returns {string} URL without query string
 */
function removeQueryString(url) {
  return url.split("?")[0];
}

/**
 * Removes outliers from data by trimming top and bottom percentiles
 * @param {Array<number>} data - Array of numbers
 * @param {number} threshold - Percentage to trim from each end (default 0.1)
 * @returns {Array<number>} Trimmed array
 */
function trimOutliers(data, threshold = 0.1) {
  const sortedData = [...data].sort((a, b) => a - b);
  const n = sortedData.length;
  const lowIndex = Math.floor(n * threshold);
  const highIndex = Math.ceil(n * (1 - threshold)) - 1;
  return sortedData.slice(lowIndex, highIndex + 1);
}

/**
 * Calculates average of an array of numbers
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Average value
 */
function getAverage(arr) {
  if (arr.length === 0) {
    return 0;
  }
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

/**
 * Calculates median of an array of numbers
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Median value
 */
function getMedian(arr) {
  if (arr.length === 0) {
    return 0;
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Formats speed in bits per second to human-readable format
 * @param {number} bps - Speed in bits per second
 * @returns {string} Formatted speed string
 */
function formatSpeed(bps) {
  if (bps < 1000) {
    return `${bps.toFixed(2)} bps`;
  } else if (bps < 1000000) {
    return `${(bps / 1000).toFixed(2)} Kbps`;
  } else {
    return `${(bps / 1000000).toFixed(2)} Mbps`;
  }
}

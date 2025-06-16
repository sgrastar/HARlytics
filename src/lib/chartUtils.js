// /src/lib/chartUtils.js

/**
 * Aggregates entries by HTTP status code ranges
 * @param {Array} filteredEntries - Array of filtered HAR entries
 * @returns {Array<{name: string, value: number}>} Status code data for charts
 */
export function getStatusCodeData(filteredEntries) {
  if (!filteredEntries || filteredEntries.length === 0) {
    return [];
  }
  const statusCodeRanges = [
    { min: 100, max: 199, label: "100" },
    { min: 200, max: 299, label: "200" },
    { min: 300, max: 399, label: "300" },
    { min: 400, max: 499, label: "400" },
    { min: 500, max: 599, label: "500" },
    { other: true, label: "Other" },
  ];

  const statusCodeData = filteredEntries.reduce((acc, entry) => {
    const statusCode = entry.status;
    const range = statusCodeRanges.find(
      (range) =>
        (range.other && (statusCode < 100 || statusCode >= 600)) ||
        (statusCode >= range.min && statusCode <= range.max)
    );
    const label = range.label;
    if (acc[label]) {
      acc[label]++;
    } else {
      acc[label] = 1;
    }
    return acc;
  }, {});

  return Object.entries(statusCodeData).map(([name, value]) => ({
    name,
    value,
  }));
}

/**
 * Aggregates entries by MIME type categories
 * @param {Array} filteredEntries - Array of filtered HAR entries
 * @returns {Array<{name: string, value: number}>} MIME type data for charts
 */
export function getMimeTypeData(filteredEntries) {
  if (!filteredEntries || filteredEntries.length === 0) {
    return [];
  }

  const mimeTypeOrder = [
    "Fetch/XHR",
    "Doc",
    "CSS",
    "JS",
    "Font",
    "Img",
    "Media",
    "Manifest",
    "WS",
    "Wasm",
    "Other",
  ];
  const mimeTypeData = mimeTypeOrder.map((mimeType) => {
    const value = filteredEntries.filter(
      (entry) => entry.type === mimeType
    ).length;
    return { name: mimeType, value };
  });

  return mimeTypeData;
}

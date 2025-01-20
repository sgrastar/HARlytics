// /src/lib/constants.js

// export const statusRanges = [
//     { label: '200', min: 200, max: 299 },
//     { label: '300', min: 300, max: 399 },
//     { label: '400', min: 400, max: 499 },
//     { label: '500', min: 500, max: 599 },
//     { label: 'Other', min: 0, max: 199, other: true },
//   ];

export const statusRanges = [
  { label: "1xx", min: 100, max: 199 }, // Information responses
  { label: "2xx", min: 200, max: 299 }, // Successful responses
  { label: "3xx", min: 300, max: 399 }, // Redirection messages
  { label: "4xx", min: 400, max: 499 }, // Client error responses
  { label: "5xx", min: 500, max: 599 }, // Server error responses
  { label: "Other", other: true }, // Invalid or non-standard codes
];

export const communicationTypes = [
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

export const httpMethods = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "CONNECT",
  "HEAD",
];

export const messageElements = [
  "Authorization",  // hasHeaderAuthData
  "PostData",       // hasPostData
  "QueryParameter", // entry.requestQueryString.length > 0
  "Set-Cookie",         // hasCookieData
  "Plain"
];
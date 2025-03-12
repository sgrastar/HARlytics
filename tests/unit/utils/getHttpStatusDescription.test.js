import { describe, it, expect } from 'vitest';
import { getHttpStatusDescription } from '$lib/utils.js';

describe('getHttpStatusDescription', () => {
  // Test case: Common status codes
  it('should return correct descriptions for common status codes', () => {
    expect(getHttpStatusDescription(200)).toBe('200 OK');
    expect(getHttpStatusDescription(201)).toBe('201 Created');
    expect(getHttpStatusDescription(301)).toBe('301 Moved Permanently');
    expect(getHttpStatusDescription(302)).toBe('302 Found');
    expect(getHttpStatusDescription(400)).toBe('400 Bad Request');
    expect(getHttpStatusDescription(401)).toBe('401 Unauthorized');
    expect(getHttpStatusDescription(403)).toBe('403 Forbidden');
    expect(getHttpStatusDescription(404)).toBe('404 Not Found');
    expect(getHttpStatusDescription(500)).toBe('500 Internal Server Error');
    expect(getHttpStatusDescription(503)).toBe('503 Service Unavailable');
  });

  // Test case: Less common status codes
  it('should return correct descriptions for less common status codes', () => {
    expect(getHttpStatusDescription(100)).toBe('100 Continue');
    expect(getHttpStatusDescription(204)).toBe('204 No Content');
    expect(getHttpStatusDescription(304)).toBe('304 Not Modified');
    expect(getHttpStatusDescription(307)).toBe('307 Temporary Redirect');
    expect(getHttpStatusDescription(405)).toBe('405 Method Not Allowed');
    expect(getHttpStatusDescription(418)).toBe("418 I'm a teapot");
    expect(getHttpStatusDescription(429)).toBe('429 Too Many Requests');
    expect(getHttpStatusDescription(451)).toBe('451 Unavailable For Legal Reasons');
    expect(getHttpStatusDescription(502)).toBe('502 Bad Gateway');
    expect(getHttpStatusDescription(504)).toBe('504 Gateway Timeout');
  });

  // Test case: Uncommon but valid status codes
  it('should generate generic descriptions for uncommon but valid status codes', () => {
    expect(getHttpStatusDescription(103)).toBe('103 Early Hints');
    expect(getHttpStatusDescription(226)).toBe('226 IM Used');
    expect(getHttpStatusDescription(308)).toBe('308 Permanent Redirect');
    expect(getHttpStatusDescription(425)).toBe('425 Too Early');
    expect(getHttpStatusDescription(511)).toBe('511 Network Authentication Required');
  });

  // Test case: Valid status codes without specific descriptions
  it('should generate category descriptions for status codes without specific descriptions', () => {
    // These might not have explicit descriptions in the function but should return a generic category
    expect(getHttpStatusDescription(299)).toBe('299 Success');
    expect(getHttpStatusDescription(399)).toBe('399 Redirection');
    expect(getHttpStatusDescription(499)).toBe('499 Client Error');
    expect(getHttpStatusDescription(599)).toBe('599 Server Error');
  });

  // Test case: Edge cases and different input formats
  it('should handle edge cases and different input formats', () => {
    // String inputs
    expect(getHttpStatusDescription('200')).toBe('200 OK');
    expect(getHttpStatusDescription('404')).toBe('404 Not Found');
    
    // Special cases
    expect(getHttpStatusDescription(0)).toBe('0 No Response');
    expect(getHttpStatusDescription(null)).toBe('0 No Status Code Provided');
    expect(getHttpStatusDescription(undefined)).toBe('0 No Status Code Provided');
    expect(getHttpStatusDescription('')).toBe('0 No Status Code Provided');
  });

  // Test case: Invalid inputs
  it('should throw an error for invalid status codes', () => {
    expect(() => getHttpStatusDescription('abc')).toThrow();
    expect(() => getHttpStatusDescription(-1)).toThrow();
    expect(() => getHttpStatusDescription(99)).toThrow();
    expect(() => getHttpStatusDescription(600)).toThrow();
    expect(() => getHttpStatusDescription(1000)).toThrow();
  });
});
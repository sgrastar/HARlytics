import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { calculateFreshness } from '$lib/utils.js';

describe('calculateFreshness', () => {
  // Mock current time for consistent testing
  const originalDateNow = Date.now;
  const mockNow = new Date('2025-03-11T12:00:00Z').getTime();
  
  beforeAll(() => {
    Date.now = vi.fn(() => mockNow);
  });
  
  afterAll(() => {
    Date.now = originalDateNow;
  });
  
  // Test case: No cache headers
  it('should handle entries with no cache headers', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: []
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Unknown');
    expect(result.cdn.status).toBe('Unknown');
  });
  
  // Test case: no-store directive
  it('should mark as Not Cacheable when no-store is present', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'cache-control', value: 'no-store' }
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Not Cacheable');
    expect(result.cdn.status).toBe('Not Cacheable');
  });
  
  // Test case: no-cache directive
  it('should mark browser cache as Not Cacheable when no-cache is present', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'cache-control', value: 'no-cache' }
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Not Cacheable');
  });
  
  // Test case: max-age fresh
  it('should mark as Fresh when max-age is not expired', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'date', value: '2025-03-11T11:59:00Z' },
          { name: 'cache-control', value: 'max-age=3600' } // 1 hour
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Fresh');
    expect(result.browser.ttl).toBe(3540); // 59 minutes remaining
    expect(result.cdn.status).toBe('Fresh');
    expect(result.cdn.ttl).toBe(3540);
  });
  
  // Test case: max-age stale
  it('should mark as Stale when max-age is expired', () => {
    const entry = {
      startedDateTime: '2025-03-11T10:30:00Z',
      response: {
        headers: [
          { name: 'date', value: '2025-03-11T10:30:00Z' },
          { name: 'cache-control', value: 'max-age=60' } // 1 minute
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Stale');
    expect(result.cdn.status).toBe('Stale');
  });
  
  // Test case: s-maxage
  it('should use s-maxage for CDN when available', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'date', value: '2025-03-11T11:59:00Z' },
          { name: 'cache-control', value: 'max-age=60, s-maxage=3600' } // 1 min browser, 1 hour CDN
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Stale'); // 60s already expired
    expect(result.cdn.status).toBe('Fresh');
    expect(result.cdn.ttl).toBe(3540); // 59 minutes remaining
  });
  
  // Test case: expires header fresh
  it('should use Expires header when no Cache-Control max-age is present', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'date', value: '2025-03-11T11:59:00Z' },
          { name: 'expires', value: '2025-03-11T13:00:00Z' } // 1 hour later
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Fresh');
    expect(result.browser.ttl).toBe(3600); // 1 hour remaining
    expect(result.cdn.status).toBe('Fresh');
  });
  
  // Test case: expires header stale
  it('should mark as Stale when Expires is in the past', () => {
    const entry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'date', value: '2025-03-11T11:59:00Z' },
          { name: 'expires', value: '2025-03-11T11:58:00Z' } // 1 minute ago
        ]
      }
    };
    
    const result = calculateFreshness(entry);
    
    expect(result.browser.status).toBe('Stale');
    expect(result.cdn.status).toBe('Stale');
  });
  
  // Test case: Cloudflare CDN
  it('should handle Cloudflare cache status', () => {
    const hitEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'cf-cache-status', value: 'HIT' }
        ]
      }
    };
    
    const missEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'cf-cache-status', value: 'MISS' }
        ]
      }
    };
    
    const bypassEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'cf-cache-status', value: 'BYPASS' }
        ]
      }
    };
    
    const hitResult = calculateFreshness(hitEntry);
    const missResult = calculateFreshness(missEntry);
    const bypassResult = calculateFreshness(bypassEntry);
    
    expect(hitResult.cdn.status).toBe('Fresh');
    expect(hitResult.cdn.provider).toBe('Cloudflare');
    
    expect(missResult.cdn.status).toBe('Fresh');
    expect(missResult.cdn.provider).toBe('Cloudflare');
    
    expect(bypassResult.cdn.status).toBe('Not Cacheable');
    expect(bypassResult.cdn.provider).toBe('Cloudflare');
  });
  
  // Test case: CloudFront CDN
  it('should handle CloudFront cache status', () => {
    const hitEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'x-cache', value: 'Hit from cloudfront' }
        ]
      }
    };
    
    const missEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'x-cache', value: 'Miss from cloudfront' }
        ]
      }
    };
    
    const hitResult = calculateFreshness(hitEntry);
    const missResult = calculateFreshness(missEntry);
    
    expect(hitResult.cdn.status).toBe('Fresh');
    expect(hitResult.cdn.provider).toBe('CloudFront');
    
    expect(missResult.cdn.status).toBe('Fresh');
    expect(missResult.cdn.provider).toBe('CloudFront');
  });
  
  // Test case: Fastly/Other CDN
  it('should handle other CDN providers', () => {
    const hitEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'x-cache', value: 'Hit' }
        ]
      }
    };
    
    const missEntry = {
      startedDateTime: '2025-03-11T11:59:00Z',
      response: {
        headers: [
          { name: 'x-cache', value: 'Miss' }
        ]
      }
    };
    
    const hitResult = calculateFreshness(hitEntry);
    const missResult = calculateFreshness(missEntry);
    
    expect(hitResult.cdn.status).toBe('Fresh');
    expect(hitResult.cdn.provider).toBe('Fastly/Other');
    
    expect(missResult.cdn.status).toBe('Fresh');
    expect(missResult.cdn.provider).toBe('Fastly/Other');
  });
});
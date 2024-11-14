import { describe, it, expect } from 'vitest';
import { 
  formatTimestamp,
  truncateText,
  escapeForMermaid,
  httpStatusCSSClass,
  formatTime,
  formatBytes,
  formatGMTtoUTC,
  formatToLocalTime,
  formatPostDataValue
} from '$lib/utils';

describe('formatTimestamp', () => {
  it('formats date with all components', () => {
    const date = new Date('2024-01-01T12:34:56.789Z');
    expect(formatTimestamp(date)).toBe('2024-01-01 12:34:56.789');
  });

  it('pads single digit values with zeros', () => {
    const date = new Date('2024-02-03T04:05:06.007Z');
    expect(formatTimestamp(date)).toBe('2024-02-03 04:05:06.007');
  });

  it('handles end of month/year dates', () => {
    const date = new Date('2024-12-31T23:59:59.999Z');
    expect(formatTimestamp(date)).toBe('2024-12-31 23:59:59.999');
  });
});

describe('truncateText', () => {
  it('truncates text longer than maxLength', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('returns original text if shorter than maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('returns original text if equal to maxLength', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });
});

describe('escapeForMermaid', () => {
  it('escapes special characters', () => {
    const input = '$ # _ ~ * + = | [ ] { } ( ) > < \n \r \t \' "';
    expect(escapeForMermaid(input)).toBe(
      '\\$ \\# \\_ \\~ \\* \\+ \\= \\| \\[ \\] \\{ \\} \\( \\) \\> \\< \\n \\r \\t \\\' \\"'
    );
  });

  it('handles normal text without special characters', () => {
    expect(escapeForMermaid('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(escapeForMermaid('')).toBe('');
  });
});

describe('httpStatusCSSClass', () => {
  it('returns info class for 1xx status codes', () => {
    expect(httpStatusCSSClass(100)).toBe('info');
    expect(httpStatusCSSClass(199)).toBe('info');
  });

  it('returns success class for 2xx status codes', () => {
    expect(httpStatusCSSClass(200)).toBe('success');
    expect(httpStatusCSSClass(299)).toBe('success');
  });

  it('returns redirect class for 3xx status codes', () => {
    expect(httpStatusCSSClass(300)).toBe('redirect');
    expect(httpStatusCSSClass(399)).toBe('redirect');
  });

  it('returns cliError class for 4xx status codes', () => {
    expect(httpStatusCSSClass(400)).toBe('cliError');
    expect(httpStatusCSSClass(499)).toBe('cliError');
  });

  it('returns srvError class for 5xx status codes', () => {
    expect(httpStatusCSSClass(500)).toBe('srvError');
    expect(httpStatusCSSClass(599)).toBe('srvError');
  });

  it('returns other for invalid status codes', () => {
    expect(httpStatusCSSClass(600)).toBe('other');
    expect(httpStatusCSSClass(99)).toBe('other');
  });
});

describe('formatTime', () => {
    it('formats milliseconds', () => {
      expect(formatTime(500)).toBe('500 ms');
      expect(formatTime(999)).toBe('999 ms');
    });
  
    it('formats seconds', () => {
      expect(formatTime(1000)).toBe('1.00 s');
      expect(formatTime(1500)).toBe('1.50 s');
      // 59.99秒でテスト
      expect(formatTime(59990)).toBe('59.99 s');
    });
  
    it('handles boundary between seconds and minutes', () => {
      expect(formatTime(59999)).toBe('59.99 s');
      expect(formatTime(60000)).toBe('1 min 00 s');
    });
  
    it('formats minutes', () => {
      expect(formatTime(60000)).toBe('1 min 00 s');
      expect(formatTime(90000)).toBe('1 min 30 s');
      // 59分59秒でテスト
      expect(formatTime(3599000)).toBe('59 min 59 s');
    });
  
    it('handles boundary between minutes and hours', () => {
      expect(formatTime(3599999)).toBe('59 min 59 s');
      expect(formatTime(3600000)).toBe('1 h 00 min 00 s');
    });
  
    it('formats hours', () => {
      expect(formatTime(3600000)).toBe('1 h 00 min 00 s');
      expect(formatTime(7200000)).toBe('2 h 00 min 00 s');
      expect(formatTime(3661000)).toBe('1 h 01 min 01 s');
    });
  });

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500.0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });

  it('handles negative values', () => {
    expect(formatBytes(-1024)).toBe('-1.0 KB');
    expect(formatBytes(-1048576)).toBe('-1.0 MB');
  });

  it('formats decimal values correctly', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });
});

describe('formatGMTtoUTC', () => {
  it('converts GMT date string to UTC format', () => {
    expect(formatGMTtoUTC('Tue, 15 Nov 2023 12:00:00 GMT'))
      .toBe('2023-11-15 12:00:00');
  });

  it('handles invalid date strings', () => {
    expect(formatGMTtoUTC('invalid date')).toBe('');
  });

  it('handles empty input', () => {
    expect(formatGMTtoUTC('')).toBe('');
    expect(formatGMTtoUTC(null)).toBe('');
  });
});

// describe('formatToLocalTime', () => {
//     it('converts GMT date string to local time format', () => {
//         const result = formatToLocalTime('Tue, 15 Nov 2023 12:00:00 GMT');
//         // より柔軟な形式チェック
//         expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \([^)]+\)$/);
//     });

//     it('includes timezone information', () => {
//         const result = formatToLocalTime('Tue, 15 Nov 2023 12:00:00 GMT');
//         expect(result).toMatch(/\([^)]+, UTC[+-]\d{4}\)$/);
//     });

//     it('handles invalid date strings', () => {
//         expect(formatToLocalTime('invalid date')).toBe('');
//     });

//     it('handles empty input', () => {
//         expect(formatToLocalTime('')).toBe('');
//         expect(formatToLocalTime(null)).toBe('');
//     });
// });

describe('formatPostDataValue', () => {
  it('handles null and undefined', () => {
    expect(formatPostDataValue(null)).toBe('[null]');
    expect(formatPostDataValue(undefined)).toBe('[null]');
  });

  it('handles binary data', () => {
    const arrayBuffer = new ArrayBuffer(8);
    expect(formatPostDataValue(arrayBuffer)).toBe('[Binary Data]');
    expect(formatPostDataValue(new Uint8Array(arrayBuffer))).toBe('[Binary Data]');
  });

  it('handles simple objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(formatPostDataValue(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  it('handles complex objects with circular references', () => {
    const obj = { name: 'test' };
    obj.self = obj; // 循環参照を作成
    expect(formatPostDataValue(obj)).toBe('[Complex Object]');
  });

  it('truncates long text', () => {
    const longText = 'a'.repeat(1000);
    const result = formatPostDataValue(longText);
    expect(result.length).toBeLessThan(longText.length);
    expect(result.endsWith('... [Text Truncated]')).toBe(true);
  });

  it('handles URL encoded data', () => {
    const encoded = 'name=John%20Doe&age=30';
    const result = formatPostDataValue(encoded);
    expect(result).toBe('name=John Doe&age=30');
  });
});
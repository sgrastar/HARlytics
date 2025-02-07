import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Layout from '../../../src/routes/+layout.svelte';

describe('Layout Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve('mock license text'),
      })
    );
  });

  it('should show splash screen initially', () => {
    const { container } = render(Layout);
    const splash = container.querySelector('.fixed');
    expect(splash).toBeTruthy();
    expect(splash.classList.contains('opacity-100')).toBeTruthy();
  });

  it('should fade out splash screen after delay', async () => {
    const { container } = render(Layout);
    
    vi.advanceTimersByTime(100);
    expect(container.querySelector('.fixed')).toBeTruthy();
    
    vi.advanceTimersByTime(2500);
    const content = container.querySelector('.opacity-100');
    expect(content).toBeTruthy();
  });


});
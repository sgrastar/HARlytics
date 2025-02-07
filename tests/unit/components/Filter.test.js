import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Page from '../../../src/routes/+page.svelte';

describe('Filter Tests', () => {
  let component;

  beforeEach(() => {
    component = render(Page);
  });

  describe('Method Filter', () => {
    it('should show method filter button with correct initial state', () => {
      const methodFilter = component.getByTestId('method-filter');
      const button = methodFilter.querySelector('button');
      expect(button.textContent).toContain('Method Filter');
      expect(button.classList).toContain('bg-white');
    });

    it('should show filter icon when methods are filtered', async () => {
      const methodFilter = component.getByTestId('method-filter');
      await fireEvent.mouseEnter(methodFilter);
      
      const checkbox = methodFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(checkbox);
      
      const filterIcon = methodFilter.querySelector('svg.w-3.h-3.mr-1');
      expect(filterIcon).toBeTruthy();
    });

    it('should update filter state when toggling methods', async () => {
      const methodFilter = component.getByTestId('method-filter');
      await fireEvent.mouseEnter(methodFilter);
      
      const allToggle = methodFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(allToggle);
      
      const button = methodFilter.querySelector('button');
      expect(button.classList).toContain('bg-primary-700');
    });

    it('should display correct method counts', async () => {
      const methodFilter = component.getByTestId('method-filter');
      await fireEvent.mouseEnter(methodFilter);
      
      const methodLabels = methodFilter.querySelectorAll('.rounded label:not(:first-child)');
      methodLabels.forEach(label => {
        expect(label.textContent).toMatch(/\(\d+\/\d+\)/);
      });
    });
  });

  describe('Status Filter', () => {
    it('should show status filter button with correct initial state', () => {
      const statusFilter = component.getByTestId('status-filter');
      const button = statusFilter.querySelector('button');
      expect(button.textContent).toContain('Status Filter');
      expect(button.classList).toContain('bg-white');
    });

    it('should show filter icon when status is filtered', async () => {
      const statusFilter = component.getByTestId('status-filter');
      await fireEvent.mouseEnter(statusFilter);
      
      const checkbox = statusFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(checkbox);
      
      const filterIcon = statusFilter.querySelector('svg.w-3.h-3.mr-1');
      expect(filterIcon).toBeTruthy();
    });

    it('should update filter state when changing status selections', async () => {
      const statusFilter = component.getByTestId('status-filter');
      await fireEvent.mouseEnter(statusFilter);
      
      const statusCheckboxes = statusFilter.querySelectorAll('.rounded input[type="checkbox"]');
      await fireEvent.click(statusCheckboxes[1]);
      
      const button = statusFilter.querySelector('button');
      expect(button.classList).toContain('bg-primary-700');
    });
  });

  describe('MimeType Filter', () => {
    it('should show mime type filter button with correct initial state', () => {
      const typeFilter = component.getByTestId('type-filter');
      const button = typeFilter.querySelector('button');
      expect(button.textContent).toContain('mimeType Filter');
      expect(button.classList).toContain('bg-white');
    });

    it('should show filter icon when type is filtered', async () => {
      const typeFilter = component.getByTestId('type-filter');
      await fireEvent.mouseEnter(typeFilter);
      
      const checkbox = typeFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(checkbox);
      
      const filterIcon = typeFilter.querySelector('svg.w-3.h-3.mr-1');
      expect(filterIcon).toBeTruthy();
    });

    it('should update filter state when changing type selections', async () => {
      const typeFilter = component.getByTestId('type-filter');
      await fireEvent.mouseEnter(typeFilter);
      
      const typeCheckboxes = typeFilter.querySelectorAll('.rounded input[type="checkbox"]');
      await fireEvent.click(typeCheckboxes[1]);
      
      const button = typeFilter.querySelector('button');
      expect(button.classList).toContain('bg-primary-700');
    });
  });

  describe('Message Filter', () => {
    it('should show message filter button with correct initial state', () => {
      const messageFilter = component.getByTestId('message-filter');
      const button = messageFilter.querySelector('button');
      expect(button.textContent).toContain('Message Filter');
      expect(button.classList).toContain('bg-white');
    });

    it('should show filter icon when messages are filtered', async () => {
      const messageFilter = component.getByTestId('message-filter');
      await fireEvent.mouseEnter(messageFilter);
      
      const checkbox = messageFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(checkbox);
      
      const filterIcon = messageFilter.querySelector('svg.w-3.h-3.mr-1');
      expect(filterIcon).toBeTruthy();
    });

    it('should update filter state when toggling messages', async () => {
      const messageFilter = component.getByTestId('message-filter');
      await fireEvent.mouseEnter(messageFilter);
      
      const allToggle = messageFilter.querySelector('input[type="checkbox"]');
      await fireEvent.click(allToggle);
      
      const button = messageFilter.querySelector('button');
      expect(button.classList).toContain('bg-primary-700');
    });

    it('should display all message types with counts', async () => {
      const messageFilter = component.getByTestId('message-filter');
      await fireEvent.mouseEnter(messageFilter);
      
      const messageTypes = ['Authorization', 'QueryParameter', 'PostData', 'Set-Cookie', 'Plain'];
      
      // 必要なデータが読み込まれるのを待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const labels = Array.from(messageFilter.querySelectorAll('.rounded input[type="checkbox"]'));
      
      messageTypes.forEach(type => {
        const typeExists = labels.some(label => 
          label.parentElement.textContent.includes(type) && 
          label.parentElement.textContent.match(/\(\d+\/\d+\)/)
        );
        expect(typeExists).toBeTruthy();
      });
    });
  });
});
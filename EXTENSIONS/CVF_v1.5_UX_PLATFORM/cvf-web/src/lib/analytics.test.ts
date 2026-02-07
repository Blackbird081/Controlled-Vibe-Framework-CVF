import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAnalyticsEvents, getAnalyticsEvents, trackEvent } from './analytics';

describe('analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('tracks and returns events', () => {
    trackEvent('template_selected', { templateId: 't_1' });
    trackEvent('execution_created');

    const events = getAnalyticsEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('execution_created');
    expect(events[1].type).toBe('template_selected');
  });

  it('clears events', () => {
    trackEvent('execution_completed');
    expect(getAnalyticsEvents()).toHaveLength(1);

    clearAnalyticsEvents();
    expect(getAnalyticsEvents()).toHaveLength(0);
  });
});

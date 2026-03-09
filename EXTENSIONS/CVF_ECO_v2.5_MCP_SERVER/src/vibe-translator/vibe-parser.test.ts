/**
 * Tests for Vibe Parser
 */

import { describe, it, expect } from 'vitest';
import { parseVibe } from './vibe-parser.js';

describe('parseVibe', () => {
  describe('empty input', () => {
    it('handles empty string', () => {
      const r = parseVibe('');
      expect(r.actionType).toBe('unknown');
      expect(r.confidence).toBe(0);
      expect(r.missingSlots).toContain('goal');
    });

    it('handles whitespace only', () => {
      const r = parseVibe('   ');
      expect(r.actionType).toBe('unknown');
      expect(r.confidence).toBe(0);
    });
  });

  describe('action detection - English', () => {
    it('detects create', () => {
      expect(parseVibe('Create a landing page for my product').actionType).toBe('create');
    });

    it('detects build', () => {
      expect(parseVibe('Build a REST API for user management').actionType).toBe('create');
    });

    it('detects modify/edit', () => {
      expect(parseVibe('Edit the homepage layout').actionType).toBe('modify');
    });

    it('detects update', () => {
      expect(parseVibe('Update the database schema').actionType).toBe('modify');
    });

    it('detects fix', () => {
      expect(parseVibe('Fix the login bug').actionType).toBe('modify');
    });

    it('detects delete', () => {
      expect(parseVibe('Delete old log files').actionType).toBe('delete');
    });

    it('detects send', () => {
      expect(parseVibe('Send the report to the team').actionType).toBe('send');
    });

    it('detects analyze', () => {
      expect(parseVibe('Analyze the user engagement data').actionType).toBe('analyze');
    });

    it('detects review', () => {
      expect(parseVibe('Review the pull request').actionType).toBe('review');
    });

    it('detects deploy', () => {
      expect(parseVibe('Deploy the app to production').actionType).toBe('deploy');
    });

    it('detects search', () => {
      expect(parseVibe('Find all files containing auth logic').actionType).toBe('search');
    });

    it('detects report', () => {
      expect(parseVibe('Generate a summary report of sales').actionType).toBe('report');
    });
  });

  describe('action detection - Vietnamese', () => {
    it('detects tạo', () => {
      expect(parseVibe('Tạo trang landing page cho sản phẩm').actionType).toBe('create');
    });

    it('detects sửa', () => {
      expect(parseVibe('Sửa lỗi đăng nhập').actionType).toBe('modify');
    });

    it('detects xóa', () => {
      expect(parseVibe('Xóa các file log cũ').actionType).toBe('delete');
    });

    it('detects gửi', () => {
      expect(parseVibe('Gửi báo cáo cho sếp').actionType).toBe('send');
    });

    it('detects phân tích', () => {
      expect(parseVibe('Phân tích dữ liệu người dùng').actionType).toBe('analyze');
    });

    it('detects triển khai', () => {
      expect(parseVibe('Triển khai ứng dụng lên production').actionType).toBe('deploy');
    });

    it('detects tìm', () => {
      expect(parseVibe('Tìm tất cả các file chứa auth logic').actionType).toBe('search');
    });
  });

  describe('entity extraction', () => {
    it('extracts service entities', () => {
      const r = parseVibe('Send report via Telegram to the team');
      const services = r.entities.filter((e) => e.type === 'service');
      expect(services.length).toBeGreaterThanOrEqual(1);
      expect(services[0].value.toLowerCase()).toBe('telegram');
    });

    it('extracts money entities', () => {
      const r = parseVibe('Budget is $500 for this project');
      const money = r.entities.filter((e) => e.type === 'money');
      expect(money.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts time entities', () => {
      const r = parseVibe('Send it daily at 9h sáng');
      const time = r.entities.filter((e) => e.type === 'time');
      expect(time.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts person entities', () => {
      const r = parseVibe('Gửi cho sếp báo cáo');
      const persons = r.entities.filter((e) => e.type === 'person');
      expect(persons.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts multiple entities', () => {
      const r = parseVibe('Send $100 report via Slack to the team daily');
      expect(r.entities.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('constraint extraction', () => {
    it('extracts security constraints', () => {
      const r = parseVibe('Create report but đừng gửi thông tin nhạy cảm');
      const security = r.constraints.filter((c) => c.type === 'security');
      expect(security.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts scope constraints', () => {
      const r = parseVibe('Chỉ sửa file frontend, không làm gì backend');
      const scope = r.constraints.filter((c) => c.type === 'scope');
      expect(scope.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts permission constraints', () => {
      const r = parseVibe('Hỏi tôi trước khi xóa bất cứ thứ gì');
      const permission = r.constraints.filter((c) => c.type === 'permission');
      expect(permission.length).toBeGreaterThanOrEqual(1);
    });

    it('marks security constraints as hard', () => {
      const r = parseVibe('Never share the API key');
      const security = r.constraints.filter((c) => c.type === 'security');
      if (security.length > 0) {
        expect(security[0].severity).toBe('hard');
      }
    });
  });

  describe('missing slots', () => {
    it('detects missing action type for vague input', () => {
      const r = parseVibe('hmm');
      expect(r.missingSlots).toContain('action_type');
    });

    it('detects missing recipient for send', () => {
      const r = parseVibe('Send the report');
      expect(r.missingSlots).toContain('recipient');
    });

    it('detects missing channel for send', () => {
      const r = parseVibe('Send the report');
      expect(r.missingSlots).toContain('channel');
    });

    it('detects missing target for deploy', () => {
      const r = parseVibe('Deploy the app');
      expect(r.missingSlots).toContain('target_environment');
    });
  });

  describe('confidence', () => {
    it('high confidence for clear create request', () => {
      const r = parseVibe('Create a React component for user dashboard');
      expect(r.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('low confidence for vague input', () => {
      const r = parseVibe('hmm maybe something');
      expect(r.confidence).toBeLessThan(0.5);
    });

    it('higher confidence with entities', () => {
      const a = parseVibe('Create report');
      const b = parseVibe('Create report via Slack for daily delivery');
      expect(b.confidence).toBeGreaterThanOrEqual(a.confidence);
    });
  });

  describe('suggested phase', () => {
    it('suggests DISCOVERY for analyze', () => {
      expect(parseVibe('Analyze the user data').suggestedPhase).toBe('DISCOVERY');
    });

    it('suggests DESIGN for create', () => {
      expect(parseVibe('Create a new component').suggestedPhase).toBe('DESIGN');
    });

    it('suggests BUILD for modify', () => {
      expect(parseVibe('Modify the API endpoint').suggestedPhase).toBe('BUILD');
    });

    it('suggests REVIEW for deploy', () => {
      expect(parseVibe('Deploy to production').suggestedPhase).toBe('REVIEW');
    });

    it('suggests REVIEW for review', () => {
      expect(parseVibe('Review the code').suggestedPhase).toBe('REVIEW');
    });

    it('suggests DISCOVERY for unknown', () => {
      expect(parseVibe('hmm').suggestedPhase).toBe('DISCOVERY');
    });
  });

  describe('suggested risk', () => {
    it('R3 for deploy', () => {
      expect(parseVibe('Deploy to production').suggestedRisk).toBe('R3');
    });

    it('R2 for delete', () => {
      expect(parseVibe('Delete all temp files').suggestedRisk).toBe('R2');
    });

    it('R1 for send', () => {
      expect(parseVibe('Send report to team').suggestedRisk).toBe('R1');
    });

    it('R0 for analyze', () => {
      expect(parseVibe('Analyze the data').suggestedRisk).toBe('R0');
    });

    it('R2 for send with money', () => {
      const r = parseVibe('Send $500 payment to the client');
      expect(r.suggestedRisk).toBe('R2');
    });
  });

  describe('goal extraction', () => {
    it('extracts goal from clear input', () => {
      const r = parseVibe('Create a landing page for my product');
      expect(r.goal).toContain('landing page');
    });

    it('preserves raw input reference', () => {
      const input = 'Build a REST API';
      const r = parseVibe(input);
      expect(r.rawInput).toBe(input);
    });

    it('truncates very long goals', () => {
      const longInput = 'Create '.padEnd(300, 'a very long description ');
      const r = parseVibe(longInput);
      expect(r.goal.length).toBeLessThanOrEqual(204); // 200 + "..."
    });
  });
});

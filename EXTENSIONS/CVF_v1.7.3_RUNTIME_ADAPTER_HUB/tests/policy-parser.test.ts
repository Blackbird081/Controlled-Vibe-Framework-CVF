// tests/policy-parser.test.ts
// Natural language policy parser tests

import { describe, it, expect } from 'vitest'
import { NaturalPolicyParser } from '../policy/natural.policy.parser.js'

describe('NaturalPolicyParser', () => {
    const parser = new NaturalPolicyParser()

    it('parses simple allow rule', () => {
        const rules = parser.parse('allow reading files')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('allow')
        expect(rules[0].resource).toBe('filesystem')
    })

    it('parses simple deny rule', () => {
        const rules = parser.parse('deny shell execution')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('deny')
        expect(rules[0].resource).toBe('shell')
    })

    it('parses review rule', () => {
        const rules = parser.parse('review email sending')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('review')
        expect(rules[0].resource).toBe('email')
    })

    it('parses sandbox rule', () => {
        const rules = parser.parse('sandbox code execution')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('sandbox')
        expect(rules[0].resource).toBe('shell')
    })

    it('handles conflicting keywords — deny wins over allow', () => {
        const rules = parser.parse('deny file access, do not allow delete')
        expect(rules).toHaveLength(1)
        // "deny" has higher priority than "allow"
        expect(rules[0].decision).toBe('deny')
    })

    it('parses multi-line input', () => {
        const rules = parser.parse(`
      allow reading files
      deny shell commands
      review api calls
    `)
        expect(rules).toHaveLength(3)
        expect(rules[0].decision).toBe('allow')
        expect(rules[1].decision).toBe('deny')
        expect(rules[2].decision).toBe('review')
    })

    it('skips lines without decision keywords', () => {
        const rules = parser.parse(`
      This is a comment line
      allow file reading
      Another comment
    `)
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('allow')
    })

    it('returns empty array for empty input', () => {
        expect(parser.parse('')).toHaveLength(0)
        expect(parser.parse('   ')).toHaveLength(0)
    })

    it('handles Vietnamese keywords', () => {
        const rules = parser.parse('từ chối xóa tệp')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('deny')
        expect(rules[0].resource).toBe('filesystem')
    })

    it('handles Vietnamese allow', () => {
        const rules = parser.parse('cho phép đọc dữ liệu')
        expect(rules).toHaveLength(1)
        expect(rules[0].decision).toBe('allow')
        expect(rules[0].resource).toBe('database')
    })

    it('assigns low confidence for unknown resource', () => {
        const rules = parser.parse('deny unknown stuff')
        expect(rules).toHaveLength(1)
        expect(rules[0].confidence).toBeLessThan(0.5)
        expect(rules[0].resource).toBe('unknown')
    })

    it('assigns high confidence for matched resource', () => {
        const rules = parser.parse('deny file deletion')
        expect(rules).toHaveLength(1)
        expect(rules[0].confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('preserves original line text', () => {
        const input = 'deny all shell commands immediately'
        const rules = parser.parse(input)
        expect(rules[0].originalLine).toBe(input)
    })
})

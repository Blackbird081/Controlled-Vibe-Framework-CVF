import { describe, it, expect } from 'vitest'
import * as RuntimeAdapterHub from '../index.js'

describe('root barrel exports', () => {
    it('exports contract layer from the canonical root entry', () => {
        expect(RuntimeAdapterHub).toHaveProperty('NaturalPolicyParser')
        expect(RuntimeAdapterHub).toHaveProperty('ExplainabilityLayer')
    })

    it('exports adapter layer from the canonical root entry', () => {
        expect(RuntimeAdapterHub).toHaveProperty('OpenClawAdapter')
        expect(RuntimeAdapterHub).toHaveProperty('PicoClawAdapter')
        expect(RuntimeAdapterHub).toHaveProperty('ZeroClawAdapter')
        expect(RuntimeAdapterHub).toHaveProperty('NanoAdapter')
        expect(RuntimeAdapterHub).toHaveProperty('ReleaseEvidenceAdapter')
    })
})

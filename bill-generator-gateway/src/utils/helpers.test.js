import { describe, it, expect } from 'vitest';
import { calculateItemAmount } from './helpers';
import { pricing } from '../constants/data';

describe('calculateItemAmount', () => {
    it('should calculate the amount for 32_GB_Pendrive with a given quantity', () => {
        const item = { workMain: '32_GB_Pendrive', quantity: 3 };
        const result = calculateItemAmount(item);
        expect(result).toBe(pricing['32_GB_Pendrive'] * 3);
    });

    it('should calculate the amount for 32_GB_Pendrive with default quantity (1)', () => {
        const item = { workMain: '32_GB_Pendrive' };
        const result = calculateItemAmount(item);
        expect(result).toBe(pricing['32_GB_Pendrive'] * 1);
    });

    it('should calculate the amount for a category with a valid subcategory and default quantity', () => {
        const item = { workMain: 'Still_Photography', workSub: 'Mumbai_Upto_4_Hrs' };
        const result = calculateItemAmount(item);
        expect(result).toBe(pricing['Still_Photography']['Mumbai_Upto_4_Hrs']);
    });

    it('should calculate the amount for a category with a valid subcategory and specific quantity', () => {
        const item = { workMain: 'Still_Photography', workSub: 'Mumbai_Upto_4_Hrs', quantity: 3 };
        const result = calculateItemAmount(item);
        expect(result).toBe(pricing['Still_Photography']['Mumbai_Upto_4_Hrs'] * 3);
    });

    it('should return 0 for a missing or invalid workMain', () => {
        const item = { workMain: 'Invalid_Category', workSub: 'Mumbai_Upto_4_Hrs' };
        const result = calculateItemAmount(item);
        expect(result).toBe(0);
    });

    it('should return 0 for a valid workMain but missing or invalid workSub', () => {
        const item = { workMain: 'Still_Photography', workSub: 'Invalid_Subcategory' };
        const result = calculateItemAmount(item);
        expect(result).toBe(0);
    });

    it('should return 0 if item object is empty', () => {
        const item = {};
        const result = calculateItemAmount(item);
        expect(result).toBe(0);
    });
});

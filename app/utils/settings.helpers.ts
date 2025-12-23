import { hsbToRgb, rgbToHex } from '@shopify/polaris';
import { HSBColor } from '../types/settings';

export const hexToHsb = (hex: string | null | undefined): HSBColor => {
    if (!hex) return { hue: 0, saturation: 0, brightness: 0, alpha: 1 };

    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else if (max === b) h = (r - g) / d + 4;
        h /= 6;
    }

    return {
        hue: h * 360,
        saturation: max === 0 ? 0 : d / max,
        brightness: max,
        alpha: 1
    };
};

export const getFontFamilyValue = (fontFamily: string, options: { label: string, value: string }[]) => {
    if (fontFamily === 'theme') return 'theme';
    if (fontFamily === '') return 'custom';
    const predefinedValues = options.map(opt => opt.value);
    return predefinedValues.includes(fontFamily) ? fontFamily : 'custom';
};

export const hsbToHex = (hsb: HSBColor): string => {
    return rgbToHex(hsbToRgb(hsb));
};

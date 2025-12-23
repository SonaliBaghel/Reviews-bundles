/**
 * CSV Helper Utilities
 * Functions for parsing, generating, and validating CSV data
 */

import APP_CONFIG from '../app.config';

/**
 * Escapes a value for CSV output
 */
export function escapeCsvValue(value: string | null | undefined): string {
    if (!value) return '';
    return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Parses a CSV value, handling quoted strings
 */
export function parseCsvValue(value: string): string {
    let trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        trimmed = trimmed.slice(1, -1).replace(/""/g, '"');
    }
    return trimmed;
}

/**
 * Validates CSV headers against required headers
 */
export function validateCsvHeaders(
    headers: string[],
    requiredHeaders: string[]
): { valid: boolean; missingHeaders: string[] } {
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    return {
        valid: missingHeaders.length === 0,
        missingHeaders,
    };
}

/**
 * Generates CSV content from review data
 */
export function generateReviewsCsv(reviews: any[]): string {
    const headers = APP_CONFIG.CSV.HEADERS.join(',') + '\n';

    const rows = reviews.map(review => {
        const escapedContent = escapeCsvValue(review.content);
        const escapedTitle = escapeCsvValue(review.title);

        return [
            review.productId,
            review.rating,
            review.author || '',
            review.email || '',
            escapedTitle,
            escapedContent,
            review.status,
            review.createdAt.toISOString(),
        ].join(',');
    }).join('\n');

    return headers + rows;
}

/**
 * Generates a CSV filename with timestamp
 */
export function generateCsvFileName(prefix: string = APP_CONFIG.CSV.FILE_NAME_PREFIX): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}-${date}.csv`;
}

/**
 * Parses CSV text into rows and columns
 */
export function parseCsvText(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 1) {
        return { headers: [], rows: [] };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));

    return { headers, rows };
}

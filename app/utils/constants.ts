/**
 * Application Constants
 * Type-safe constants and enums used throughout the application
 */

export const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

export const ACTION_SOURCE = {
    BUNDLE: 'bundle',
    INDIVIDUAL: 'individual',
} as const;

export type ActionSource = typeof ACTION_SOURCE[keyof typeof ACTION_SOURCE];

export const BADGE_TONE = {
    SUCCESS: 'success',
    CRITICAL: 'critical',
    ATTENTION: 'attention',
    WARNING: 'warning',
    INFO: 'info',
    BASE: 'base',
} as const;

export type BadgeTone = typeof BADGE_TONE[keyof typeof BADGE_TONE];

export const STATUS_BADGE_TONE_MAP: Record<string, BadgeTone> = {
    [REVIEW_STATUS.APPROVED]: BADGE_TONE.SUCCESS,
    [REVIEW_STATUS.REJECTED]: BADGE_TONE.CRITICAL,
    [REVIEW_STATUS.PENDING]: BADGE_TONE.ATTENTION,
};

export const RATING_BADGE_TONE_MAP = {
    getByRating: (rating: number): BadgeTone => {
        if (rating >= 4.5) return BADGE_TONE.SUCCESS;
        if (rating >= 4.0) return BADGE_TONE.SUCCESS;
        if (rating >= 3.0) return BADGE_TONE.WARNING;
        if (rating >= 2.0) return BADGE_TONE.CRITICAL;
        return BADGE_TONE.CRITICAL;
    },
};

export const STATUS_OPTIONS = [
    { label: 'Pending', value: REVIEW_STATUS.PENDING },
    { label: 'Approved', value: REVIEW_STATUS.APPROVED },
    { label: 'Rejected', value: REVIEW_STATUS.REJECTED },
] as const;

export const RATING_OPTIONS = [
    { label: '⭐ 1 Star', value: '1' },
    { label: '⭐⭐ 2 Stars', value: '2' },
    { label: '⭐⭐⭐ 3 Stars', value: '3' },
    { label: '⭐⭐⭐⭐ 4 Stars', value: '4' },
    { label: '⭐⭐⭐⭐⭐ 5 Stars', value: '5' },
] as const;

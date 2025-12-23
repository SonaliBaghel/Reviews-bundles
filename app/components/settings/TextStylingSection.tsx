import { Box, InlineGrid, BlockStack, InlineStack, Text, Card, TextField, Select } from '@shopify/polaris';
import { HSBColor } from '../../types/settings';
import { ColorSettingCard } from './ColorSettingCard';
import { getFontFamilyValue, hsbToHex } from '../../utils/settings.helpers';

interface TextStylingSectionProps {
    headingText: string;
    setHeadingText: (value: string) => void;
    headingFontFamily: string;
    setHeadingFontFamily: (value: string) => void;
    headingFontSize: number;
    handleHeadingFontSizeChange: (value: string) => void;
    headingFontWeight: string;
    setHeadingFontWeight: (value: string) => void;
    headingFontStyle: string;
    setHeadingFontStyle: (value: string) => void;
    headingTextTransform: string;
    setHeadingTextTransform: (value: string) => void;
    headingLetterSpacing: number;
    handleHeadingLetterSpacingChange: (value: string) => void;
    headingLineHeight: number;
    handleHeadingLineHeightChange: (value: string) => void;
    headingTextShadow: string;
    setHeadingTextShadow: (value: string) => void;

    ratingLabelText: string;
    setRatingLabelText: (value: string) => void;
    ratingLabelFontFamily: string;
    setRatingLabelFontFamily: (value: string) => void;
    ratingLabelFontSize: number;
    handleRatingLabelFontSizeChange: (value: string) => void;
    ratingLabelFontWeight: string;
    setRatingLabelFontWeight: (value: string) => void;
    ratingLabelColor: HSBColor;
    handleRatingLabelColorChange: (color: HSBColor) => void;

    ratingValueFontFamily: string;
    setRatingValueFontFamily: (value: string) => void;
    ratingValueFontSize: number;
    handleRatingValueFontSizeChange: (value: string) => void;
    ratingValueFontWeight: string;
    setRatingValueFontWeight: (value: string) => void;
    ratingValueColor: HSBColor;
    handleRatingValueColorChange: (color: HSBColor) => void;

    reviewCountPrefix: string;
    setReviewCountPrefix: (value: string) => void;
    reviewCountSuffix: string;
    setReviewCountSuffix: (value: string) => void;
    reviewCountFontFamily: string;
    setReviewCountFontFamily: (value: string) => void;
    reviewCountFontSize: number;
    handleReviewCountFontSizeChange: (value: string) => void;
    reviewCountFontWeight: string;
    setReviewCountFontWeight: (value: string) => void;
    reviewCountColor: HSBColor;
    handleReviewCountColorChange: (color: HSBColor) => void;

    fontFamilyOptions: { label: string, value: string }[];
    fontWeightOptions: { label: string, value: string }[];
    fontStyleOptions: { label: string, value: string }[];
    textTransformOptions: { label: string, value: string }[];
    headingColor: HSBColor;
}

export const TextStylingSection = (props: TextStylingSectionProps) => {
    const {
        headingText, setHeadingText, headingFontFamily, setHeadingFontFamily,
        headingFontSize, handleHeadingFontSizeChange, headingFontWeight, setHeadingFontWeight,
        headingFontStyle, setHeadingFontStyle, headingTextTransform, setHeadingTextTransform,
        headingLetterSpacing, handleHeadingLetterSpacingChange, headingLineHeight, handleHeadingLineHeightChange,
        headingTextShadow, setHeadingTextShadow,
        ratingLabelText, setRatingLabelText, ratingLabelFontFamily, setRatingLabelFontFamily,
        ratingLabelFontSize, handleRatingLabelFontSizeChange, ratingLabelFontWeight, setRatingLabelFontWeight,
        ratingLabelColor, handleRatingLabelColorChange,
        ratingValueFontFamily, setRatingValueFontFamily, ratingValueFontSize, handleRatingValueFontSizeChange,
        ratingValueFontWeight, setRatingValueFontWeight, ratingValueColor, handleRatingValueColorChange,
        reviewCountPrefix, setReviewCountPrefix, reviewCountSuffix, setReviewCountSuffix,
        reviewCountFontFamily, setReviewCountFontFamily, reviewCountFontSize, handleReviewCountFontSizeChange,
        reviewCountFontWeight, setReviewCountFontWeight, reviewCountColor, handleReviewCountColorChange,
        fontFamilyOptions, fontWeightOptions, fontStyleOptions, textTransformOptions, headingColor
    } = props;

    return (
        <Box>
            <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                <BlockStack gap="400">
                    <InlineStack gap="300" blockAlign="center">
                        <Box background="bg-fill-brand" padding="200" borderRadius="300">
                            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>🅰️</div>
                        </Box>
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">Text Styling</Text>
                            <Text as="p" variant="bodySm" tone="subdued">Customize the appearance of all text elements in your review display.</Text>
                        </BlockStack>
                    </InlineStack>
                </BlockStack>

                <Card padding="400">
                    <BlockStack gap="500">
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">Main Heading</Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <TextField label="Heading Text" value={headingText} onChange={setHeadingText} helpText="Main title text for the review section" autoComplete="off" />
                            <div>
                                <Select
                                    label="Font Family"
                                    options={fontFamilyOptions}
                                    value={getFontFamilyValue(headingFontFamily, fontFamilyOptions)}
                                    onChange={(value) => value === 'custom' ? setHeadingFontFamily('') : setHeadingFontFamily(value)}
                                    helpText="Select 'Use theme body font' to match your store's typography, or choose from predefined fonts"
                                />
                                {(headingFontFamily === '' || getFontFamilyValue(headingFontFamily, fontFamilyOptions) === 'custom') && (
                                    <Box paddingBlockStart="200">
                                        <TextField label="Custom Font Family" value={headingFontFamily} onChange={setHeadingFontFamily} helpText="Enter custom font family (e.g., 'Roboto, sans-serif')" autoComplete="off" placeholder="e.g., Roboto, sans-serif" />
                                    </Box>
                                )}
                            </div>
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <TextField label="Font Size" value={headingFontSize === 0 ? '' : String(headingFontSize)} onChange={handleHeadingFontSizeChange} type="number" min={10} max={100} helpText="Font size in pixels" autoComplete="off" suffix="px" />
                            <Select label="Font Weight" options={fontWeightOptions} value={headingFontWeight} onChange={setHeadingFontWeight} helpText="Font weight (boldness)" />
                            <Select label="Text Transform" options={textTransformOptions} value={headingTextTransform} onChange={setHeadingTextTransform} helpText="Text transformation" />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <Select label="Font Style" options={fontStyleOptions} value={headingFontStyle} onChange={setHeadingFontStyle} helpText="Font style" />
                            <TextField label="Letter Spacing" value={headingLetterSpacing === 0 ? '' : String(headingLetterSpacing)} onChange={handleHeadingLetterSpacingChange} type="number" min={-10} max={50} helpText="Space between letters in pixels" autoComplete="off" suffix="px" />
                            <TextField label="Line Height" value={headingLineHeight === 0 ? '' : String(headingLineHeight)} onChange={handleHeadingLineHeightChange} type="number" min={0.5} max={3} step={0.1} helpText="Line height multiplier" autoComplete="off" />
                        </InlineGrid>

                        <TextField label="Text Shadow" value={headingTextShadow} onChange={setHeadingTextShadow} helpText="CSS text-shadow property (e.g., '2px 2px 4px rgba(0,0,0,0.5)')" autoComplete="off" />

                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">Rating Summary</Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <TextField label="Rating Label Text" value={ratingLabelText} onChange={setRatingLabelText} helpText="Text for the rating label (e.g., 'Excellent')" autoComplete="off" />
                            <div>
                                <Select
                                    label="Font Family"
                                    options={fontFamilyOptions}
                                    value={getFontFamilyValue(ratingLabelFontFamily, fontFamilyOptions)}
                                    onChange={(value) => value === 'custom' ? setRatingLabelFontFamily('') : setRatingLabelFontFamily(value)}
                                    helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                                />
                                {(ratingLabelFontFamily === '' || getFontFamilyValue(ratingLabelFontFamily, fontFamilyOptions) === 'custom') && (
                                    <Box paddingBlockStart="200">
                                        <TextField label="Custom Font Family" value={ratingLabelFontFamily} onChange={setRatingLabelFontFamily} helpText="Enter custom font family (e.g., 'Roboto, sans-serif')" autoComplete="off" placeholder="e.g., Roboto, sans-serif" />
                                    </Box>
                                )}
                            </div>
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <TextField label="Font Size" value={ratingLabelFontSize === 0 ? '' : String(ratingLabelFontSize)} onChange={handleRatingLabelFontSizeChange} type="number" min={8} max={40} helpText="Font size in pixels" autoComplete="off" suffix="px" />
                            <Select label="Font Weight" options={fontWeightOptions} value={ratingLabelFontWeight} onChange={setRatingLabelFontWeight} helpText="Font weight" />
                            <ColorSettingCard title="Label Color" description="Color for the rating label" color={ratingLabelColor} onChange={handleRatingLabelColorChange} />
                        </InlineGrid>

                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">Average Rating</Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <div>
                                <Select
                                    label="Font Family"
                                    options={fontFamilyOptions}
                                    value={getFontFamilyValue(ratingValueFontFamily, fontFamilyOptions)}
                                    onChange={(value) => value === 'custom' ? setRatingValueFontFamily('') : setRatingValueFontFamily(value)}
                                    helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                                />
                                {(ratingValueFontFamily === '' || getFontFamilyValue(ratingValueFontFamily, fontFamilyOptions) === 'custom') && (
                                    <Box paddingBlockStart="200">
                                        <TextField label="Custom Font Family" value={ratingValueFontFamily} onChange={setRatingValueFontFamily} helpText="Enter custom font family (e.g., 'Roboto, sans-serif')" autoComplete="off" placeholder="e.g., Roboto, sans-serif" />
                                    </Box>
                                )}
                            </div>
                            <TextField label="Font Size" value={ratingValueFontSize === 0 ? '' : String(ratingValueFontSize)} onChange={handleRatingValueFontSizeChange} type="number" min={8} max={40} helpText="Font size in pixels" autoComplete="off" suffix="px" />
                            <Select label="Font Weight" options={fontWeightOptions} value={ratingValueFontWeight} onChange={setRatingValueFontWeight} helpText="Font weight" />
                        </InlineGrid>

                        <ColorSettingCard title="Rating Value Color" description="Color for the average rating number" color={ratingValueColor} onChange={handleRatingValueColorChange} />

                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">Review Count</Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <TextField label="Count Prefix" value={reviewCountPrefix} onChange={setReviewCountPrefix} helpText="Text before review count (e.g., 'Based on')" autoComplete="off" />
                            <TextField label="Count Suffix" value={reviewCountSuffix} onChange={setReviewCountSuffix} helpText="Text after review count (e.g., 'reviews')" autoComplete="off" />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <div>
                                <Select
                                    label="Font Family"
                                    options={fontFamilyOptions}
                                    value={getFontFamilyValue(reviewCountFontFamily, fontFamilyOptions)}
                                    onChange={(value) => value === 'custom' ? setReviewCountFontFamily('') : setReviewCountFontFamily(value)}
                                    helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                                />
                                {(reviewCountFontFamily === '' || getFontFamilyValue(reviewCountFontFamily, fontFamilyOptions) === 'custom') && (
                                    <Box paddingBlockStart="200">
                                        <TextField label="Custom Font Family" value={reviewCountFontFamily} onChange={setReviewCountFontFamily} helpText="Enter custom font family (e.g., 'Roboto, sans-serif')" autoComplete="off" placeholder="e.g., Roboto, sans-serif" />
                                    </Box>
                                )}
                            </div>
                            <TextField label="Font Size" value={reviewCountFontSize === 0 ? '' : String(reviewCountFontSize)} onChange={handleReviewCountFontSizeChange} type="number" min={8} max={30} helpText="Font size in pixels" autoComplete="off" suffix="px" />
                            <Select label="Font Weight" options={fontWeightOptions} value={reviewCountFontWeight} onChange={setReviewCountFontWeight} helpText="Font weight" />
                        </InlineGrid>

                        <ColorSettingCard title="Review Count Color" description="Color for the review count text" color={reviewCountColor} onChange={handleReviewCountColorChange} />

                        <Box padding="400" background="bg-surface-brand" borderRadius="200">
                            <BlockStack gap="300">
                                <Text as="h3" variant="headingSm" fontWeight="semibold">Text Preview</Text>
                                <Box padding="400" background="bg-surface" borderRadius="200">
                                    <BlockStack gap="200">
                                        <div style={{
                                            fontFamily: headingFontFamily === 'theme' ? 'inherit' : (headingFontFamily || 'Arial, sans-serif'),
                                            fontSize: `${headingFontSize}px`,
                                            fontWeight: headingFontWeight,
                                            fontStyle: headingFontStyle,
                                            textTransform: headingTextTransform as any,
                                            letterSpacing: `${headingLetterSpacing}px`,
                                            lineHeight: headingLineHeight,
                                            textShadow: headingTextShadow,
                                            color: hsbToHex(headingColor),
                                            textAlign: 'center'
                                        }}>
                                            {headingTextTransform === 'capitalize'
                                                ? headingText.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
                                                : headingText
                                            }
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ fontFamily: ratingLabelFontFamily === 'theme' ? 'inherit' : (ratingLabelFontFamily || 'Arial, sans-serif'), fontSize: `${ratingLabelFontSize}px`, fontWeight: ratingLabelFontWeight, color: hsbToHex(ratingLabelColor) }}>{ratingLabelText}</span>
                                            <span style={{ fontFamily: ratingValueFontFamily === 'theme' ? 'inherit' : (ratingValueFontFamily || 'Arial, sans-serif'), fontSize: `${ratingValueFontSize}px`, fontWeight: ratingValueFontWeight, color: hsbToHex(ratingValueColor) }}>4.5</span>
                                        </div>
                                        <div style={{ fontFamily: reviewCountFontFamily === 'theme' ? 'inherit' : (reviewCountFontFamily || 'Arial, sans-serif'), fontSize: `${reviewCountFontSize}px`, fontWeight: reviewCountFontWeight, color: hsbToHex(reviewCountColor), textAlign: 'center' }}>
                                            {reviewCountPrefix} <strong>24</strong> {reviewCountSuffix}
                                        </div>
                                    </BlockStack>
                                </Box>
                            </BlockStack>
                        </Box>
                    </BlockStack>
                </Card>
            </InlineGrid>
        </Box>
    );
};

import { Card, BlockStack, Text, Box, InlineStack } from '@shopify/polaris';
import { HSBColor } from '../../types/settings';
import { hsbToHex } from '../../utils/settings.helpers';

interface PreviewSectionProps {
    headingFontFamily: string;
    headingFontSize: number;
    headingFontWeight: string;
    headingFontStyle: string;
    headingTextTransform: string;
    headingLetterSpacing: number;
    headingLineHeight: number;
    headingTextShadow: string;
    headingColor: HSBColor;
    headingText: string;
    ratingLabelFontFamily: string;
    ratingLabelFontSize: number;
    ratingLabelFontWeight: string;
    ratingLabelColor: HSBColor;
    ratingLabelText: string;
    ratingValueFontFamily: string;
    ratingValueFontSize: number;
    ratingValueFontWeight: string;
    ratingValueColor: HSBColor;
    reviewCountFontFamily: string;
    reviewCountFontSize: number;
    reviewCountFontWeight: string;
    reviewCountColor: HSBColor;
    reviewCountPrefix: string;
    reviewCountSuffix: string;
    starColor: HSBColor;
    backgroundColor: HSBColor;
    reviewCardColor: HSBColor;
    sectionBorderRadius: number;
}

export const PreviewSection = (props: PreviewSectionProps) => {
    const {
        headingFontFamily, headingFontSize, headingFontWeight, headingFontStyle,
        headingTextTransform, headingLetterSpacing, headingLineHeight, headingTextShadow,
        headingColor, headingText,
        ratingLabelFontFamily, ratingLabelFontSize, ratingLabelFontWeight, ratingLabelColor, ratingLabelText,
        ratingValueFontFamily, ratingValueFontSize, ratingValueFontWeight, ratingValueColor,
        reviewCountFontFamily, reviewCountFontSize, reviewCountFontWeight, reviewCountColor,
        reviewCountPrefix, reviewCountSuffix,
        starColor, backgroundColor, reviewCardColor, sectionBorderRadius
    } = props;

    return (
        <Card>
            <BlockStack gap="300">
                <Text as="h3" variant="headingSm" fontWeight="medium">Color Preview</Text>
                <Text as="p" variant="bodySm" tone="subdued">Your selected colors will be applied to the review components throughout your store.</Text>
                <InlineStack gap="200" blockAlign="center">
                    <Box padding="200">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '10px',
                            padding: '30px',
                            backgroundColor: hsbToHex(backgroundColor),
                            borderRadius: `${sectionBorderRadius}px`,
                            border: '1px solid #eee',
                            width: '100%'
                        }}>
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
                                textAlign: 'center',
                                marginBottom: '10px'
                            }}>
                                {headingTextTransform === 'capitalize'
                                    ? headingText.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
                                    : headingText
                                }
                            </div>

                            <div style={{
                                backgroundColor: hsbToHex(reviewCardColor),
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                width: '100%',
                                maxWidth: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <span key={i} style={{ color: hsbToHex(starColor), fontSize: '24px' }}>★</span>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontFamily: ratingLabelFontFamily === 'theme' ? 'inherit' : (ratingLabelFontFamily || 'Arial, sans-serif'), fontSize: `${ratingLabelFontSize}px`, fontWeight: ratingLabelFontWeight, color: hsbToHex(ratingLabelColor) }}>{ratingLabelText}</span>
                                    <span style={{ fontFamily: ratingValueFontFamily === 'theme' ? 'inherit' : (ratingValueFontFamily || 'Arial, sans-serif'), fontSize: `${ratingValueFontSize}px`, fontWeight: ratingValueFontWeight, color: hsbToHex(ratingValueColor) }}>4.5</span>
                                </div>

                                <div style={{ fontFamily: reviewCountFontFamily === 'theme' ? 'inherit' : (reviewCountFontFamily || 'Arial, sans-serif'), fontSize: `${reviewCountFontSize}px`, fontWeight: reviewCountFontWeight, color: hsbToHex(reviewCountColor), textAlign: 'center' }}>
                                    {reviewCountPrefix} <strong>24</strong> {reviewCountSuffix}
                                </div>
                            </div>
                        </div>
                    </Box>
                </InlineStack>
            </BlockStack>
        </Card>
    );
};

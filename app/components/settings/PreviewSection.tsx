import { Card, BlockStack, Text, Box, InlineStack, InlineGrid } from '@shopify/polaris';
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
            <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="medium">Color Preview</Text>
                    <Text as="p" variant="bodySm" tone="subdued">Your selected colors will be applied to the review components throughout your store.</Text>
                </BlockStack>

                <InlineStack gap="400">
                    <BlockStack gap="100" align="center">
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: hsbToHex(starColor),
                            borderRadius: '8px',
                            border: '1px solid #dfe3e8'
                        }} />
                        <Text as="p" variant="bodyXs" alignment="center">Star</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: hsbToHex(backgroundColor),
                            borderRadius: '8px',
                            border: '1px solid #dfe3e8'
                        }} />
                        <Text as="p" variant="bodyXs" alignment="center">Background</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: hsbToHex(headingColor),
                            borderRadius: '8px',
                            border: '1px solid #dfe3e8'
                        }} />
                        <Text as="p" variant="bodyXs" alignment="center">Heading</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: hsbToHex(reviewCardColor),
                            borderRadius: '8px',
                            border: '1px solid #dfe3e8'
                        }} />
                        <Text as="p" variant="bodyXs" alignment="center">Card</Text>
                    </BlockStack>
                </InlineStack>
            </InlineGrid>
        </Card>
    );
};

import { Box, InlineGrid, BlockStack, InlineStack, Text } from '@shopify/polaris';
import { HSBColor } from '../../types/settings';
import { ColorSettingCard } from './ColorSettingCard';

interface ColorSchemeSectionProps {
    starColor: HSBColor;
    handleStarColorChange: (color: HSBColor) => void;
    backgroundColor: HSBColor;
    handleBackgroundColorChange: (color: HSBColor) => void;
    headingColor: HSBColor;
    handleHeadingColorChange: (color: HSBColor) => void;
    reviewCardColor: HSBColor;
    handleReviewCardColorChange: (color: HSBColor) => void;
}

export const ColorSchemeSection = (props: ColorSchemeSectionProps) => {
    const {
        starColor, handleStarColorChange,
        backgroundColor, handleBackgroundColorChange,
        headingColor, handleHeadingColorChange,
        reviewCardColor, handleReviewCardColorChange
    } = props;

    return (
        <Box>
            <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                <BlockStack gap="400">
                    <InlineStack gap="300" blockAlign="center">
                        <Box background="bg-fill-brand" padding="200" borderRadius="300">
                            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>🎨</div>
                        </Box>
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">Color Scheme</Text>
                            <Text as="p" variant="bodySm" tone="subdued">Customize colors to match your brand identity and create a cohesive look.</Text>
                        </BlockStack>
                    </InlineStack>
                </BlockStack>

                <BlockStack gap="400">
                    <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap="400">
                        <ColorSettingCard title="Star Color" description="Color of rating stars" color={starColor} onChange={handleStarColorChange} />
                        <ColorSettingCard title="Background" description="Main background color" color={backgroundColor} onChange={handleBackgroundColorChange} />
                        <ColorSettingCard title="Heading Text" description="Color for headings and titles" color={headingColor} onChange={handleHeadingColorChange} />
                        <ColorSettingCard title="Card Background" description="Review card background color" color={reviewCardColor} onChange={handleReviewCardColorChange} />
                    </InlineGrid>
                </BlockStack>
            </InlineGrid>
        </Box>
    );
};

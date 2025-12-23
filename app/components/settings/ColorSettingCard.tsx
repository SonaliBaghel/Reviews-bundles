import { Card, BlockStack, InlineStack, Text, Badge, Box, ColorPicker } from '@shopify/polaris';
import { HSBColor } from '../../types/settings';
import { hsbToHex } from '../../utils/settings.helpers';

interface ColorSettingCardProps {
    title: string;
    description: string;
    color: HSBColor;
    onChange: (color: HSBColor) => void;
}

export const ColorSettingCard = ({
    title,
    description,
    color,
    onChange
}: ColorSettingCardProps) => (
    <Card padding="400">
        <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                    <Text as="h4" variant="bodyMd" fontWeight="semibold">
                        {title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                        {description}
                    </Text>
                </BlockStack>
                <Badge tone="info">{hsbToHex(color).toUpperCase()}</Badge>
            </InlineStack>

            <Box padding="200">
                <ColorPicker
                    onChange={onChange}
                    color={color}
                    allowAlpha={false}
                />
            </Box>
        </BlockStack>
    </Card>
);

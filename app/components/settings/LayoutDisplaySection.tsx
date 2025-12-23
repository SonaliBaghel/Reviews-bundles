import { Box, InlineGrid, BlockStack, InlineStack, Text, Card, Select, TextField } from '@shopify/polaris';

interface LayoutDisplaySectionProps {
    displayType: string;
    setDisplayType: (value: string) => void;
    displayTypeOptions: { label: string, value: string }[];
    reviewsPerSlide: number;
    handleReviewsPerSlideChange: (value: string) => void;
    gridRows: number;
    handleGridRowsChange: (value: string) => void;
    gridColumns: number;
    handleGridColumnsChange: (value: string) => void;
    sectionBorderRadius: number;
    handleSectionBorderRadiusChange: (value: string) => void;
}

export const LayoutDisplaySection = (props: LayoutDisplaySectionProps) => {
    const {
        displayType, setDisplayType, displayTypeOptions,
        reviewsPerSlide, handleReviewsPerSlideChange,
        gridRows, handleGridRowsChange,
        gridColumns, handleGridColumnsChange,
        sectionBorderRadius, handleSectionBorderRadiusChange
    } = props;

    return (
        <Box>
            <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                <BlockStack gap="400">
                    <InlineStack gap="300" blockAlign="center">
                        <Box background="bg-fill-brand" padding="200" borderRadius="300">
                            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>⚡</div>
                        </Box>
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">Layout & Display</Text>
                            <Text as="p" variant="bodySm" tone="subdued">Configure how reviews are organized and displayed to your customers.</Text>
                        </BlockStack>
                    </InlineStack>
                </BlockStack>

                <Card padding="400">
                    <BlockStack gap="400">
                        <Select label="Display Type" options={displayTypeOptions} value={displayType} onChange={setDisplayType} helpText="Choose how reviews are displayed on your store" />

                        {displayType === 'slider' && (
                            <TextField label="Reviews per slide" value={reviewsPerSlide === 0 ? '' : String(reviewsPerSlide)} onChange={handleReviewsPerSlideChange} type="number" min={1} max={6} helpText="Number of review cards visible at one time in slider" autoComplete="off" />
                        )}

                        {displayType === 'grid' && (
                            <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                                <TextField label="Grid Rows" value={gridRows === 0 ? '' : String(gridRows)} onChange={handleGridRowsChange} type="number" min={1} max={6} helpText="Number of rows in the grid" autoComplete="off" />
                                <TextField label="Grid Columns" value={gridColumns === 0 ? '' : String(gridColumns)} onChange={handleGridColumnsChange} type="number" min={1} max={6} helpText="Number of columns in the grid" autoComplete="off" />
                            </InlineGrid>
                        )}

                        <TextField label="Section Border Radius" value={sectionBorderRadius === 0 ? '' : String(sectionBorderRadius)} onChange={handleSectionBorderRadiusChange} type="number" min={0} max={50} helpText="Border radius for the entire review section (0-50px)" autoComplete="off" suffix="px" />

                        <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                            <Text as="p" variant="bodySm" tone="subdued">
                                {displayType === 'slider'
                                    ? `Slider will show ${reviewsPerSlide} review${reviewsPerSlide !== 1 ? 's' : ''} per slide with ${sectionBorderRadius}px border radius`
                                    : `Grid layout: ${gridRows} row${gridRows !== 1 ? 's' : ''} × ${gridColumns} column${gridColumns !== 1 ? 's' : ''} (${gridRows * gridColumns} total reviews visible) with ${sectionBorderRadius}px border radius`
                                }
                            </Text>
                        </Box>
                    </BlockStack>
                </Card>
            </InlineGrid>
        </Box>
    );
};

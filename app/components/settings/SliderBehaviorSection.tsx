import { Box, InlineGrid, BlockStack, InlineStack, Text, Card, Select, TextField } from '@shopify/polaris';

interface SliderBehaviorSectionProps {
    sliderEffect: string;
    setSliderEffect: (value: string) => void;
    effectOptions: { label: string, value: string }[];
    sliderDirection: string;
    setSliderDirection: (value: string) => void;
    directionOptions: { label: string, value: string }[];
    sliderSpeed: number;
    handleSliderSpeedChange: (value: string) => void;
    spaceBetween: number;
    handleSpaceBetweenChange: (value: string) => void;
    sliderAutoplay: boolean;
    setSliderAutoplay: (value: boolean) => void;
    sliderLoop: boolean;
    setSliderLoop: (value: boolean) => void;
    showNavigation: boolean;
    setShowNavigation: (value: boolean) => void;
}

export const SliderBehaviorSection = (props: SliderBehaviorSectionProps) => {
    const {
        sliderEffect, setSliderEffect, effectOptions,
        sliderDirection, setSliderDirection, directionOptions,
        sliderSpeed, handleSliderSpeedChange,
        spaceBetween, handleSpaceBetweenChange,
        sliderAutoplay, setSliderAutoplay,
        sliderLoop, setSliderLoop,
        showNavigation, setShowNavigation
    } = props;

    return (
        <Box>
            <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                <BlockStack gap="400">
                    <InlineStack gap="300" blockAlign="center">
                        <Box background="bg-fill-brand" padding="200" borderRadius="300">
                            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>⚙️</div>
                        </Box>
                        <BlockStack gap="100">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">Slider Behavior</Text>
                            <Text as="p" variant="bodySm" tone="subdued">Configure how the review slider behaves and appears to customers.</Text>
                        </BlockStack>
                    </InlineStack>
                </BlockStack>

                <Card padding="400">
                    <BlockStack gap="400">
                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <Select label="Transition Effect" options={effectOptions} value={sliderEffect} onChange={setSliderEffect} helpText="Animation effect between slides" />
                            <Select label="Direction" options={directionOptions} value={sliderDirection} onChange={setSliderDirection} helpText="Slider movement direction" />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <TextField label="Autoplay Speed" value={sliderSpeed === 0 ? '' : String(sliderSpeed)} onChange={handleSliderSpeedChange} type="number" min={2000} max={12000} step={1000} helpText="Time between slides (2000-12000 milliseconds)" autoComplete="off" suffix="ms" />
                            <TextField label="Space Between" value={spaceBetween === 0 ? '' : String(spaceBetween)} onChange={handleSpaceBetweenChange} type="number" min={0} max={100} helpText="Space between slides (0-100px)" autoComplete="off" suffix="px" />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                            <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                    <input type="checkbox" id="sliderAutoplay" checked={sliderAutoplay} onChange={(e) => setSliderAutoplay(e.target.checked)} style={{ margin: 0 }} />
                                    <label htmlFor="sliderAutoplay" style={{ fontSize: '14px', fontWeight: 'normal' }}>Autoplay</label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">Automatically advance slides</Text>
                            </Box>

                            <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                    <input type="checkbox" id="sliderLoop" checked={sliderLoop} onChange={(e) => setSliderLoop(e.target.checked)} style={{ margin: 0 }} />
                                    <label htmlFor="sliderLoop" style={{ fontSize: '14px', fontWeight: 'normal' }}>Infinite Loop</label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">Continuously loop through slides</Text>
                            </Box>

                            <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                    <input type="checkbox" id="showNavigation" checked={showNavigation} onChange={(e) => setShowNavigation(e.target.checked)} style={{ margin: 0 }} />
                                    <label htmlFor="showNavigation" style={{ fontSize: '14px', fontWeight: 'normal' }}>Show Navigation</label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">Display next/previous buttons</Text>
                            </Box>
                        </InlineGrid>
                    </BlockStack>
                </Card>
            </InlineGrid>
        </Box>
    );
};

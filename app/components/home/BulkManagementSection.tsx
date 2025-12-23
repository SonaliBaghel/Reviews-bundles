import { useState } from 'react';
import {
    Card, Text, BlockStack, Box, Divider,
    InlineStack, Button, Banner, Thumbnail
} from "@shopify/polaris";
import { ExportIcon, ChevronUpIcon, ChevronDownIcon } from '@shopify/polaris-icons';

interface BulkManagementSectionProps {
    isExporting: boolean;
    isImporting: boolean;
    isDownloadingSample: boolean;
    handleExportCSV: () => void;
    csvFile: File | null;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveFile: () => void;
    handleImportCSV: () => void;
    handleDownloadSampleCSV: () => void;
}

export function BulkManagementSection({
    isExporting,
    isImporting,
    isDownloadingSample,
    handleExportCSV,
    csvFile,
    handleFileChange,
    handleRemoveFile,
    handleImportCSV,
    handleDownloadSampleCSV
}: BulkManagementSectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Card>
            <BlockStack gap="600">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingXl" fontWeight="bold">
                        Bulk Review Management
                    </Text>
                    <Button
                        variant="plain"
                        icon={collapsed ? ChevronDownIcon : ChevronUpIcon}
                        onClick={() => setCollapsed(!collapsed)}
                        accessibilityLabel={collapsed ? "Expand bulk management" : "Collapse bulk management"}
                    />
                </InlineStack>

                {!collapsed && (
                    <>
                        <Banner tone="info">
                            <BlockStack gap="200">
                                <Text as="p" variant="bodyLg">
                                    Export your reviews to CSV for backup or analysis, or import reviews from a CSV file.
                                    Download the sample template to see the required format.
                                </Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                    <strong>Important:</strong> When importing, reviews for existing products will be imported successfully.
                                    Reviews for non-existent products will be skipped with a warning message.
                                </Text>
                            </BlockStack>
                        </Banner>

                        <Divider />

                        <InlineStack gap="800" align="start" blockAlign="center">
                            <div style={{ flex: 1 }}>
                                <BlockStack gap="400">
                                    <Button
                                        variant="primary"
                                        onClick={handleExportCSV}
                                        disabled={isExporting}
                                        icon={ExportIcon}
                                        fullWidth
                                        size="large"
                                    >
                                        {isExporting ? "Exporting..." : "Download CSV"}
                                    </Button>
                                    <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                                        Export all reviews as CSV file
                                    </Text>
                                </BlockStack>
                            </div>

                            <div style={{ width: '1px', height: '100px', background: 'var(--p-color-border-secondary)' }} />

                            <div style={{ flex: 1 }}>
                                <BlockStack gap="400">
                                    {!csvFile ? (
                                        <Box width="100%">
                                            <input
                                                id="csv-file-input"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #c4cdd5',
                                                    borderRadius: '8px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    marginBottom: '8px'
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box width="100%">
                                            <Box
                                                background="bg-fill-success-secondary"
                                                borderRadius="300"
                                                padding="400"
                                            >
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <InlineStack gap="300" blockAlign="center">
                                                        <Box background="bg-fill-success" borderRadius="200" padding="200">
                                                            <Text as="span" variant="bodyLg" fontWeight="bold" tone="text-inverse">
                                                                ✓
                                                            </Text>
                                                        </Box>
                                                        <BlockStack gap="100">
                                                            <Text as="span" variant="bodyLg" fontWeight="bold">
                                                                {csvFile.name}
                                                            </Text>
                                                            <Text as="span" variant="bodySm" tone="subdued">
                                                                {(csvFile.size / 1024).toFixed(2)} KB
                                                            </Text>
                                                        </BlockStack>
                                                    </InlineStack>
                                                    <Button variant="tertiary" onClick={handleRemoveFile} tone="critical">Remove</Button>
                                                </InlineStack>
                                            </Box>
                                        </Box>
                                    )}

                                    <Button
                                        variant="primary"
                                        onClick={handleImportCSV}
                                        disabled={!csvFile || isImporting}
                                        fullWidth
                                        size="large"
                                    >
                                        {isImporting ? "Importing..." : "Upload & Import Reviews"}
                                    </Button>
                                </BlockStack>
                            </div>
                        </InlineStack>

                        <Divider />

                        <InlineStack align="center">
                            <Button
                                variant="tertiary"
                                onClick={handleDownloadSampleCSV}
                                disabled={isDownloadingSample}
                                loading={isDownloadingSample}
                            >
                                Download Sample CSV Template
                            </Button>
                        </InlineStack>
                    </>
                )}
            </BlockStack>
        </Card>
    );
}

import { useState } from 'react';
import { Card, Text, BlockStack, InlineGrid, Box, Icon, InlineStack, Button } from "@shopify/polaris";
import { StarFilledIcon, ChatIcon, ChevronUpIcon, ChevronDownIcon } from "@shopify/polaris-icons";

interface StatsCardProps {
  totalReviews: number;
  averageRating: string | number;
}

export default function StatsCard({ totalReviews, averageRating }: StatsCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const stats = [
    { value: averageRating, label: "Average Rating", icon: StarFilledIcon, valueTone: "success", iconColor: "success" },
    { value: totalReviews, label: "Total Reviews", icon: ChatIcon, valueTone: "subdued", iconColor: "interactive" },
  ];

  return (
    <Card background="bg-surface-secondary">
      <BlockStack gap="500">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h1" variant="headingLg" >
            Review Summary
          </Text>
          <Button
            variant="plain"
            icon={collapsed ? ChevronDownIcon : ChevronUpIcon}
            onClick={() => setCollapsed(!collapsed)}
            accessibilityLabel={collapsed ? "Expand summary" : "Collapse summary"}
          />
        </InlineStack>

        {!collapsed && (
          <InlineGrid columns={2} gap="600">
            {stats.map((stat, index) => (
              <Box
                key={index}
                padding="600"
                background="bg-surface"
                borderRadius="300"
                shadow="400"
              >
                <BlockStack gap="300" align="center">
                  <Box
                    background="bg-fill-secondary"
                    borderRadius="full"
                    padding="300"
                  >
                    <Icon source={stat.icon} tone={stat.iconColor as 'base' | 'critical' | 'interactive' | 'magic' | 'primary' | 'success' | 'warning'} />
                  </Box>
                  <Text as="p" variant="heading2xl" fontWeight="semibold" alignment="center" tone={stat.valueTone as 'critical' | 'subdued' | 'success' | 'text-inverse'}>
                    {stat.value}
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    {stat.label}
                  </Text>
                </BlockStack>
              </Box>
            ))}
          </InlineGrid>
        )}
      </BlockStack>
    </Card>
  );
}
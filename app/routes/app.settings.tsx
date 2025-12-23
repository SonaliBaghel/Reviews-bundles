import {
  Page, Layout, BlockStack, Button, InlineStack,
  Toast, Box, Divider
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { json } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import db from "../db.server";
import { APP_CONFIG } from '../app.config';

import { TextStylingSection } from '../components/settings/TextStylingSection';
import { LayoutDisplaySection } from '../components/settings/LayoutDisplaySection';
import { SliderBehaviorSection } from '../components/settings/SliderBehaviorSection';
import { ColorSchemeSection } from '../components/settings/ColorSchemeSection';
import { PreviewSection } from '../components/settings/PreviewSection';
import { useSettingsForm } from '../hooks/useSettingsForm';
import {
  fontFamilyOptions,
  fontWeightOptions,
  fontStyleOptions,
  textTransformOptions,
  displayTypeOptions,
  directionOptions,
  effectOptions
} from '../constants/settingsOptions';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    let appSettings = await (db.appSettings as any).findUnique({
      where: { shop }
    });

    if (!appSettings) {
      appSettings = await (db.appSettings as any).create({
        data: {
          shop,
          starColor: APP_CONFIG.SETTINGS_DEFAULTS.STAR_COLOR,
          backgroundColor: APP_CONFIG.SETTINGS_DEFAULTS.BACKGROUND_COLOR,
          headingColor: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_COLOR,
          reviewCardColor: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_CARD_COLOR,
          reviewsPerSlide: APP_CONFIG.SETTINGS_DEFAULTS.REVIEWS_PER_SLIDE,
          displayType: APP_CONFIG.SETTINGS_DEFAULTS.DISPLAY_TYPE,
          gridRows: APP_CONFIG.SETTINGS_DEFAULTS.GRID_ROWS,
          gridColumns: APP_CONFIG.SETTINGS_DEFAULTS.GRID_COLUMNS,
          sliderAutoplay: APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_AUTOPLAY,
          sliderSpeed: APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_SPEED,
          sliderLoop: APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_LOOP,
          sliderDirection: APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_DIRECTION,
          spaceBetween: APP_CONFIG.SETTINGS_DEFAULTS.SPACE_BETWEEN,
          showNavigation: APP_CONFIG.SETTINGS_DEFAULTS.SHOW_NAVIGATION,
          sliderEffect: APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_EFFECT,
          sectionBorderRadius: APP_CONFIG.SETTINGS_DEFAULTS.SECTION_BORDER_RADIUS,

          headingText: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT,
          headingFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_FAMILY,
          headingFontSize: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_SIZE,
          headingFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_WEIGHT,
          headingFontStyle: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_STYLE,
          headingTextTransform: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_TRANSFORM,
          headingLetterSpacing: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LETTER_SPACING,
          headingLineHeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LINE_HEIGHT,
          headingTextShadow: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_SHADOW,

          ratingLabelText: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_TEXT,
          ratingLabelFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_FAMILY,
          ratingLabelFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_SIZE,
          ratingLabelFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_WEIGHT,
          ratingLabelColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_COLOR,

          ratingValueFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_FAMILY,
          ratingValueFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_SIZE,
          ratingValueFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_WEIGHT,
          ratingValueColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_COLOR,

          reviewCountPrefix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_PREFIX,
          reviewCountSuffix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_SUFFIX,
          reviewCountFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_FAMILY,
          reviewCountFontSize: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_SIZE,
          reviewCountFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_WEIGHT,
          reviewCountColor: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_COLOR,
        }
      });
    }

    return json({
      ...appSettings,
      gridRows: appSettings.gridRows || APP_CONFIG.SETTINGS_DEFAULTS.GRID_ROWS,
      gridColumns: appSettings.gridColumns || APP_CONFIG.SETTINGS_DEFAULTS.GRID_COLUMNS,
    });
  } catch (error) {
    return json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const settingsData = {
    starColor: String(formData.get('starColor')),
    backgroundColor: String(formData.get('backgroundColor')),
    headingColor: String(formData.get('headingColor')),
    reviewCardColor: String(formData.get('reviewCardColor')),
    reviewsPerSlide: Number(formData.get('reviewsPerSlide')),
    displayType: String(formData.get('displayType')),
    gridRows: Number(formData.get('gridRows')),
    gridColumns: Number(formData.get('gridColumns')),
    sliderAutoplay: formData.get('sliderAutoplay') === 'true',
    sliderSpeed: Number(formData.get('sliderSpeed')),
    sliderLoop: formData.get('sliderLoop') === 'true',
    sliderDirection: String(formData.get('sliderDirection')),
    spaceBetween: Number(formData.get('spaceBetween')),
    showNavigation: formData.get('showNavigation') === 'true',
    sliderEffect: String(formData.get('sliderEffect')),
    sectionBorderRadius: Number(formData.get('sectionBorderRadius')),

    headingText: String(formData.get('headingText')),
    headingFontFamily: String(formData.get('headingFontFamily')),
    headingFontSize: Number(formData.get('headingFontSize')),
    headingFontWeight: String(formData.get('headingFontWeight')),
    headingFontStyle: String(formData.get('headingFontStyle')),
    headingTextTransform: String(formData.get('headingTextTransform')),
    headingLetterSpacing: Number(formData.get('headingLetterSpacing')),
    headingLineHeight: Number(formData.get('headingLineHeight')),
    headingTextShadow: String(formData.get('headingTextShadow')),

    ratingLabelText: String(formData.get('ratingLabelText')),
    ratingLabelFontFamily: String(formData.get('ratingLabelFontFamily')),
    ratingLabelFontSize: Number(formData.get('ratingLabelFontSize')),
    ratingLabelFontWeight: String(formData.get('ratingLabelFontWeight')),
    ratingLabelColor: String(formData.get('ratingLabelColor')),

    ratingValueFontFamily: String(formData.get('ratingValueFontFamily')),
    ratingValueFontSize: Number(formData.get('ratingValueFontSize')),
    ratingValueFontWeight: String(formData.get('ratingValueFontWeight')),
    ratingValueColor: String(formData.get('ratingValueColor')),

    reviewCountPrefix: String(formData.get('reviewCountPrefix')),
    reviewCountSuffix: String(formData.get('reviewCountSuffix')),
    reviewCountFontFamily: String(formData.get('reviewCountFontFamily')),
    reviewCountFontSize: Number(formData.get('reviewCountFontSize')),
    reviewCountFontWeight: String(formData.get('reviewCountFontWeight')),
    reviewCountColor: String(formData.get('reviewCountColor')),
  };

  try {
    const settings = await (db.appSettings as any).findUnique({
      where: { shop }
    });

    if (settings) {
      await (db.appSettings as any).update({
        where: { shop },
        data: settingsData,
      });
    } else {
      await (db.appSettings as any).create({
        data: {
          ...settingsData,
          shop
        },
      });
    }

    return json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    return json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}

export default function SettingsPage() {
  const {
    starColor, backgroundColor, headingColor, reviewCardColor, reviewsPerSlide, displayType,
    gridRows, gridColumns, sectionBorderRadius, sliderAutoplay, sliderSpeed, sliderLoop,
    sliderDirection, spaceBetween, showNavigation, sliderEffect, headingText, headingFontFamily,
    headingFontSize, headingFontWeight, headingFontStyle, headingTextTransform, headingLetterSpacing,
    headingLineHeight, headingTextShadow, ratingLabelText, ratingLabelFontFamily, ratingLabelFontSize,
    ratingLabelFontWeight, ratingLabelColor, ratingValueFontFamily, ratingValueFontSize,
    ratingValueFontWeight, ratingValueColor, reviewCountPrefix, reviewCountSuffix,
    reviewCountFontFamily, reviewCountFontSize, reviewCountFontWeight, reviewCountColor,
    activeToast, toastMessage, toastError, setActiveToast,
    handleStarColorChange, handleBackgroundColorChange, handleHeadingColorChange, handleReviewCardColorChange,
    handleReviewsPerSlideChange, handleGridRowsChange, handleGridColumnsChange, handleSectionBorderRadiusChange,
    handleSliderSpeedChange, handleSpaceBetweenChange, handleHeadingFontSizeChange, handleHeadingLetterSpacingChange,
    handleHeadingLineHeightChange, handleRatingLabelFontSizeChange, handleRatingValueFontSizeChange, handleReviewCountFontSizeChange,
    handleRatingLabelColorChange, handleRatingValueColorChange, handleReviewCountColorChange,
    handleSubmit, isLoading,
    setHeadingText, setHeadingFontFamily, setHeadingFontWeight, setHeadingFontStyle,
    setHeadingTextTransform, setHeadingTextShadow, setRatingLabelText, setRatingLabelFontFamily,
    setRatingLabelFontWeight, setRatingValueFontFamily, setRatingValueFontWeight,
    setReviewCountPrefix, setReviewCountSuffix, setReviewCountFontFamily, setReviewCountFontWeight,
    setDisplayType, setSliderEffect, setSliderDirection, setSliderAutoplay, setSliderLoop, setShowNavigation
  } = useSettingsForm();

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setActiveToast(false)} />
  ) : null;

  return (
    <Page fullWidth>
      <TitleBar title="Review Display Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <TextStylingSection
                headingText={headingText}
                setHeadingText={setHeadingText}
                headingFontFamily={headingFontFamily}
                setHeadingFontFamily={setHeadingFontFamily}
                headingFontSize={headingFontSize}
                handleHeadingFontSizeChange={handleHeadingFontSizeChange}
                headingFontWeight={headingFontWeight}
                setHeadingFontWeight={setHeadingFontWeight}
                headingFontStyle={headingFontStyle}
                setHeadingFontStyle={setHeadingFontStyle}
                headingTextTransform={headingTextTransform}
                setHeadingTextTransform={setHeadingTextTransform}
                headingLetterSpacing={headingLetterSpacing}
                handleHeadingLetterSpacingChange={handleHeadingLetterSpacingChange}
                headingLineHeight={headingLineHeight}
                handleHeadingLineHeightChange={handleHeadingLineHeightChange}
                headingTextShadow={headingTextShadow}
                setHeadingTextShadow={setHeadingTextShadow}
                ratingLabelText={ratingLabelText}
                setRatingLabelText={setRatingLabelText}
                ratingLabelFontFamily={ratingLabelFontFamily}
                setRatingLabelFontFamily={setRatingLabelFontFamily}
                ratingLabelFontSize={ratingLabelFontSize}
                handleRatingLabelFontSizeChange={handleRatingLabelFontSizeChange}
                ratingLabelFontWeight={ratingLabelFontWeight}
                setRatingLabelFontWeight={setRatingLabelFontWeight}
                ratingLabelColor={ratingLabelColor}
                handleRatingLabelColorChange={handleRatingLabelColorChange}
                ratingValueFontFamily={ratingValueFontFamily}
                setRatingValueFontFamily={setRatingValueFontFamily}
                ratingValueFontSize={ratingValueFontSize}
                handleRatingValueFontSizeChange={handleRatingValueFontSizeChange}
                ratingValueFontWeight={ratingValueFontWeight}
                setRatingValueFontWeight={setRatingValueFontWeight}
                ratingValueColor={ratingValueColor}
                handleRatingValueColorChange={handleRatingValueColorChange}
                reviewCountPrefix={reviewCountPrefix}
                setReviewCountPrefix={setReviewCountPrefix}
                reviewCountSuffix={reviewCountSuffix}
                setReviewCountSuffix={setReviewCountSuffix}
                reviewCountFontFamily={reviewCountFontFamily}
                setReviewCountFontFamily={setReviewCountFontFamily}
                reviewCountFontSize={reviewCountFontSize}
                handleReviewCountFontSizeChange={handleReviewCountFontSizeChange}
                reviewCountFontWeight={reviewCountFontWeight}
                setReviewCountFontWeight={setReviewCountFontWeight}
                reviewCountColor={reviewCountColor}
                handleReviewCountColorChange={handleReviewCountColorChange}
                fontFamilyOptions={fontFamilyOptions}
                fontWeightOptions={fontWeightOptions}
                fontStyleOptions={fontStyleOptions}
                textTransformOptions={textTransformOptions}
                headingColor={headingColor}
              />

              <Divider />

              <LayoutDisplaySection
                displayType={displayType}
                setDisplayType={setDisplayType}
                displayTypeOptions={displayTypeOptions}
                reviewsPerSlide={reviewsPerSlide}
                handleReviewsPerSlideChange={handleReviewsPerSlideChange}
                gridRows={gridRows}
                handleGridRowsChange={handleGridRowsChange}
                gridColumns={gridColumns}
                handleGridColumnsChange={handleGridColumnsChange}
                sectionBorderRadius={sectionBorderRadius}
                handleSectionBorderRadiusChange={handleSectionBorderRadiusChange}
              />

              {displayType === 'slider' && (
                <>
                  <Divider />
                  <SliderBehaviorSection
                    sliderEffect={sliderEffect}
                    setSliderEffect={setSliderEffect}
                    effectOptions={effectOptions}
                    sliderDirection={sliderDirection}
                    setSliderDirection={setSliderDirection}
                    directionOptions={directionOptions}
                    sliderSpeed={sliderSpeed}
                    handleSliderSpeedChange={handleSliderSpeedChange}
                    spaceBetween={spaceBetween}
                    handleSpaceBetweenChange={handleSpaceBetweenChange}
                    sliderAutoplay={sliderAutoplay}
                    setSliderAutoplay={setSliderAutoplay}
                    sliderLoop={sliderLoop}
                    setSliderLoop={setSliderLoop}
                    showNavigation={showNavigation}
                    setShowNavigation={setShowNavigation}
                  />
                </>
              )}

              <Divider />

              <ColorSchemeSection
                starColor={starColor}
                handleStarColorChange={handleStarColorChange}
                backgroundColor={backgroundColor}
                handleBackgroundColorChange={handleBackgroundColorChange}
                headingColor={headingColor}
                handleHeadingColorChange={handleHeadingColorChange}
                reviewCardColor={reviewCardColor}
                handleReviewCardColorChange={handleReviewCardColorChange}
              />

              <Divider />

              <PreviewSection
                headingText={headingText}
                headingFontFamily={headingFontFamily}
                headingFontSize={headingFontSize}
                headingFontWeight={headingFontWeight}
                headingFontStyle={headingFontStyle}
                headingTextTransform={headingTextTransform}
                headingLetterSpacing={headingLetterSpacing}
                headingLineHeight={headingLineHeight}
                headingTextShadow={headingTextShadow}
                headingColor={headingColor}
                ratingLabelText={ratingLabelText}
                ratingLabelFontFamily={ratingLabelFontFamily}
                ratingLabelFontSize={ratingLabelFontSize}
                ratingLabelFontWeight={ratingLabelFontWeight}
                ratingLabelColor={ratingLabelColor}
                ratingValueFontFamily={ratingValueFontFamily}
                ratingValueFontSize={ratingValueFontSize}
                ratingValueFontWeight={ratingValueFontWeight}
                ratingValueColor={ratingValueColor}
                reviewCountPrefix={reviewCountPrefix}
                reviewCountSuffix={reviewCountSuffix}
                reviewCountFontFamily={reviewCountFontFamily}
                reviewCountFontSize={reviewCountFontSize}
                reviewCountFontWeight={reviewCountFontWeight}
                reviewCountColor={reviewCountColor}
                starColor={starColor}
                backgroundColor={backgroundColor}
                reviewCardColor={reviewCardColor}
                sectionBorderRadius={sectionBorderRadius}
              />

              <Box paddingBlockEnd="500">
                <InlineStack align="end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    size="large"
                  >
                    Save Settings
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
      {toastMarkup}
    </Page>
  );
}
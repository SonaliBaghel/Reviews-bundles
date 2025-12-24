// app/routes/api.settings.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import db from '../db.server';
import { APP_CONFIG } from '../app.config';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      console.error("Missing shop parameter in api.settings");
      return json({ error: "Missing shop parameter" }, { status: 400 });
    }

    const appSettings = await (db.appSettings as any).findUnique({
      where: { shop }
    });

    if (!appSettings) {
      console.log(`No settings found for shop: ${shop}, returning defaults`);
      return json({
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

        // Heading Text Defaults
        headingText: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT,
        headingFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_FAMILY,
        headingFontSize: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_SIZE,
        headingFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_WEIGHT,
        headingFontStyle: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_STYLE,
        headingTextTransform: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_TRANSFORM,
        headingLetterSpacing: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LETTER_SPACING,
        headingLineHeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LINE_HEIGHT,
        headingTextShadow: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_SHADOW,

        // Rating Summary Defaults
        ratingLabelText: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_TEXT,
        ratingLabelFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_FAMILY,
        ratingLabelFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_SIZE,
        ratingLabelFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_WEIGHT,
        ratingLabelColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_COLOR,

        // Average Rating Defaults
        ratingValueFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_FAMILY,
        ratingValueFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_SIZE,
        ratingValueFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_WEIGHT,
        ratingValueColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_COLOR,

        // Review Count Defaults
        reviewCountPrefix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_PREFIX,
        reviewCountSuffix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_SUFFIX,
        reviewCountFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_FAMILY,
        reviewCountFontSize: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_SIZE,
        reviewCountFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_WEIGHT,
        reviewCountColor: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_COLOR
      });
    }

    return json({
      starColor: appSettings.starColor,
      backgroundColor: appSettings.backgroundColor,
      headingColor: appSettings.headingColor,
      reviewCardColor: appSettings.reviewCardColor,
      reviewsPerSlide: appSettings.reviewsPerSlide,
      displayType: appSettings.displayType,
      gridRows: appSettings.gridRows || APP_CONFIG.SETTINGS_DEFAULTS.GRID_ROWS,
      gridColumns: appSettings.gridColumns || APP_CONFIG.SETTINGS_DEFAULTS.GRID_COLUMNS,
      sliderAutoplay: appSettings.sliderAutoplay ?? APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_AUTOPLAY,
      sliderSpeed: appSettings.sliderSpeed ?? APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_SPEED,
      sliderLoop: appSettings.sliderLoop ?? APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_LOOP,
      sliderDirection: appSettings.sliderDirection ?? APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_DIRECTION,
      spaceBetween: appSettings.spaceBetween ?? APP_CONFIG.SETTINGS_DEFAULTS.SPACE_BETWEEN,
      showNavigation: appSettings.showNavigation ?? APP_CONFIG.SETTINGS_DEFAULTS.SHOW_NAVIGATION,
      sliderEffect: appSettings.sliderEffect ?? APP_CONFIG.SETTINGS_DEFAULTS.SLIDER_EFFECT,
      sectionBorderRadius: appSettings.sectionBorderRadius ?? APP_CONFIG.SETTINGS_DEFAULTS.SECTION_BORDER_RADIUS,

      // Heading Text
      headingText: appSettings.headingText,
      headingFontFamily: appSettings.headingFontFamily,
      headingFontSize: appSettings.headingFontSize,
      headingFontWeight: appSettings.headingFontWeight,
      headingFontStyle: appSettings.headingFontStyle,
      headingTextTransform: appSettings.headingTextTransform,
      headingLetterSpacing: appSettings.headingLetterSpacing,
      headingLineHeight: appSettings.headingLineHeight,
      headingTextShadow: appSettings.headingTextShadow,

      // Rating Summary
      ratingLabelText: appSettings.ratingLabelText,
      ratingLabelFontFamily: appSettings.ratingLabelFontFamily,
      ratingLabelFontSize: appSettings.ratingLabelFontSize,
      ratingLabelFontWeight: appSettings.ratingLabelFontWeight,
      ratingLabelColor: appSettings.ratingLabelColor,

      // Average Rating
      ratingValueFontFamily: appSettings.ratingValueFontFamily,
      ratingValueFontSize: appSettings.ratingValueFontSize,
      ratingValueFontWeight: appSettings.ratingValueFontWeight,
      ratingValueColor: appSettings.ratingValueColor,

      // Review Count
      reviewCountPrefix: appSettings.reviewCountPrefix,
      reviewCountSuffix: appSettings.reviewCountSuffix,
      reviewCountFontFamily: appSettings.reviewCountFontFamily,
      reviewCountFontSize: appSettings.reviewCountFontSize,
      reviewCountFontWeight: appSettings.reviewCountFontWeight,
      reviewCountColor: appSettings.reviewCountColor
    });

  } catch (error) {
    console.error("Error fetching app settings for theme:", error);
    return json({
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

      // Heading Text Fallbacks
      headingText: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT,
      headingFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_FAMILY,
      headingFontSize: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_SIZE,
      headingFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_WEIGHT,
      headingFontStyle: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_FONT_STYLE,
      headingTextTransform: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_TRANSFORM,
      headingLetterSpacing: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LETTER_SPACING,
      headingLineHeight: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_LINE_HEIGHT,
      headingTextShadow: APP_CONFIG.SETTINGS_DEFAULTS.HEADING_TEXT_SHADOW,

      // Rating Summary Fallbacks
      ratingLabelText: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_TEXT,
      ratingLabelFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_FAMILY,
      ratingLabelFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_SIZE,
      ratingLabelFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_FONT_WEIGHT,
      ratingLabelColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_LABEL_COLOR,

      // Average Rating Fallbacks
      ratingValueFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_FAMILY,
      ratingValueFontSize: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_SIZE,
      ratingValueFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_FONT_WEIGHT,
      ratingValueColor: APP_CONFIG.SETTINGS_DEFAULTS.RATING_VALUE_COLOR,

      // Review Count Fallbacks
      reviewCountPrefix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_PREFIX,
      reviewCountSuffix: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_SUFFIX,
      reviewCountFontFamily: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_FAMILY,
      reviewCountFontSize: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_SIZE,
      reviewCountFontWeight: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_FONT_WEIGHT,
      reviewCountColor: APP_CONFIG.SETTINGS_DEFAULTS.REVIEW_COUNT_COLOR
    }, { status: 500 });
  }
}
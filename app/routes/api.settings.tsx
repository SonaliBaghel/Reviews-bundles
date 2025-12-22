// app/routes/api.settings.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import db from '../db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const appSettings = await db.appSettings.findFirst();

    if (!appSettings) {
      return json({
        starColor: '#FFD700',
        backgroundColor: '#F9F9F9',
        headingColor: '#222222',
        reviewCardColor: '#FFFFFF',
        reviewsPerSlide: 3,
        displayType: 'slider',
        gridRows: 2,
        gridColumns: 2,
        sliderAutoplay: true,
        sliderSpeed: 3000,
        sliderLoop: true,
        sliderDirection: 'horizontal',
        spaceBetween: 20,
        showNavigation: true,
        sliderEffect: 'slide',
        sectionBorderRadius: 12,
        
        // Heading Text Defaults
        headingText: "CUSTOMER TESTIMONIALS",
        headingFontFamily: "inherit",
        headingFontSize: 40,
        headingFontWeight: "bold",
        headingFontStyle: "normal",
        headingTextTransform: "uppercase",
        headingLetterSpacing: 0,
        headingLineHeight: 1.2,
        headingTextShadow: "none",
        
        // Rating Summary Defaults
        ratingLabelText: "Excellent",
        ratingLabelFontFamily: "inherit", 
        ratingLabelFontSize: 18,
        ratingLabelFontWeight: "600",
        ratingLabelColor: "#555555",
        
        // Average Rating Defaults
        ratingValueFontFamily: "inherit",
        ratingValueFontSize: 18,
        ratingValueFontWeight: "600",
        ratingValueColor: "#555555",
        
        // Review Count Defaults
        reviewCountPrefix: "Based on",
        reviewCountSuffix: "reviews",
        reviewCountFontFamily: "inherit",
        reviewCountFontSize: 16,
        reviewCountFontWeight: "normal",
        reviewCountColor: "#777777"
      });
    }

    return json({
      starColor: appSettings.starColor,
      backgroundColor: appSettings.backgroundColor,
      headingColor: appSettings.headingColor,
      reviewCardColor: appSettings.reviewCardColor,
      reviewsPerSlide: appSettings.reviewsPerSlide,
      displayType: appSettings.displayType,
      gridRows: appSettings.gridRows || 2,
      gridColumns: appSettings.gridColumns || 2,
      sliderAutoplay: appSettings.sliderAutoplay ?? true,
      sliderSpeed: appSettings.sliderSpeed ?? 3000,
      sliderLoop: appSettings.sliderLoop ?? true,
      sliderDirection: appSettings.sliderDirection ?? 'horizontal',
      spaceBetween: appSettings.spaceBetween ?? 20,
      showNavigation: appSettings.showNavigation ?? true,
      sliderEffect: appSettings.sliderEffect ?? 'slide',
      sectionBorderRadius: appSettings.sectionBorderRadius ?? 12,
      
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
      starColor: '#FFD700',
      backgroundColor: '#F9F9F9',
      headingColor: '#222222',
      reviewCardColor: '#FFFFFF',
      reviewsPerSlide: 3,
      displayType: 'slider',
      gridRows: 2,
      gridColumns: 2,
      sliderAutoplay: true,
      sliderSpeed: 3000,
      sliderLoop: true,
      sliderDirection: 'horizontal',
      spaceBetween: 20,
      showNavigation: true,
      sliderEffect: 'slide',
      sectionBorderRadius: 12,
      
      // Heading Text Fallbacks
      headingText: "CUSTOMER TESTIMONIALS",
      headingFontFamily: "inherit",
      headingFontSize: 40,
      headingFontWeight: "bold",
      headingFontStyle: "normal",
      headingTextTransform: "uppercase",
      headingLetterSpacing: 0,
      headingLineHeight: 1.2,
      headingTextShadow: "none",
      
      // Rating Summary Fallbacks
      ratingLabelText: "Excellent",
      ratingLabelFontFamily: "inherit", 
      ratingLabelFontSize: 18,
      ratingLabelFontWeight: "600",
      ratingLabelColor: "#555555",
      
      // Average Rating Fallbacks
      ratingValueFontFamily: "inherit",
      ratingValueFontSize: 18,
      ratingValueFontWeight: "600",
      ratingValueColor: "#555555",
      
      // Review Count Fallbacks
      reviewCountPrefix: "Based on",
      reviewCountSuffix: "reviews",
      reviewCountFontFamily: "inherit",
      reviewCountFontSize: 16,
      reviewCountFontWeight: "normal",
      reviewCountColor: "#777777"
    }, { status: 500 });
  }
}
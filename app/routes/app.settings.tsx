// app/routes/app.settings.tsx
import { useState, useCallback, useEffect } from 'react';
import { 
  Page, Layout, Card, Text, BlockStack, Button, InlineStack, 
  Toast, ColorPicker, hsbToRgb, rgbToHex, TextField, 
  Select, Box, Divider, InlineGrid, Badge
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit, useNavigation, json } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import db from "../db.server";

interface LoaderData {
  starColor: string;
  backgroundColor: string;
  headingColor: string;
  reviewCardColor: string;
  reviewsPerSlide: number;
  displayType: string;
  gridRows?: number;
  gridColumns?: number;
  sliderAutoplay: boolean;
  sliderSpeed: number;
  sliderLoop: boolean;
  sliderDirection: string;
  spaceBetween: number;
  showNavigation: boolean;
  sliderEffect: string;
  sectionBorderRadius: number;
  
  // Heading Text Properties
  headingText: string;
  headingFontFamily: string;
  headingFontSize: number;
  headingFontWeight: string;
  headingFontStyle: string;
  headingTextTransform: string;
  headingLetterSpacing: number;
  headingLineHeight: number;
  headingTextShadow: string;
  
  // Rating Summary Properties
  ratingLabelText: string;
  ratingLabelFontFamily: string;
  ratingLabelFontSize: number;
  ratingLabelFontWeight: string;
  ratingLabelColor: string;
  
  // Average Rating Properties
  ratingValueFontFamily: string;
  ratingValueFontSize: number;
  ratingValueFontWeight: string;
  ratingValueColor: string;
  
  // Review Count Properties
  reviewCountPrefix: string;
  reviewCountSuffix: string;
  reviewCountFontFamily: string;
  reviewCountFontSize: number;
  reviewCountFontWeight: string;
  reviewCountColor: string;
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

interface HSBColor {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;
}

const hexToHsb = (hex: string | null | undefined): HSBColor => {
  if (!hex || typeof hex !== 'string' || !/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    return { hue: 0, saturation: 0, brightness: 1, alpha: 1 };
  }
  const parsedHex = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(parsedHex.slice(1, 3), 16) / 255;
  const g = parseInt(parsedHex.slice(3, 5), 16) / 255;
  const b = parseInt(parsedHex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta === 0) hue = 0;
  else if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return { hue, saturation, brightness, alpha: 1 };
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  try {
    let appSettings = await db.appSettings.findFirst();

    if (!appSettings) {
      appSettings = await db.appSettings.create({
        data: {
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
          headingFontFamily: "theme",
          headingFontSize: 40,
          headingFontWeight: "bold",
          headingFontStyle: "normal",
          headingTextTransform: "uppercase",
          headingLetterSpacing: 0,
          headingLineHeight: 1.2,
          headingTextShadow: "none",
          
          // Rating Summary Defaults
          ratingLabelText: "Excellent",
          ratingLabelFontFamily: "theme",
          ratingLabelFontSize: 18,
          ratingLabelFontWeight: "600",
          ratingLabelColor: "#555555",
          
          // Average Rating Defaults
          ratingValueFontFamily: "theme",
          ratingValueFontSize: 18,
          ratingValueFontWeight: "600",
          ratingValueColor: "#555555",
          
          // Review Count Defaults
          reviewCountPrefix: "Based on",
          reviewCountSuffix: "reviews",
          reviewCountFontFamily: "theme",
          reviewCountFontSize: 16,
          reviewCountFontWeight: "normal",
          reviewCountColor: "#777777",
        }
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
      reviewCountColor: appSettings.reviewCountColor,
    });

  } catch (error) {
    console.error("Error fetching or creating app settings:", error);
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
      headingFontFamily: "theme",
      headingFontSize: 40,
      headingFontWeight: "bold",
      headingFontStyle: "normal",
      headingTextTransform: "uppercase",
      headingLetterSpacing: 0,
      headingLineHeight: 1.2,
      headingTextShadow: "none",
      
      // Rating Summary Fallbacks
      ratingLabelText: "Excellent",
      ratingLabelFontFamily: "theme",
      ratingLabelFontSize: 18,
      ratingLabelFontWeight: "600",
      ratingLabelColor: "#555555",
      
      // Average Rating Fallbacks
      ratingValueFontFamily: "theme",
      ratingValueFontSize: 18,
      ratingValueFontWeight: "600",
      ratingValueColor: "#555555",
      
      // Review Count Fallbacks
      reviewCountPrefix: "Based on",
      reviewCountSuffix: "reviews",
      reviewCountFontFamily: "theme",
      reviewCountFontSize: 16,
      reviewCountFontWeight: "normal",
      reviewCountColor: "#777777",
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const formData = await request.formData();

  // Existing settings
  const starColor = formData.get('starColor') as string;
  const backgroundColor = formData.get('backgroundColor') as string;
  const headingColor = formData.get('headingColor') as string;
  const reviewCardColor = formData.get('reviewCardColor') as string;
  const reviewsPerSlideRaw = formData.get('reviewsPerSlide') as string;
  const displayType = formData.get('displayType') as string;
  const gridRowsRaw = formData.get('gridRows') as string;
  const gridColumnsRaw = formData.get('gridColumns') as string;
  const sectionBorderRadiusRaw = formData.get('sectionBorderRadius') as string;
  
  const sliderAutoplay = formData.get('sliderAutoplay') === 'true';
  const sliderSpeedRaw = formData.get('sliderSpeed') as string;
  const sliderLoop = formData.get('sliderLoop') === 'true';
  const sliderDirection = formData.get('sliderDirection') as string;
  const spaceBetweenRaw = formData.get('spaceBetween') as string;
  const showNavigation = formData.get('showNavigation') === 'true';
  const sliderEffect = formData.get('sliderEffect') as string;

  // New text styling settings
  const headingText = formData.get('headingText') as string;
  const headingFontFamily = formData.get('headingFontFamily') as string;
  const headingFontSizeRaw = formData.get('headingFontSize') as string;
  const headingFontWeight = formData.get('headingFontWeight') as string;
  const headingFontStyle = formData.get('headingFontStyle') as string;
  const headingTextTransform = formData.get('headingTextTransform') as string;
  const headingLetterSpacingRaw = formData.get('headingLetterSpacing') as string;
  const headingLineHeightRaw = formData.get('headingLineHeight') as string;
  const headingTextShadow = formData.get('headingTextShadow') as string;
  
  const ratingLabelText = formData.get('ratingLabelText') as string;
  const ratingLabelFontFamily = formData.get('ratingLabelFontFamily') as string;
  const ratingLabelFontSizeRaw = formData.get('ratingLabelFontSize') as string;
  const ratingLabelFontWeight = formData.get('ratingLabelFontWeight') as string;
  const ratingLabelColor = formData.get('ratingLabelColor') as string;
  
  const ratingValueFontFamily = formData.get('ratingValueFontFamily') as string;
  const ratingValueFontSizeRaw = formData.get('ratingValueFontSize') as string;
  const ratingValueFontWeight = formData.get('ratingValueFontWeight') as string;
  const ratingValueColor = formData.get('ratingValueColor') as string;
  
  const reviewCountPrefix = formData.get('reviewCountPrefix') as string;
  const reviewCountSuffix = formData.get('reviewCountSuffix') as string;
  const reviewCountFontFamily = formData.get('reviewCountFontFamily') as string;
  const reviewCountFontSizeRaw = formData.get('reviewCountFontSize') as string;
  const reviewCountFontWeight = formData.get('reviewCountFontWeight') as string;
  const reviewCountColor = formData.get('reviewCountColor') as string;

  // Handle regular settings update
  let reviewsPerSlide: number = parseInt(reviewsPerSlideRaw, 10);
  if (isNaN(reviewsPerSlide) || reviewsPerSlide < 1 || reviewsPerSlide > 6) {
    reviewsPerSlide = 3;
  }

  // Handle grid settings
  let gridRows: number = parseInt(gridRowsRaw, 10);
  if (isNaN(gridRows) || gridRows < 1 || gridRows > 6) {
    gridRows = 2;
  }

  let gridColumns: number = parseInt(gridColumnsRaw, 10);
  if (isNaN(gridColumns) || gridColumns < 1 || gridColumns > 6) {
    gridColumns = 2;
  }

  // Handle section border radius
  let sectionBorderRadius: number = parseInt(sectionBorderRadiusRaw, 10);
  if (isNaN(sectionBorderRadius) || sectionBorderRadius < 0 || sectionBorderRadius > 50) {
    sectionBorderRadius = 12;
  }

  // Handle slider settings 
  let sliderSpeed: number = parseInt(sliderSpeedRaw, 10);
  if (isNaN(sliderSpeed) || sliderSpeed < 2000 || sliderSpeed > 12000) {
    sliderSpeed = 3000;
  }

  // slider speed is in increments of 1000
  sliderSpeed = Math.round(sliderSpeed / 1000) * 1000;

  let spaceBetween: number = parseInt(spaceBetweenRaw, 10);
  if (isNaN(spaceBetween) || spaceBetween < 0 || spaceBetween > 100) {
    spaceBetween = 20;
  }

  // Handle text styling settings
  let headingFontSize: number = parseInt(headingFontSizeRaw, 10);
  if (isNaN(headingFontSize) || headingFontSize < 10 || headingFontSize > 100) {
    headingFontSize = 40;
  }

  let headingLetterSpacing: number = parseInt(headingLetterSpacingRaw, 10);
  if (isNaN(headingLetterSpacing) || headingLetterSpacing < -10 || headingLetterSpacing > 50) {
    headingLetterSpacing = 0;
  }

  let headingLineHeight: number = parseFloat(headingLineHeightRaw);
  if (isNaN(headingLineHeight) || headingLineHeight < 0.5 || headingLineHeight > 3) {
    headingLineHeight = 1.2;
  }

  let ratingLabelFontSize: number = parseInt(ratingLabelFontSizeRaw, 10);
  if (isNaN(ratingLabelFontSize) || ratingLabelFontSize < 8 || ratingLabelFontSize > 40) {
    ratingLabelFontSize = 18;
  }

  let ratingValueFontSize: number = parseInt(ratingValueFontSizeRaw, 10);
  if (isNaN(ratingValueFontSize) || ratingValueFontSize < 8 || ratingValueFontSize > 40) {
    ratingValueFontSize = 18;
  }

  let reviewCountFontSize: number = parseInt(reviewCountFontSizeRaw, 10);
  if (isNaN(reviewCountFontSize) || reviewCountFontSize < 8 || reviewCountFontSize > 30) {
    reviewCountFontSize = 16;
  }

  try {
    let appSettings = await db.appSettings.findFirst();

    if (!appSettings) {
      appSettings = await db.appSettings.create({
        data: {
          starColor,
          backgroundColor,
          headingColor,
          reviewCardColor,
          reviewsPerSlide,
          displayType,
          gridRows,
          gridColumns,
          sectionBorderRadius,
          sliderAutoplay,
          sliderSpeed,
          sliderLoop,
          sliderDirection,
          spaceBetween,
          showNavigation,
          sliderEffect,
          
          // Text styling settings
          headingText,
          headingFontFamily,
          headingFontSize,
          headingFontWeight,
          headingFontStyle,
          headingTextTransform,
          headingLetterSpacing,
          headingLineHeight,
          headingTextShadow,
          
          ratingLabelText,
          ratingLabelFontFamily,
          ratingLabelFontSize,
          ratingLabelFontWeight,
          ratingLabelColor,
          
          ratingValueFontFamily,
          ratingValueFontSize,
          ratingValueFontWeight,
          ratingValueColor,
          
          reviewCountPrefix,
          reviewCountSuffix,
          reviewCountFontFamily,
          reviewCountFontSize,
          reviewCountFontWeight,
          reviewCountColor,
        }
      });
    } else {
      await db.appSettings.update({
        where: { id: appSettings.id },
        data: {
          starColor,
          backgroundColor,
          headingColor,
          reviewCardColor,
          reviewsPerSlide,
          displayType,
          gridRows,
          gridColumns,
          sectionBorderRadius,
          sliderAutoplay,
          sliderSpeed,
          sliderLoop,
          sliderDirection,
          spaceBetween,
          showNavigation,
          sliderEffect,
          
          // Text styling settings
          headingText,
          headingFontFamily,
          headingFontSize,
          headingFontWeight,
          headingFontStyle,
          headingTextTransform,
          headingLetterSpacing,
          headingLineHeight,
          headingTextShadow,
          
          ratingLabelText,
          ratingLabelFontFamily,
          ratingLabelFontSize,
          ratingLabelFontWeight,
          ratingLabelColor,
          
          ratingValueFontFamily,
          ratingValueFontSize,
          ratingValueFontWeight,
          ratingValueColor,
          
          reviewCountPrefix,
          reviewCountSuffix,
          reviewCountFontFamily,
          reviewCountFontSize,
          reviewCountFontWeight,
          reviewCountColor,
        }
      });
    }

    return json({ success: true, message: "Settings updated successfully! Your review display will now reflect these changes." });
  } catch (error: any) {
    console.error("Error saving app settings to database:", error);
    return json({ success: false, error: error.message || "Failed to save settings. Please try again." });
  }
}

export default function SettingsPage() {
  const { 
    starColor: initialStarColor = '#FFD700', 
    backgroundColor: initialBackgroundColor = '#F9F9F9', 
    headingColor: initialHeadingColor = '#222222', 
    reviewCardColor: initialReviewCardColor = '#FFFFFF', 
    reviewsPerSlide: initialReviewsPerSlide = 3,
    displayType: initialDisplayType = 'slider',
    gridRows: initialGridRows = 2,
    gridColumns: initialGridColumns = 2,
    sectionBorderRadius: initialSectionBorderRadius = 12,
    sliderAutoplay: initialSliderAutoplay = true,
    sliderSpeed: initialSliderSpeed = 3000,
    sliderLoop: initialSliderLoop = true,
    sliderDirection: initialSliderDirection = 'horizontal',
    spaceBetween: initialSpaceBetween = 20,
    showNavigation: initialShowNavigation = true,
    sliderEffect: initialSliderEffect = 'slide',
    
    // Text styling initial values
    headingText: initialHeadingText = "CUSTOMER TESTIMONIALS",
    headingFontFamily: initialHeadingFontFamily = "theme",
    headingFontSize: initialHeadingFontSize = 40,
    headingFontWeight: initialHeadingFontWeight = "bold",
    headingFontStyle: initialHeadingFontStyle = "normal",
    headingTextTransform: initialHeadingTextTransform = "uppercase",
    headingLetterSpacing: initialHeadingLetterSpacing = 0,
    headingLineHeight: initialHeadingLineHeight = 1.2,
    headingTextShadow: initialHeadingTextShadow = "none",
    
    ratingLabelText: initialRatingLabelText = "Excellent",
    ratingLabelFontFamily: initialRatingLabelFontFamily = "theme",
    ratingLabelFontSize: initialRatingLabelFontSize = 18,
    ratingLabelFontWeight: initialRatingLabelFontWeight = "600",
    ratingLabelColor: initialRatingLabelColor = "#555555",
    
    ratingValueFontFamily: initialRatingValueFontFamily = "theme",
    ratingValueFontSize: initialRatingValueFontSize = 18,
    ratingValueFontWeight: initialRatingValueFontWeight = "600",
    ratingValueColor: initialRatingValueColor = "#555555",
    
    reviewCountPrefix: initialReviewCountPrefix = "Based on",
    reviewCountSuffix: initialReviewCountSuffix = "reviews",
    reviewCountFontFamily: initialReviewCountFontFamily = "theme",
    reviewCountFontSize: initialReviewCountFontSize = 16,
    reviewCountFontWeight: initialReviewCountFontWeight = "normal",
    reviewCountColor: initialReviewCountColor = "#777777",
  } = useLoaderData<LoaderData>();
  
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const navigation = useNavigation();

  // Existing state variables
  const [starColor, setStarColor] = useState<HSBColor>(hexToHsb(initialStarColor));
  const [backgroundColor, setBackgroundColor] = useState<HSBColor>(hexToHsb(initialBackgroundColor));
  const [headingColor, setHeadingColor] = useState<HSBColor>(hexToHsb(initialHeadingColor));
  const [reviewCardColor, setReviewCardColor] = useState<HSBColor>(hexToHsb(initialReviewCardColor));
  const [reviewsPerSlide, setReviewsPerSlide] = useState<number>(initialReviewsPerSlide);
  const [displayType, setDisplayType] = useState<string>(initialDisplayType);
  const [gridRows, setGridRows] = useState<number>(initialGridRows);
  const [gridColumns, setGridColumns] = useState<number>(initialGridColumns);
  const [sectionBorderRadius, setSectionBorderRadius] = useState<number>(initialSectionBorderRadius);
  const [sliderAutoplay, setSliderAutoplay] = useState<boolean>(initialSliderAutoplay);
  const [sliderSpeed, setSliderSpeed] = useState<number>(initialSliderSpeed);
  const [sliderLoop, setSliderLoop] = useState<boolean>(initialSliderLoop);
  const [sliderDirection, setSliderDirection] = useState<string>(initialSliderDirection);
  const [spaceBetween, setSpaceBetween] = useState<number>(initialSpaceBetween);
  const [showNavigation, setShowNavigation] = useState<boolean>(initialShowNavigation);
  const [sliderEffect, setSliderEffect] = useState<string>(initialSliderEffect);

  // New text styling state variables
  const [headingText, setHeadingText] = useState<string>(initialHeadingText);
  const [headingFontFamily, setHeadingFontFamily] = useState<string>(initialHeadingFontFamily);
  const [headingFontSize, setHeadingFontSize] = useState<number>(initialHeadingFontSize);
  const [headingFontWeight, setHeadingFontWeight] = useState<string>(initialHeadingFontWeight);
  const [headingFontStyle, setHeadingFontStyle] = useState<string>(initialHeadingFontStyle);
  const [headingTextTransform, setHeadingTextTransform] = useState<string>(initialHeadingTextTransform);
  const [headingLetterSpacing, setHeadingLetterSpacing] = useState<number>(initialHeadingLetterSpacing);
  const [headingLineHeight, setHeadingLineHeight] = useState<number>(initialHeadingLineHeight);
  const [headingTextShadow, setHeadingTextShadow] = useState<string>(initialHeadingTextShadow);
  
  const [ratingLabelText, setRatingLabelText] = useState<string>(initialRatingLabelText);
  const [ratingLabelFontFamily, setRatingLabelFontFamily] = useState<string>(initialRatingLabelFontFamily);
  const [ratingLabelFontSize, setRatingLabelFontSize] = useState<number>(initialRatingLabelFontSize);
  const [ratingLabelFontWeight, setRatingLabelFontWeight] = useState<string>(initialRatingLabelFontWeight);
  const [ratingLabelColor, setRatingLabelColor] = useState<HSBColor>(hexToHsb(initialRatingLabelColor));
  
  const [ratingValueFontFamily, setRatingValueFontFamily] = useState<string>(initialRatingValueFontFamily);
  const [ratingValueFontSize, setRatingValueFontSize] = useState<number>(initialRatingValueFontSize);
  const [ratingValueFontWeight, setRatingValueFontWeight] = useState<string>(initialRatingValueFontWeight);
  const [ratingValueColor, setRatingValueColor] = useState<HSBColor>(hexToHsb(initialRatingValueColor));
  
  const [reviewCountPrefix, setReviewCountPrefix] = useState<string>(initialReviewCountPrefix);
  const [reviewCountSuffix, setReviewCountSuffix] = useState<string>(initialReviewCountSuffix);
  const [reviewCountFontFamily, setReviewCountFontFamily] = useState<string>(initialReviewCountFontFamily);
  const [reviewCountFontSize, setReviewCountFontSize] = useState<number>(initialReviewCountFontSize);
  const [reviewCountFontWeight, setReviewCountFontWeight] = useState<string>(initialReviewCountFontWeight);
  const [reviewCountColor, setReviewCountColor] = useState<HSBColor>(hexToHsb(initialReviewCountColor));

  const [activeToast, setActiveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    // Existing settings
    setStarColor(hexToHsb(initialStarColor));
    setBackgroundColor(hexToHsb(initialBackgroundColor));
    setHeadingColor(hexToHsb(initialHeadingColor));
    setReviewCardColor(hexToHsb(initialReviewCardColor));
    setReviewsPerSlide(initialReviewsPerSlide);
    setDisplayType(initialDisplayType);
    setGridRows(initialGridRows);
    setGridColumns(initialGridColumns);
    setSectionBorderRadius(initialSectionBorderRadius);
    setSliderAutoplay(initialSliderAutoplay);
    setSliderSpeed(initialSliderSpeed);
    setSliderLoop(initialSliderLoop);
    setSliderDirection(initialSliderDirection);
    setSpaceBetween(initialSpaceBetween);
    setShowNavigation(initialShowNavigation);
    setSliderEffect(initialSliderEffect);
    
    // Text styling settings
    setHeadingText(initialHeadingText);
    setHeadingFontFamily(initialHeadingFontFamily);
    setHeadingFontSize(initialHeadingFontSize);
    setHeadingFontWeight(initialHeadingFontWeight);
    setHeadingFontStyle(initialHeadingFontStyle);
    setHeadingTextTransform(initialHeadingTextTransform);
    setHeadingLetterSpacing(initialHeadingLetterSpacing);
    setHeadingLineHeight(initialHeadingLineHeight);
    setHeadingTextShadow(initialHeadingTextShadow);
    
    setRatingLabelText(initialRatingLabelText);
    setRatingLabelFontFamily(initialRatingLabelFontFamily);
    setRatingLabelFontSize(initialRatingLabelFontSize);
    setRatingLabelFontWeight(initialRatingLabelFontWeight);
    setRatingLabelColor(hexToHsb(initialRatingLabelColor));
    
    setRatingValueFontFamily(initialRatingValueFontFamily);
    setRatingValueFontSize(initialRatingValueFontSize);
    setRatingValueFontWeight(initialRatingValueFontWeight);
    setRatingValueColor(hexToHsb(initialRatingValueColor));
    
    setReviewCountPrefix(initialReviewCountPrefix);
    setReviewCountSuffix(initialReviewCountSuffix);
    setReviewCountFontFamily(initialReviewCountFontFamily);
    setReviewCountFontSize(initialReviewCountFontSize);
    setReviewCountFontWeight(initialReviewCountFontWeight);
    setReviewCountColor(hexToHsb(initialReviewCountColor));
  }, [
    initialStarColor, initialBackgroundColor, initialHeadingColor, initialReviewCardColor, 
    initialReviewsPerSlide, initialDisplayType, initialGridRows, initialGridColumns, 
    initialSectionBorderRadius, initialSliderAutoplay, initialSliderSpeed, initialSliderLoop, 
    initialSliderDirection, initialSpaceBetween, initialShowNavigation, initialSliderEffect,
    initialHeadingText, initialHeadingFontFamily, initialHeadingFontSize, initialHeadingFontWeight,
    initialHeadingFontStyle, initialHeadingTextTransform, initialHeadingLetterSpacing,
    initialHeadingLineHeight, initialHeadingTextShadow, initialRatingLabelText,
    initialRatingLabelFontFamily, initialRatingLabelFontSize, initialRatingLabelFontWeight,
    initialRatingLabelColor, initialRatingValueFontFamily, initialRatingValueFontSize,
    initialRatingValueFontWeight, initialRatingValueColor, initialReviewCountPrefix,
    initialReviewCountSuffix, initialReviewCountFontFamily, initialReviewCountFontSize,
    initialReviewCountFontWeight, initialReviewCountColor
  ]);

  // Existing handlers...
  const handleStarColorChange = useCallback((value: HSBColor) => {
    setStarColor({ ...value });
  }, []);

  const handleBackgroundColorChange = useCallback((value: HSBColor) => {
    setBackgroundColor({ ...value });
  }, []);

  const handleHeadingColorChange = useCallback((value: HSBColor) => {
    setHeadingColor({ ...value });
  }, []);

  const handleReviewCardColorChange = useCallback((value: HSBColor) => {
    setReviewCardColor({ ...value });
  }, []);

  const handleReviewsPerSlideChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 6)) {
      setReviewsPerSlide(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleGridRowsChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 6)) {
      setGridRows(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleGridColumnsChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 6)) {
      setGridColumns(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleSectionBorderRadiusChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 50)) {
      setSectionBorderRadius(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleDisplayTypeChange = useCallback((value: string) => {
    setDisplayType(value);
  }, []);

  const handleSliderSpeedChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 2000 && parsedValue <= 12000)) {
      const roundedValue = Math.round(parsedValue / 1000) * 1000;
      setSliderSpeed(value === '' ? 0 : roundedValue);
    }
  }, []);

  const handleSpaceBetweenChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 100)) {
      setSpaceBetween(value === '' ? 0 : parsedValue);
    }
  }, []);

  // New text styling handlers
  const handleHeadingTextChange = useCallback((value: string) => {
    setHeadingText(value);
  }, []);

  const handleHeadingFontSizeChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 10 && parsedValue <= 100)) {
      setHeadingFontSize(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleHeadingLetterSpacingChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= -10 && parsedValue <= 50)) {
      setHeadingLetterSpacing(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleHeadingLineHeightChange = useCallback((value: string) => {
    const parsedValue = parseFloat(value);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 0.5 && parsedValue <= 3)) {
      setHeadingLineHeight(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleRatingLabelTextChange = useCallback((value: string) => {
    setRatingLabelText(value);
  }, []);

  const handleRatingLabelFontSizeChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 8 && parsedValue <= 40)) {
      setRatingLabelFontSize(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleRatingLabelColorChange = useCallback((value: HSBColor) => {
    setRatingLabelColor({ ...value });
  }, []);

  const handleRatingValueFontSizeChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 8 && parsedValue <= 40)) {
      setRatingValueFontSize(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleRatingValueColorChange = useCallback((value: HSBColor) => {
    setRatingValueColor({ ...value });
  }, []);

  const handleReviewCountPrefixChange = useCallback((value: string) => {
    setReviewCountPrefix(value);
  }, []);

  const handleReviewCountSuffixChange = useCallback((value: string) => {
    setReviewCountSuffix(value);
  }, []);

  const handleReviewCountFontSizeChange = useCallback((value: string) => {
    const parsedValue = parseInt(value, 10);
    if (value === '' || (!isNaN(parsedValue) && parsedValue >= 8 && parsedValue <= 30)) {
      setReviewCountFontSize(value === '' ? 0 : parsedValue);
    }
  }, []);

  const handleReviewCountColorChange = useCallback((value: HSBColor) => {
    setReviewCountColor({ ...value });
  }, []);

  const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setToastMessage(actionData.message || 'Settings saved!');
        setToastError(false);
      } else {
        setToastMessage(actionData.error || 'Failed to save settings.');
        setToastError(true);
      }
      setActiveToast(true);
    }
  }, [actionData]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    // Existing settings
    formData.append('starColor', rgbToHex(hsbToRgb(starColor)));
    formData.append('backgroundColor', rgbToHex(hsbToRgb(backgroundColor)));
    formData.append('headingColor', rgbToHex(hsbToRgb(headingColor)));
    formData.append('reviewCardColor', rgbToHex(hsbToRgb(reviewCardColor)));
    formData.append('reviewsPerSlide', String(reviewsPerSlide));
    formData.append('displayType', displayType);
    formData.append('gridRows', String(gridRows));
    formData.append('gridColumns', String(gridColumns));
    formData.append('sectionBorderRadius', String(sectionBorderRadius));
    formData.append('sliderAutoplay', String(sliderAutoplay));
    formData.append('sliderSpeed', String(sliderSpeed));
    formData.append('sliderLoop', String(sliderLoop));
    formData.append('sliderDirection', sliderDirection);
    formData.append('spaceBetween', String(spaceBetween));
    formData.append('showNavigation', String(showNavigation));
    formData.append('sliderEffect', sliderEffect);

    // Text styling settings
    formData.append('headingText', headingText);
    formData.append('headingFontFamily', headingFontFamily);
    formData.append('headingFontSize', String(headingFontSize));
    formData.append('headingFontWeight', headingFontWeight);
    formData.append('headingFontStyle', headingFontStyle);
    formData.append('headingTextTransform', headingTextTransform);
    formData.append('headingLetterSpacing', String(headingLetterSpacing));
    formData.append('headingLineHeight', String(headingLineHeight));
    formData.append('headingTextShadow', headingTextShadow);
    
    formData.append('ratingLabelText', ratingLabelText);
    formData.append('ratingLabelFontFamily', ratingLabelFontFamily);
    formData.append('ratingLabelFontSize', String(ratingLabelFontSize));
    formData.append('ratingLabelFontWeight', ratingLabelFontWeight);
    formData.append('ratingLabelColor', rgbToHex(hsbToRgb(ratingLabelColor)));
    
    formData.append('ratingValueFontFamily', ratingValueFontFamily);
    formData.append('ratingValueFontSize', String(ratingValueFontSize));
    formData.append('ratingValueFontWeight', ratingValueFontWeight);
    formData.append('ratingValueColor', rgbToHex(hsbToRgb(ratingValueColor)));
    
    formData.append('reviewCountPrefix', reviewCountPrefix);
    formData.append('reviewCountSuffix', reviewCountSuffix);
    formData.append('reviewCountFontFamily', reviewCountFontFamily);
    formData.append('reviewCountFontSize', String(reviewCountFontSize));
    formData.append('reviewCountFontWeight', reviewCountFontWeight);
    formData.append('reviewCountColor', rgbToHex(hsbToRgb(reviewCountColor)));

    submit(formData, { method: 'post' });
  }, [
    starColor, backgroundColor, headingColor, reviewCardColor, reviewsPerSlide, 
    displayType, gridRows, gridColumns, sectionBorderRadius, sliderAutoplay, 
    sliderSpeed, sliderLoop, sliderDirection, spaceBetween, showNavigation, 
    sliderEffect, headingText, headingFontFamily, headingFontSize, headingFontWeight,
    headingFontStyle, headingTextTransform, headingLetterSpacing, headingLineHeight,
    headingTextShadow, ratingLabelText, ratingLabelFontFamily, ratingLabelFontSize,
    ratingLabelFontWeight, ratingLabelColor, ratingValueFontFamily, ratingValueFontSize,
    ratingValueFontWeight, ratingValueColor, reviewCountPrefix, reviewCountSuffix,
    reviewCountFontFamily, reviewCountFontSize, reviewCountFontWeight, reviewCountColor,
    submit
  ]);

  const isSaving = navigation.state === 'submitting';

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} onDismiss={toggleActiveToast} error={toastError} />
  ) : null;

  const displayTypeOptions = [
    { label: 'Slider', value: 'slider' },
    { label: 'Grid', value: 'grid' },
  ];

  const effectOptions = [
    { label: 'Slide', value: 'slide' },
    { label: 'Fade', value: 'fade' },
    { label: 'Cube', value: 'cube' },
    { label: 'Coverflow', value: 'coverflow' }
  ];

  const directionOptions = [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' }
  ];

  const fontWeightOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Bold', value: 'bold' },
    { label: '100 (Thin)', value: '100' },
    { label: '200 (Extra Light)', value: '200' },
    { label: '300 (Light)', value: '300' },
    { label: '400 (Regular)', value: '400' },
    { label: '500 (Medium)', value: '500' },
    { label: '600 (Semi Bold)', value: '600' },
    { label: '700 (Bold)', value: '700' },
    { label: '800 (Extra Bold)', value: '800' },
    { label: '900 (Black)', value: '900' },
  ];

  const fontStyleOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Italic', value: 'italic' },
    { label: 'Oblique', value: 'oblique' },
  ];

  const textTransformOptions = [
    { label: 'None', value: 'none' },
    { label: 'Uppercase', value: 'uppercase' },
    { label: 'Lowercase', value: 'lowercase' },
    { label: 'Capitalize', value: 'capitalize' },
  ];

  // Font family options with theme font option
  const fontFamilyOptions = [
  { label: 'Use theme body font', value: 'theme' },
  { label: 'Arial, sans-serif', value: 'Arial, sans-serif' },
  { label: 'Helvetica, Arial, sans-serif', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia, serif', value: 'Georgia, serif' },
  { label: 'Times New Roman, serif', value: 'Times New Roman, serif' },
  { label: 'Custom font...', value: 'custom' },
];

  const getFontFamilyValue = (fontFamily: string) => {
    if (fontFamily === 'theme') return 'theme';
    if (fontFamily === '') return 'custom';
    // Check if the current font family is one of the predefined options, otherwise assume 'custom'
    const predefinedValues = fontFamilyOptions.map(opt => opt.value);
    return predefinedValues.includes(fontFamily) ? fontFamily : 'custom';
  }

  const ColorSettingCard = ({ 
    title, 
    description,
    color, 
    onChange, 
    hexValue 
  }: { 
    title: string; 
    description: string;
    color: HSBColor; 
    onChange: (color: HSBColor) => void; 
    hexValue: string;
  }) => (
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
          <Badge tone="info">{hexValue.toUpperCase()}</Badge>
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

  return (
    <Page fullWidth>
      <TitleBar title="Review Display Settings" />
      <Layout>
        <Layout.Section>
          <div style={{ minHeight: '100vh', overflowY: 'auto' }}>
            <Card roundedAbove="sm">
              <BlockStack gap="600">
                {/* Header Section */}
                <Box paddingBlockEnd="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="200">
                      <Text as="h1" variant="headingXl" fontWeight="bold">
                        Review Display Settings
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Customize how customer reviews appear on your storefront. Match your brand and optimize layout for the best customer experience.
                      </Text>
                    </BlockStack>
                    <Button 
                      variant="primary" 
                      onClick={handleSubmit} 
                      loading={isSaving} 
                      disabled={isSaving}
                      size="large"
                    >
                      Save Changes
                    </Button>
                  </InlineStack>
                </Box>

                <Divider />

                {/* Text Styling Section */}
                <Box>
                  <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                    <BlockStack gap="400">
                      <InlineStack gap="300" blockAlign="center">
                        <Box 
                          background="bg-fill-brand" 
                          padding="200" 
                          borderRadius="300"
                        >
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            🅰️
                          </div>
                        </Box>
                        <BlockStack gap="100">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Text Styling
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Customize the appearance of all text elements in your review display.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>

                    <Card padding="400">
                      <BlockStack gap="500">
                        {/* Main Heading Styling */}
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            Main Heading
                          </Text>
                        </Box>
                        
                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                          <TextField
                            label="Heading Text"
                            value={headingText}
                            onChange={handleHeadingTextChange}
                            helpText="Main title text for the review section"
                            autoComplete="off"
                          />
                          <div>
                            <Select
                              label="Font Family"
                              options={fontFamilyOptions}
                              value={getFontFamilyValue(headingFontFamily)}
                              onChange={(value) => {
                                if (value === 'custom') {
                                  setHeadingFontFamily('');
                                } else {
                                  setHeadingFontFamily(value);
                                }
                              }}
                              helpText="Select 'Use theme body font' to match your store's typography, or choose from predefined fonts"
                            />
                            {(headingFontFamily === '' || getFontFamilyValue(headingFontFamily) === 'custom') && (
                              <Box paddingBlockStart="200">
                                <TextField
                                  label="Custom Font Family"
                                  value={headingFontFamily}
                                  onChange={setHeadingFontFamily}
                                  helpText="Enter custom font family (e.g., 'Roboto, sans-serif')"
                                  autoComplete="off"
                                  placeholder="e.g., Roboto, sans-serif"
                                />
                              </Box>
                            )}
                          </div>
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                          <TextField
                            label="Font Size"
                            value={headingFontSize === 0 ? '' : String(headingFontSize)}
                            onChange={handleHeadingFontSizeChange}
                            type="number"
                            min={10}
                            max={100}
                            helpText="Font size in pixels"
                            autoComplete="off"
                            suffix="px"
                          />
                          <Select
                            label="Font Weight"
                            options={fontWeightOptions}
                            value={headingFontWeight}
                            onChange={setHeadingFontWeight}
                            helpText="Font weight (boldness)"
                          />
                          <Select
                            label="Text Transform"
                            options={textTransformOptions}
                            value={headingTextTransform}
                            onChange={setHeadingTextTransform}
                            helpText="Text transformation"
                          />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                          <Select
                            label="Font Style"
                            options={fontStyleOptions}
                            value={headingFontStyle}
                            onChange={setHeadingFontStyle}
                            helpText="Font style"
                          />
                          <TextField
                            label="Letter Spacing"
                            value={headingLetterSpacing === 0 ? '' : String(headingLetterSpacing)}
                            onChange={handleHeadingLetterSpacingChange}
                            type="number"
                            min={-10}
                            max={50}
                            helpText="Space between letters in pixels"
                            autoComplete="off"
                            suffix="px"
                          />
                          <TextField
                            label="Line Height"
                            value={headingLineHeight === 0 ? '' : String(headingLineHeight)}
                            onChange={handleHeadingLineHeightChange}
                            type="number"
                            min={0.5}
                            max={3}
                            step={0.1}
                            helpText="Line height multiplier"
                            autoComplete="off"
                          />
                        </InlineGrid>

                        <TextField
                          label="Text Shadow"
                          value={headingTextShadow}
                          onChange={setHeadingTextShadow}
                          helpText="CSS text-shadow property (e.g., '2px 2px 4px rgba(0,0,0,0.5)')"
                          autoComplete="off"
                        />

                        {/* Rating Summary Styling */}
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            Rating Summary
                          </Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                          <TextField
                            label="Rating Label Text"
                            value={ratingLabelText}
                            onChange={handleRatingLabelTextChange}
                            helpText="Text for the rating label (e.g., 'Excellent')"
                            autoComplete="off"
                          />
                          <div>
                            <Select
                              label="Font Family"
                              options={fontFamilyOptions}
                              value={getFontFamilyValue(ratingLabelFontFamily)}
                              onChange={(value) => {
                                if (value === 'custom') {
                                  setRatingLabelFontFamily('');
                                } else {
                                  setRatingLabelFontFamily(value);
                                }
                              }}
                              helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                            />
                            {(ratingLabelFontFamily === '' || getFontFamilyValue(ratingLabelFontFamily) === 'custom') && (
                              <Box paddingBlockStart="200">
                                <TextField
                                  label="Custom Font Family"
                                  value={ratingLabelFontFamily}
                                  onChange={setRatingLabelFontFamily}
                                  helpText="Enter custom font family (e.g., 'Roboto, sans-serif')"
                                  autoComplete="off"
                                  placeholder="e.g., Roboto, sans-serif"
                                />
                              </Box>
                            )}
                          </div>
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                          <TextField
                            label="Font Size"
                            value={ratingLabelFontSize === 0 ? '' : String(ratingLabelFontSize)}
                            onChange={handleRatingLabelFontSizeChange}
                            type="number"
                            min={8}
                            max={40}
                            helpText="Font size in pixels"
                            autoComplete="off"
                            suffix="px"
                          />
                          <Select
                            label="Font Weight"
                            options={fontWeightOptions}
                            value={ratingLabelFontWeight}
                            onChange={setRatingLabelFontWeight}
                            helpText="Font weight"
                          />
                          <ColorSettingCard
                            title="Label Color"
                            description="Color for the rating label"
                            color={ratingLabelColor}
                            onChange={handleRatingLabelColorChange}
                            hexValue={rgbToHex(hsbToRgb(ratingLabelColor))}
                          />
                        </InlineGrid>

                        {/* Average Rating Styling */}
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            Average Rating
                          </Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                          <div>
                            <Select
                              label="Font Family"
                              options={fontFamilyOptions}
                              value={getFontFamilyValue(ratingValueFontFamily)}
                              onChange={(value) => {
                                if (value === 'custom') {
                                  setRatingValueFontFamily('');
                                } else {
                                  setRatingValueFontFamily(value);
                                }
                              }}
                              helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                            />
                            {(ratingValueFontFamily === '' || getFontFamilyValue(ratingValueFontFamily) === 'custom') && (
                              <Box paddingBlockStart="200">
                                <TextField
                                  label="Custom Font Family"
                                  value={ratingValueFontFamily}
                                  onChange={setRatingValueFontFamily}
                                  helpText="Enter custom font family (e.g., 'Roboto, sans-serif')"
                                  autoComplete="off"
                                  placeholder="e.g., Roboto, sans-serif"
                                />
                              </Box>
                            )}
                          </div>
                          <TextField
                            label="Font Size"
                            value={ratingValueFontSize === 0 ? '' : String(ratingValueFontSize)}
                            onChange={handleRatingValueFontSizeChange}
                            type="number"
                            min={8}
                            max={40}
                            helpText="Font size in pixels"
                            autoComplete="off"
                            suffix="px"
                          />
                          <Select
                            label="Font Weight"
                            options={fontWeightOptions}
                            value={ratingValueFontWeight}
                            onChange={setRatingValueFontWeight}
                            helpText="Font weight"
                          />
                        </InlineGrid>

                        <ColorSettingCard
                          title="Rating Value Color"
                          description="Color for the average rating number"
                          color={ratingValueColor}
                          onChange={handleRatingValueColorChange}
                          hexValue={rgbToHex(hsbToRgb(ratingValueColor))}
                        />

                        {/* Review Count Styling */}
                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">
                            Review Count
                          </Text>
                        </Box>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                          <TextField
                            label="Count Prefix"
                            value={reviewCountPrefix}
                            onChange={handleReviewCountPrefixChange}
                            helpText="Text before review count (e.g., 'Based on')"
                            autoComplete="off"
                          />
                          <TextField
                            label="Count Suffix"
                            value={reviewCountSuffix}
                            onChange={handleReviewCountSuffixChange}
                            helpText="Text after review count (e.g., 'reviews')"
                            autoComplete="off"
                          />
                        </InlineGrid>

                        <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                          <div>
                            <Select
                              label="Font Family"
                              options={fontFamilyOptions}
                              value={getFontFamilyValue(reviewCountFontFamily)}
                              onChange={(value) => {
                                if (value === 'custom') {
                                  setReviewCountFontFamily('');
                                } else {
                                  setReviewCountFontFamily(value);
                                }
                              }}
                              helpText="Select 'Use theme font' to match your store's body font, or choose from predefined fonts"
                            />
                            {(reviewCountFontFamily === '' || getFontFamilyValue(reviewCountFontFamily) === 'custom') && (
                              <Box paddingBlockStart="200">
                                <TextField
                                  label="Custom Font Family"
                                  value={reviewCountFontFamily}
                                  onChange={setReviewCountFontFamily}
                                  helpText="Enter custom font family (e.g., 'Roboto, sans-serif')"
                                  autoComplete="off"
                                  placeholder="e.g., Roboto, sans-serif"
                                />
                              </Box>
                            )}
                          </div>
                          <TextField
                            label="Font Size"
                            value={reviewCountFontSize === 0 ? '' : String(reviewCountFontSize)}
                            onChange={handleReviewCountFontSizeChange}
                            type="number"
                            min={8}
                            max={30}
                            helpText="Font size in pixels"
                            autoComplete="off"
                            suffix="px"
                          />
                          <Select
                            label="Font Weight"
                            options={fontWeightOptions}
                            value={reviewCountFontWeight}
                            onChange={setReviewCountFontWeight}
                            helpText="Font weight"
                          />
                        </InlineGrid>

                        <ColorSettingCard
                          title="Review Count Color"
                          description="Color for the review count text"
                          color={reviewCountColor}
                          onChange={handleReviewCountColorChange}
                          hexValue={rgbToHex(hsbToRgb(reviewCountColor))}
                        />

                        {/* Preview Section */}
                        <Box padding="400" background="bg-surface-brand" borderRadius="200">
                          <BlockStack gap="300">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">
                              Text Preview
                            </Text>
                            <Box padding="400" background="bg-surface" borderRadius="200">
                              <BlockStack gap="200">
                                <div style={{
                                  fontFamily: headingFontFamily === 'theme' ? 'inherit' : (headingFontFamily || 'Arial, sans-serif'),
                                  fontSize: `${headingFontSize}px`,
                                  fontWeight: headingFontWeight,
                                  fontStyle: headingFontStyle,
                                  textTransform: headingTextTransform,
                                  letterSpacing: `${headingLetterSpacing}px`,
                                  lineHeight: headingLineHeight,
                                  textShadow: headingTextShadow,
                                  color: rgbToHex(hsbToRgb(headingColor)),
                                  textAlign: 'center'
                                }}>
                                  {headingTextTransform === 'capitalize' 
                                    ? headingText.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
                                    : headingText
                                  }
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '12px',
                                  flexWrap: 'wrap'
                                }}>
                                  <span style={{
                                    fontFamily: ratingLabelFontFamily === 'theme' ? 'inherit' : (ratingLabelFontFamily || 'Arial, sans-serif'),
                                    fontSize: `${ratingLabelFontSize}px`,
                                    fontWeight: ratingLabelFontWeight,
                                    color: rgbToHex(hsbToRgb(ratingLabelColor))
                                  }}>
                                    {ratingLabelText}
                                  </span>
                                  <span style={{
                                    fontFamily: ratingValueFontFamily === 'theme' ? 'inherit' : (ratingValueFontFamily || 'Arial, sans-serif'),
                                    fontSize: `${ratingValueFontSize}px`,
                                    fontWeight: ratingValueFontWeight,
                                    color: rgbToHex(hsbToRgb(ratingValueColor))
                                  }}>
                                    4.5
                                  </span>
                                </div>
                                <div style={{
                                  fontFamily: reviewCountFontFamily === 'theme' ? 'inherit' : (reviewCountFontFamily || 'Arial, sans-serif'),
                                  fontSize: `${reviewCountFontSize}px`,
                                  fontWeight: reviewCountFontWeight,
                                  color: rgbToHex(hsbToRgb(reviewCountColor)),
                                  textAlign: 'center'
                                }}>
                                  {reviewCountPrefix} <strong>24</strong> {reviewCountSuffix}
                                </div>
                              </BlockStack>
                            </Box>
                          </BlockStack>
                        </Box>
                      </BlockStack>
                    </Card>
                  </InlineGrid>
                </Box>

                <Divider />

                {/* Layout Settings */}
                <Box>
                  <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                    <BlockStack gap="400">
                      <InlineStack gap="300" blockAlign="center">
                        <Box 
                          background="bg-fill-brand" 
                          padding="200" 
                          borderRadius="300"
                        >
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            ⚡
                          </div>
                        </Box>
                        <BlockStack gap="100">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Layout & Display
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Configure how reviews are organized and displayed to your customers.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>

                    <Card padding="400">
                      <BlockStack gap="400">
                        <Select
                          label="Display Type"
                          options={displayTypeOptions}
                          value={displayType}
                          onChange={handleDisplayTypeChange}
                          helpText="Choose how reviews are displayed on your store"
                        />
                        
                        {displayType === 'slider' && (
                          <TextField
                            label="Reviews per slide"
                            value={reviewsPerSlide === 0 ? '' : String(reviewsPerSlide)}
                            onChange={handleReviewsPerSlideChange}
                            type="number"
                            min={1}
                            max={6}
                            helpText="Number of review cards visible at one time in slider"
                            autoComplete="off"
                          />
                        )}
                        
                        {displayType === 'grid' && (
                          <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                            <TextField
                              label="Grid Rows"
                              value={gridRows === 0 ? '' : String(gridRows)}
                              onChange={handleGridRowsChange}
                              type="number"
                              min={1}
                              max={6}
                              helpText="Number of rows in the grid"
                              autoComplete="off"
                            />
                            <TextField
                              label="Grid Columns"
                              value={gridColumns === 0 ? '' : String(gridColumns)}
                              onChange={handleGridColumnsChange}
                              type="number"
                              min={1}
                              max={6}
                              helpText="Number of columns in the grid"
                              autoComplete="off"
                            />
                          </InlineGrid>
                        )}

                        {/* Section Border Radius Control */}
                        <TextField
                          label="Section Border Radius"
                          value={sectionBorderRadius === 0 ? '' : String(sectionBorderRadius)}
                          onChange={handleSectionBorderRadiusChange}
                          type="number"
                          min={0}
                          max={50}
                          helpText="Border radius for the entire review section (0-50px)"
                          autoComplete="off"
                          suffix="px"
                        />
                        
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

                {/* Slider Settings - Only show when displayType is slider */}
                {displayType === 'slider' && (
                  <>
                    <Divider />
                    <Box>
                      <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                        <BlockStack gap="400">
                          <InlineStack gap="300" blockAlign="center">
                            <Box 
                              background="bg-fill-brand" 
                              padding="200" 
                              borderRadius="300"
                            >
                              <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ⚙️
                              </div>
                            </Box>
                            <BlockStack gap="100">
                              <Text as="h2" variant="headingMd" fontWeight="semibold">
                                Slider Behavior
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Configure how the review slider behaves and appears to customers.
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </BlockStack>

                        <Card padding="400">
                          <BlockStack gap="400">
                            <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                              <Select
                                label="Transition Effect"
                                options={effectOptions}
                                value={sliderEffect}
                                onChange={setSliderEffect}
                                helpText="Animation effect between slides"
                              />
                              <Select
                                label="Direction"
                                options={directionOptions}
                                value={sliderDirection}
                                onChange={setSliderDirection}
                                helpText="Slider movement direction"
                              />
                            </InlineGrid>

                            <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} gap="400">
                              
                              <TextField
                                label="Autoplay Speed"
                                value={sliderSpeed === 0 ? '' : String(sliderSpeed)}
                                onChange={handleSliderSpeedChange}
                                type="number"
                                min={2000}
                                max={12000}
                                step={1000}
                                helpText="Time between slides (2000-12000 milliseconds)"
                                autoComplete="off"
                                suffix="ms"
                              />
                              <TextField
                                label="Space Between"
                                value={spaceBetween === 0 ? '' : String(spaceBetween)}
                                onChange={handleSpaceBetweenChange}
                                type="number"
                                min={0}
                                max={100}
                                helpText="Space between slides (0-100px)"
                                autoComplete="off"
                                suffix="px"
                              />
                            </InlineGrid>

                            <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap="400">
                              <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                  <input
                                    type="checkbox"
                                    id="sliderAutoplay"
                                    checked={sliderAutoplay}
                                    onChange={(e) => setSliderAutoplay(e.target.checked)}
                                    style={{ margin: 0 }}
                                  />
                                  <label htmlFor="sliderAutoplay" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                                    Autoplay
                                  </label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Automatically advance slides
                                </Text>
                              </Box>

                              <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                  <input
                                    type="checkbox"
                                    id="sliderLoop"
                                    checked={sliderLoop}
                                    onChange={(e) => setSliderLoop(e.target.checked)}
                                    style={{ margin: 0 }}
                                  />
                                  <label htmlFor="sliderLoop" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                                    Infinite Loop
                                  </label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Continuously loop through slides
                                </Text>
                              </Box>

                              <Box padding="200">
                                <InlineStack gap="200" blockAlign="center">
                                  <input
                                    type="checkbox"
                                    id="showNavigation"
                                    checked={showNavigation}
                                    onChange={(e) => setShowNavigation(e.target.checked)}
                                    style={{ margin: 0 }}
                                  />
                                  <label htmlFor="showNavigation" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                                    Show Navigation
                                  </label>
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Display next/previous buttons
                                </Text>
                              </Box>
                            </InlineGrid>
                          </BlockStack>
                        </Card>
                      </InlineGrid>
                    </Box>
                  </>
                )}

                <Divider />

                {/* Color Settings  */}
                <Box>
                  <InlineGrid columns={{ xs: '1fr', md: '1fr 2fr' }} gap="600" alignItems="start">
                    <BlockStack gap="400">
                      <InlineStack gap="300" blockAlign="center">
                        <Box 
                          background="bg-fill-brand" 
                          padding="200" 
                          borderRadius="300"
                        >
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            🎨
                          </div>
                        </Box>
                        <BlockStack gap="100">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Color Scheme
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Customize colors to match your brand identity and create a cohesive look.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>

                    <BlockStack gap="400">
                      <InlineGrid columns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap="400">
                        <ColorSettingCard
                          title="Star Color"
                          description="Color of rating stars"
                          color={starColor}
                          onChange={handleStarColorChange}
                          hexValue={rgbToHex(hsbToRgb(starColor))}
                        />
                        <ColorSettingCard
                          title="Background"
                          description="Main background color"
                          color={backgroundColor}
                          onChange={handleBackgroundColorChange}
                          hexValue={rgbToHex(hsbToRgb(backgroundColor))}
                        />
                        <ColorSettingCard
                          title="Heading Text"
                          description="Color for headings and titles"
                          color={headingColor}
                          onChange={handleHeadingColorChange}
                          hexValue={rgbToHex(hsbToRgb(headingColor))}
                        />
                        <ColorSettingCard
                          title="Card Background"
                          description="Review card background color"
                          color={reviewCardColor}
                          onChange={handleReviewCardColorChange}
                          hexValue={rgbToHex(hsbToRgb(reviewCardColor))}
                        />
                      </InlineGrid>
                    </BlockStack>
                  </InlineGrid>
                </Box>

                {/* Simple Color Preview */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="medium">
                      Color Preview
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Your selected colors will be applied to the review components throughout your store.
                    </Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Box padding="200">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: rgbToHex(hsbToRgb(starColor)),
                            borderRadius: '2px',
                            border: '1px solid #e1e3e5'
                          }} />
                          <Text as="span" variant="bodySm">Stars</Text>
                        </div>
                      </Box>
                      <Box padding="200">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: rgbToHex(hsbToRgb(headingColor)),
                            borderRadius: '2px',
                            border: '1px solid #e1e3e5'
                          }} />
                          <Text as="span" variant="bodySm">Headings</Text>
                        </div>
                      </Box>
                      <Box padding="200">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: rgbToHex(hsbToRgb(backgroundColor)),
                            borderRadius: '2px',
                            border: '1px solid #e1e3e5'
                          }} />
                          <Text as="span" variant="bodySm">Background</Text>
                        </div>
                      </Box>
                      <Box padding="200">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: rgbToHex(hsbToRgb(reviewCardColor)),
                            borderRadius: '2px',
                            border: '1px solid #e1e3e5'
                          }} />
                          <Text as="span" variant="bodySm">Cards</Text>
                        </div>
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
}
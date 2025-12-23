export interface HSBColor {
    hue: number;
    saturation: number;
    brightness: number;
    alpha: number;
}

export interface LoaderData {
    id?: string;
    starColor: string;
    backgroundColor: string;
    headingColor: string;
    reviewCardColor: string;
    reviewsPerSlide: number;
    displayType: string;
    gridRows: number;
    gridColumns: number;
    sliderAutoplay: boolean;
    sliderSpeed: number;
    sliderLoop: boolean;
    sliderDirection: string;
    spaceBetween: number;
    showNavigation: boolean;
    sliderEffect: string;
    sectionBorderRadius: number;

    headingText: string;
    headingFontFamily: string;
    headingFontSize: number;
    headingFontWeight: string;
    headingFontStyle: string;
    headingTextTransform: string;
    headingLetterSpacing: number;
    headingLineHeight: number;
    headingTextShadow: string;

    ratingLabelText: string;
    ratingLabelFontFamily: string;
    ratingLabelFontSize: number;
    ratingLabelFontWeight: string;
    ratingLabelColor: string;

    ratingValueFontFamily: string;
    ratingValueFontSize: number;
    ratingValueFontWeight: string;
    ratingValueColor: string;

    reviewCountPrefix: string;
    reviewCountSuffix: string;
    reviewCountFontFamily: string;
    reviewCountFontSize: number;
    reviewCountFontWeight: string;
    reviewCountColor: string;
}

export interface ActionData {
    success: boolean;
    message?: string;
    error?: string;
}

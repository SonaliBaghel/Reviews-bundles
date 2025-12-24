document.addEventListener('DOMContentLoaded', function () {
    const sliderBlock = document.querySelector('.review-slider-block');
    if (!sliderBlock) return;

    const elements = {
        sliderContainer: sliderBlock.querySelector('.review-carousel-container'),
        gridContainer: sliderBlock.querySelector('.review-grid-container'),
        track: sliderBlock.querySelector('.review-carousel-track'),
        grid: sliderBlock.querySelector('.review-grid'),
        prevBtn: sliderBlock.querySelector('.carousel-arrow-left'),
        nextBtn: sliderBlock.querySelector('.carousel-arrow-right'),
        gridPagination: sliderBlock.querySelector('.grid-pagination'),
        gridPrevBtn: sliderBlock.querySelector('.grid-pagination-prev'),
        gridNextBtn: sliderBlock.querySelector('.grid-pagination-next'),
        starsContainer: sliderBlock.querySelector('.summary-stars-container'),
        avgRating: sliderBlock.querySelector('.summary-average-rating'),
        count: sliderBlock.querySelector('.review-count-value'),
        sectionTitle: sliderBlock.querySelector('.section-title'),
        summaryLabel: sliderBlock.querySelector('.summary-label'),
        summaryReviewCount: sliderBlock.querySelector('.summary-review-count')
    };

    // Popup elements
    const popup = document.getElementById('review-popup');
    const popupOverlay = popup.querySelector('.review-popup-overlay');
    const popupClose = popup.querySelector('.review-popup-close');
    const popupTitle = popup.querySelector('.review-popup-title');
    const popupContent = popup.querySelector('.review-popup-content-text');
    const popupImages = popup.querySelector('.review-popup-images');

    let reviews = [];
    let currentIndex = 0;
    let gridCurrentPage = 0;
    let appSettings = {};
    let cardsPerPage = 3;
    let displayType = 'slider';
    let gridRows = 2;
    let gridColumns = 2;
    let sliderAutoplay = true;
    let sliderSpeed = 3000;
    let sliderLoop = true;
    let sliderDirection = 'horizontal';
    let spaceBetween = 20;
    let showNavigation = true;
    let sliderEffect = 'slide';
    let autoplayInterval = null;

    // Popup functions
    function openReviewPopup(review) {
        // Populate popup content - ONLY title, content, and images
        popupTitle.textContent = review.title || 'No Title';
        popupContent.textContent = review.content || '';

        // Populate images
        popupImages.innerHTML = '';
        if (review.images && Array.isArray(review.images) && review.images.length > 0) {
            review.images.forEach(image => {
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = image.altText || 'Customer review image';
                img.loading = 'lazy';
                popupImages.appendChild(img);
            });
        }

        // Show popup - centered on screen
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Ensure popup is centered
        setTimeout(() => {
            popup.style.alignItems = 'center';
            popup.style.justifyContent = 'center';
        }, 10);
    }

    function closeReviewPopup() {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Event listeners for popup
    popupOverlay.addEventListener('click', closeReviewPopup);
    popupClose.addEventListener('click', closeReviewPopup);

    // Close popup on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popup.style.display === 'flex') {
            closeReviewPopup();
        }
    });

    const updateCardWidths = () => {
        const root = document.documentElement;
        const gap = spaceBetween || 20;
        root.style.setProperty('--card-width', `calc((100% - (${gap}px * ${cardsPerPage - 1})) / ${cardsPerPage})`);
        root.style.setProperty('--card-width-md', `calc((100% - (${gap}px * ${Math.min(cardsPerPage, 4) - 1})) / ${Math.min(cardsPerPage, 4)})`);
        root.style.setProperty('--card-width-sm', `calc((100% - (${gap}px * ${Math.min(cardsPerPage, 3) - 1})) / ${Math.min(cardsPerPage, 3)})`);
        root.style.setProperty('--card-width-xs', `calc((100% - (${gap}px * ${Math.min(cardsPerPage, 2) - 1})) / ${Math.min(cardsPerPage, 2)})`);
    };

    function applySettingsToCss(settings) {
        const root = document.documentElement;

        // Existing color settings
        root.style.setProperty('--review-slider-bg', settings.backgroundColor || '#f9f9f9');
        root.style.setProperty('--heading-color', settings.headingColor || '#222222');
        root.style.setProperty('--review-card-bg', settings.reviewCardColor || '#ffffff');
        root.style.setProperty('--star-color', settings.starColor || '#FFD700');
        root.style.setProperty('--section-border-radius', `${settings.sectionBorderRadius || 12}px`);

        cardsPerPage = settings.reviewsPerSlide || 3;
        displayType = settings.displayType || 'slider';

        // Grid settings
        gridRows = settings.gridRows || 2;
        gridColumns = settings.gridColumns || 2;
        root.style.setProperty('--grid-rows', gridRows);
        root.style.setProperty('--grid-columns', gridColumns);

        // Slider settings 
        sliderAutoplay = settings.sliderAutoplay ?? true;
        sliderSpeed = settings.sliderSpeed ?? 3000;
        sliderLoop = settings.sliderLoop ?? true;
        sliderDirection = settings.sliderDirection ?? 'horizontal';
        spaceBetween = settings.spaceBetween ?? 20;
        showNavigation = settings.showNavigation ?? true;
        sliderEffect = settings.sliderEffect ?? 'slide';

        // Apply space between to CSS
        root.style.setProperty('--space-between', `${spaceBetween}px`);

        // Responsive grid columns
        root.style.setProperty('--grid-columns-sm', Math.min(gridColumns, 3));
        root.style.setProperty('--grid-columns-xs', Math.min(gridColumns, 2));

        // Text styling settings - Use 'inherit' for theme font
        root.style.setProperty('--heading-font-family',
            settings.headingFontFamily === 'theme' ? 'inherit' : (settings.headingFontFamily || 'inherit'));
        root.style.setProperty('--heading-font-size', `${settings.headingFontSize || 40}px`);
        root.style.setProperty('--heading-font-weight', settings.headingFontWeight || 'bold');
        root.style.setProperty('--heading-font-style', settings.headingFontStyle || 'normal');
        root.style.setProperty('--heading-text-transform', settings.headingTextTransform || 'uppercase');
        root.style.setProperty('--heading-letter-spacing', `${settings.headingLetterSpacing || 0}px`);
        root.style.setProperty('--heading-line-height', settings.headingLineHeight || 1.2);
        root.style.setProperty('--heading-text-shadow', settings.headingTextShadow || 'none');

        root.style.setProperty('--rating-label-font-family',
            settings.ratingLabelFontFamily === 'theme' ? 'inherit' : (settings.ratingLabelFontFamily || 'inherit'));
        root.style.setProperty('--rating-label-font-size', `${settings.ratingLabelFontSize || 18}px`);
        root.style.setProperty('--rating-label-font-weight', settings.ratingLabelFontWeight || '600');
        root.style.setProperty('--rating-label-color', settings.ratingLabelColor || '#555555');

        root.style.setProperty('--rating-value-font-family',
            settings.ratingValueFontFamily === 'theme' ? 'inherit' : (settings.ratingValueFontFamily || 'inherit'));
        root.style.setProperty('--rating-value-font-size', `${settings.ratingValueFontSize || 18}px`);
        root.style.setProperty('--rating-value-font-weight', settings.ratingValueFontWeight || '600');
        root.style.setProperty('--rating-value-color', settings.ratingValueColor || '#555555');

        root.style.setProperty('--review-count-font-family',
            settings.reviewCountFontFamily === 'theme' ? 'inherit' : (settings.reviewCountFontFamily || 'inherit'));
        root.style.setProperty('--review-count-font-size', `${settings.reviewCountFontSize || 16}px`);
        root.style.setProperty('--review-count-font-weight', settings.reviewCountFontWeight || 'normal');
        root.style.setProperty('--review-count-color', settings.reviewCountColor || '#777777');

        // Update text content
        if (elements.sectionTitle) {
            let headingText = settings.headingText || 'CUSTOMER TESTIMONIALS';

            // If text transform is set to capitalize, convert the text to proper case
            if (settings.headingTextTransform === 'capitalize') {
                headingText = headingText.toLowerCase().replace(/\b\w/g, function (char) {
                    return char.toUpperCase();
                });
            }

            elements.sectionTitle.textContent = headingText;
        }
        if (elements.summaryLabel) {
            elements.summaryLabel.textContent = settings.ratingLabelText || 'Excellent';
        }
        if (elements.summaryReviewCount) {
            const prefix = settings.reviewCountPrefix || 'Based on';
            const suffix = settings.reviewCountSuffix || 'reviews';
            elements.summaryReviewCount.innerHTML = `${prefix} <span class="review-count-value">0</span> ${suffix}`;
            // Re-bind the count element after updating HTML
            elements.count = sliderBlock.querySelector('.review-count-value');
        }

        updateCardWidths();
        showCorrectLayout();
        applySliderSettings();
    }

    // Apply slider-specific settings
    function applySliderSettings() {
        if (displayType !== 'slider') return;

        // Apply direction
        if (elements.sliderContainer) {
            elements.sliderContainer.className = 'review-carousel-container';
            if (sliderDirection === 'vertical') {
                elements.sliderContainer.classList.add('vertical');
            }
        }

        // Apply effect
        if (elements.track) {
            elements.track.className = 'review-carousel-track';
            if (sliderEffect !== 'slide') {
                elements.track.classList.add(`effect-${sliderEffect}`);
            }
        }

        // Apply navigation visibility
        if (elements.prevBtn && elements.nextBtn) {
            elements.prevBtn.style.display = showNavigation ? 'flex' : 'none';
            elements.nextBtn.style.display = showNavigation ? 'flex' : 'none';
        }

        // Initialize autoplay
        initAutoplay();
    }

    // Initialize autoplay
    function initAutoplay() {
        clearInterval(autoplayInterval);

        if (sliderAutoplay && displayType === 'slider' && reviews.length > cardsPerPage) {
            autoplayInterval = setInterval(() => {
                if (currentIndex + cardsPerPage < reviews.length) {
                    showNextReviews();
                } else if (sliderLoop) {
                    currentIndex = 0;
                    renderSliderReviews();
                    updateButtons();
                } else {
                    clearInterval(autoplayInterval);
                }
            }, sliderSpeed);
        }
    }

    function showCorrectLayout() {
        if (elements.sliderContainer) {
            elements.sliderContainer.style.display = displayType === 'slider' ? 'flex' : 'none';
        }
        if (elements.gridContainer) {
            elements.gridContainer.style.display = displayType === 'grid' ? 'block' : 'none';

            if (elements.gridPagination) {
                elements.gridPagination.style.display = displayType === 'grid' ? 'flex' : 'none';
            }
        }
    }

    // Initialize slider
    function initSlider() {
        fetchAppSettings();
        setupEventListeners();
    }

    // Fetch app settings from the API
    function fetchAppSettings() {
        const apiUrl = sliderBlock.dataset.apiUrl;
        if (!apiUrl) {
            console.error('API URL for app settings not found.');
            applySettingsToCss({
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
                headingText: "CUSTOMER TESTIMONIALS",
                headingFontFamily: "inherit",
                headingFontSize: 40,
                headingFontWeight: "bold",
                headingFontStyle: "normal",
                headingTextTransform: "uppercase",
                headingLetterSpacing: 0,
                headingLineHeight: 1.2,
                headingTextShadow: "none",
                ratingLabelText: "Excellent",
                ratingLabelFontFamily: "inherit",
                ratingLabelFontSize: 18,
                ratingLabelFontWeight: "600",
                ratingLabelColor: "#555555",
                ratingValueFontFamily: "inherit",
                ratingValueFontSize: 18,
                ratingValueFontWeight: "600",
                ratingValueColor: "#555555",
                reviewCountPrefix: "Based on",
                reviewCountSuffix: "reviews",
                reviewCountFontFamily: "inherit",
                reviewCountFontSize: 16,
                reviewCountFontWeight: "normal",
                reviewCountColor: "#777777"
            });
            fetchReviews();
            return;
        }

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || `Failed to load app settings: ${response.status}`);
                    }).catch(() => {
                        throw new Error(`Failed to load app settings: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(settings => {
                appSettings = settings;
                applySettingsToCss(appSettings);
                fetchReviews();
            })
            .catch(error => {
                console.error('Error fetching app settings:', error);
                applySettingsToCss({
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
                    headingText: "CUSTOMER TESTIMONIALS",
                    headingFontFamily: "inherit",
                    headingFontSize: 40,
                    headingFontWeight: "bold",
                    headingFontStyle: "normal",
                    headingTextTransform: "uppercase",
                    headingLetterSpacing: 0,
                    headingLineHeight: 1.2,
                    headingTextShadow: "none",
                    ratingLabelText: "Excellent",
                    ratingLabelFontFamily: "inherit",
                    ratingLabelFontSize: 18,
                    ratingLabelFontWeight: "600",
                    ratingLabelColor: "#555555",
                    ratingValueFontFamily: "inherit",
                    ratingValueFontSize: 18,
                    ratingValueFontWeight: "600",
                    ratingValueColor: "#555555",
                    reviewCountPrefix: "Based on",
                    reviewCountSuffix: "reviews",
                    reviewCountFontFamily: "inherit",
                    reviewCountFontSize: 16,
                    reviewCountFontWeight: "normal",
                    reviewCountColor: "#777777"
                });
                fetchReviews();
            });
    }

    // Fetch reviews from API
    function fetchReviews() {
        showLoading();
        fetch('/apps/productreview/api/productreview')
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `Failed to load reviews: ${response.status}`);
                    }).catch(() => {
                        throw new Error(`Failed to load reviews: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                reviews = data.reviews.filter(r => r.status === 'approved')
                    .sort((a, b) => {
                        if (b.rating !== a.rating) {
                            return b.rating - a.rating;
                        }
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    });

                updateDisplay(parseFloat(data.averageRating), parseInt(data.totalReviews, 10));
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message || 'Unknown error');
            })
            .finally(() => {
                sliderBlock.classList.remove('loading');
                sliderBlock.classList.add('loaded');
            });
    }

    function updateDisplay(averageRating, totalReviews) {
        updateSummary(averageRating, totalReviews);
        renderReviews();
        updateButtons();
        initAutoplay();
    }

    function updateSummary(averageRating, totalReviews) {
        elements.avgRating.textContent = averageRating.toFixed(1);
        elements.starsContainer.innerHTML = renderSummaryStars(averageRating);
        if (elements.count) {
            elements.count.textContent = totalReviews;
        }
    }

    function renderSummaryStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const partialStarFill = (rating % 1) * 100;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<span class="star-icon full-star-summary">★</span>';
            } else if (i === fullStars + 1 && partialStarFill > 0) {
                starsHtml += `<span class="star-icon partial-star-summary" style="--fill-percentage: ${partialStarFill}%">★</span>`;
            } else {
                starsHtml += '<span class="star-icon">★</span>';
            }
        }
        return starsHtml;
    }

    function renderStars(rating) {
        let stars = '';
        const roundedRating = Math.round(rating);

        for (let i = 1; i <= 5; i++) {
            if (i <= roundedRating) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        return stars;
    }

    function renderReviews() {
        if (reviews.length === 0) {
            const emptyMessage = '<p class="loading-reviews-slider">No reviews found</p>';
            if (elements.track) elements.track.innerHTML = emptyMessage;
            if (elements.grid) elements.grid.innerHTML = emptyMessage;
            return;
        }

        if (displayType === 'slider') {
            renderSliderReviews();
        } else {
            renderGridReviews();
        }
    }

    function renderSliderReviews() {
        if (!elements.track) return;

        elements.track.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const endIndex = Math.min(currentIndex + cardsPerPage, reviews.length);

        for (let i = currentIndex; i < endIndex; i++) {
            const review = reviews[i];
            const reviewCard = createReviewCard(review);
            fragment.appendChild(reviewCard);
        }

        elements.track.appendChild(fragment);
        applyEffectTransforms();
    }

    // Apply effect-specific transformations
    function applyEffectTransforms() {
        if (!elements.track) return;
        const cards = elements.track.querySelectorAll('.review-card');
        if (cards.length === 0) return;
        const centerIndex = currentIndex;
        cards.forEach((card, index) => {
            const difference = index - centerIndex;
            let transformStyle = '';
            if (sliderEffect === 'cube') {
                const rotationY = difference * 90;
                transformStyle = `rotateY(${rotationY}deg) translateZ(${cards[0].offsetWidth / 2}px)`;
            } else if (sliderEffect === 'coverflow') {
                const rotationY = difference * -30;
                const offset = difference * 50;
                const translateZ = Math.abs(difference) * -100;
                transformStyle = `perspective(1000px) translateX(${offset}px) rotateY(${rotationY}deg) translateZ(${translateZ}px)`;
            }
            card.style.transform = transformStyle;
        });
    }

    // Render reviews for grid layout
    function renderGridReviews() {
        if (!elements.grid) return;

        elements.grid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        // Calculate grid items per page
        const itemsPerPage = gridRows * gridColumns;
        const startIndex = gridCurrentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, reviews.length);

        for (let i = startIndex; i < endIndex; i++) {
            const review = reviews[i];
            const reviewCard = createReviewCard(review);
            fragment.appendChild(reviewCard);
        }

        elements.grid.appendChild(fragment);
        updateGridPagination();
    }

    // Update grid pagination buttons
    function updateGridPagination() {
        if (!elements.gridPrevBtn || !elements.gridNextBtn) return;

        const itemsPerPage = gridRows * gridColumns;
        const totalPages = Math.ceil(reviews.length / itemsPerPage);

        elements.gridPrevBtn.disabled = gridCurrentPage === 0;
        elements.gridNextBtn.disabled = gridCurrentPage >= totalPages - 1;
    }

    // Create a single review card with Read More functionality
    function createReviewCard(review) {
        const reviewCard = document.createElement('div');
        reviewCard.classList.add('review-card');

        let imagesHtml = '';
        if (review.images && Array.isArray(review.images) && review.images.length > 0) {
            imagesHtml += '<div class="review-card-images-container">';
            review.images.forEach(image => {
                imagesHtml += `<img src="${image.url}" alt="${image.altText || 'Customer review image'}" loading="lazy" />`;
            });
            imagesHtml += '</div>';
        }

        const content = review.content || '';

        // Simple and reliable detection: if content has more than 250 characters, show Read More
        const needsReadMore = content.length > 250;

        // Create short content - first 200 characters
        const shortContent = needsReadMore ? content.substring(0, 200) + '...' : content;

        reviewCard.innerHTML = `
      <div class="review-card-rating">${renderStars(parseFloat(review.rating))}</div>
      <h3 class="review-card-title">${review.title || 'No Title'}</h3>
      <div class="review-card-content ${needsReadMore ? 'collapsed' : ''}">
        ${needsReadMore ? shortContent : content}
      </div>
      ${needsReadMore ? '<button class="read-more-btn">Read More</button>' : ''}
      ${imagesHtml}
      <p class="review-card-meta">
        by ${review.author || 'Anonymous'} • ${new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    `;

        // Add event listener for Read More button
        if (needsReadMore) {
            const readMoreBtn = reviewCard.querySelector('.read-more-btn');

            readMoreBtn.addEventListener('click', function () {
                openReviewPopup(review);
            });
        }

        return reviewCard;
    }

    // Update navigation buttons (for slider only)
    function updateButtons() {
        if (elements.prevBtn) elements.prevBtn.disabled = currentIndex === 0 || displayType !== 'slider';
        if (elements.nextBtn) elements.nextBtn.disabled = currentIndex + cardsPerPage >= reviews.length || displayType !== 'slider';
    }

    // Show loading state
    function showLoading() {
        const loadingMessage = '<p class="loading-reviews-slider">Loading reviews...</p>';
        if (elements.track) elements.track.innerHTML = loadingMessage;
        if (elements.grid) elements.grid.innerHTML = loadingMessage;
        sliderBlock.classList.add('loading');
    }

    // Show error state
    function showError(message = 'Error loading reviews') {
        const errorMessage = `<p class="loading-reviews-slider">${message}</p>`;
        if (elements.track) elements.track.innerHTML = errorMessage;
        if (elements.grid) elements.grid.innerHTML = errorMessage;
        elements.avgRating.textContent = '0.0';
        elements.starsContainer.innerHTML = renderSummaryStars(0);
        if (elements.count) {
            elements.count.textContent = '0';
        }
        if (elements.prevBtn) elements.prevBtn.disabled = true;
        if (elements.nextBtn) elements.nextBtn.disabled = true;
        if (elements.gridPrevBtn) elements.gridPrevBtn.disabled = true;
        if (elements.gridNextBtn) elements.gridNextBtn.disabled = true;
    }

    // Handle next slide (slider only)
    function showNextReviews() {
        if (displayType === 'slider' && currentIndex + cardsPerPage < reviews.length) {
            currentIndex += cardsPerPage;
            renderSliderReviews();
            updateButtons();
        } else if (displayType === 'slider' && sliderLoop) {
            currentIndex = 0;
            renderSliderReviews();
            updateButtons();
        }
    }

    // Handle previous slide (slider only)
    function showPrevReviews() {
        if (displayType === 'slider' && currentIndex > 0) {
            currentIndex = Math.max(0, currentIndex - cardsPerPage);
            renderSliderReviews();
            updateButtons();
        } else if (displayType === 'slider' && sliderLoop) {
            currentIndex = Math.max(0, reviews.length - cardsPerPage);
            renderSliderReviews();
            updateButtons();
        }
    }

    // Handle next page (grid only)
    function showNextGridPage() {
        const itemsPerPage = gridRows * gridColumns;
        const totalPages = Math.ceil(reviews.length / itemsPerPage);

        if (gridCurrentPage < totalPages - 1) {
            gridCurrentPage++;
            renderGridReviews();
        }
    }

    // Handle previous page (grid only)
    function showPrevGridPage() {
        if (gridCurrentPage > 0) {
            gridCurrentPage--;
            renderGridReviews();
        }
    }

    function handleResize() {
        if (displayType === 'slider') {
            updateCardWidths();
            renderSliderReviews();
            updateButtons();
        } else if (displayType === 'grid') {
            renderGridReviews();
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        if (elements.prevBtn) elements.prevBtn.addEventListener('click', showPrevReviews);
        if (elements.nextBtn) elements.nextBtn.addEventListener('click', showNextReviews);
        if (elements.gridPrevBtn) elements.gridPrevBtn.addEventListener('click', showPrevGridPage);
        if (elements.gridNextBtn) elements.gridNextBtn.addEventListener('click', showNextGridPage);
        window.addEventListener('resize', handleResize);

        // Pause autoplay on hover
        if (elements.sliderContainer) {
            elements.sliderContainer.addEventListener('mouseenter', () => {
                clearInterval(autoplayInterval);
            });

            elements.sliderContainer.addEventListener('mouseleave', () => {
                initAutoplay();
            });
        }
    }

    initSlider();
});

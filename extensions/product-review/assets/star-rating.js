function darkenColor(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.floor(r * (1 - percent / 100));
    g = Math.floor(g * (1 - percent / 100));
    b = Math.floor(b * (1 - percent / 100));

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    const toHex = (c) => ('0' + c.toString(16)).slice(-2);
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

document.addEventListener('DOMContentLoaded', function () {
    const starRatingBlock = document.querySelector('.star-rating-block');
    const productId = starRatingBlock ? starRatingBlock.dataset.productId : null;
    const reviewsContainer = starRatingBlock ? starRatingBlock.querySelector('.reviews-container') : null;
    const reviewsList = reviewsContainer ? reviewsContainer.querySelector('.reviews-list') : null;
    const reviewCountSpan = starRatingBlock ? starRatingBlock.querySelector('.review-count') : null;
    const averageRatingSpan = starRatingBlock ? starRatingBlock.querySelector('.average-rating') : null;
    const starsRenderContainer = starRatingBlock ? starRatingBlock.querySelector('.rating-header .stars-container') : null;
    const prevPageButton = starRatingBlock ? starRatingBlock.querySelector('.prev-page') : null;
    const nextPageButton = starRatingBlock ? starRatingBlock.querySelector('.next-page') : null;
    const pageIndicator = starRatingBlock ? starRatingBlock.querySelector('.page-indicator') : null;

    const submissionMessageModal = document.getElementById('submission-message-modal');
    const closeSubmissionModalBtn = submissionMessageModal ? submissionMessageModal.querySelector('.close-submission-modal') : null;
    const okSubmissionBtn = submissionMessageModal ? submissionMessageModal.querySelector('.ok-submission-btn') : null;

    const MAX_IMAGES_ALLOWED = 5;
    const MAX_FILE_SIZE_MB = 2;

    let currentAppStarColor = '#FFD700';
    let currentAppStarColorDarken = '#E6C200';


    fetch('/apps/productreview/api/settings')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.starColor) {
                currentAppStarColor = data.starColor;
                currentAppStarColorDarken = darkenColor(currentAppStarColor, 8);


                document.documentElement.style.setProperty('--app-star-color', currentAppStarColor);
                document.documentElement.style.setProperty('--app-star-color-darken', currentAppStarColorDarken);

            } else {
                console.warn('Star color not found in app settings API response. Using default.');
            }
        })
        .catch(error => {
            console.error('Error fetching app settings for star color:', error);

        })
        .finally(() => {

            loadReviews();
        });


    let allReviews = [];
    let reviewsPerPage = 5;
    let currentPage = 1;

    function renderMainRatingStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const partialStarFill = (rating % 1) * 100; // Get the percentage for the partial star

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                // Full star for main rating
                starsHtml += '<span class="star-icon-main full-star-main">★</span>';
            } else if (i === fullStars + 1 && partialStarFill > 0) {
                // Partial star for main rating
                starsHtml += `<span class="star-icon-main partial-star-main" style="--fill-percentage: ${partialStarFill}%">★</span>`;
            } else {
                // Empty star for main rating 
                starsHtml += '<span class="star-icon-main">★</span>';
            }
        }
        return starsHtml;
    }

    function renderStars(rating) {
        let stars = '';
        const roundedRating = Math.round(rating);

        for (let i = 1; i <= 5; i++) {
            if (i <= roundedRating) {
                stars += '★'; // Solid star
            } else {
                stars += '☆'; // Empty outline star
            }
        }
        return stars;
    }
    function renderReviews() {
        if (!reviewsList) return;

        reviewsList.innerHTML = '';
        const reviewsFooter = starRatingBlock.querySelector('.reviews-footer');

        if (allReviews.length === 0) {
            reviewsList.innerHTML = `<p class="no-reviews">No reviews yet</p>`;
            if (reviewsFooter) reviewsFooter.style.display = 'none';
            return;
        }

        const startIndex = (currentPage - 1) * reviewsPerPage;
        const endIndex = startIndex + reviewsPerPage;
        const reviewsToDisplay = allReviews.slice(startIndex, endIndex);

        reviewsToDisplay.forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.classList.add('review-item');

            let imagesHtml = '';
            if (review.images && Array.isArray(review.images) && review.images.length > 0) {
                imagesHtml += `<div class="review-images-container">`;
                review.images.forEach(image => {
                    imagesHtml += `<img src="${image.url}" alt="${image.altText || 'Customer review image'}" />`;
                });
                imagesHtml += `</div>`;
            }

            reviewItem.innerHTML = `
        <div class="review-meta">
          <span class="review-author">${review.author || 'Anonymous'}</span>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="review-rating" style="color:var(--app-star-color, #FFD700);">
          ${renderStars(parseFloat(review.rating))}
        </div>
        ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
        <div class="review-content">${review.content}</div>
        ${imagesHtml}
      `;
            reviewsList.appendChild(reviewItem);
        });

        if (reviewsFooter) {
            reviewsFooter.style.display = allReviews.length > reviewsPerPage ? 'block' : 'none';
        }

        updatePaginationControls();
    }

    function updatePaginationControls() {
        const totalPages = Math.ceil(allReviews.length / reviewsPerPage);

        if (prevPageButton) {
            prevPageButton.disabled = currentPage === 1;
        }
        if (nextPageButton) {
            nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
        }
        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    }

    async function loadReviews() {
        if (!productId || !reviewsList) {
            console.warn("Product ID or reviews container not found, cannot load reviews.");
            if (reviewsList) {
                reviewsList.innerHTML = `<p class="no-reviews">No reviews yet</p>`;
            }
            starRatingBlock.classList.remove('loading');
            starRatingBlock.classList.add('loaded');
            return;
        }

        starRatingBlock.classList.add('loading');
        reviewsList.innerHTML = `<p class="loading-reviews">Loading reviews...</p>`;

        try {
            const response = await fetch(`/apps/productreview/api/productreview?productId=${productId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Failed to load reviews: ${response.status}`);
            }

            const responseData = await response.json();
            allReviews = Array.isArray(responseData) ? responseData : [];


            if (allReviews.length > 0) {
                let totalRating = 0;
                allReviews.forEach(review => {
                    totalRating += parseFloat(review.rating);
                });

                const newAvgRating = (totalRating / allReviews.length);
                if (averageRatingSpan) {
                    averageRatingSpan.textContent = newAvgRating.toFixed(1);
                }
                if (reviewCountSpan) {
                    reviewCountSpan.textContent = `${allReviews.length} reviews`;
                }
                if (starsRenderContainer) {
                    starsRenderContainer.innerHTML = renderMainRatingStars(newAvgRating);
                }
                currentPage = 1;
                renderReviews();
            } else {
                reviewsList.innerHTML = `<p class="no-reviews">No reviews yet</p>`;
                if (reviewCountSpan) {
                    reviewCountSpan.textContent = `0 reviews`;
                }
                if (averageRatingSpan) {
                    averageRatingSpan.textContent = 'No reviews yet';
                }
                if (starsRenderContainer) {
                    starsRenderContainer.innerHTML = renderMainRatingStars(0);
                }
                updatePaginationControls();
            }
            starRatingBlock.classList.remove('loading');
            starRatingBlock.classList.add('loaded');


        } catch (error) {
            console.error("Error loading reviews:", error);
            starRatingBlock.classList.remove('loading');
            starRatingBlock.classList.add('loaded');
        }
    }
    // loadReviews() is now called inside the .finally() block of the fetch request
    // to ensure app settings (color) are loaded first.


    if (prevPageButton) {
        prevPageButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                renderReviews();
            }
        });
    }

    if (nextPageButton) {
        nextPageButton.addEventListener('click', function () {
            const totalPages = Math.ceil(allReviews.length / reviewsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderReviews();
            }
        });
    }

    // Move modals to body on load to fix stacking context issues
    document.querySelectorAll('.review-form-modal').forEach(modal => {
        if (modal.parentNode !== document.body) {
            document.body.appendChild(modal);
        }
    });

    document.querySelectorAll('.write-review-btn').forEach(button => {
        button.addEventListener('click', function () {
            const modal = document.getElementById(`review-form-modal-${productId}`);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    document.querySelectorAll('.close-modal, .modal-overlay').forEach(element => {
        element.addEventListener('click', function () {
            this.closest('.review-form-modal').style.display = 'none';
            document.body.style.overflow = '';
        });
    });

    document.querySelectorAll('.star-rating-input').forEach(starInputContainer => {
        const labels = starInputContainer.querySelectorAll('label');
        const inputs = starInputContainer.querySelectorAll('input');

        const updateStars = (ratingValue) => {
            labels.forEach((star, index) => {
                // Use the currentAppStarColor variable (fetched from API)
                star.style.color = index < ratingValue ? currentAppStarColor : '#e0e0e0';
            });
        };

        // Initial state if a radio button is pre-selected (e.g., from browser autofill)
        const initialCheckedInput = starInputContainer.querySelector('input:checked');
        if (initialCheckedInput) {
            updateStars(initialCheckedInput.value);
        }

        labels.forEach(label => {
            label.addEventListener('mouseover', function () {
                const ratingValue = this.previousElementSibling.value;
                updateStars(ratingValue);
            });

            label.addEventListener('mouseout', function () {
                const checkedInput = starInputContainer.querySelector('input:checked');
                if (checkedInput) {
                    updateStars(checkedInput.value);
                } else {
                    updateStars(0);
                }
            });

            label.addEventListener('click', function () {
                const ratingValue = this.previousElementSibling.value;
                updateStars(ratingValue);
            });
        });
    });

    document.querySelectorAll('.review-form').forEach(form => {
        const productId = form.dataset.productId;
        const imageUploadInput = form.querySelector(`#image-upload-${productId}`);
        const imagePreviewContainer = form.querySelector(`#image-preview-${productId}`);
        let selectedFiles = [];

        const renderImagePreviews = () => {
            if (!imagePreviewContainer) return;
            imagePreviewContainer.innerHTML = '';

            selectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imgItem = document.createElement('div');
                    imgItem.classList.add('image-preview-item');
                    imgItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview of ${file.name}" data-index="${index}" />
            <button type="button" class="remove-image-btn" data-index="${index}">&times;</button>
          `;
                    imagePreviewContainer.appendChild(imgItem);

                    imgItem.querySelector('.remove-image-btn').addEventListener('click', function () {
                        const idxToRemove = parseInt(this.dataset.index);
                        selectedFiles.splice(idxToRemove, 1);
                        renderImagePreviews();
                        if (selectedFiles.length === 0) {
                            imageUploadInput.value = '';
                        }
                    });
                };
                reader.readAsDataURL(file);
            });

            if (selectedFiles.length > MAX_IMAGES_ALLOWED) {
                const helpText = form.querySelector('.form-help-text');
                if (helpText) helpText.innerHTML = `Max ${MAX_IMAGES_ALLOWED} images. Each max ${MAX_FILE_SIZE_MB}MB. JPG, PNG, GIF only. <span style="color: red;">(You have selected ${selectedFiles.length} images. Only the first ${MAX_IMAGES_ALLOWED} will be uploaded.)</span>`;
            } else {
                const helpText = form.querySelector('.form-help-text');
                if (helpText) helpText.innerHTML = `Max ${MAX_IMAGES_ALLOWED} images. Each max ${MAX_FILE_SIZE_MB}MB. JPG, PNG, GIF only.`;
            }
        };

        if (imageUploadInput && imagePreviewContainer) {
            imageUploadInput.addEventListener('change', async function (event) {
                const newFiles = Array.from(event.target.files);
                let tempSelectedFiles = [...selectedFiles];

                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

                for (let i = 0; i < newFiles.length; i++) {
                    const file = newFiles[i];
                    if (tempSelectedFiles.length >= MAX_IMAGES_ALLOWED) {
                        // No more images can be added if max is reached
                        break;
                    }
                    if (!allowedTypes.includes(file.type)) {
                        console.warn(`Skipping ${file.name}: Only JPG, PNG, GIF allowed.`);
                        continue;
                    }
                    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                        console.warn(`Skipping ${file.name}: File size exceeds ${MAX_FILE_SIZE_MB}MB.`);
                        continue;
                    }
                    tempSelectedFiles.push(file);
                }

                selectedFiles = tempSelectedFiles;
                this.value = '';

                renderImagePreviews();
            });
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-review');
            const currentProductId = this.dataset.productId;

            if (!this.checkValidity()) {
                this.reportValidity();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const formData = new FormData(this);
                const base64Images = [];

                for (let i = 0; i < Math.min(selectedFiles.length, MAX_IMAGES_ALLOWED); i++) {
                    const file = selectedFiles[i];
                    const reader = new FileReader();
                    const base64Data = await new Promise((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    base64Images.push(base64Data);
                }

                const response = await fetch('/apps/productreview/api/productreview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: currentProductId,
                        rating: parseFloat(formData.get('rating')),
                        author: formData.get('name'),
                        email: formData.get('email'),
                        title: formData.get('title'),
                        content: formData.get('content'),
                        images: base64Images
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.error ||
                        `Request failed with status ${response.status}`
                    );
                }

                const result = await response.json();
                submitBtn.textContent = 'Submitted! Thank you.';

                const reviewFormModal = document.getElementById(`review-form-modal-${currentProductId}`);
                if (reviewFormModal) {
                    reviewFormModal.style.display = 'none';
                }

                if (submissionMessageModal) {
                    submissionMessageModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
                form.reset();
                selectedFiles = [];
                renderImagePreviews();
                loadReviews();

            } catch (error) {
                console.error('Submission error:', error);
                if (submissionMessageModal) {
                    submissionMessageModal.querySelector('.submission-message-title').textContent = 'Submission Failed!';
                    submissionMessageModal.querySelector('.submission-message-title').style.color = '#dc3545';
                    submissionMessageModal.querySelector('.submission-message-text').textContent = error.message || 'There was an error submitting your review. Please try again.';
                    if (okSubmissionBtn) okSubmissionBtn.style.background = '#dc3545';
                    submissionMessageModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {

                    document.body.style.overflow = '';

                    alert(error.message || 'Error submitting review');
                }
                submitBtn.textContent = 'Submit Review';
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    });

    if (closeSubmissionModalBtn) {
        closeSubmissionModalBtn.addEventListener('click', function () {
            if (submissionMessageModal) {
                submissionMessageModal.style.display = 'none';
                document.body.overflow = '';
            }
        });
    }

    if (okSubmissionBtn) {
        okSubmissionBtn.addEventListener('click', function () {
            if (submissionMessageModal) {
                submissionMessageModal.style.display = 'none';
                document.body.overflow = '';
            }

            submissionMessageModal.querySelector('.submission-message-title').textContent = 'Thank you!';
            submissionMessageModal.querySelector('.submission-message-title').style.color = '#28a745';
            if (okSubmissionBtn) okSubmissionBtn.style.background = '#007bff';
        });
    }


});


document.dispatchEvent(new CustomEvent('ratingUpdated', {
    detail: {
        productId: productId, // This `productId` must be defined in scope for this to work
    }
}));

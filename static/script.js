// ============================================================
// POTHOLE DETECTION - FRONTEND
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // ELEMENTS
    // ========================================================

    const imageInput = document.getElementById("imageInput");
    const browseButton = document.getElementById("browseButton");
    const dropZone = document.getElementById("dropZone");

    const uploadPlaceholder = document.getElementById("uploadPlaceholder");
    const previewContainer = document.getElementById("previewContainer");
    const previewImage = document.getElementById("previewImage");
    const fileName = document.getElementById("fileName");
    const removeImage = document.getElementById("removeImage");

    const confidenceSlider = document.getElementById("confidenceSlider");
    const confidenceValue = document.getElementById("confidenceValue");

    const analyzeButton = document.getElementById("analyzeButton");
    const analyzeText = document.getElementById("analyzeText");
    const loadingSpinner = document.getElementById("loadingSpinner");

    const errorMessage = document.getElementById("errorMessage");

    const resultsSection = document.getElementById("resultsSection");
    const resultImage = document.getElementById("resultImage");
    const downloadButton = document.getElementById("downloadButton");

    const detectionCount = document.getElementById("detectionCount");
    const averageConfidence = document.getElementById("averageConfidence");
    const highestConfidence = document.getElementById("highestConfidence");
    const processingTime = document.getElementById("processingTime");
    const detectionList = document.getElementById("detectionList");
    const detectionBadge = document.getElementById("detectionBadge");

    const analyzeAnother = document.getElementById("analyzeAnother");

    const startInspection = document.getElementById("startInspection");
    const viewSamples = document.getElementById("viewSamples");

    const navItems = document.querySelectorAll(".nav-item");
    const sampleButtons = document.querySelectorAll(".sample-card");

    // ========================================================
    // STATE
    // ========================================================

    let selectedFile = null;
    let selectedSample = null;

    // ========================================================
    // BASIC DEBUG
    // ========================================================

    console.log("Pothole Detection frontend loaded successfully.");

    // ========================================================
    // HELPERS
    // ========================================================

    function showError(message) {
        if (!errorMessage) {
            alert(message);
            return;
        }

        errorMessage.textContent = message;
        errorMessage.classList.remove("hidden");
        errorMessage.style.display = "block";
    }

    function hideError() {
        if (!errorMessage) {
            return;
        }

        errorMessage.textContent = "";
        errorMessage.classList.add("hidden");
        errorMessage.style.display = "none";
    }

    function scrollToSection(id) {
        const section = document.getElementById(id);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function setLoading(loading) {
        if (!analyzeButton) {
            return;
        }

        if (loading) {
            analyzeButton.disabled = true;

            if (analyzeText) {
                analyzeText.textContent = "Checking...";
            }

            if (loadingSpinner) {
                loadingSpinner.classList.remove("hidden");
                loadingSpinner.style.display = "inline-block";
            }
        } else {
            analyzeButton.disabled = false;

            if (analyzeText) {
                analyzeText.textContent = "Check for potholes";
            }

            if (loadingSpinner) {
                loadingSpinner.classList.add("hidden");
                loadingSpinner.style.display = "none";
            }
        }
    }

    function updateConfidence() {
        if (!confidenceSlider || !confidenceValue) {
            return;
        }

        const value = Number(confidenceSlider.value);

        confidenceValue.textContent = `${value}%`;
    }

    // ========================================================
    // CLEAR CURRENT IMAGE
    // ========================================================

    function clearSelection() {
        selectedFile = null;
        selectedSample = null;

        if (imageInput) {
            imageInput.value = "";
        }

        if (previewImage) {
            previewImage.removeAttribute("src");
        }

        if (fileName) {
            fileName.textContent = "";
        }

        if (previewContainer) {
            previewContainer.classList.add("hidden");
            previewContainer.style.display = "none";
        }

        if (uploadPlaceholder) {
            uploadPlaceholder.classList.remove("hidden");
            uploadPlaceholder.style.display = "";
        }

        if (dropZone) {
            dropZone.classList.remove("has-image");
        }
    }

    // ========================================================
    // FILE VALIDATION
    // ========================================================

    function validateFile(file) {
        if (!file) {
            return false;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        const maxSize = 10 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            showError("Please use a JPG, JPEG, PNG or WEBP image.");
            return false;
        }

        if (file.size > maxSize) {
            showError("Image is too large. Maximum size is 10 MB.");
            return false;
        }

        return true;
    }

    // ========================================================
    // HANDLE FILE
    // ========================================================

    function handleFile(file) {
        if (!file) {
            return;
        }

        hideError();

        if (!validateFile(file)) {
            return;
        }

        selectedFile = file;
        selectedSample = null;

        const reader = new FileReader();

        reader.onload = function (event) {

            if (previewImage) {
                previewImage.src = event.target.result;
            }

            if (fileName) {
                fileName.textContent = file.name;
            }

            if (previewContainer) {
                previewContainer.classList.remove("hidden");
                previewContainer.style.display = "block";
            }

            if (uploadPlaceholder) {
                uploadPlaceholder.classList.add("hidden");
                uploadPlaceholder.style.display = "none";
            }

            if (dropZone) {
                dropZone.classList.add("has-image");
            }
        };

        reader.onerror = function () {
            showError("Could not read the selected image.");
        };

        reader.readAsDataURL(file);
    }

    // ========================================================
    // BROWSE BUTTON
    // ========================================================

    if (browseButton && imageInput) {
        browseButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            imageInput.click();
        });
    }

    // ========================================================
    // FILE INPUT
    // ========================================================

    if (imageInput) {
        imageInput.addEventListener("change", function (event) {

            const file = event.target.files
                ? event.target.files[0]
                : null;

            handleFile(file);
        });
    }

    // ========================================================
    // DROP ZONE CLICK
    // ========================================================

    if (dropZone && imageInput) {
        dropZone.addEventListener("click", function (event) {

            // Do not trigger file picker when clicking buttons
            if (event.target.closest("button")) {
                return;
            }

            imageInput.click();
        });
    }

    // ========================================================
    // DRAG OVER
    // ========================================================

    if (dropZone) {
        dropZone.addEventListener("dragover", function (event) {
            event.preventDefault();

            dropZone.classList.add("dragging");
        });
    }

    // ========================================================
    // DRAG LEAVE
    // ========================================================

    if (dropZone) {
        dropZone.addEventListener("dragleave", function () {
            dropZone.classList.remove("dragging");
        });
    }

    // ========================================================
    // DROP
    // ========================================================

    if (dropZone) {
        dropZone.addEventListener("drop", function (event) {

            event.preventDefault();

            dropZone.classList.remove("dragging");

            const files = event.dataTransfer.files;

            if (!files || !files.length) {
                return;
            }

            handleFile(files[0]);
        });
    }

    // ========================================================
    // REMOVE IMAGE
    // ========================================================

    if (removeImage) {
        removeImage.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            clearSelection();
            hideError();
        });
    }

    // ========================================================
    // CONFIDENCE SLIDER
    // ========================================================

    if (confidenceSlider) {
        confidenceSlider.addEventListener("input", updateConfidence);

        updateConfidence();
    }

    // ========================================================
    // HOME - CHECK AN IMAGE
    // ========================================================

    if (startInspection) {
        startInspection.addEventListener("click", function () {
            scrollToSection("inspect");
        });
    }

    // ========================================================
    // HOME - VIEW SAMPLES
    // ========================================================

    if (viewSamples) {
        viewSamples.addEventListener("click", function () {
            scrollToSection("samples");
        });
    }

    // ========================================================
    // SAMPLE BUTTONS
    // ========================================================

    sampleButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            hideError();

            selectedFile = null;

            selectedSample = button.dataset.sample || null;

            if (!selectedSample) {
                showError("This sample image could not be selected.");
                return;
            }

            const imageUrl =
                button.dataset.image ||
                `/static/samples/${encodeURIComponent(selectedSample)}`;

            if (imageInput) {
                imageInput.value = "";
            }

            if (previewImage) {
                previewImage.src = imageUrl;
            }

            if (fileName) {
                fileName.textContent = selectedSample;
            }

            if (previewContainer) {
                previewContainer.classList.remove("hidden");
                previewContainer.style.display = "block";
            }

            if (uploadPlaceholder) {
                uploadPlaceholder.classList.add("hidden");
                uploadPlaceholder.style.display = "none";
            }

            if (dropZone) {
                dropZone.classList.add("has-image");
            }

            scrollToSection("inspect");
        });
    });

    // ========================================================
    // ANALYZE / PREDICT
    // ========================================================

    if (analyzeButton) {

        analyzeButton.addEventListener("click", async function () {

            hideError();

            if (!selectedFile && !selectedSample) {
                showError("Please upload an image or select a sample first.");
                scrollToSection("inspect");
                return;
            }

            const formData = new FormData();

            const confidence = confidenceSlider
                ? Number(confidenceSlider.value) / 100
                : 0.25;

            formData.append("confidence", confidence);

            if (selectedFile) {
                formData.append("image", selectedFile);
            } else {
                formData.append("sample", selectedSample);
            }

            setLoading(true);

            try {

                const response = await fetch("/predict", {
                    method: "POST",
                    body: formData
                });

                const responseText = await response.text();

                let data = null;

                if (responseText) {
                    try {
                        data = JSON.parse(responseText);
                    } catch (jsonError) {

                        console.error(
                            "Server returned non-JSON response:",
                            responseText
                        );

                        throw new Error(
                            "The server returned an invalid response."
                        );
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        `Server error (${response.status}).`
                    );
                }

                if (!data) {
                    throw new Error(
                        "The server returned an empty response."
                    );
                }

                displayResults(data);

            } catch (error) {

                console.error("Prediction error:", error);

                showError(
                    error.message ||
                    "Prediction failed. Please try again."
                );

            } finally {

                setLoading(false);
            }
        });
    }

    // ========================================================
    // DISPLAY RESULTS
    // ========================================================

    function displayResults(data) {

        console.log("Prediction result:", data);

        if (resultImage && data.result_image) {
            resultImage.src =
                `${data.result_image}?t=${Date.now()}`;

            resultImage.style.display = "block";
        }

        if (detectionCount) {
            detectionCount.textContent =
                data.count ?? 0;
        }

        if (detectionBadge) {
            detectionBadge.textContent =
                data.count ?? 0;
        }

        if (averageConfidence) {
            averageConfidence.textContent =
                `${Number(
                    data.average_confidence ?? 0
                ).toFixed(2)}%`;
        }

        if (highestConfidence) {
            highestConfidence.textContent =
                `${Number(
                    data.highest_confidence ?? 0
                ).toFixed(2)}%`;
        }

        if (processingTime) {
            processingTime.textContent =
                `${Number(
                    data.processing_time ?? 0
                ).toFixed(2)}s`;
        }

        // ====================================================
        // INDIVIDUAL DETECTIONS
        // ====================================================

        if (detectionList) {

            detectionList.innerHTML = "";

            const detections = Array.isArray(data.detections)
                ? data.detections
                : [];

            if (detections.length === 0) {

                detectionList.innerHTML = `
                    <div class="empty-detection">
                        No potholes detected above the selected confidence.
                    </div>
                `;

            } else {

                detections.forEach(function (detection, index) {

                    const item =
                        document.createElement("div");

                    item.className = "detection-item";

                    const className =
                        escapeHtml(
                            detection.class || "Pothole"
                        );

                    const confidence =
                        Number(
                            detection.confidence ?? 0
                        ).toFixed(2);

                    item.innerHTML = `
                        <div class="detection-dot"></div>

                        <div class="detection-info">
                            <strong>
                                ${className} ${index + 1}
                            </strong>
                        </div>

                        <div class="detection-confidence">
                            ${confidence}%
                        </div>
                    `;

                    detectionList.appendChild(item);
                });
            }
        }

        // ====================================================
        // DOWNLOAD
        // ====================================================

        if (downloadButton && data.result_image) {

            downloadButton.href = data.result_image;

            downloadButton.download =
                "pothole-detection-result.jpg";
        }

        // ====================================================
        // SHOW RESULTS
        // ====================================================

        if (resultsSection) {

            resultsSection.classList.remove("hidden");
            resultsSection.style.display = "block";

            setTimeout(function () {

                resultsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 100);
        }
    }

    // ========================================================
    // CHECK ANOTHER IMAGE
    // ========================================================

    if (analyzeAnother) {

        analyzeAnother.addEventListener("click", function () {

            clearSelection();
            hideError();

            if (resultsSection) {
                resultsSection.classList.add("hidden");
                resultsSection.style.display = "none";
            }

            scrollToSection("inspect");
        });
    }

    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // ========================================================
    // NAVIGATION
    // ========================================================

    navItems.forEach(function (link) {

        link.addEventListener("click", function () {

            navItems.forEach(function (item) {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });
    });

    // ========================================================
    // ACTIVE NAVIGATION ON SCROLL
    // ========================================================

    const sections =
        document.querySelectorAll(".page-section[id]");

    if (
        sections.length &&
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(function (entry) {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        const id = entry.target.id;

                        navItems.forEach(function (link) {

                            const href =
                                link.getAttribute("href");

                            link.classList.toggle(
                                "active",
                                href === `#${id}`
                            );
                        });
                    });
                },
                {
                    threshold: 0.2
                }
            );

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

});
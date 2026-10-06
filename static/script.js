document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const imageInput =
        document.getElementById("imageInput");

    const browseButton =
        document.getElementById("browseButton");

    const dropZone =
        document.getElementById("dropZone");

    const uploadPlaceholder =
        document.getElementById("uploadPlaceholder");

    const previewContainer =
        document.getElementById("previewContainer");

    const previewImage =
        document.getElementById("previewImage");

    const fileName =
        document.getElementById("fileName");

    const removeImage =
        document.getElementById("removeImage");

    const analyzeButton =
        document.getElementById("analyzeButton");

    const analyzeText =
        document.getElementById("analyzeText");

    const loadingSpinner =
        document.getElementById("loadingSpinner");

    const errorMessage =
        document.getElementById("errorMessage");

    const confidenceSlider =
        document.getElementById("confidenceSlider");

    const confidenceValue =
        document.getElementById("confidenceValue");

    const resultsSection =
        document.getElementById("resultsSection");

    const resultImage =
        document.getElementById("resultImage");

    const downloadButton =
        document.getElementById("downloadButton");

    const detectionCount =
        document.getElementById("detectionCount");

    const detectionBadge =
        document.getElementById("detectionBadge");

    const averageConfidence =
        document.getElementById("averageConfidence");

    const highestConfidence =
        document.getElementById("highestConfidence");

    const processingTime =
        document.getElementById("processingTime");

    const detectionList =
        document.getElementById("detectionList");

    const analyzeAnother =
        document.getElementById("analyzeAnother");

    const startInspection =
        document.getElementById("startInspection");

    const viewSamples =
        document.getElementById("viewSamples");


    /* =====================================================
       STATE
    ====================================================== */

    let selectedFile = null;

    let selectedSample = null;


    /* =====================================================
       CONFIG
    ====================================================== */

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    const maxFileSize =
        10 * 1024 * 1024;


    /* =====================================================
       HERO BUTTONS
    ====================================================== */

    startInspection.addEventListener(
        "click",
        () => {

            document
                .getElementById("inspect")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    viewSamples.addEventListener(
        "click",
        () => {

            document
                .getElementById("samples")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    /* =====================================================
       CONFIDENCE
    ====================================================== */

    confidenceSlider.addEventListener(
        "input",
        () => {

            confidenceValue.textContent =
                confidenceSlider.value + "%";

        }
    );


    /* =====================================================
       BROWSE
    ====================================================== */

    browseButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            imageInput.click();

        }
    );


    /* =====================================================
       DROP ZONE CLICK
    ====================================================== */

    dropZone.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#removeImage"
                )
            ) {
                return;
            }

            imageInput.click();

        }
    );


    /* =====================================================
       FILE INPUT
    ====================================================== */

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files[0];

            if (file) {

                handleFile(file);

            }

        }
    );


    /* =====================================================
       VALIDATE FILE
    ====================================================== */

    function validateFile(file) {

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            showError(
                "Please choose a JPG, JPEG, PNG or WEBP image."
            );

            return false;
        }


        if (
            file.size > maxFileSize
        ) {

            showError(
                "The image must be smaller than 10 MB."
            );

            return false;
        }


        return true;
    }


    /* =====================================================
       HANDLE FILE
    ====================================================== */

    function handleFile(file) {

        clearError();


        if (
            !validateFile(file)
        ) {

            imageInput.value = "";

            return;
        }


        selectedFile = file;

        selectedSample = null;


        const reader =
            new FileReader();


        reader.onload =
            event => {

                previewImage.src =
                    event.target.result;

                fileName.textContent =
                    file.name;

                uploadPlaceholder.classList.add(
                    "hidden"
                );

                previewContainer.classList.remove(
                    "hidden"
                );

            };


        reader.readAsDataURL(file);

    }


    /* =====================================================
       REMOVE
    ====================================================== */

    removeImage.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            resetInput();

        }
    );


    /* =====================================================
       DRAG AND DROP
    ====================================================== */

    [
        "dragenter",
        "dragover"
    ].forEach(
        name => {

            dropZone.addEventListener(
                name,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    dropZone.classList.add(
                        "dragover"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        name => {

            dropZone.addEventListener(
                name,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    dropZone.classList.remove(
                        "dragover"
                    );

                }
            );

        }
    );


    dropZone.addEventListener(
        "drop",
        event => {

            const files =
                event.dataTransfer.files;

            if (
                files.length
            ) {

                handleFile(
                    files[0]
                );

            }

        }
    );


    /* =====================================================
       SAMPLE IMAGES
    ====================================================== */

    const sampleCards =
        document.querySelectorAll(
            ".sample-card"
        );


    sampleCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const sample =
                        card.dataset.sample;

                    if (!sample) {
                        return;
                    }


                    selectedSample =
                        sample;

                    selectedFile =
                        null;

                    imageInput.value =
                        "";


                    const image =
                        card.querySelector(
                            "img"
                        );


                    if (image) {

                        previewImage.src =
                            image.src;

                    }


                    fileName.textContent =
                        sample;


                    uploadPlaceholder.classList.add(
                        "hidden"
                    );

                    previewContainer.classList.remove(
                        "hidden"
                    );


                    document
                        .getElementById("inspect")
                        .scrollIntoView({
                            behavior: "smooth"
                        });

                }
            );

        }
    );


    /* =====================================================
       ANALYZE
    ====================================================== */

    analyzeButton.addEventListener(
        "click",
        async () => {

            clearError();


            if (
                !selectedFile &&
                !selectedSample
            ) {

                showError(
                    "Choose an image before checking for potholes."
                );

                return;
            }


            setLoading(true);


            const formData =
                new FormData();


            const confidence =
                parseInt(
                    confidenceSlider.value
                ) / 100;


            formData.append(
                "confidence",
                confidence.toString()
            );


            if (selectedFile) {

                formData.append(
                    "image",
                    selectedFile
                );

            } else {

                formData.append(
                    "sample",
                    selectedSample
                );

            }


            try {

                const response =
                    await fetch(
                        "/predict",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Unable to analyze this image."
                    );

                }


                displayResults(
                    data
                );


            } catch (error) {

                console.error(
                    error
                );

                showError(
                    error.message ||
                    "Something went wrong while checking the image."
                );

            } finally {

                setLoading(false);

            }

        }
    );


    /* =====================================================
       DISPLAY RESULTS
    ====================================================== */

    function displayResults(data) {

        resultImage.src =
            data.result_image +
            "?t=" +
            Date.now();


        downloadButton.href =
            data.result_image;


        detectionCount.textContent =
            data.count;


        detectionBadge.textContent =
            data.count;


        averageConfidence.textContent =
            data.average_confidence +
            "%";


        highestConfidence.textContent =
            data.highest_confidence +
            "%";


        processingTime.textContent =
            data.processing_time +
            "s";


        renderDetections(
            data.detections
        );


        resultsSection.classList.remove(
            "hidden"
        );


        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =====================================================
       DETECTIONS
    ====================================================== */

    function renderDetections(
        detections
    ) {

        detectionList.innerHTML = "";


        if (
            !detections ||
            detections.length === 0
        ) {

            detectionList.innerHTML = `
                <div class="no-detection">
                    No potholes were detected at this confidence level.
                </div>
            `;

            return;
        }


        detections.forEach(
            (item, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "detection-row";


                row.innerHTML = `

                    <div class="detection-name">

                        <span class="detection-dot"></span>

                        <span>
                            Pothole ${index + 1}
                        </span>

                    </div>

                    <span class="detection-confidence">
                        ${item.confidence}%
                    </span>

                `;


                detectionList.appendChild(
                    row
                );

            }
        );

    }


    /* =====================================================
       LOADING
    ====================================================== */

    function setLoading(
        loading
    ) {

        analyzeButton.disabled =
            loading;


        if (loading) {

            analyzeText.textContent =
                "Checking image...";

            loadingSpinner.classList.remove(
                "hidden"
            );

        } else {

            analyzeText.textContent =
                "Check for potholes";

            loadingSpinner.classList.add(
                "hidden"
            );

        }

    }


    /* =====================================================
       RESET
    ====================================================== */

    function resetInput() {

        selectedFile =
            null;

        selectedSample =
            null;

        imageInput.value =
            "";

        previewImage.src =
            "";

        fileName.textContent =
            "";

        uploadPlaceholder.classList.remove(
            "hidden"
        );

        previewContainer.classList.add(
            "hidden"
        );

        clearError();

    }


    /* =====================================================
       ANALYZE ANOTHER
    ====================================================== */

    analyzeAnother.addEventListener(
        "click",
        () => {

            resultsSection.classList.add(
                "hidden"
            );


            resetInput();


            document
                .getElementById("inspect")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    /* =====================================================
       ERRORS
    ====================================================== */

    function showError(
        message
    ) {

        errorMessage.textContent =
            message;

        errorMessage.classList.remove(
            "hidden"
        );

    }


    function clearError() {

        errorMessage.textContent =
            "";

        errorMessage.classList.add(
            "hidden"
        );

    }


    /* =====================================================
       NAVIGATION
    ====================================================== */

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    navItems.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                    item.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================================
       ACTIVE NAV ON SCROLL
    ====================================================== */

    const sections =
        document.querySelectorAll(
            ".page-section"
        );


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        const id =
                            entry.target.id;


                        const matching =
                            document.querySelector(
                                `.nav-item[href="#${id}"]`
                            );


                        if (!matching) {
                            return;
                        }


                        navItems.forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                        matching.classList.add(
                            "active"
                        );

                    }
                );

            },
            {
                rootMargin:
                    "-25% 0px -60% 0px"
            }
        );


    sections.forEach(
        section =>
            observer.observe(section)
    );

});
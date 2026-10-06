from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
from werkzeug.utils import secure_filename
from PIL import Image
import os
import uuid
import time


# ============================================================
# APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "best.pt"
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "static",
    "uploads"
)

RESULT_FOLDER = os.path.join(
    BASE_DIR,
    "static",
    "results"
)

SAMPLE_FOLDER = os.path.join(
    BASE_DIR,
    "static",
    "samples"
)


# ============================================================
# CONFIGURATION
# ============================================================

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}

MAX_FILE_SIZE = 10 * 1024 * 1024

app.config[
    "MAX_CONTENT_LENGTH"
] = MAX_FILE_SIZE


# ============================================================
# DIRECTORIES
# ============================================================

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

os.makedirs(
    RESULT_FOLDER,
    exist_ok=True
)

os.makedirs(
    SAMPLE_FOLDER,
    exist_ok=True
)


# ============================================================
# MODEL
# ============================================================

print("=" * 60)
print("POTHOLE DETECTION")
print("=" * 60)

print(
    "Loading fine-tuned YOLOv8 model..."
)

print(
    "Model:",
    MODEL_PATH
)


if not os.path.exists(
    MODEL_PATH
):

    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )


model = YOLO(
    MODEL_PATH
)


print(
    "Model loaded successfully."
)

print(
    "Classes:",
    model.names
)

print("=" * 60)


# ============================================================
# HELPERS
# ============================================================

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(
            ".",
            1
        )[1].lower()
        in ALLOWED_EXTENSIONS
    )


def get_samples():

    samples = []


    if not os.path.exists(
        SAMPLE_FOLDER
    ):

        return samples


    for filename in sorted(
        os.listdir(
            SAMPLE_FOLDER
        )
    ):

        if allowed_file(
            filename
        ):

            samples.append({

                "name":
                    filename,

                "url":
                    f"/static/samples/{filename}"

            })


    return samples


# ============================================================
# DETECTION
# ============================================================

def run_detection(
    image_path,
    confidence_threshold=0.25
):

    start_time = time.time()


    results = model.predict(

        source=image_path,

        conf=confidence_threshold,

        imgsz=640,

        save=False,

        verbose=False

    )


    result = results[0]


    # ========================================================
    # ANNOTATED IMAGE
    # ========================================================

    output_name = (
        f"result_{uuid.uuid4().hex}.jpg"
    )


    output_path = os.path.join(
        RESULT_FOLDER,
        output_name
    )


    annotated = result.plot()


    Image.fromarray(
        annotated[:, :, ::-1]
    ).save(
        output_path,
        quality=95
    )


    # ========================================================
    # DETECTIONS
    # ========================================================

    detections = []


    if result.boxes is not None:

        for box in result.boxes:

            confidence = float(
                box.conf[0]
            )


            class_id = int(
                box.cls[0]
            )


            class_name = model.names[
                class_id
            ]


            coordinates = (
                box.xyxy[0]
                .tolist()
            )


            detections.append({

                "class":
                    class_name,

                "confidence":
                    round(
                        confidence * 100,
                        2
                    ),

                "box": [
                    round(
                        value,
                        2
                    )
                    for value in coordinates
                ]

            })


    detections.sort(
        key=lambda item:
            item["confidence"],
        reverse=True
    )


    # ========================================================
    # SUMMARY
    # ========================================================

    count = len(
        detections
    )


    if count:

        confidences = [

            item["confidence"]

            for item in detections

        ]


        average_confidence = round(

            sum(confidences)
            /
            len(confidences),

            2

        )


        highest_confidence = max(
            confidences
        )

    else:

        average_confidence = 0

        highest_confidence = 0


    processing_time = round(

        time.time()
        -
        start_time,

        2

    )


    return {

        "result_image":
            "/static/results/"
            + output_name,

        "detections":
            detections,

        "count":
            count,

        "average_confidence":
            average_confidence,

        "highest_confidence":
            highest_confidence,

        "processing_time":
            processing_time

    }


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return render_template(

        "index.html",

        samples=get_samples()

    )


# ============================================================
# PREDICT
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    image_path = None


    # ========================================================
    # CONFIDENCE
    # ========================================================

    try:

        confidence_threshold = float(

            request.form.get(
                "confidence",
                0.25
            )

        )

    except (
        ValueError,
        TypeError
    ):

        confidence_threshold = 0.25


    confidence_threshold = max(

        0.10,

        min(
            confidence_threshold,
            0.90
        )

    )


    # ========================================================
    # UPLOAD
    # ========================================================

    if "image" in request.files:

        file = request.files[
            "image"
        ]


        if file.filename == "":

            return jsonify({

                "error":
                    "Please select an image."

            }), 400


        if not allowed_file(
            file.filename
        ):

            return jsonify({

                "error":
                    "Please use JPG, JPEG, PNG or WEBP."

            }), 400


        original_name = secure_filename(
            file.filename
        )


        unique_name = (

            f"{uuid.uuid4().hex}_"
            f"{original_name}"

        )


        image_path = os.path.join(

            UPLOAD_FOLDER,

            unique_name

        )


        file.save(
            image_path
        )


    # ========================================================
    # SAMPLE
    # ========================================================

    elif request.form.get(
        "sample"
    ):

        sample_name = os.path.basename(

            request.form.get(
                "sample"
            )

        )


        candidate = os.path.join(

            SAMPLE_FOLDER,

            sample_name

        )


        if not os.path.exists(
            candidate
        ):

            return jsonify({

                "error":
                    "Selected sample was not found."

            }), 404


        image_path = candidate


    # ========================================================
    # NOTHING
    # ========================================================

    else:

        return jsonify({

            "error":
                "Please upload an image or select a sample."

        }), 400


    # ========================================================
    # RUN MODEL
    # ========================================================

    try:

        output = run_detection(

            image_path,

            confidence_threshold

        )


        return jsonify(
            output
        )


    except Exception as error:

        print(
            "Prediction error:",
            error
        )


        return jsonify({

            "error":
                "Prediction failed. Please try another image."

        }), 500


# ============================================================
# HEALTH
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "model":
            "YOLOv8 fine-tuned for pothole detection"

    })


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=7860,

        debug=False

    )
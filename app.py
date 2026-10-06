from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
from werkzeug.utils import secure_filename
from PIL import Image
import torch
import os
import uuid
import time


# ==================================================
# Flask application
# ==================================================

app = Flask(__name__)


# ==================================================
# Paths
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

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


# ==================================================
# Configuration
# ==================================================

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}

MAX_FILE_SIZE = 10 * 1024 * 1024

app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


# ==================================================
# Create required folders
# ==================================================

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
os.makedirs(SAMPLE_FOLDER, exist_ok=True)


# ==================================================
# CPU optimization
# ==================================================

# Render Free has a very small CPU allocation.
# Limit PyTorch to one CPU thread.
try:
    torch.set_num_threads(1)
except Exception:
    pass

try:
    torch.set_num_interop_threads(1)
except Exception:
    pass


# ==================================================
# Load YOLO model
# ==================================================

print("=" * 60)
print("POTHOLE DETECTION")
print("=" * 60)

print("Loading fine-tuned YOLOv8 model...")
print("Model:", MODEL_PATH)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )

model = YOLO(MODEL_PATH)

print("Model loaded successfully.")
print("Classes:", model.names)
print("Device: CPU")
print("Image size: 416")
print("=" * 60)


# ==================================================
# Utility functions
# ==================================================

def allowed_file(filename):
    """
    Check whether an uploaded file has an allowed extension.
    """
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


def get_samples():
    """
    Return all valid sample images from static/samples.
    """

    samples = []

    if not os.path.exists(SAMPLE_FOLDER):
        return samples

    for filename in sorted(os.listdir(SAMPLE_FOLDER)):

        if allowed_file(filename):

            samples.append({
                "name": filename,
                "url": f"/static/samples/{filename}"
            })

    return samples


# ==================================================
# YOLO detection
# ==================================================

def run_detection(
    image_path,
    confidence_threshold=0.25
):

    start_time = time.time()

    print("-" * 60)
    print("Starting prediction")
    print("Image:", image_path)
    print("Confidence:", confidence_threshold)

    try:

        results = model.predict(
            source=image_path,

            # Lower resolution for Render Free.
            # This reduces CPU and RAM requirements.
            imgsz=416,

            # Explicitly force CPU.
            device="cpu",

            # CPU does not use half precision.
            half=False,

            conf=confidence_threshold,

            # Keep inference lightweight.
            max_det=20,

            save=False,
            verbose=False
        )

        result = results[0]

        print("YOLO inference completed.")

        # --------------------------------------------------
        # Save annotated result
        # --------------------------------------------------

        output_name = (
            f"result_{uuid.uuid4().hex}.jpg"
        )

        output_path = os.path.join(
            RESULT_FOLDER,
            output_name
        )

        annotated = result.plot()

        # YOLO returns BGR numpy image.
        # Convert to RGB before PIL saving.
        Image.fromarray(
            annotated[:, :, ::-1]
        ).save(
            output_path,
            quality=90,
            optimize=True
        )

        # --------------------------------------------------
        # Extract detections
        # --------------------------------------------------

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

                    "class": class_name,

                    "confidence": round(
                        confidence * 100,
                        2
                    ),

                    "box": [
                        round(value, 2)
                        for value in coordinates
                    ]
                })

        # Highest confidence first.
        detections.sort(
            key=lambda item: item["confidence"],
            reverse=True
        )

        # --------------------------------------------------
        # Statistics
        # --------------------------------------------------

        count = len(detections)

        if count > 0:

            confidences = [
                item["confidence"]
                for item in detections
            ]

            average_confidence = round(
                sum(confidences)
                / len(confidences),
                2
            )

            highest_confidence = max(
                confidences
            )

        else:

            average_confidence = 0
            highest_confidence = 0

        processing_time = round(
            time.time() - start_time,
            2
        )

        print(
            f"Detections: {count}"
        )

        print(
            f"Processing time: "
            f"{processing_time}s"
        )

        print("Prediction completed.")
        print("-" * 60)

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

    except Exception as error:

        print("=" * 60)
        print("PREDICTION ERROR")
        print(repr(error))
        print("=" * 60)

        raise


# ==================================================
# Routes
# ==================================================

@app.route("/")
def home():

    return render_template(
        "index.html",
        samples=get_samples()
    )


@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    image_path = None

    # --------------------------------------------------
    # Confidence threshold
    # --------------------------------------------------

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

    # --------------------------------------------------
    # Uploaded image
    # --------------------------------------------------

    if "image" in request.files:

        file = request.files["image"]

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

        file.save(image_path)

    # --------------------------------------------------
    # Sample image
    # --------------------------------------------------

    elif request.form.get("sample"):

        sample_name = os.path.basename(
            request.form.get("sample")
        )

        candidate = os.path.join(
            SAMPLE_FOLDER,
            sample_name
        )

        if not os.path.exists(candidate):

            return jsonify({
                "error":
                    "Selected sample was not found."
            }), 404

        image_path = candidate

    # --------------------------------------------------
    # No image
    # --------------------------------------------------

    else:

        return jsonify({
            "error":
                "Please upload an image or select a sample."
        }), 400

    # --------------------------------------------------
    # Run detection
    # --------------------------------------------------

    try:

        output = run_detection(
            image_path,
            confidence_threshold
        )

        return jsonify(output)

    except Exception as error:

        print(
            "Prediction error:",
            repr(error)
        )

        return jsonify({
            "error":
                "Prediction failed. "
                "The server could not complete "
                "YOLO inference."
        }), 500


# ==================================================
# Health check
# ==================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "model":
            "YOLOv8 fine-tuned for pothole detection",

        "device":
            "cpu",

        "image_size":
            416
    })


# ==================================================
# File too large
# ==================================================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "error":
            "Image is too large. "
            "Maximum size is 10 MB."
    }), 413


# ==================================================
# General server error
# ==================================================

@app.errorhandler(500)
def internal_server_error(error):

    return jsonify({
        "error":
            "Internal server error."
    }), 500


# ==================================================
# Local development
# ==================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=7860,
        debug=False
    )
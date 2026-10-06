---
title: Pothole Detection
emoji: 🕳️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
short_description: Detect potholes from road images using YOLOv8.
---

# Pothole Detection

A simple web application for detecting potholes in road images.

Upload an image or choose a sample image and the application
will highlight detected potholes along with their confidence scores.

## Features

- Upload road images
- Drag and drop
- Sample road images
- Pothole detection
- Bounding boxes
- Confidence scores
- Detection count
- Average confidence
- Highest confidence
- Processing time
- Downloadable result

## Model

The application uses a fine-tuned YOLOv8 object detection model
trained for pothole detection.

## Pipeline

Road Image → YOLOv8 → Pothole Detection → Annotated Image

## Input

JPG, JPEG, PNG and WEBP images up to 10 MB.

## Output

An annotated image showing detected potholes and their confidence scores.
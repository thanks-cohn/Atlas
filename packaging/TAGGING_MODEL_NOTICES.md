# Model provenance and redistribution

Weights are downloaded at build time, never committed as opaque binaries. See
`src/atlas_companion/tagging-models.json` for immutable revisions, exact URLs,
byte lengths and SHA-256 checksums. Runtime verifies every selected model.

- YOLO11n: Ultralytics YOLO11, AGPL-3.0 / commercial licensing from Ultralytics.
  This ONNX conversion is published by unileon-robotics, not an official
  Ultralytics-hosted ONNX export. Upstream: https://github.com/ultralytics/ultralytics
  License: https://github.com/ultralytics/ultralytics/blob/main/LICENSE
- MobileFaceNet FER: Apache-2.0 per its README; YuNet: MIT. OpenCV Zoo model directories and their respective
  licenses: https://github.com/opencv/opencv_zoo/tree/main/models/facial_expression_recognition
  and https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
- JoyTag: fancyfeast/joytag, Apache-2.0 per official model-card metadata; pinned ONNX and tag vocabulary:
  https://huggingface.co/fancyfeast/joytag

These notices identify upstream terms; they do not grant a separate license.
A proprietary commercial release needs review of the YOLO AGPL/commercial terms.
No facial identity recognition is implemented. Expression outputs are model
predictions about visible appearance, not facts about a person's internal state.

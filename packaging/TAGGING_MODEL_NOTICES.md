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

## Rich tagging candidate (separate from default release)

- RAM++ authors: OPPO / Xinyu Huang, Yi-Jie Huang, Youcai Zhang et al.
  Original code/weights: https://github.com/xinyu1205/recognize-anything and
  https://huggingface.co/xinyu1205/recognize-anything-plus-model . Apache-2.0.
  The fixed FP32 export is from CannotFindObject/RAM_ONNX, revision
  `6c4ca81fb841e359c043c1e8f92f62bf5c3b8c18`, also declared Apache-2.0.
  Atlas changes: dynamic INT8 quantization of MatMul only with ORT 1.20.1;
  convolution remains floating point. This is not the incompatible third-party
  all-operator INT8 checkpoint. Preserve `RAM-plus-Apache-2.0.txt`.
- MiVOLO v2: Maksim Kuprashevich and Irina Tolstykh (2023); Maksim
  Kuprashevich, Grigorii Alekseenko and Irina Tolstykh (2024).
  Authors' checkpoint `iitolstykh/mivolo_v2`, revision
  `53393526c220e34cdd7b722b36d22b6f9e5f4241`, declares Apache-2.0;
  architecture commit `37475e3f8818b5f22448003feec3e64b01bfb188` at
  https://github.com/WildChlamydia/MiVOLO has an Apache-2.0 LICENSE.
  Atlas changes: fixed batch-one ONNX export of the unmodified learned head,
  with an exporter symbolic for Col2Im. Preserve `MiVOLO-Apache-2.0.txt`.
- Face/person detector: authors' `iitolstykh/YOLO-Face-Person-Detector`, revision
  `b3d071aedccd46a3b2d4b40609da6880a815f395`, is **AGPL-3.0**, not Apache-2.0.
  Source and terms: https://huggingface.co/iitolstykh/YOLO-Face-Person-Detector
  and https://github.com/ultralytics/ultralytics/tree/v8.3.0 . Atlas changes:
  fixed 640x640 batch-one ONNX export; volatile metadata removed. The bundled
  `YOLO11-AGPL-3.0.txt` is the AGPL text, also applicable to this candidate.
  The candidate does NOT resolve the existing proprietary/commercial licensing
  gate. Do not present Apache licensing of MiVOLO as licensing its detector.

The reproducible exporter, manifests and source references accompany the
candidate. These notices do not claim proprietary redistribution permission.
Age and male/female appearance scores are estimates; no identification, family
relationships, or identity attributes are inferred. No export tool, upstream
Python model code, PyTorch or Ultralytics runtime is needed by the installed user.

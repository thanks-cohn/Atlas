# Atlas: local photo-tagging setup (experimental)

The image preview now has **Generate tags**. It calls the paired local companion endpoint `/v1/tag-image`, which runs one selected inference at a time. Object results are persisted before facial-expression inference starts. The preview then shows both sets of suggestions independently of human tags.

**This is not yet a validated turnkey release.** The inference dependencies and checkpoint files are not bundled. The model-specific CPU inference, face alignment and Windows packaging need real-image testing. No model downloads automatically, and no image is sent to a cloud service.

## Explicit local installation

Use the **same Python environment as the running source companion** (the packaged EXE does not inherit pip-installed packages). For the source companion, install:

```sh
python -m pip install ultralytics opencv-python-headless numpy
```

Check the upstream licenses and your intended distribution. Ultralytics has separate AGPL-3.0 and enterprise licensing options; this experimental integration is not a claim of permission to redistribute it commercially.

Put checkpoint files in `<companion state directory>/tagging-models/`:

- `yolo11n.pt` — the official YOLO11 nano COCO object-detection checkpoint, from https://docs.ultralytics.com/models/yolo11/ . Model filename is checked before loading; no implicit download on preview opening.
- `facial_expression_recognition_mobilefacenet_2022july_int8.onnx` — official OpenCV Zoo FER checkpoint at https://github.com/opencv/opencv_zoo/tree/main/models/facial_expression_recognition . This is only needed when facial expressions are selected.

Model filenames must match exactly. Source and checksum verification plus packaging in the companion installer are outstanding. Total checkpoint weights are far below 500 MB, but inference runtime dependencies are substantially larger; installation footprints and 4GB-machine RAM must be measured.

## Behavior

1. Open an image. No tagger runs automatically.
2. Leave “Tag this image?” selected for objects. Optionally tick “Detect facial expressions?”.
3. Press “Generate tags”. Atlas runs objects first, saves the results, then runs the facial model if selected, and saves those results.
4. Model suggestions appear **below human tags**, with source names and confidence shown on hover. They are not automatically inserted into user-authored tags.
5. Failure leaves earlier completed model results intact, reports an error, and does not fabricate tags.

JoyTag remains hidden until activated, and its preview execution is **not implemented yet**; enabling the checkbox cannot trigger a phantom run.

## Known limitations

The baseline YOLO11 COCO vocabulary covers persons, cars, dogs, cats, and other ordinary objects, **not dress/man/woman/child specifics**, face traits or body parts. The facial-expression model is seven-class and is currently paired with a basic frontal-face crop rather than upstream five-point landmark alignment; scores should be regarded as preliminary. Browser canvas security may prevent reading remote image covers until they are stored locally or served with suitable CORS. A shared companion lock rejects competing inference requests rather than parallelizing them. Tags are keyed by bookmark URL at present; durable per-image identity, rerun history, hash-verified downloads and training exports need follow-up work.

Do not describe this implementation as fully smoke-tested on the user's Windows installation until it has actually been tested with both official models.

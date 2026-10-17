# Sequential image tagging contract

Status: initial integration, requires optional local model installation and end-to-end validation.

## Execution order and memory policy

Atlas **never runs object and facial-expression inference concurrently** for a single Generate Tags action. Selected sources are resolved in order:
1. Object detection (if selected).
2. Facial expression detection (if selected).
3. Optional JoyTag (only when independently activated and its future connector is installed).

The preview's controller awaits the complete response for a model **and saves its results** before sending the next model request. There is no Promise.all, parallel batch, or simultaneous model instantiation. The companion also guards inference with a process-level lock: concurrent requests from another preview or tab are rejected as busy rather than starting a competing run. A future work queue may serialize those requests, but must not overlap inference.

Only a manual **Generate tags** click initiates inference; neither opening the preview nor changing selections triggers it. The UI remains within two rows inside the opened image preview, never on the pinboard grid. Human-authored tags remain independent; machine suggestions carry source/model identity and scores.

## Model roles and present limitations

- **Objects:** `yolo11n.pt` (COCO-80) detects basic common objects, animals and persons. It does not support garments, estimated age/gender, or body-part labels.
- **Facial expressions:** OpenCV Zoo's quantized MobileFaceNet FER checkpoint (opt-in), using frontal face localization. Its seven categories are expressions inferred from appearance, not a reliable measurement of internal feelings.
- **JoyTag:** optional and hidden until activated. The separately isolated JoyTag experiment exists but is not yet integrated in the preview tagging endpoint.

Models and inference libraries are optional and are never downloaded automatically. No cloud inference. Generated suggestions currently persist in extension-local storage, separately by URL/source. Full immutable run histories, saved display profiles, model installers and training export pipelines remain follow-on implementation work.

## Validation required

Test with a real local image and correctly installed model weights in the running companion environment; verify the object run completes and persists before the facial run begins. Confirm only one inference runs at once across multiple tabs, and that a missing model produces an error without adding fabricated tags. Validate RAM, peak memory, preprocessing and licenses before a production release.

// Layout operations permute positions; they never invoke window restoration.
// Apply the same operation to the restore baseline so later Restore changes size,
// not the deliberate placement the user just chose.
export function rearrange(preferences, action, index = 0) {
  if (action === 'vertical') {
    preferences.reversed[index] = !preferences.reversed[index];
  } else if (action === 'columns') {
    preferences.swapped = !preferences.swapped;
    preferences.ratio = 100 - preferences.ratio;
  } else if (action === 'viewers') {
    preferences.viewerSwapped = !preferences.viewerSwapped;
  } else if (action === 'explorers') {
    rearrange(preferences, 'columns');
    rearrange(preferences, 'viewers');
  }
}

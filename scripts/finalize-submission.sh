#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PDF="$PROJECT_DIR/submission/final-assets/Sanchez_JuanManuel_SHPE_AI_Hackathon_Presentation.pdf"
VIDEO="${1:-$PROJECT_DIR/submission/final-assets/Sanchez_JuanManuel_SHPE_AI_Hackathon_Video.mp4}"
ZIP="$PROJECT_DIR/submission/Sanchez_JuanManuel_SHPE_AI_Hackathon.zip"

if [[ ! -f "$PDF" ]]; then
  echo "Missing presentation PDF: $PDF" >&2
  exit 1
fi

if [[ ! -f "$VIDEO" ]]; then
  echo "Missing video: $VIDEO" >&2
  echo "Pass the MP4 path as the first argument after recording." >&2
  exit 1
fi

PAGES="$(pdfinfo "$PDF" | awk '/^Pages:/ {print $2}')"
if [[ "$PAGES" != "4" ]]; then
  echo "Presentation must contain exactly 4 pages; found $PAGES." >&2
  exit 1
fi

if command -v ffprobe >/dev/null 2>&1; then
  DURATION="$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$VIDEO")"
  if awk "BEGIN {exit !($DURATION > 180.5)}"; then
    echo "Video exceeds 3 minutes: ${DURATION}s" >&2
    exit 1
  fi
  echo "Video duration: ${DURATION}s"
else
  echo "Warning: ffprobe is unavailable; video duration was not automatically checked."
fi

if [[ -e "$ZIP" ]]; then
  echo "Refusing to overwrite existing ZIP: $ZIP" >&2
  exit 1
fi

zip -j "$ZIP" "$PDF" "$VIDEO" >/dev/null
SIZE="$(stat -f%z "$ZIP")"
if (( SIZE > 52428800 )); then
  echo "ZIP exceeds the 50 MB submission limit: $SIZE bytes" >&2
  exit 1
fi

echo "Submission ZIP created: $ZIP"
echo "ZIP size: $SIZE bytes"

#!/usr/bin/env bash
# Real PulseAudio output for headless browsers; Web Audio itself is never mocked.
set -euo pipefail
AUDIO_RUNTIME_DIR="${RUNNER_TEMP:-/tmp}/to-startup-pulse"
mkdir -p "$AUDIO_RUNTIME_DIR"
chmod 700 "$AUDIO_RUNTIME_DIR"
export PULSE_RUNTIME_PATH="$AUDIO_RUNTIME_DIR"
export PULSE_SERVER="unix:$AUDIO_RUNTIME_DIR/native"
pulseaudio --daemonize=yes --exit-idle-time=-1 --use-pid-file=no \
  --log-target="file:$AUDIO_RUNTIME_DIR/pulse.log" -n \
  --load="module-native-protocol-unix socket=$AUDIO_RUNTIME_DIR/native auth-anonymous=1" \
  --load="module-null-sink sink_name=ci_audio rate=44100 channels=2"
pactl set-default-sink ci_audio
pactl list short sinks
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'PULSE_SERVER=%s\nPULSE_RUNTIME_PATH=%s\n' "$PULSE_SERVER" "$PULSE_RUNTIME_PATH" >> "$GITHUB_ENV"
fi

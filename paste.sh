#!/usr/bin/env bash
export XDG_RUNTIME_DIR=/run/user/1000
export WAYLAND_DISPLAY=wayland-1

while :; do
	wl-paste
	wl-paste --watch wl-paste 2>/dev/null || echo "err"
done

#!/usr/bin/env bash
websocketd --port=6009 --staticdir=. "$@" ./paste.sh

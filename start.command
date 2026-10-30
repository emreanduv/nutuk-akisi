#!/bin/sh
# Mac'te çift tıkla: sunucuyu başlatır ve yayını tarayıcıda açar.
cd "$(dirname "$0")"
( sleep 2; open "http://127.0.0.1:8769/?yayin=1" ) &
exec python3 server.py "$@"

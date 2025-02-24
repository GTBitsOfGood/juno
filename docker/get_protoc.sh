#!/bin/sh

if [ "$TARGETARCH" = "amd64" ]; then
    wget -O protoc.zip "https://github.com/protocolbuffers/protobuf/releases/download/v29.3/protoc-29.3-linux-x86_64.zip"
elif [ "$TARGETARCH" = "arm64" ]; then
    wget -O protoc.zip "https://github.com/protocolbuffers/protobuf/releases/download/v29.3/protoc-29.3-linux-aarch_64.zip"
fi

unzip protoc.zip -d protoc

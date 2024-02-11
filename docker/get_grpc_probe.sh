#!/bin/sh

if [ "$TARGETARCH" = "amd64" ]; then
    wget -O grpc_health_probe "https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.24/grpc_health_probe-linux-amd64"
elif [ "$TARGETARCH" = "arm64" ]; then
    wget -O grpc_health_probe "https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.24/grpc_health_probe-linux-arm64"
fi

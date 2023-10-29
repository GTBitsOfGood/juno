#!/bin/bash

for dir in ../*/; do
    dirname=$(basename "$dir")
    if [ -d "$dir" ] && [ "$dirname" != "bog-utils" ] && [ "$dirname" != "proto" ]; then
        ln -s "$(pwd)"/ "$dir"/bog-utils
    fi
done
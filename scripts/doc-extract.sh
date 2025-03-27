#!/bin/sh

# A utility script for autogenerating the OpenAPI SDK code.
# 
# Swagger OpenAPI documentation has a super neat way of automatically generating SDK code from an API page. Unfortunately, this process has been fairly manual and tedious--this script automates the vast majority of it.
#
# Keep in mind that this script is ONLY for if you need to update the SDK without releasing Juno. Upon a new release, the Juno-SDK repository has a GitHub action for fetching the latest SDK code. This is more for the "oh no, I forgot I needed that feature in juno for this part of the sdk to work."
#
# Make sure you have Juno running before running this script, preferably with start:dev:up-all. 
#

# extract gateway information from running juno instance
gateway_container_id=$(docker ps -q --filter "ancestor=juno-api-gateway")
gateway_container_port=$(docker port $gateway_container_id)

gateway_public_port=$(echo "$gateway_container_port" | grep -oP "0.0.0.0:\K\d+")

# grab doc yaml
curl "localhost:$gateway_public_port/docs-yaml" > docs-yaml

# run gen client sdk script 
pnpm gen-client-sdk

echo "Successfully generated SDK code. You can find it under .openapi-generator."

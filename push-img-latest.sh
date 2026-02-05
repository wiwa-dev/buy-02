#!/bin/bash

DOCKER_USER="wiwadev01"
TAG="latest"

SERVICES=(
  "config-server"
  "discovery"
  "gateway"
  "user-service"
  "product-service"
  "media-service"
)

echo "=== ⬆ Push des images Docker ==="

for svc in "${SERVICES[@]}"
do
    IMAGE="${DOCKER_USER}/${svc}:${TAG}"
    echo "➡ Pushing ${IMAGE} ..."
    docker push ${IMAGE}
done

echo "✔ Push terminé"

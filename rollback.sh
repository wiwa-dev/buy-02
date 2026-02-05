#!/bin/bash

# ========================================
# ROLLBACK BACKUP SCRIPT
# Sauvegarde la version courante en `previous`
# ========================================

# Liste de tous tes services
SERVICES=(
  "config-server"
  "discovery"
  "gateway"
  "user-service"
  "product-service"
  "media-service"
  "front-service"
)

DOCKER_USER="wiwadev01"
TAG_CURRENT="latest"
TAG_BACKUP="previous"

echo "=== 🔄 Sauvegarde des images courantes → previous ==="

for svc in "${SERVICES[@]}"
do
    IMAGE="${DOCKER_USER}/${svc}:${TAG_CURRENT}"

    echo "➡  Image courante : ${IMAGE}"

    # 1️⃣ Pull de la version latest (au cas où Jenkins ne l’a pas localement)
    docker pull ${IMAGE} || {
        echo "❌ Impossible de pull ${IMAGE}, rollback impossible"
        exit 1
    }

    # 2️⃣ Retag en previous
    echo "↪  Retag ${TAG_CURRENT} → ${TAG_BACKUP}"
    docker tag ${IMAGE} ${DOCKER_USER}/${svc}:${TAG_BACKUP}

    # 3️⃣ Push du tag previous
    echo "⬆  Push de l’image previous : ${DOCKER_USER}/${svc}:${TAG_BACKUP}"
    docker push ${DOCKER_USER}/${svc}:${TAG_BACKUP}
done

echo "✔ Sauvegarde terminée — toutes les images previous sont à jour !"

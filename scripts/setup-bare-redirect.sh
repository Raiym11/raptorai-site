#!/usr/bin/env bash
# Настраивает бакет raptorai.ru (без www) как 301-редирект
# на https://www.raptorai.ru с сохранением пути.
#
# Idempotent: можно запускать повторно — ничего не сломается.
#
# Нужны переменные окружения:
#   AWS_ACCESS_KEY_ID      — ID статического ключа сервисного аккаунта Yandex Cloud
#   AWS_SECRET_ACCESS_KEY  — секрет этого ключа
set -euo pipefail

BARE_BUCKET="raptorai.ru"
TARGET_HOST="www.raptorai.ru"
ENDPOINT="https://storage.yandexcloud.net"

export AWS_DEFAULT_REGION=ru-central1
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required

s3()    { aws s3    --endpoint-url "$ENDPOINT" "$@"; }
s3api() { aws s3api --endpoint-url "$ENDPOINT" "$@"; }

echo "=== Настройка редиректа $BARE_BUCKET → https://$TARGET_HOST ==="

# 1. Удаляем старое содержимое бакета (если есть)
echo "→ Очистка бакета $BARE_BUCKET..."
s3 rm "s3://$BARE_BUCKET" --recursive 2>/dev/null || true

# 2. Ставим website-конфигурацию: редирект всех запросов
echo "→ Настройка website redirect..."
s3api put-bucket-website \
  --bucket "$BARE_BUCKET" \
  --website-configuration '{
    "RedirectAllRequestsTo": {
      "HostName": "'"$TARGET_HOST"'",
      "Protocol": "https"
    }
  }'

echo "✓ Готово: http(s)://$BARE_BUCKET/* → https://$TARGET_HOST/*"
echo ""
echo "Убедитесь, что DNS для $BARE_BUCKET указывает на"
echo "$BARE_BUCKET.website.yandexcloud.net (CNAME или ANAME/ALIAS)."

#!/usr/bin/env bash
# Выкладывает собранный сайт (папка out/ после `npm run build`) в бакет Yandex Object Storage.
#
# Нужны переменные окружения:
#   YC_BUCKET              — имя бакета, например www.raptorai.ru
#   AWS_ACCESS_KEY_ID      — ID статического ключа сервисного аккаунта Yandex Cloud
#   AWS_SECRET_ACCESS_KEY  — секрет этого ключа
set -euo pipefail

: "${YC_BUCKET:?Не задан YC_BUCKET}"
export AWS_DEFAULT_REGION=ru-central1
# Новые версии aws cli по умолчанию шлют контрольные суммы, которые S3-совместимые хранилища
# поддерживают не всегда — включаем их только там, где они обязательны.
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required

s3() { aws s3 --endpoint-url https://storage.yandexcloud.net "$@"; }
DEST="s3://${YC_BUCKET}"
HTML_TYPE="text/html; charset=utf-8"

cd "$(dirname "$0")/../out"

# Красивые адреса: /blog отдаётся из объекта "blog" (копия blog.html).
# Object Storage сам не подставляет .html, поэтому кладём копию без расширения.
mapfile -t PAGES < <(find . -name '*.html' ! -path './index.html' ! -path './404.html' ! -name '_not-found.html' \
  | sed -e 's|^\./||' -e 's|\.html$||' | sort)
KEEP=()
for p in "${PAGES[@]}"; do KEEP+=(--exclude "$p"); done

echo "→ Статика Next.js (с хешами в именах — кешируется навсегда)"
s3 sync . "$DEST" --exclude '*' --include '_next/static/*' \
  --cache-control 'public, max-age=31536000, immutable'

echo "→ Остальные файлы: шрифты, скрипты, картинки"
s3 sync . "$DEST" --exclude '_next/static/*' --exclude '*.html' "${KEEP[@]}" \
  --cache-control 'public, max-age=86400'

echo "→ HTML-страницы (без кеша, чтобы обновления были видны сразу)"
s3 sync . "$DEST" --exclude '*' --include '*.html' \
  --content-type "$HTML_TYPE" --cache-control 'no-cache'

echo "→ Адреса без .html"
for p in "${PAGES[@]}"; do
  s3 cp "$p.html" "$DEST/$p" --content-type "$HTML_TYPE" --cache-control 'no-cache' --only-show-errors
done

echo "→ Удаление файлов, которых больше нет в сборке"
s3 sync . "$DEST" --delete "${KEEP[@]}"

echo "Готово: https://${YC_BUCKET}/"

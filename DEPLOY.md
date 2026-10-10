# Переезд raptorai.ru на Yandex Object Storage

Сайт собирается в статику (`npm run build` → папка `out/`), а GitHub Actions
(`.github/workflows/deploy-yandex.yml`) после каждого push в `master` выкладывает её
в бакет Yandex Cloud. Хостинг в России, без Vercel и Cloudflare.

Шаги 1–5 можно делать, пока сайт ещё работает на Vercel, — посетители ничего не заметят.
Переключение происходит только на шаге 7.

---

## 1. Аккаунт Yandex Cloud

1. Зайдите на https://console.yandex.cloud и войдите через Яндекс ID.
2. Создайте платёжный аккаунт (нужна карта). Новым пользователям дают стартовый грант,
   а у Object Storage есть бесплатный лимит — для сайта такого размера счёт обычно ~0 ₽.
   Актуальные условия: https://yandex.cloud/ru/docs/storage/pricing

## 2. Бакет для сайта

Object Storage → **Создать бакет**:

| Поле | Значение |
|---|---|
| Имя | `www.raptorai.ru` (обязательно ровно так — имя должно совпадать с доменом) |
| Макс. размер | 1 ГБ |
| Доступ на чтение объектов | **Публичный** |
| Доступ к списку объектов | Ограниченный |
| Класс хранилища | Стандартное |

Затем в бакете → вкладка **Веб-сайт** → **Хостинг**:
- Главная страница: `index.html`
- Страница ошибки: `404.html`

## 3. Ключ доступа для GitHub

1. В каталоге → **Сервисные аккаунты** → **Создать**: имя `github-deploy`,
   роль `storage.editor`.
2. Откройте аккаунт → **Создать новый ключ** → **Статический ключ доступа**.
3. Сохраните **ID ключа** и **секретный ключ** — секрет показывается один раз.

## 4. Настройка GitHub

Репозиторий `Raiym11/raptorai-site` → **Settings → Secrets and variables → Actions**:

- вкладка **Secrets** → New repository secret:
  - `YC_ACCESS_KEY_ID` — ID ключа
  - `YC_SECRET_ACCESS_KEY` — секретный ключ
- вкладка **Variables** → New repository variable:
  - `YC_BUCKET` = `www.raptorai.ru`

Затем **Actions → Deploy to Yandex Object Storage → Run workflow**.
Когда запуск станет зелёным, сайт откроется по временному адресу:
http://www.raptorai.ru.website.yandexcloud.net

Проверьте главную, блог, форму заявки и чат.

## 5. HTTPS-сертификат

> Важно сделать **до** переключения DNS: на Vercel сайт отдавал HSTS
> (`includeSubDomains; preload`), и браузеры, где сайт уже открывали, без HTTPS его не покажут.

1. **Certificate Manager → Добавить сертификат → Сертификат от Let's Encrypt**.
   Домены: `www.raptorai.ru` и `raptorai.ru`. Тип проверки: **DNS** (CNAME).
2. Консоль покажет CNAME-записи вида `_acme-challenge.www.raptorai.ru`.
   Добавьте их у регистратора домена (там, где сейчас настроен DNS).
3. Дождитесь статуса **Issued** (обычно 10–60 минут).
4. Бакет `www.raptorai.ru` → **HTTPS** → источник **Certificate Manager** → выберите сертификат.

## 6. Редирект с raptorai.ru на www

Сейчас `raptorai.ru` перенаправляет на `www.raptorai.ru` — сохраним это:

1. Создайте второй бакет с именем `raptorai.ru` (публичный доступ на чтение).
2. **Веб-сайт → Переадресация**: домен `www.raptorai.ru`, протокол `HTTPS`.
3. **HTTPS** → тот же сертификат.

## 7. Переключение DNS

У регистратора домена:

| Запись | Тип | Значение |
|---|---|---|
| `www` | CNAME | `www.raptorai.ru.website.yandexcloud.net.` |
| `@` (raptorai.ru) | ANAME / ALIAS | `raptorai.ru.website.yandexcloud.net.` |

- Старые записи Vercel для `www` и `@` удалите. **Не трогайте** запись `n8n` и записи почты (MX, TXT).
- Для корневого домена (`@`) обычный CNAME нельзя. Если регистратор не поддерживает ANAME/ALIAS,
  есть два пути: перенести DNS-зону в Yandex Cloud DNS (поддерживает ANAME) или включить
  у регистратора услугу «перенаправление домена» на `https://www.raptorai.ru`.
- За сутки до переключения уменьшите TTL записей до 300, чтобы смена прошла быстрее.

Через 5–60 минут сайт начнёт открываться с Yandex Cloud.

## 8. После переезда

- Убедитесь, что `https://www.raptorai.ru` и `https://raptorai.ru` открываются по HTTPS.
- Попросите знакомых из России проверить сайт с разных провайдеров и мобильного интернета.
- В Vercel: проект → Settings → Git → **Disconnect**, чтобы он перестал собирать сайт.
- В Яндекс.Вебмастере и Google Search Console ничего менять не нужно — домен тот же.

## Как обновлять сайт

Как раньше: правите файлы → push в `master` → через 1–2 минуты изменения на сайте.
Ход деплоя виден во вкладке **Actions** на GitHub.

Вручную (если установлен aws cli):

```bash
npm run build
YC_BUCKET=www.raptorai.ru AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... bash scripts/deploy-yandex.sh
```

## Что осталось за рубежом

`n8n.raptorai.ru` (форма заявки и чат) работает на сервере Hostkey в Нидерландах.
Из России он тоже может открываться нестабильно — его стоит перенести на российский VPS
(Timeweb Cloud, Selectel, Yandex Compute Cloud).

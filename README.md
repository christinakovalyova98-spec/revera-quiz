# Квиз Revera для женщин 40+ в менопаузе

## Что внутри

- `index.html`: весь квиз одним файлом, без фреймворков и сборки. Весь копирайт лежит в массиве `FLOW` в начале скрипта.
- `img/`: 5 фигур (shape-1…4 и shape-fit) без фона, webp. Цель на финале: 4→3, 3→2, 2→fit, 1→fit.
- `api/submit.js`: serverless-функция Vercel, отправляет лид в Telegram.
- `tests/run_tests.py`: автотест Playwright (счётчик, скролл, email, баллы, сегменты, консоль).
- `tests/shots.py`: скриншоты всех экранов.

## Деплой: GitHub → Vercel

1. Залить папку в репозиторий GitHub.
2. В Vercel: New Project → импорт репозитория. Framework Preset: Other. Build Command и Output Directory оставить пустыми.
3. Settings → Environment Variables: `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Пока их нет, функция молча пропускает отправку и отвечает 200, пользователь ошибки не видит.
4. Redeploy.

## Как получить переменные

- `TELEGRAM_BOT_TOKEN`: создать бота через @BotFather, команда /newbot.
- `TELEGRAM_CHAT_ID`: написать боту любое сообщение, открыть `https://api.telegram.org/bot<TOKEN>/getUpdates`, взять `chat.id`.

## Тесты

```
pip install playwright && python -m playwright install chromium
python tests/run_tests.py
```

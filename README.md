# Career Daily

Браузерный симулятор рабочих дней в IT-команде: офис, DevOS, задачи, встречи, HR.

Стек: Java 17, Spring Boot 3, PostgreSQL / H2, vanilla JS. Maven-артефакт и пакеты Java — `devsimulator` (`com.devsimulator`).

[Архитектура](ARCHITECTURE.md) · [Товарные знаки](TRADEMARKS.md)

---

## Запуск

### Docker

```bash
docker compose up -d --build
```

| Что | URL / порт |
|-----|------------|
| Игра | http://localhost:3000 |
| API (gateway) | http://localhost:8080 |
| PostgreSQL | `localhost:5433`, БД `devsimulator`, пользователь `devsimulator` |

Админ: `admin` / `admin` (обычная форма входа).

Windows:

```powershell
.\scripts\docker-up.ps1
```

Если Docker Hub недоступен (`TLS handshake timeout`): VPN, зеркало в Docker Desktop или локальный запуск ниже. Образы можно переопределить через `.env` (см. `.env.example`).

### Без Docker

```powershell
.\scripts\start-local.ps1
```

Игра: http://localhost:3000 · JDK 17+ · Node.js · Maven не нужен (`mvnw.cmd`).

Остановка: `.\scripts\stop-local.ps1`

Данные H2: `./data/auth`, `./data/game`.

Сборка вручную:

```powershell
.\mvnw.cmd package -pl auth-service,game-service,gateway -am -DskipTests
```

---

## Регистрация

Для пользователей из РФ: обязательный телефон **+7**, опциональный email (`.ru`, Яндекс, Mail.ru). Зарубежные почтовые домены не принимаются.

Подтверждение номера — SMS-код. В dev-коде (`app.sms.provider=log`) код пишется в лог auth-service и показывается на экране. Для prod — [SMS.ru](https://sms.ru):

```properties
app.sms.provider=smsru
app.sms.smsru.api-id=ваш-api-id
```

Капча при регистрации: математическая задача (по умолчанию) или Yandex SmartCaptcha — см. `auth-service/.../application.properties`.

---

## Структура репозитория

```
frontend/          UI (nginx в Docker)
gateway/           Spring Cloud Gateway :8080
auth-service/      Логин, регистрация, админка :8081
game-service/      Игровой движок, сохранения :8082
common/            JWT, общая security
scripts/           docker-up, start-local, create-db
```

Подробнее — [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Игровой цикл

1 игровой день = 1 реальный час (09:00–17:00 на DevOS).

```
Офис → DevOS → задачи и коммуникации → конец дня
```

Режимы: знакомство (без кода), учебный, спокойный, реалистичный, челлендж.

Минимум карьеры — 7 игровых дней; победа — 10 уровень (не раньше 7-го дня).

---

## API (через gateway)

| Метод | Путь | Сервис |
|-------|------|--------|
| `POST` | `/api/auth/login` | auth |
| `POST` | `/api/auth/register` | auth |
| `POST` | `/api/auth/phone/send-code` | auth |
| `GET` | `/api/game/state` | game |
| `POST` | `/api/game/start` | game |
| `POST` | `/api/game/end-day` | game |

JWT: заголовок `Authorization: Bearer <token>`.

---

## Лицензия

MIT — [LICENSE](LICENSE).

Названия Slack, JIRA, IntelliJ IDEA и др. — товарные знаки соответствующих компаний; проект с ними не связан.

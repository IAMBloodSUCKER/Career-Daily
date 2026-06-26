-- Создание пользователя и базы для Java Dev Daily
-- Запуск: scripts/create-db.ps1 (от имени postgres)

CREATE USER devsimulator WITH PASSWORD 'devsimulator';
CREATE DATABASE devsimulator OWNER devsimulator ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE devsimulator TO devsimulator;

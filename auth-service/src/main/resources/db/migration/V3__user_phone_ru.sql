-- Регистрация для РФ: телефон +7, email опционален (только российские домены)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(16) UNIQUE;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

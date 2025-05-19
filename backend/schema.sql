CREATE TABLE IF NOT EXISTS restaurants (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    phone           VARCHAR(25),
    email           VARCHAR(120),
    address         TEXT,
    latitude        DECIMAL(18,15) NOT NULL,
    longitude       DECIMAL(18,15) NOT NULL,
    seats_total     INT CHECK (seats_total > 0),
    -- seats_free manejada dinámicamente por intervalos
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    google_id       VARCHAR(60) UNIQUE,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password        VARCHAR(255),
    name            VARCHAR(120),
    role            VARCHAR(20) DEFAULT 'customer',
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT auth_method CHECK (
        (google_id IS NOT NULL AND password IS NULL) OR
        (google_id IS NULL AND password IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS reservations (
    id                    SERIAL PRIMARY KEY,
    user_id               INT REFERENCES users(id),
    restaurant_id         INT REFERENCES restaurants(id),
    reservation_at        TIMESTAMP NOT NULL,
    requested_guests      INT CHECK (requested_guests > 0),
    guests                INT CHECK (guests > 0),
    status                VARCHAR(20) DEFAULT 'pending',
    presence_confirmed    BOOLEAN DEFAULT FALSE,
    presence_confirmed_at TIMESTAMP,
    created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT);
COPY users FROM '/data/users.csv' WITH (FORMAT csv, HEADER true);

CREATE TABLE tasks (id SERIAL PRIMARY KEY, title TEXT, product_id INTEGER, user_id INTEGER);
COPY tasks FROM '/data/tasks.csv' WITH (FORMAT csv, HEADER true);

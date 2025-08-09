CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price NUMERIC);
COPY products FROM '/data/products.csv' WITH (FORMAT csv, HEADER true);

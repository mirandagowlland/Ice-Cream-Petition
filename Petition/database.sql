CREATE TABLE signatures(id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) not null,
    last_name VARCHAR(100) not null,
    signature TEXT,
    timestamp TIMESTAMP default current_TIMESTAMP)

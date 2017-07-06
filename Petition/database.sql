CREATE TABLE signatures(id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) not null,
    lastname VARCHAR(100) not null,
    signature TEXT,
    timestamp TIMESTAMP default current_TIMESTAMP)

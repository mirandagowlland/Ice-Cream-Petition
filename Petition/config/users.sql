CREATE TABLE users(id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) not null,
    lastname VARCHAR(100) not null,
    email VARCHAR (100) not null unique,
    password VARCHAR (100) not null,
    timestamp TIMESTAMP default current_TIMESTAMP);

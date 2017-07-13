CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature TEXT,
    user_id INTEGER references users(id),
    timestamp TIMESTAMP default current_TIMESTAMP);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(100),
    homepage VARCHAR (100),
    user_id INTEGER references users(id));

CREATE TABLE reviews (
    reviewID SERIAL PRIMARY KEY NOT NULL,
    showName TEXT NOT NULL,
    review TEXT NOT NULL,
    reviewDate VARCHAR(10) NOT NULL
);
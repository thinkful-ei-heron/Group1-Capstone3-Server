require('dotenv').config();

module.exports = {
    "migrationDirectory": "migrations",
    "driver": "pg",
    "connectionString": (process.env.NODE_ENV === 'test')
        ? process.env.DB_TEST_URL
        : process.env.DB_URL,
    "ssl": !!process.env.SSL
};
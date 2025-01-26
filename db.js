const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 70000,
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Connection error', err.stack));

module.exports = { client };

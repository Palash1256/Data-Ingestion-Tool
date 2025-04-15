const express = require('express');
const cors = require('cors'); // Import CORS library
const { createClient } = require('@clickhouse/client');
const routes = require('./routes'); // Import routes

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON data
app.use(express.json());

// Initialize ClickHouse client
const clickhouse = createClient({
    url: 'https://l1d0nxqxfe.ap-south-1.aws.clickhouse.cloud:8443',
    username: 'default',
    password: 'aT7rpBOTv_k3o',
});

// Use routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

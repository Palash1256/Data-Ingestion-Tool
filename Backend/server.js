const express = require('express');
const cors = require('cors'); // Import CORS library to handle cross-origin requests
const { createClient } = require('@clickhouse/client'); // Import ClickHouse client
const routes = require('./routes'); // Import routes

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port with fallback

// Use CORS middleware to allow cross-origin requests
app.use(cors());

// Middleware to parse JSON data in incoming requests
app.use(express.json());

// Use routes middleware
app.use('/', routes);

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`); // Log server start message
});
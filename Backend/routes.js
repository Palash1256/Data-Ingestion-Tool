const express = require('express');
const cors = require('cors'); // Import CORS library
const { createClient } = require('@clickhouse/client');
const jwt = require('jsonwebtoken'); // Import JWT library
const router = express.Router();

// Use CORS middleware
router.use(cors());

// POST /upload-file endpoint
router.post('/upload-file', async (req, res) => {
    try {
        const { jsonData, tableName } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        const updatedData = jsonData.map(entry => {
            const newEntry = {};
            for (const key in entry) {
                const newKey = key.replace(/ /g, "_");
                newEntry[newKey] = entry[key];
            }
            return newEntry;
        });

        if (!token) {
            return res.status(401).send('Unauthorized: Missing token');
        }

        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
            return res.status(400).send('Invalid or empty data provided.');
        }

        // Decode JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const { host, database, username, password } = decoded;

        // ClickHouse Client
        const clickhouse = createClient({
            url: host,
            username: username,
            password: password,
            database: database,
        });

        // Check if table exists
        const tableExistsQuery = `EXISTS TABLE ${tableName}`;
        const tableExistsResponse = await clickhouse.query({ query: tableExistsQuery });
        const tableExists = (await tableExistsResponse.json()).data[0]?.result === 1;

        // Create table if not exists
        if (!tableExists) {
            const columnsDef = Object.keys(updatedData[0])
                .map((key) => `${key} String`) // Assuming all columns are of type String
                .join(', ');

            const createTableQuery = `
                CREATE TABLE ${tableName} (
                    ${columnsDef}
                ) ENGINE = MergeTree() ORDER BY tuple();
            `;
           const createResult =  await clickhouse.query({ query: createTableQuery });
           
           console.log(createResult)
        }

        // Insert using JSONEachRow format (safer and cleaner)
        const InsertResult = await clickhouse.insert({
            table: tableName,
            values: updatedData,
            format: 'JSONEachRow',
        });
        console.log(InsertResult.summary)

        res.status(200).json({ success: true, result: InsertResult.summary , tableName:tableName});

    } catch (error) {
        console.log("Catch err");
        console.error('Error ingesting data:', error);
        res.status(500).json({
            message: 'An error occurred while ingesting data into ClickHouse.',
            error: error.message,
        });
    }
});

// POST /connect endpoint
router.post('/connect', async (req, res) => {
    try {
        const { host, database, username, password } = req.body;

        if (!host || !database || !username || !password) {
            return res.status(400).send('Missing required connection details.');
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
                const remainingTime = decoded.exp * 1000 - Date.now();
                if (remainingTime > 0) {
                    return res.status(200).json({
                        message: 'Already connected. Session still valid.',
                        success: true,
                        expiresAt: decoded.exp * 1000,
                    });
                }
            } catch (err) {
                // Token expired or invalid, proceed to create a new connection
            }
        }

        const clickhouse = createClient({
            url: host,
            username: username,
            password: password,
            database: database,
        });

        await clickhouse.ping();

        const response = await clickhouse.query({ query: `SHOW TABLES` });
        const tables = (await response.json()).data.map((table) => table.name || table);

        const newToken = jwt.sign(
            { host, database, username, password },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '60m' } // Set session expiration to 5 minutes
        );

        res.status(200).json({
            message: 'Connection successful',
            token: newToken,
            tables,
            success: true,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });
    } catch (error) {
        console.error('Connection error:', error);
        res.status(500).send('Failed to connect to ClickHouse.');
    }
});

// POST /get-columns endpoint
router.post('/get-columns', async (req, res) => {
    try {
        const { tableName } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send('Unauthorized: Missing token');
        }

        // Decode the JWT token to retrieve connection details
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const { host, database, username, password } = decoded;

        // Create a new ClickHouse client with decoded details
        const clickhouse = createClient({
            url: host,
            username: username,
            password: password,
            database: database,
        });

        // Fetch column names for the specified table
        const response = await clickhouse.query({
            query: `DESCRIBE TABLE ${tableName}`,
        });
        const columns = (await response.json()).data.map((col) => col.name);

        res.status(200).json({ success: true, columns });
    } catch (error) {
        console.error('Error fetching columns:', error);
        res.status(500).send('Failed to fetch columns.');
    }
});

// POST /get-table-data endpoint
router.post('/get-table-data', async (req, res) => {
    try {
        const { tableName } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send('Unauthorized: Missing token');
        }

        // Decode the JWT token to retrieve connection details
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const { host, database, username, password } = decoded;

        // Create a new ClickHouse client with decoded details
        const clickhouse = createClient({
            url: host,
            username: username,
            password: password,
            database: database,
        });

        // Fetch data from the specified table
        const response = await clickhouse.query({
            query: `SELECT * FROM ${tableName} LIMIT 100`, 
        });
        const data = await response.json();

        res.status(200).json({ success: true, data: data.data });
    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).send('Failed to fetch table data.');
    }
});

// POST /get-tables endpoint
router.post('/get-tables', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send('Unauthorized: Missing token');
        }

        // Decode the JWT token to retrieve connection details
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const { host, database, username, password } = decoded;

        // Create a new ClickHouse client with decoded details
        const clickhouse = createClient({
            url: host,
            username: username,
            password: password,
            database: database,
        });

        // Fetch tables from the database
        const response = await clickhouse.query({
            query: `SHOW TABLES`,
        });
        const tables = await response.json();

        res.status(200).json({ success: true, tables: tables.data });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).send('Failed to fetch tables.');
    }
});

module.exports = router;

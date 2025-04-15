# Data Ingestion Tool Backend

The Data Ingestion Tool Backend is an Express.js-based server that facilitates data ingestion into ClickHouse. It provides APIs for connecting to ClickHouse, fetching tables and columns, uploading files, and ingesting data.

## Features

- **Connect to ClickHouse**: Establish a connection to a ClickHouse database.
- **Fetch Tables and Columns**: Retrieve available tables and their columns.
- **File Upload**: Upload CSV or Excel files for ingestion.
- **Data Ingestion**: Ingest data into ClickHouse tables.
- **JWT Authentication**: Secure API endpoints using JSON Web Tokens.

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)
- A ClickHouse database instance

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in the `.env` file:
   ```
   JWT_SECRET=your_secret_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. The server will run at:
   ```
   http://localhost:3000
   ```

## API Endpoints

### 1. **POST /connect**
   Establish a connection to ClickHouse.

   **Request Body**:
   ```json
   {
     "host": "ClickHouse URL",
     "database": "Database Name",
     "username": "Username",
     "password": "Password"
   }
   ```

   **Response**:
   - `200 OK`: Connection successful with a JWT token.
   - `400 Bad Request`: Missing connection details.
   - `500 Internal Server Error`: Connection failed.

---

### 2. **POST /get-tables**
   Fetch available tables in the connected database.

   **Headers**:
   - `Authorization: Bearer <JWT Token>`

   **Response**:
   - `200 OK`: List of tables.
   - `401 Unauthorized`: Missing or invalid token.
   - `500 Internal Server Error`: Failed to fetch tables.

---

### 3. **POST /get-columns**
   Fetch columns for a specific table.

   **Headers**:
   - `Authorization: Bearer <JWT Token>`

   **Request Body**:
   ```json
   {
     "tableName": "Table Name"
   }
   ```

   **Response**:
   - `200 OK`: List of columns.
   - `401 Unauthorized`: Missing or invalid token.
   - `500 Internal Server Error`: Failed to fetch columns.

---

### 4. **POST /get-table-data**
   Fetch data from a specific table.

   **Headers**:
   - `Authorization: Bearer <JWT Token>`

   **Request Body**:
   ```json
   {
     "tableName": "Table Name"
   }
   ```

   **Response**:
   - `200 OK`: Table data.
   - `401 Unauthorized`: Missing or invalid token.
   - `500 Internal Server Error`: Failed to fetch data.

---

### 5. **POST /upload-file**
   Upload and ingest data into ClickHouse.

   **Headers**:
   - `Authorization: Bearer <JWT Token>`

   **Request Body**:
   ```json
   {
     "jsonData": [ { "column1": "value1", "column2": "value2" } ],
     "tableName": "Table Name"
   }
   ```

   **Response**:
   - `200 OK`: File uploaded successfully.
   - `400 Bad Request`: Invalid or empty data.
   - `401 Unauthorized`: Missing or invalid token.
   - `500 Internal Server Error`: Ingestion failed.

## Folder Structure

```
Backend/
├── routes.js          # API routes
├── server.js          # Server entry point
├── .env               # Environment variables
├── package.json       # Project metadata and dependencies
└── README.md          # Project documentation
```

## Technologies Used

- **Express.js**: Web framework for building APIs.
- **ClickHouse Client**: Node.js client for interacting with ClickHouse.
- **JWT**: JSON Web Tokens for authentication.
- **CORS**: Middleware for handling cross-origin requests.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

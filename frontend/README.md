# Data Ingestion Tool Frontend

The Data Ingestion Tool Frontend is a React-based application designed to facilitate data ingestion from various sources like ClickHouse and Flat Files. It provides an intuitive interface for connecting to data sources, selecting tables and columns, previewing data, and starting the ingestion process.

## Features

- **Source Selection**: Choose between ClickHouse or Flat File as the data source.
- **Connection Parameters**: Input connection details for ClickHouse.
- **Table and Column Selection**: Fetch tables, select columns, and preview data.
- **File Upload**: Upload CSV or Excel files for ingestion.
- **Data Preview**: Preview selected data before ingestion.
- **Ingestion**: Start the ingestion process and monitor status updates.

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend URL in the `.env` file:
   ```
   VITE_APP_BACKEND_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open the application in your browser at:
   ```
   http://localhost:5173
   ```

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm run preview`: Preview the production build.
- `npm run lint`: Run ESLint to check for code quality issues.

## Folder Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   ├── index.css         # Global styles
│   └── App.css           # Component-specific styles
├── public/               # Static assets
├── .env                  # Environment variables
├── vite.config.js        # Vite configuration
├── package.json          # Project metadata and dependencies
└── README.md             # Project documentation
```

## Technologies Used

- **React**: Frontend library for building user interfaces.
- **Vite**: Build tool for fast development.
- **Tailwind CSS**: Utility-first CSS framework.
- **Axios**: HTTP client for API requests.
- **PapaParse**: CSV parsing library.
- **XLSX**: Excel file handling library.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

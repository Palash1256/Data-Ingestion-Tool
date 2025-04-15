import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from 'axios';

const FileUploader = () => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL;
    console.log(backendUrl)
    const [sourceType, setSourceType] = useState('');
    const [dataType, setDataType] = useState('');
    const [connectionParams, setConnectionParams] = useState({
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
    });
    const [status, setStatus] = useState('');
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [fileData, setFileData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isConnected,setIsConnected] = useState(false);
    const [isPreviewClicked,setIsPreviewClicked]=useState(false);
    const [tableName,setTableName]=useState("");

    const handleConnectionChange = (e) => {
        const { name, value } = e.target;
        setConnectionParams((prev) => ({ ...prev, [name]: value }));
      
    };

    const connectToSource = async () => {
        setStatus('Connecting...');
        try {
            const response = await axios.post(
                `${backendUrl}/connect`,
                connectionParams
            );
            console.log(response.data);
            if (response.data.success) {
                localStorage.setItem('jwtToken', response.data.token);
                setTables(response.data.tables);
                setStatus(`Connected`);
                setIsConnected(true);
            } else {
                setStatus('Error: Unable to connect');
            }
        } catch (error) {
            console.log(error);
            setStatus(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const loadColumns = async () => {
        setStatus('Fetching columns...');
        try {
            
            if(selectedTable!=""){
                const token = localStorage.getItem('jwtToken');
            const response = await axios.post(
                `${backendUrl}/get-columns`,
                { tableName: selectedTable },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setColumns(response.data.columns);
                setStatus('Columns loaded');
            } else {
                setStatus('Error: Unable to fetch columns');
            }
            }
            else{
                window.alert("First Select Table")
            }
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setTableName((file.name.split('.')[0] )+ Date.now());
        console.log((file.name.split('.')[0]) + Date.now());
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const reader = new FileReader();

        if (fileExtension === 'csv') {
            reader.onload = (e) => {
                const text = e.target?.result;
                const parsedData = Papa.parse(text, { header: true });
                const columnNames = Object.keys(parsedData.data[0] || {});
                setSelectedColumns([]);
                setFilteredData([]);
                setIsPreviewClicked(false);
                setColumns(columnNames);
                setFileData(parsedData.data);
                setStatus('File loaded');
            };
            reader.readAsText(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                const columnNames = Object.keys(jsonData[0] || {});
                setSelectedColumns([]);
                setIsPreviewClicked(false);
                setFilteredData([]);
                setColumns(columnNames);
                setFileData(jsonData);
                setStatus('File Uploaded');
            };
            reader.readAsArrayBuffer(file);
        } else {
            setStatus('Error: Unsupported file format');
        }
    };

    const startIngestion = async () => {
        if (sourceType !== 'ClickHouse') {
            setStatus('Ingestion is only supported for ClickHouse.');
            return;
        }
    
        if (selectedColumns.length === 0) {
            setStatus('Please select at least one column to download.');
            return;
        }
    
        setStatus('Downloading selected columns data...');
        try {
            
            const token = localStorage.getItem('jwtToken');
            const response = await axios.post(
                `${backendUrl}/get-table-data`,
                { tableName: selectedTable },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                const tableData = response.data.data;
    
                // Filter data to include only selected columns
                const filteredData = tableData.map((row) =>
                    selectedColumns.reduce((acc, col) => {
                        acc[col] = row[col];
                        return acc;
                    }, {})
                );
    
                // Convert data to CSV or Excel
                const fileExtension = dataType === 'Excel' ? 'xlsx' : 'csv';
                const fileName = `${selectedTable}_selected_columns.${fileExtension}`;
    
                if (fileExtension === 'csv') {
                    const csvContent = Papa.unparse(filteredData);
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    link.click();
                } else if (fileExtension === 'xlsx') {
                    const worksheet = XLSX.utils.json_to_sheet(filteredData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable);
                    XLSX.writeFile(workbook, fileName);
                }
    
                setStatus('Selected columns data downloaded successfully.');
            } else {
                setStatus('Error: Unable to fetch table data for download.');
            }
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const previewData = async () => {
        setStatus('Fetching table data...');
        setIsPreviewClicked(true)
        if (sourceType === "ClickHouse") {
            try {
                const token = localStorage.getItem('jwtToken');
                const response = await axios.post(
                    `${backendUrl}/get-table-data`,
                    { tableName: selectedTable },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
    
                if (response.data.success) {
                    const tableData = response.data.data;
    
                    if (selectedColumns.length === 0) {
                        setFilteredData(tableData);
                        setStatus('Preview completed');
                        return;
                    }
    
                    const filteredData = tableData.map((row) =>
                        selectedColumns.reduce((acc, col) => {
                            acc[col] = row[col];
                            return acc;
                        }, {})
                    );
                    setFilteredData(filteredData);
    
                    if (filteredData.length === 0) {
                        setStatus("No record found");
                    } else {
                        setStatus(`Preview completed. Total Records: ${filteredData.length}`);
                    }
                } else {
                    setStatus('Error: Unable to fetch table data');
                }
            } catch (error) {
                console.error(error);
                setStatus(`Error: ${error.response?.data?.message || error.message}`);
            }
        } else if (sourceType === "FlatFile") {
            if (fileData.length === 0) {
                setStatus("No file data available for preview");
                return;
            }
    
            const filteredData = fileData.map((row) =>
                selectedColumns.length > 0
                    ? selectedColumns.reduce((acc, col) => {
                        acc[col] = row[col];
                        return acc;
                    }, {})
                    : row
            );
    
            setFilteredData(filteredData);
    
            if (filteredData.length === 0) {
                setStatus("No record found");
            } else {
                setStatus(`Preview completed. Total Records: ${filteredData.length}`);
            }
        } else {
            setStatus("Invalid source type selected");
        }
    };

    const fileHandler = async () => {
        console.log(filteredData);
        console.log("File upload in progress");

        try {
            const token = localStorage.getItem('jwtToken'); // Retrieve the token
            const response = await axios.post(
                `${backendUrl}/upload-file`,
                {
                    jsonData: filteredData,
                    tableName: tableName,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }, // Add Authorization header
                }
            );
            const data = response.data;
            console.log(data);
            if (data.success) {
                setStatus(`File uploaded successfully. Rows Written: ${data.result.written_rows} \n
                            Table Name ${data.tableName}`);
            } else {
                setStatus('Error: File upload failed.');
            }
        } catch (error) {
            console.error(`Error: ${error.response?.data?.message || error.message}`);
            setStatus(`Error: ${error.response?.data?.message || error.message}`);
        }
    };


    return (
        <div className=" ml-3 grid grid-cols-2 gap-5">

            <div className='flex flex-col items-center bg-gray-200 text-xl'>
                <div className='w-full bg-[#453f3e] text-white flex justify-center py-1.5 rounded-md'>
                    <p className="text-lg">Data Ingestion Tool</p>
                </div>
                
                <div className='w-full'>
                    

                { !isConnected &&(
                    <div className="mb-4">
                        <h3 className="text-md font-semibold">Connection Parameters</h3>
                        <input
                            type="text"
                            name="host"
                            placeholder="Host"
                            value={connectionParams.host}
                            onChange={handleConnectionChange}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                            className=''
                        />
                        <input
                            type="text"
                            name="database"
                            placeholder="Database"
                            value={connectionParams.database}
                            onChange={handleConnectionChange}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                        />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={connectionParams.username}
                            onChange={handleConnectionChange}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={connectionParams.password}
                            onChange={handleConnectionChange}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                        />
                        <button
                            onClick={connectToSource}
                            style={{
                                backgroundColor: '#007bff',
                                color: '#fff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Connect
                        </button>
                    </div>
                )}


                { isConnected &&
                    <div className='flex justify-between w-full pr-10'>
                    <div className="mb-4">
                        <h3 className="text-md my-1">Select Source Type</h3>
                        <select
                            value={sourceType}
                            onChange={(e) => {
                                setColumns([])
                                setSelectedColumns([]);
                                setIsPreviewClicked(false);
                                setSourceType("")
                                setFileData([])
                                setFilteredData([])
                                setSourceType(e.target.value);
                                setStatus(`${e.target.value} Selected`)

                            }}
                            className='border '
                        >
                            <option value="">Select Source Type</option>
                            <option value="ClickHouse">ClickHouse</option>
                            <option value="FlatFile">Flat File</option>
                        </select>
                    </div>
                    <div className="border-2 pr-10 flex gap-10 items-center justify-center">
                        <h3 className="text-md font-semibold">Status</h3>
                        <p>{status}</p>
                    </div>
                </div>
                
                }

                {sourceType === 'FlatFile' && (
                    <div className="mb-4">
                        <h3 className="text-md font-semibold">Upload File</h3>
                        <input
                            type="file"
                            accept=".csv, .xls, .xlsx"
                            onChange={handleFileUpload}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                        />
                    </div>
                )}

                { sourceType==="ClickHouse" && tables.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-md font-semibold">Select Table</h3>
                        <select
                            value={selectedTable}
                            onChange={(e) => {
                                setColumns([])
                                setSelectedColumns([]);
                                setIsPreviewClicked(false);
                                setSelectedTable(e.target.value)
                            }}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                width: '100%',
                                marginBottom: '8px',
                            }}
                        >
                            <option value="">Select a Table</option>
                            {tables.map((table, index) => (
                                <option key={index} value={table.name || table}>
                                    {table.name || table}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={loadColumns}
                            style={{
                                backgroundColor: '#007bff',
                                color: '#fff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Load Columns
                        </button>
                    </div>
                )
                }

                {columns.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-md font-semibold">Select Columns</h3>
                        {columns.map((column) => (
                            <div key={column}>
                                <label>
                                    <input
                                        type="checkbox"
                                        value={column}
                                        checked={selectedColumns.includes(column)}
                                        onChange={() =>
                                            setSelectedColumns((prev) =>
                                                prev.includes(column)
                                                    ? prev.filter((col) => col !== column)
                                                    : [...prev, column]
                                            )
                                        }
                                        style={{ marginRight: '8px' }}
                                    />
                                    {column}
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <button
                        onClick={previewData}
                        style={{
                            backgroundColor: '#ffc107',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '8px',
                        }}
                    >
                        Preview
                    </button>
                    { isPreviewClicked &&
                        <button
                        onClick={sourceType=="ClickHouse" ?
                            startIngestion : fileHandler
                        }
                        style={{
                            backgroundColor: '#28a745',
                            color: '#fff',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Start Ingestion
                    </button>}
                </div>

                
                </div>
            </div>
            <div className='bg-gray-300 rounded-md scroll'>
                {filteredData.length > 0 && (
                    <div>
                        <h3 className="text-md font-semibold">Result</h3>
                        <div style={{ overflowX: 'auto', overflowY: 'auto',  maxHeight:'screen'}}>
                            <table>
                                <thead>
                                    <tr >
                                        {selectedColumns.map((col, index) => (
                                            <th className='border border-black-300' key={index}>
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {selectedColumns.map((col, colIndex) => (
                                                <td className='border border-black-300 p-1.5' key={colIndex}>
                                                    {row[col] || ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;

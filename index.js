require('dotenv').config()
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors')
const app = express();
const port = 8000;

const employeeRoute = require("./routes/employeeRoute");
// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
}); 

// Enable JSON parsing for request bodies
app.use(express.json());
app.use(cors())
app.use('/api/v1', employeeRoute);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

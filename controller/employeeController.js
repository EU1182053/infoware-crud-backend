require('dotenv').config()
const { validationResult } = require('express-validator');
const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

exports.createTable = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()[0].msg });
    }

    const { fullName,
        jobTitle,
        phoneNumber,
        email,
        address,
        city,
        state,
        primaryEmergencyContact,
        primaryEmergencyPhoneNumber,
        primaryEmergencyRelationship,
        secondaryEmergencyContact,
        secondaryEmergencyPhoneNumber,
        secondaryEmergencyRelationship } = req.body;
    // Insert employee data into the MySQL database
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            res.status(500).json({ "Error Message": err.sqlMessage });
            return;
        }

        const employeeQuery = 'INSERT INTO employees (full_name, job_title,phone_number,email, address, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const employeeValues = [fullName, jobTitle, phoneNumber, email, address, city, state];

        connection.query(employeeQuery, employeeValues, (err, employeeResult) => {
            if (err) {
                connection.release();

                res.status(500).json({ "Error Message": err.sqlMessage });
                return;
            }

            const employeeId = employeeResult.insertId;

            // Insert contact details into the contact_details table
            const contactQuery = `
                                    INSERT INTO contact_details (
                                        employee_id,
                                        
                                        primary_emergency_contact,
                                        primary_emergency_phone_number,
                                        primary_emergency_relationship,
                                        secondary_emergency_contact,
                                        secondary_emergency_phone_number,
                                        secondary_emergency_relationship
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                                    `;

            const contactValues = [
                employeeId,

                primaryEmergencyContact,
                primaryEmergencyPhoneNumber,
                primaryEmergencyRelationship,
                secondaryEmergencyContact,
                secondaryEmergencyPhoneNumber,
                secondaryEmergencyRelationship,
            ];

            connection.query(contactQuery, contactValues, (err, contactResult) => {

                if (err) {
                    connection.release();

                    res.status(500).json({ "Error Message": err.sqlMessage });
                    return;
                }

                res.json({ message: 'Employee and contact details inserted successfully' });
            });
        })
    });

}

exports.updateTable = (req, res) => {
    const employeeId = req.params.employeeId;

    const { fullName,
        jobTitle,
        phoneNumber,
        email,
        address,
        city,
        state,

        primaryEmergencyContact,
        primaryEmergencyPhoneNumber,
        primaryEmergencyRelationship,
        secondaryEmergencyContact,
        secondaryEmergencyPhoneNumber,
    } = req.body;

    // Update employee and contact details in the database
    const updateQuery = `
        UPDATE employees AS e
        JOIN contact_details AS c ON e.id = c.employee_id
        SET
            e.full_name = ?,
            e.job_title = ?,
            e.phone_number = ?,
            e.email = ?,
            e.address = ?,
            e.city = ?,
            e.state = ?,
            c.primary_emergency_contact = ?,
            c.primary_emergency_phone_number = ?,
            c.primary_emergency_relationship = ?,
            c.secondary_emergency_contact = ?,
            c.secondary_emergency_phone_number = ?,
            c.secondary_emergency_relationship = ?
        WHERE e.id = ?`;

    const employeeValues = [
        fullName,
        jobTitle,
        phoneNumber,
        email,
        address,
        city,
        state,
        primaryEmergencyContact,
        primaryEmergencyPhoneNumber,
        primaryEmergencyRelationship,
        secondaryEmergencyContact,
        secondaryEmergencyPhoneNumber,
        primaryEmergencyContact,
        employeeId
    ];

    // Execute the update query
    pool.query(updateQuery, employeeValues, (err, result) => {
        if (err) {
            console.error('Error updating employee and contact details:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        res.json({ message: 'Employee and contact details updated successfully' });
    });
}

exports.deleteTable = (req, res) => {
    const parentId = req.params.id;

    // First, delete the child records from the child table
    const deleteChildQuery = 'DELETE FROM contact_details WHERE employee_id = ?';
    pool.query(deleteChildQuery, parentId, (err, result) => {
        if (err) {
            console.error('Error deleting contact details records:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // If child records were successfully deleted, proceed to delete the parent record
        const deleteParentQuery = 'DELETE FROM employees WHERE id = ?';
        pool.query(deleteParentQuery, parentId, (err, result) => {
            if (err) {
                console.error('Error deleting employees record:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            res.json({ message: 'Parent and associated child records deleted successfully' });
        });
    });
}

exports.getDataFromTables = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    // Execute a query to fetch data from both tables
    const query = `
    SELECT e.*, c.*
    FROM employees AS e
    JOIN contact_details AS c ON e.id = c.employee_id
    LIMIT ? OFFSET ?
  `;

    pool.query(query, [pageSize, offset], (err, results) => {
        if (err) {
            console.error('Error fetching employee details:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Retrieve the total number of employees from the database
        const countQuery = 'SELECT COUNT(*) AS total FROM employees';
        pool.query(countQuery, (countError, countResult) => {
            if (countError) {
                console.error('Error executing count query:', countError);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / pageSize);

            res.json({
                page,
                pageSize,
                totalPages,
                totalCount,
                data: results,
            });
        });
    });

}

exports.getDataById = (req, res) => {
    const employeeId = req.params.id;

    // Retrieve employee and contact details based on the employee ID
    const query = `
    SELECT e.*, c.*
    FROM employees e
    LEFT JOIN contact_details c ON e.id = c.employee_id
    WHERE e.id = ?
  `;

    pool.query(query, [employeeId], (error, results) => {
        if (error) {
            console.error('Error retrieving employee and contact details:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }



        // Send the employee and contact details as a JSON response
        res.json({ results });
    });
}
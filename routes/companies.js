const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query('SELECT code, name, description FROM companies');
        return res.json({companies: result.rows});
    } catch (err) {
        return next(err);
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        if (!result.rows[0]) {
            throw new ExpressError("Company not found", 404);
        }
        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code]);
        return res.json({ companies: result.rows[0], invoices: [invoices.rows] });
    } catch (err) {
        return next(err);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({ company: result.rows});
    } catch(err) {
        return next(err);
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const change = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3`, [name, description, code]);
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        if (!result.rows[0]) {
            throw new ExpressError("Company not found", 404);
        }
        return res.json(result.rows[0]);
    } catch (err) {
        console.log(err)
        return next(err);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const change = await db.query(`SELECT * FROM companies WHERE code=$1`, [code])
        if (!change.rows[0]) {
            throw new ExpressError("Company not found", 404);
        }
        const result = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
        return res.json({status: "deleted"})
    } catch(err) {
        return next(err);
    }
})

module.exports = router;
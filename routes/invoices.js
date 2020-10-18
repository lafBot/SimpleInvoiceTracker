const { json } = require('body-parser');
const express = require('express');
const app = require('../app');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    } catch (err) {
        return next(err);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const invoiceResults = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);
        if (!invoiceResults.rows[0]) {
            throw new ExpressError("Invoice not found", 404);
        }
        const { id, comp_code, amt, paid, add_date, paid_date } = invoiceResults.rows[0];
        const compResults = await db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code]);
        if (!compResults.rows[0]) {
            throw new ExpressError("Invoice not found", 404);
        }
        const { code, name, description } = compResults.rows[0];
        return res.json({invoice: { id, amt, paid, add_date, paid_date, company: { code, name, description }}});
    } catch (err) {
        return next(err);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, paid, add_date, paid_date`, [comp_code, amt]);
        const { id, paid, add_date, paid_date } = results.rows[0];
        return res.json({invoice: {id, comp_code, amt, paid, add_date, paid_date}});
    } catch (err) {
        return next(err);
    }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const change = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2`, [amt, id]);
        const results = await db.query(`SELECT comp_code, paid, add_date, paid_date FROM invoices WHERE id=$1`, [id]);
        if (!results.rows[0]) {
            throw new ExpressError("Invoice not found", 404);
        }
        const { comp_code, paid, add_date, paid_date } = results.rows[0];
        return res.json({invoice: {id, comp_code, amt, paid, add_date, paid_date}});
    } catch (err) {
        return next(err);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const identified = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if (!identified.rows[0]) {
            throw new ExpressError("Invoice not found", 404);
        }
        await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


router.get('/', async (req, res, next) => {
    // get all industries and return company codes for the industries
    try {
        const results = await db.query(
            `SELECT i.industry, ci.comp_code
            FROM industries AS i
            LEFT JOIN companies_industries AS ci
            ON i.code = ci.industry_code`);
        if (results.rows.length === 0) {
            throw new ExpressError("Industries not found", 404);
        }
        let industries = [];
        for (obj of results.rows) {
            industries.push({industry: obj.industry, comp_codes: []});
        }
        for (obj of results.rows) {
            for (out of industries) {
                if (out.industry == obj.industry) {
                    out.comp_codes.push(obj.comp_code);
                }
            }
        }
        return res.json(industries);
    } catch (err) {
        return next(err);
    }
})

router.post('/', async (req, res, next) => {
    try {  
        const { industry, code } = req.body;
        const result = await db.query(
            `INSERT INTO industries (industry, code)
            VALUES ($1, $2)
            RETURNING industry, code`, [industry, code]);
        if (result.rows.length === 0) {
            throw new ExpressError('Invalid request to add industry', 400)
        }
        return res.status(201).json({ industry: result.rows[0] });
    } catch(err) {
        return next(err);
    }
})


module.exports = router
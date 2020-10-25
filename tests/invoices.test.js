process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require('../db');
const app = require("../app");
const { notify } = require("../app");

let testCompany;
let testInvoice;

beforeEach(async function() {
    // create sample company table
    const company = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING code, name, description`);
    
    testCompany = company.rows[0]

    // create sample invoice table
    const invoice = await db.query(
        `INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null)
        RETURNING id, comp_code, amt, paid, paid_date`);
    
    testInvoice = invoice.rows[0];
})

afterEach(async function() {
    // delete sample company and start from scratch
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM companies_industries');
    await db.query('DELETE FROM invoices');
    await db.query('DELETE FROM industries');
})

afterAll(async () => {
    // end connection to db when done testing
    await db.end();
})

describe("GET /invoices", () => {
    test("Get all invoices", async () => {
        const resp = await request(app).get('/invoices');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(
            { invoices: [{
                    "id": testInvoice.id,
                    "comp_code": testInvoice.comp_code,
                    "amt": testInvoice.amt,
                    "paid": testInvoice.paid,
                    "add_date": expect.anything(),
                    "paid_date": testInvoice.paid_date
                    }]
            });
    })

    test('Get specific invoice info at /invoices/:code', async () => {
        const resp = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(
            { "invoice": {
                "id": testInvoice.id,
                "amt": testInvoice.amt,
                "paid": testInvoice.paid,
                "add_date": expect.anything(),
                "paid_date": testInvoice.paid_date,
                "company": {
                    "code": testCompany.code,
                    "name": testCompany.name,
                    "description": testCompany.description
                    }
                }
            });
    })

    test('Returns error for invalid invoice /invoices/:code', async () => {
        await db.query('DELETE FROM invoices');
        const resp = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({ "error": {"message": "Invoice not found", "status": 404 }, "message": "Invoice not found"});
    })

})

describe("POST /invoice", () => {
    test('Create new invoice', async () => {
        const resp = await request(app).post('/invoices').send({
            "comp_code": "apple",
            "amt": 808
        });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            invoice: {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 808,
                "paid": false,
                "add_date": expect.anything(),
                "paid_date": null
            }
        })
    })

    test('Returns error when trying to create invalid invoice', async () => {
        const resp = await request(app).post('/invoices').send({
            "comp_code": "apple",
            "amt": "This is not a number",

        });

        expect(resp.statusCode).toBe(500);
    })
})

describe("PUT /invoice/:code", () => {
    test('Edit invoice without being paid', async () => {
        const resp = await request(app).put(`/invoices/${testInvoice.id}`).send({ "amt": "5000", "paid": false });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            invoice: {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 5000,
                "paid": false,
                "add_date": expect.anything(),
                "paid_date": null
            }
        })
    })

    test('Edit invoice with being paid', async () => {
        const resp = await request(app).put(`/invoices/${testInvoice.id}`).send({ "amt": "5000", "paid": true });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            invoice: {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 5000,
                "paid": true,
                "add_date": expect.anything(),
                "paid_date": expect.anything()
            }
        })
    })

    test('Returns invoice when trying to edit non-existent invoice', async () => {
        await db.query('DELETE FROM invoices');

        const resp = await request(app).put(`/invoices/${testInvoice.id}`).send({ "amt": "5000" });

        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({ "error": {"message": "Invoice not found", "status": 404 }, "message": "Invoice not found"});
    })
})

describe("DELETE /invoice/:code", () => {
    test('Delete an invoice', async () => {
        const resp = await request(app).delete(`/invoices/${testInvoice.id}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: "deleted" });
    })

    test('Returns error for no invoice found', async () => {
        const resp = await request(app).delete(`/invoices/0`);

        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({ "error": {"message": "Invoice not found", "status": 404 }, "message": "Invoice not found"});
    })
})
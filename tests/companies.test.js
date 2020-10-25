process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require('../db');
const app = require("../app");

let testCompany;
let testInvoice;

beforeEach(async function() {
    // create sample company table
    const company = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING code, name, description`);
    testCompany = company.rows[0];
    
    // create sample invoice table
    const invoice = await db.query(
        `INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null)
        RETURNING comp_Code, amt, paid, paid_date`);
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

describe("GET /companies", () => {
    test("Get all companies", async () => {
        const resp = await request(app).get('/companies');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(
            { companies:
                [
                    {code: testCompany.code, name: testCompany.name, description: testCompany.description}
                ]
            });
    })

    test('Get specific company info at /companies/:code', async () => {
        const resp = await request(app).get('/companies/apple');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(
            { companies:
                {code: testCompany.code, name: testCompany.name, description: testCompany.description, industry: null},
                "invoices": [
                    [{"id": expect.any(Number), "comp_code": testInvoice.comp_code, "paid": testInvoice.paid, "add_date": expect.anything(), "amt": testInvoice.amt, "paid_date": testInvoice.paid_date}]
                ]
            });
    })
})

describe("POST /company", () => {
    test('Create new company', async () => {
        const resp = await request(app).post('/companies').send({ code: "micr", name: "Microsoft", description: "Developed Windows OS" });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({ company: { code: "micr", name: "Microsoft", description: "Developed Windows OS" }})
    })
})

describe("PUT /company/:code", () => {
    test('Edit company', async () => {
        const resp = await request(app).put('/companies/apple').send({ name: testCompany.name, description: "Developer of OSX - Success" });

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ code: testCompany.code, name: testCompany.name, description: "Developer of OSX - Success" })
    })
})

describe("DELETE /company/:code", () => {
    test('Delete a company', async () => {
        const resp = await request(app).delete('/companies/apple');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: "deleted" })
    })
})
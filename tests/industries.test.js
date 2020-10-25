process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require('../db');
const app = require("../app");

let testCompany;
let testInvoice;
let testIndustry;

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

    const industry = await db.query(
        `INSERT INTO industries (code, industry)
        VALUES ('soft', 'Software')
        RETURNING code, industry`);

    testIndustry = industry.rows[0].code;

    const comp_ind = await db.query(
        `INSERT INTO companies_industries (comp_code, industry_code)
        VALUES ('apple', 'soft')
        RETURNING comp_code, industry_code`);
        this.comp_ind_ccode = company.rows[0].comp_code;
        this.comp_ind_icode = company.rows[0].industry_code;

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

describe("GET /industries", () => {
    test("Get all industries with companies within", async () => {
        const resp = await request(app).get('/industries');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual([{
                "industry": "Software",
                "comp_codes": [
                    "apple"
                ]
            }])
    })
})

describe("POST /industry", () => {
    test('Create new industry', async () => {
        const resp = await request(app).post('/industries').send({ "industry": "Healthcare", "code": "care" });

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            industry: {
                "industry": "Healthcare",
                "code": "care"
            }
        })
    })

    test('Returns error for invalid POST', async() => {
        const resp = await request(app).post('/industries').send({ "industry": "invalid content attempt" });

        expect(resp.statusCode).toBe(500);
    })
})

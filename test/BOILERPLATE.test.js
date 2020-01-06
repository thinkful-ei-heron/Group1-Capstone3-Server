require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const API_TOKEN = process.env.API_TOKEN;

describe('/BOILERPLATE route', () => {
    let db;
    let testData = [];//insert test-data

    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_TEST_URL
        });

        app.set('db', db);
    });

    before(() => db('BOILERPLATE-table').truncate());

    afterEach(() => db('BOILERPLATE-table').truncate());

    after(() => db.destroy());


    describe('GET /BOILERPLATE Route', () => {
        it('returns 200 and empty array when no data present', () => {
            return supertest(app)
                .get('/BOILERPLATE-table')
                .set('Authorization', `Bearer ${API_TOKEN}`)
                .expect(200, []);
        });

        context('BOILERPLATE-table has data', () => {
            beforeEach(() => {
                return db.into('BOILERPLATE-table')
                    .insert(testData);
            });

            it('returns 200 and array of objects with proper keys when requested', () => {
                return supertest(app)
                    .get('/BOILERPLATE-table')
                    .set('Authorization', `Bearer ${API_TOKEN}`)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(res => {
                        expect(res.body).to.be.an('Array').with.lengthOf(???);
                        expect(res.body[0]).to.be.an('Object');
                        expect(res.body[0]).to.have.all.keys('???','???');
                    });
            });
        });
    });
});
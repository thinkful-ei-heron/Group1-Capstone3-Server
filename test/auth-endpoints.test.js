require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
// const API_TOKEN = process.env.API_TOKEN;
const jwt = require('jsonwebtoken');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', function() {
    let db;
    let testUsers = helpers.makeUsersArray()
    let testUser = testUsers[0];//insert test-data
    let testPass = null;

    before('make knext instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_TEST_URL
        });

        app.set('db', db);
        bcrypt.hash('pass',12).then(res => {
            testPass = res 
        });
    });

    after('disconnect from db',() => db.destroy());

    before('cleanup', () => helpers.cleanTables(db));

    afterEach('cleanup',() => helpers.cleanTables(db));


    describe('POST /api/auth/token', () => {
        beforeEach('insert users', () => { 
            helpers.seedUsers(
                db,
                testUsers,
            )
        });

        const requiredFields = ['username', 'password']

        requiredFields.forEach(field => {
            const loginAttemptBody = {
                username: testUser.username, 
                password: testUser.password,
            }

            it(`returns 400 and error when ${field} is missing`, () => {
                delete loginAttemptBody[field]
            

                return supertest(app)
                    .post('/api/auth/token')
                    .send(loginAttemptBody)
                    .expect(400, { error:`Missing ${field} in request body`,
                })
            })
        })

            it(`returns 400 and 'invalid username or password' when bad username`, () => {
                const userInvalidUser = { username: 'user-not', password: 'existy' }
                return supertest(app)
                    .post('/api/auth/token')
                    .send(userInvalidUser)
                    .expect(400, { error:`Incorrect username or password!`})
            })

            it(`returns 400 and 'invalid username or password' when bad password`, () => {
                const userInvalidPass = { username: testUser.username, password: 'incorrect' }
                return supertest(app)
                    .post('/api/auth/token')
                    .send(userInvalidPass)
                    .expect(400, { error:`Incorrect username or password!`})
            })
    })

        describe(`PATCH /api/auth/token`, () => {
            beforeEach('insert users', () => {
            return db.into('users').insert({...testUser,password: testPass});
            // helpers.seedUsers(
            //     db,
            //     testUsers,
            // )
        });

            it(`returns 200 JWT auth token using secret when valid credentials`, () => {
                this.retries(5)
                const expectedToken = jwt.sign(
                    { user_id: testUser.id},
                    process.env.JWT_SECRET,
                    {
                    subject: testUser.username,
                    //   expiresIn: process.env.JWT_EXPIRY,
                    algorithm: 'HS256',
                    }
                )
                return supertest(app)
                    .post('/api/auth/token')
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send({username : 'test-1', password : 'pass'})
                    .expect(200, {
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    authToken: expectedToken,
                    
                });
                });
                });
        });
    });
});
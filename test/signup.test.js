require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const helpers = require('./test-helpers');

describe.only('Signup Endpoints', () => {
    let db;
    const testUser = {username:'test', password:'CoMplex$1223', email:'someEmail@gmail.com'};
    const testUser2 = {username:'test2', password:'CoMplex$1223', email:'someEmail2@gmail.com'};

    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.DB_TEST_URL
        });
        app.set('db', db);
    });

    before(() => db.raw('truncate users, stats restart identity cascade'));

    afterEach(() => db.raw('truncate users, stats restart identity cascade'));

    after(() => db.destroy());

    describe('POST /api/signup', () => {
        describe('Username Tests', () => {
            it('returns 400 with error message if no username', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ password: 'pass', email: 'email'})
                    .expect(400, {error: 'Must provide username.'});
            });
            it('returns 400 if invalid username', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'usernamethatiswaaaayyytoolongandismorethan20characters' , password: 'pass', email: 'email'})
                    .expect(400, {error: 'Username cannot exceed 20 characters'});
            });
        });
        

        describe('Password Tests', () => {
            it('returns 400 with error message if no password', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user', email: 'email'})
                    .expect(400, {error: 'Must provide password.'});
            });
            it('returns 400 with error message if password is less than 8 characters in length', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user', password: 'pass', email: 'email'})
                    .expect(400, {error: 'Password cannot be less than 8 characters long.'});
            });
            it('returns 400 with error message if password is longer than 32 characters', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user', password: 'passasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf', email: 'email'})
                    .expect(400, {error: 'Password cannot be longer than 32 characters.'});
            });
            it('returns 400 with error message if password contains a space', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user', password: 'pass witha space', email: 'email'})
                    .expect(400, {error: 'Password cannot contain a space.'});
            });
            it('returns 400 with error message if password isnt complex', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user', password: 'passwordthatisntComplex', email: 'email'})
                    .expect(400, {error: 'Password must contain at least one lowercase letter, one uppercase letter and a number'});
            });
        });

        describe('Email tests', () => {
            it('returns 400 with error message if no email', () => {
                return supertest(app)
                    .post('/signup')
                    .send({ username: 'user' , password: 'pass'})
                    .expect(400, {error: 'Must provide email.'});
            });
            it('returns 400 if email contains a space', () => {
                return supertest(app)
                    .post('/signup')
                    .send({username: 'user', password: 'CoMplex$1223', email: 'emailwith a space'})
                    .expect(400, {error: 'Email cannot contain a space.'});
            });
            it('returns 400 if email does not contain a @', () => {
                return supertest(app)
                    .post('/signup')
                    .send({username: 'user', password: 'CoMplex$1223', email: 'emailwithspace'})
                    .expect(400, {error: 'Must provide valid email.'});
            });
            it('returns 400 if email is longer than 40 characters', () => {
                return supertest(app)
                    .post('/signup')
                    .send({username: 'user', password: 'CoMplex$1223', email: 'emailwith@asdfasdfasldfkja;lsdkf;laksdf;lkasd;lfkajs;dlfkja;lsdkjf;alsdfaspace'})
                    .expect(400, {error: 'Email cannot exceed 40 characters'});
            });
        });    

        describe('Full integration testing', () => {
            it('returns 201 if sucessful (FULL INTEGRATION TEST)', () => {
                return supertest(app)
                    .post('/signup')
                    .send(testUser)
                    .expect(201)
                    .then(() => {
                        db.from('users').select('*').first()
                        .then(user => {
                            expect(user.id).to.equal(1);
                            expect(user.username).to.equal('test');
                            expect(bcrypt.compare(user.password, '$2a$12$L3tZcc1G4pnQtoEdXdhHYOdVaH7b8lcmaiSRXznvsCYsz3TPnI1BS'));
                            expect(user.email).to.equal('someEmail@gmail.com');
                        });
                    });
            });
            

            context('There are users in the database', () => {
                beforeEach(() => {
                    return db.into('users').insert(testUser);
                });

                it('returns 201 if sucessful (FULL INTEGRATION TEST)', () => {
                    return supertest(app)
                        .post('/signup')
                        .send(testUser2)
                        .expect(201)
                        .then(() => {
                            db.from('users').select('*').where('username', 'test2').first()
                            .then(user => {
                                expect(user.id).to.equal(2);
                                expect(user.username).to.equal('test2');
                                expect(bcrypt.compare(user.password, '$2a$12$L3tZcc1G4pnQtoEdXdhHYOdVaH7b8lcmaiSRXznvsCYsz3TPnI1BS'));
                                expect(user.email).to.equal('someEmail2@gmail.com');
                            });
                        });
                });
            });
        });

        context('There are users in the database', () => {
            beforeEach(() => {
                return db.into('users').insert(testUser);
            });

            it('returns 400 if username is taken', () => {
                return supertest(app)
                    .post('/signup')
                    .send({username:'test', password:'CoMplex$1223', email:'someEmail@gmail.com'})
                    .expect(400, {error: 'Username is taken.'});
            });
            it('returns 400 if email is taken', () => {
                return supertest(app)
                .post('/signup')
                .send({username:'test1', password:'CoMplex$1223', email:'someEmail@gmail.com'})
                .expect(400, {error: 'Email is taken.'});
            });
        });
    });
});
require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const bcrypt = require('bcryptjs');

describe('/signup route', () => {
    let db;
    let testUser = {username:'test', password:'CoMplex$1223'};
    let testUser2 = {username:'test2', password:'CoMplex$1223'};

    before('setup db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });

        app.set('db', db);
    });

    before(() => db.raw('truncate users, stats restart identity cascade'));

    afterEach(() => db.raw('truncate users, stats restart identity cascade'));

    after(() => db.destroy());


    describe('POST /api/signup Route', () => {
        describe('Username Tests', () => {
            it('returns 400 with error message if no username', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ password: 'pass'})
                    .expect(400, {error: 'Must provide username.'});
            });
            it('returns 400 if username is longer than 20 characters', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'usernamethatiswaaaayyytoolongandismorethan20characters' , password: 'pass'})
                    .expect(400, {error: 'Username cannot exceed 20 characters'});
            });
            it('returns 400 if username contains a space', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'this is not okay' , password: 'pass'})
                    .expect(400, {error: 'Username cannot contain a space.'});
            });
        });
        

        

        
        describe('Password Tests', () => {
            it('returns 400 with error message if no password', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'user'})
                    .expect(400, {error: 'Must provide password.'});
            });
            it('returns 400 with error message if password is less than 8 characters in length', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'user', password: 'pass'})
                    .expect(400, {error: 'Password cannot be less than 8 characters long.'});
            });
            it('returns 400 with error message if password is longer than 32 characters', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'user', password: 'passasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf'})
                    .expect(400, {error: 'Password cannot be longer than 32 characters.'});
            });
            it('returns 400 with error message if password contains a space', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'user', password: 'pass witha space'})
                    .expect(400, {error: 'Password cannot contain a space.'});
            });
            it('returns 400 with error message if password isnt complex', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send({ username: 'user', password: 'passwordthatisntComplex'})
                    .expect(400, {error: 'Password must contain at least one lowercase letter, one uppercase letter and a number'});
            });
        });





      




        describe('Full integration testing', () => {
            it('returns 201 if sucessful (FULL INTEGRATION TEST)', () => {
                return supertest(app)
                    .post('/api/signup')
                    .send(testUser)
                    .expect(201)
                    .then(() => {
                        db.from('users').select('*').first()
                        .then(user => {
                            expect(user.id).to.equal(1);
                            expect(user.username).to.equal('test');
                            expect(bcrypt.compare(user.password, '$2a$12$L3tZcc1G4pnQtoEdXdhHYOdVaH7b8lcmaiSRXznvsCYsz3TPnI1BS'));
                           
                        });
                    });
            });
            

            context('There are users in the database', () => {
                beforeEach(() => {
                    return db.into('users').insert(testUser);
                });


                it('returns 201 if sucessful (FULL INTEGRATION TEST)', () => {
                    return supertest(app)
                        .post('/api/signup')
                        .send(testUser2)
                        .expect(201)
                        .then(() => {
                            db.from('users').select('*').where('username', 'test2').first()
                            .then(user => {
                                expect(user.id).to.equal(2);
                                expect(user.username).to.equal('test2');
                                expect(bcrypt.compare(user.password, '$2a$12$L3tZcc1G4pnQtoEdXdhHYOdVaH7b8lcmaiSRXznvsCYsz3TPnI1BS'));
                               
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
                    .post('/api/signup')
                    .send({username:'test', password:'CoMplex$1223'})
                    .expect(400, {error: 'Username is taken.'});
            });
           
        });
    });
});
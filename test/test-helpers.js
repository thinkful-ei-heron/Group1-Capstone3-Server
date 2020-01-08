const knex = require('knex')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const testHelpers = {
  makeUsersArray() {
    return [
      {
        id: 1,
        username: 'test-1',
        password: 'pass',
        email: 'test1Email@gmail.com',
      },
      {
        id: 2,
        username: 'test-2',
        password: 'pass',
        email: 'test2Email@gmail.com',
      },
    ]
  },

  makeKnexInstance() {
    return knex({
      client: 'pg',
      connection: process.env.DB_TEST_URL,
    })
  },

  cleanTables(db) {
    return db.raw('truncate users, stats, game_history restart identity cascade');
  },

  makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.username,
      algorithm: 'HS256',
    })
    return `Bearer ${token}`
  },

  seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 1)
    }))
    preppedUsers.forEach(user => {
      return db.into('users').insert(user)
    })
    return db.transaction(async trx => {
      await trx.into('users').insert(preppedUsers)

      await trx.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    })
  }
};

module.exports = testHelpers
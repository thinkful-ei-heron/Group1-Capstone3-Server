const {expect} = require('chai');
const supertest = require('supertest');


global.expect = expect;
global.supertest = supertest;
process.env.NODE_ENV = 'test';
const express = require('express');
const BOILERPLATEService = require('./BOILERPLATEService');
const uuid = require('uuid/v4');
const logger = require('./logger');
const xss = require('xss');

const BOILERPLATERouter = express.Router();

BOILERPLATERouter.get('/BOILERPLATE', (req, res, next) => {
    let db = req.app.get('db');
    
    BOILERPLATEService.getAllBookmarks(db)
        .then(resp => {
        })
        .catch(next);
});

BOILERPLATERouter.get('/BOILERPLATE/:id', (req, res, next) => {
    let db = req.app.get('db');
    let id = req.params.id;

    //checks to see if id provided is a valid UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        logger.error('Must provide valid UUID');
        return res.status(400).json({ message: 'Must provide a valid ID to get' });
    }

    BOILERPLATEService.getBookmarkById(db, id)
        .then(resp => {
        })
        .catch(next);
});

BOILERPLATERouter.post('/BOILERPLATE', (req, res, next) => {
    let db = req.app.get('db');
    let post = {};

    BOILERPLATEService.postBookmark(db, post)
        .then(resp => {
        })
        .catch(next);
});

BOILERPLATERouter.patch('/BOILERPLATE/:id', (req, res, next) => {
    let db = req.app.get('db');
    let id = 1;
    let edit = {};

    BOILERPLATEService.patchBookmark(db, xss(id), edit)
        .then(resp => {
        })
        .catch(next);
});

BOILERPLATERouter.delete('/BOILERPLATE/:id', (req, res, next) => {
    let db = req.app.get('db');
    let id = 1;
    
    BOILERPLATEService.deleteBookmark(db, xss(id))
        .then(resp => {
        })
        .catch(next);
});

module.exports = BOILERPLATERouter;
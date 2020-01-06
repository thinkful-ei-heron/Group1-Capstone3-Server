const BOILERPLATEService = {
    getAllBookmarks(db) {
        return db.select('*').from('BOILERPLATE-table');
    },
    getBookmarkById(db, id) {
        return db.from('BOILERPLATE-table')
            .select('*')
            .where({id})
            .first();
    },
    postBookmark(db, post) {
        return db.into('BOILERPLATE-table')
            .insert(post)
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },
    patchBookmark(db, id, info) {
        return db.from('BOILERPLATE-table')
            .where({id})
            .update(info);
    },
    deleteBookmark(db, id) {
        return db.from('BOILERPLATE-table')
            .where({id})
            .delete();
    }
};

module.exports = BOILERPLATEService;
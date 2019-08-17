const bookmarkService = {
    getAllBookmarks(knex){
        return knex.select('*').from('bookmarks');
    },
    getById(knex, id) {
        return knex.from('bookmarks').select('*').where('id', id).first()
    },
    insertBookmark(knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteArticle(knex, id) {
        return knex('bookmarks')
          .where({ id })
          .delete()
    },
    updateArticle(knex, id, newBookmarkFields) {
        return knex('bookmarks')
          .where({ id })
          .update(newBookmarkFields)
    },
}

module.exports = bookmarkService;
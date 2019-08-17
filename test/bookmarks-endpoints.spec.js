process.env.TZ = 'UTC'
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe.only('Bookmark Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /bookmarks', () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and empty list', () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                .expect(200, [])
            })
        })

        context('Given there are bookmarks', () => {
            const bookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(bookmarks);
            })

            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                  .get('/bookmarks')
                  .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                  .expect(200, bookmarks)
            })
        })
    })

    describe('GET /bookmarks/:id', () => {
        context('Given no bookmarks', () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
              })
        })

        context('Given there are bookmarks', () => {
            const bookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(bookmarks);
            })

            it('responds with 200 and the selected bookmark', () => {
                const bookmarkId = 3;
                const bookmark = bookmarks[2];

                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                    .expect(200, bookmark)
            })
        })
    })
})

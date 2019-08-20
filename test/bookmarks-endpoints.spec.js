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

    describe(`POST /bookmarks`, () => {
        it(`creates an bookmark, responding with 201 and the new bookmark`, function() {
          const newBookmark = {
            title: "title test",
            description: "description test",
            url: "url test",
            rating: 1
        }
        return supertest(app)
            .post(`/bookmarks`)
            .send(newBookmark)
            .set('Authorization', `Bearer b08141cf-3086-42fd-9345-815aafe43c00`)
            .expect(201)
            .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title)
            expect(res.body.url).to.eql(newBookmark.url)
            expect(res.body.description).to.eql(newBookmark.description)
            expect(res.body.rating).to.eql(newBookmark.rating)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`http://localhost:8000/bookmarks/${res.body.id}`)
            })
            .then(res =>
            supertest(app)
                .get(`/bookmarks/${res.body.id}`)
                .set('Authorization', `Bearer b08141cf-3086-42fd-9345-815aafe43c00`)
                .expect(res.body)
            )
        })

        const requiredFields = ['title', 'description', 'url', 'rating']

        requiredFields.forEach(field => {
          const newBookmark = {
            title: "title test",
            description: "description test",
            url: "url test",
            rating: 1
        }
    
          it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete newBookmark[field]
    
            return supertest(app)
              .post('/bookmarks')
              .send(newBookmark)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(400, {
                error: { message: `Missing '${field}' in request body` }
              })
          })
        })
    })
    
    describe(`DELETE /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
          it(`responds with 404`, () => {
            const id = 123456
            return supertest(app)
              .delete(`/bookmark/${id}`)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(404, {})
          })
        })

        context('Given there are bookmarks in the database', () => {
          const testBookmarks = makeBookmarksArray()
          
          beforeEach('insert bookmarks', () => {
            return db
              .into('bookmarks')
              .insert(testBookmarks)
          })

          it('responds with 204 and removes the bookmark', () => {
            const idToRemove = 2
            const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
            return supertest(app)
              .delete(`/bookmarks/${idToRemove}`)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(204)
              .then(() =>
                supertest(app)
                  .get(`/bookmarks`)
                  .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                  .expect(expectedBookmarks)
              )
            })
        })
    })
})

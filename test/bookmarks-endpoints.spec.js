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

    describe('GET /api/api/bookmarks', () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and empty list', () => {
                return supertest(app)
                .get('/api/bookmarks')
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
                  .get('/api/bookmarks')
                  .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                  .expect(200, bookmarks)
            })
        })
    })

    describe('GET /api/bookmarks/:id', () => {
        context('Given no bookmarks', () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
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
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                    .expect(200, bookmark)
            })
        })
    })

    describe(`POST /api/bookmarks`, () => {
        it(`creates an bookmark, responding with 201 and the new bookmark`, function() {
          const newBookmark = {
            title: "title test",
            description: "description test",
            url: "url test",
            rating: 1
        }
        return supertest(app)
            .post(`/api/bookmarks`)
            .send(newBookmark)
            .set('Authorization', `Bearer b08141cf-3086-42fd-9345-815aafe43c00`)
            .expect(201)
            .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title)
            expect(res.body.url).to.eql(newBookmark.url)
            expect(res.body.description).to.eql(newBookmark.description)
            expect(res.body.rating).to.eql(newBookmark.rating)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`http://localhost:8000/api/bookmarks/${res.body.id}`)
            })
            .then(res =>
            supertest(app)
                .get(`/api/bookmarks/${res.body.id}`)
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
              .post('/api/bookmarks')
              .send(newBookmark)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(400, {
                error: { message: `Missing '${field}' in request body` }
              })
          })
        })
    })
    
    describe(`DELETE /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
          it(`responds with 404`, () => {
            const id = 123456
            return supertest(app)
              .delete(`/api/bookmarks/${id}`)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(404, { error: { message: `Bookmark doesn't exist` } })
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
              .delete(`/api/bookmarks/${idToRemove}`)
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(204)
              .then(() =>
                supertest(app)
                  .get(`/api/bookmarks`)
                  .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                  .expect(expectedBookmarks)
              )
            })
        })
    })

    describe.only(`PATCH /api/bookmarks/:id`, () => {
      context(`Given no bookmarks`, () => {
        it(`responds with 404`, () => {
          const id = 123456
          return supertest(app)
            .patch(`/api/bookmarks/${id}`)
            .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
            .expect(404, { error: { message: `Bookmark doesn't exist` } })
        })
      })

      context('Given there are bookmarks in the database', () => {
       const bookmarks = makeBookmarksArray()
  
       beforeEach('insert bookmarks', () => {
         return db
           .into('bookmarks')
           .insert(bookmarks)
       })
  
       it('responds with 204 and updates the article', () => {
         const idToUpdate = 2
         const updateBookmark = {
            title: "updated title",
            description: "updated description",
            rating: 2
          }
          const expectedBookmark = {
            ...bookmarks[idToUpdate - 1],
            ...updateBookmark
          }

          return supertest(app)
           .patch(`/api/bookmarks/${idToUpdate}`)
           .send(updateBookmark)
           .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
           .expect(204)
           .then(res =>
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                .expect(expectedBookmark)
            )
       })

       it(`responds with 400 when no required fields supplied`, () => {
         const idToUpdate = 2
         return supertest(app)
           .patch(`/api/bookmarks/${idToUpdate}`)
           .send({ irrelevantField: 'foo' })
           .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
           .expect(400, {
             error: {
               message: `Request body must contain either 'title', 'description', 'url', or 'rating'`
             }
           })
        })

        it(`responds with 204 when updating only a subset of fields`, () => {
            const idToUpdate = 2
            const updateBookmark = {
              title: 'updated title',
            }
            const expectedArticle = {
              ...bookmarks[idToUpdate - 1],
              ...updateBookmark
            }
                      return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .send({
                ...updateBookmark,
                fieldToIgnore: 'should not be in GET response'
              })
              .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
              .expect(204)
              .then(res =>
                supertest(app)
                  .get(`/api/bookmarks/${idToUpdate}`)
                  .set('Authorization', 'Bearer b08141cf-3086-42fd-9345-815aafe43c00')
                  .expect(expectedArticle)
              )
          })
        })
      })
    })

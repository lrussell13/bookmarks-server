require('dotenv').config()
const express = require('express')
const xss = require('xss')
const bookmarkService = require('../bookmarks-services')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    url: xss(bookmark.url),
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    rating: bookmark.rating,
})

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        bookmarkService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
          res.json(bookmarks.map(serializeBookmark))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, description, url, rating } = req.body;
        const newBook = {title, description, url, rating}
    
        for (const [key, value] of Object.entries(newBook))
        if (value == null)
            return res.status(400).json({
            error: { message: `Missing '${key}' in request body` }
            })
    
        bookmarkService.insertBookmark(req.app.get('db'), newBook)
            .then(bookmark => {
                res
                .status(201)
                .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
                .json(serializeBookmark(bookmark));
            })
        .catch(next)
   })


bookmarkRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const { id } = req.params
        bookmarkService.getById(req.app.get('db'), id)
          .then(bookmark => {
            if (!bookmark) {
              return res.status(404).json({
                error: { message: `Bookmark doesn't exist` }
              })
            }
            res.bookmark = bookmark
            next()
          })
          .catch(next)
      })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        bookmarkService.deleteArticle(
          req.app.get('db'),
          req.params.id
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
    })

module.exports = bookmarkRouter
const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, description, url, rating } = req.body;

    if (!title) {
        logger.error(`Title is required`);
        return res
        .status(400)
        .send('Invalid data');
    }
    
    if (!description) {
        logger.error(`Description is required`);
        return res
        .status(400)
        .send('Invalid data');
    }

    if (!url) {
        logger.error(`URL is required`);
        return res
        .status(400)
        .send('Invalid data');
    }

    if (!rating) {
        logger.error(`Rating is required`);
        return res
        .status(400)
        .send('Invalid data');
    }


    const id = uuid();

    const book = {
        id,
        title,
        description,
        url,
        rating
    };

    bookmarks.push(book);

    logger.info(`Book with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${id}`)
        .json(book);
    })


bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
        const book = bookmarks.find(b => b.id == id);

        if (!book) {
            logger.error(`Book with id ${id} not found.`);
            return res
            .status(404)
            .send('Book Not Found');
        }

    res.json(book);
    })

    .delete((req, res) => {
        const { id } = req.params;

        const bookIndex = bookmarks.findIndex(b => b.id == id);
    
        if (bookIndex === -1) {
            logger.error(`Book with id ${id} not found.`);
            return res
            .status(404)
            .send('Not found');
        }
    
        bookmarks.splice(bookIndex, 1);
    
        logger.info(`Book with id ${id} deleted.`);
    
        res
            .status(204)
            .end();
    })

module.exports = bookmarkRouter
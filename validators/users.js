const { check } = require('express-validator') //TODO <---
const { validateResult } = require('../helpers/validateHelper')

const validateCreate = [ //TODO:name, age, email
    check('name')
        .exists()
        .not()
        .isLength({ min: 5 })
        .isEmpty(),
    check('email')
        .exists()
        .isEmail(),
    (req, res, next) => {
        validateResult(req, res, next)
    }
]

module.exports = { validateCreate }
/**
 * Created by 99171 on 2017/2/20.
 */
const express = require('express')
const request = require('request')
const router = express.Router()
const querystring = require('querystring')
const debug = require('debug')('app:search')

router.use('/', (req, res, next) => {
  var url = 'http://www.upchina.com/media/stock/list_stock/'
  var code = querystring.escape(req.query.code)

  var callback = (error, response, body) => {
    if (error) {
      res.send({
        iRet: -1
      })
    } else {
      res.header('Cache-Control', 'no-store')
      res.type('text/plain')
      res.send(body)
    }
  }

  request.post(url + code, callback)
})

module.exports = router
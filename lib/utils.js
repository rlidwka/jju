
// this function registers json5 extension, so you
// can do `require("./config.json5")` kind of thing
module.exports.register = function() {
	var r = require, e = 'extensions'
	r[e]['.json5'] = function() {

	}
}

// this function monkey-patches JSON.parse, so it
// will return an exact position of error in case
// of parse failure
module.exports.JSON_parse = function() {

}

// this function is an express/connect middleware
// that accepts uploads in application/json5 format
module.exports.middleware = function() {
	return function(req, res, next) {

	}
}


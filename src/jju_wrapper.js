var _require = window.require
window.require = function(arg) {
	if (arg === 'jju') return require('jju')
	return _require.apply(this, arguments)
}

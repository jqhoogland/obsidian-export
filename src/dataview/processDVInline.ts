export default function processDVInline(str) {
	let _str = str.replace(/\(([\w\d]+)\:\:(.*)\)/, (_, key, value) => {
		return `[${value}](${value} "${key}")`
	})

	_str = _str.replace(/\[([\w\d]+)\:\:(.*)\]/, (_, key, value) => {
		return `[${key}: ${value}](${value} "${key}")`
	})

	return _str
}

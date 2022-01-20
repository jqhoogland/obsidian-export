export default async function processDVInline(str) {
	let _str = await str.replace(/\(([\w\d]+)\:\:(.*)\)/, (_, key, value) => {
		return `[${value}](${value} "${key}")`
	})

	_str = await _str.replace(/\[([\w\d]+)\:\:(.*)\]/, (_, key, value) => {
		return `[${key}: ${value}](${value} "${key}")`
	})

	return _str
}

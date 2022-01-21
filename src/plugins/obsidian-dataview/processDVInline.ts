export default async function processDVInline(str: string) {
	let _str = await str.replace(/\(([\w\d]+)\:\:(.*)\)/, (_: string, key: string, value: string) => {
		return `[${value}](${value} "${key}")`
	})

	_str = await _str.replace(/\[([\w\d]+)\:\:(.*)\]/, (_: string, key: string, value: string) => {
		return `[${key}: ${value}](${value} "${key}")`
	})

	return _str
}

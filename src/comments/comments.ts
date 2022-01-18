export async function removeComments(str: string) {
	console.log(str.match(/%%[\s\S]*?%%/g))
	return str.replace(/%%[\s\S]*?%%/g, ""); // Remove altogether
}

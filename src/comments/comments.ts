export async function removeComments(str: string) {
	return str.replace(/%%[\s\S]*?%%/g, ""); // Remove altogether
}

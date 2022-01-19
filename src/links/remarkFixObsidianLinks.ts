import { visit } from "unist-util-visit";
import { getUrl, parseUrl } from "../../utils";

const remarkFixObsidianLinks = (options = {}) => (tree) => {

	const dv = options?.dv

	visit(tree, { tagName: "a" }, (node, index, parent) => {
		const [oldUrl, id = ""] = parseUrl(node?.properties?.href).split("#");

		if (oldUrl.slice(0, 4) === "http") {
			return node
		}

		const target = dv.page(oldUrl);
		const newUrl = getUrl(target);
		console.log({ before: oldUrl, after: newUrl, target, node })

		//console.log("Before", node)

		if (!newUrl) {
			node.tagName = "span"
			node.properties.href = ""
		} else {
			node.properties.href = "/" + newUrl + "#" + id
		}

		// console.log("After", node)

		return node
	})

	console.log({ tree })

	return tree
}


export default remarkFixObsidianLinks

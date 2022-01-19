import { visit } from "unist-util-visit";
import { getUrl, parseUrl } from "../../utils";

const rehypeFixObsidianLinks = (options = {}) => (tree) => {

	const dv = options?.dv

	visit(tree, { tagName: "a" }, (node, index, parent) => {
		const [oldUrl, id = ""] = parseUrl(node?.properties?.href).split("#");

		if (oldUrl.slice(0, 4) === "http") {
			return node
		}

		const target = dv.page(oldUrl);
		const newUrl = getUrl(target);

		if (!newUrl) {
			node.tagName = "span"
			node.properties.href = ""
		} else {
			node.properties.href = "/" + newUrl + "#" + id
		}

		return node
	})

	return tree
}


export default rehypeFixObsidianLinks

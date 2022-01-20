import { visit } from "unist-util-visit";
import { getUrl, parseUrl } from "../../../utils";

const rehypeFixObsidianLinks = (options = {}) => (tree) => {

	const dv = options?.dv

	visit(tree, { tagName: "a" }, (node, index, parent) => {
		const href = node?.properties?.href;
		if (href?.[0] === "#" && href?.slice(0, 7) !== "#/page/") return node;

		const [oldUrl, id = ""] = parseUrl(href).split("#");

		if (["http", "mail"].includes(oldUrl.slice(0, 4))) {
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

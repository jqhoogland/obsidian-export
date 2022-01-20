import { visit } from "unist-util-visit";
import find from "lodash/find";
import findIndex from "lodash/findIndex";
import flatMap from "lodash/flatMap";
import { brk, heading, link, list, paragraph, text } from "mdast-builder";
import { u } from "unist-builder"

const renderName = ({ family, given, literal = false }) => {
	if (literal) return literal;
	return `${given.split(" ").map(name => `${name?.[0]}.`).join(" ")} ${family}`;
};

const renderAuthors = (authors) => {
	if (!authors?.length || authors.length === 0) {
		return "";
	}
	if (authors?.length === 1) {
		return renderName(authors[0]);
	}
	if (authors?.length === 2) {
		return `${renderName(authors[0])} and ${renderName(authors[1])}`;
	}
	if (authors?.length === 3) {
		return `${renderName(authors[0])}, ${renderName(authors[1])}, and ${renderName(authors[2])}`;
	}
	return `${renderName(authors[0])} et al`;
};

const renderCitation = (citation) => {
	if (!citation) return text("")

	const authors = citation?.author ? renderAuthors(citation?.author) : "";
	const year = citation?.issued?.["date-parts"]?.[0]?.[0];

	return [
		text(`${authors && authors + ". "}${citation?.title} ${year ? `(${year})` : ""}`),
		link(`#citation-${citation?.id}`, "↩"),
		...(citation?.url ? [link(citation?.URL, "🔗")] : [])
	]

};


const remarkProcessCitations = (options) => tree => {
	const citations = []

	const db = options.db ?? []
	visit(tree, { type: "cite" }, (node, _, parent) => {
		const _citations = node?.data?.citeItems.map(({ key }) => find(db, { "citation-key": key }));
		const citationIndices = _citations.map(citation => {
			let i = findIndex(citations, { id: citation?.id });
			if (i === -1 && !!citation) {
				i = citations.length;
				citations.push(citation)
			}
			return i + 1
		})

		parent.children = flatMap(parent.children, child => {
			if (child.type === "cite" && child.value === node.value) {
				if (_citations?.length > 0) {
					// Map citations to the format `[1, 2, 3]` with the number representing the index of that citation.
					return [
						text("["),
						...flatMap(_citations,
							(citation, i) =>
								[
									u("link", {
										url: `#citation-${citation?.id}`,
										data: { hProperties: { id: `ref-${citation?.id}` } }
									}, [text(`${citationIndices?.[i]}`)]),
									...(i < citation?.length - 1 ? [text(", ")] : [])
								],
						),
						text("]")
					]
				} else {
					return []
				}
			}
			return child
		})

		return node
	})


	const referencesSection = citations?.length > 0 ? [
		heading(2, [text("References")]),
		list("ordered", (citations.map(citation => u("listItem", {
			spread: true,
			data: { hProperties: { id: `citation-${citation?.id}` } }
		}, [paragraph(renderCitation(citation))])))),
		brk,
		u("break", { data: { hName: "hr" } }),
		brk
	] : [];


	tree.children = [...tree.children, ...referencesSection]


	return tree

}

export default remarkProcessCitations

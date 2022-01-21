import { visit } from "unist-util-visit";
import find from "lodash/find";
import findIndex from "lodash/findIndex";
import flatMap from "lodash/flatMap";
import { brk, heading, link, list, paragraph, text } from "mdast-builder";
import { u } from "unist-builder"
import { CitationCSLJSON, CitationName } from "./index";
import { InlineCiteNode } from "@benrbray/mdast-util-cite";
import { Root } from "mdast";

const renderName = ({ family, given, literal }: CitationName) => {
	if (!!literal) return literal;
	return `${given.split(" ").map(name => `${name?.[0]}.`).join(" ")} ${family}`;
};

const renderAuthors = (authors: CitationName[]) => {
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

const renderCitation = (citation: CitationCSLJSON) => {
	if (!citation) return text("")

	const authors = citation?.author ? renderAuthors(citation?.author) : "";
	const year = citation?.issued?.["date-parts"]?.[0]?.[0];

	return [
		text(`${authors && authors + ". "}${citation?.title} ${year ? `(${year})` : ""}`),
		link(`#citation-${citation?.id}`, "↩"),
		...(citation?.URL ? [link(citation?.URL, "🔗")] : [])
	]

};

interface ProcessCitationsOptions {
	db: CitationCSLJSON[]
}


const remarkProcessCitations = (options: ProcessCitationsOptions) => (tree: Root) => {
	const citations: CitationCSLJSON[] = []

	const db = options.db ?? []
	// @ts-ignore
	visit(tree, { type: "cite" }, (node: InlineCiteNode, _, parent: ParentNode) => {
		// @ts-ignore
		const _citations: CitationCSLJSON[] = node?.data?.citeItems.map(({ key }) => find(db, { "citation-key": key }));
		const citationIndices = _citations.map((citation: CitationCSLJSON) => {
			let i = findIndex(citations, { id: citation?.id });
			if (i === -1 && !!citation) {
				i = citations.length;
				citations.push(citation)
			}
			return i + 1
		})

		// TODO: Should *not* be doing this in place. It's very gross.
		// @ts-ignore
		parent.children = flatMap(parent.children, (child: InlineCiteNode) => {
			if (child.type === "cite" && child.value === node.value) {
				if (_citations?.length > 0) {
					// Map citations to the format `[1, 2, 3]` with the number representing the index of that citation.
					return [
						text("["),
						...flatMap(_citations,
							(citation: CitationCSLJSON, i: number) =>
								[
									u("link", {
										url: `#citation-${citation?.id}`,
										data: { hProperties: { id: `ref-${citation?.id}` } }
									}, [text(`${citationIndices?.[i]}`)]),
									...(i < _citations?.length - 1 ? [text(", ")] : [])
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

	// @ts-ignore
	tree.children = [...tree.children, ...referencesSection]


	return tree

}

export default remarkProcessCitations

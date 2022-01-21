/**
 * So I can't find any typescript implementation of the CSL spec, which is crazy.
 * This belongs in its own library.
 *
 * It is *not* complete!
 */

export type CitationDate = number[]

export interface CitationDateParts {
	"date-parts"?: CitationDate[];
	raw: string
}

export interface CitationName {
	family?: string;
	given?: string;
	"non-dropping-participle"?: string;
	"dropping-participal"?: string;
	literal: string;
}

export interface CitationCSLJSON {
	id: string,
	type: string,
	title: string,
	author: CitationName[],
	accessed?: CitationDateParts,
	issued?: CitationDateParts,
	URL?: string
}

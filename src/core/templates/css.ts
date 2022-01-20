import h from "hastscript";

export const DEFAULT_EXTRA_STYLES = [h("style", `
p {
  margin-bottom: 0.5rem /* Add a bottom gutter */ 
}
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
}

h1 { font-size: 3rem; margin-top: 1rem }
h2 { font-size: 2.5rem; margin-top: .75rem }
h3 { font-size: 2.125rem; margin-top: .675rem }
h4 { font-size: 1.875rem; margin-top: .5rem }
h5 { font-size: 1.5rem; margin-top: .375rem }
h6 { font-size: 1.25rem; margin-top: .5rem }
ol { list-style: decimal }
`)]

export const DEFAULT_STYLES = [
	{
		href: "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.css",
		integrity: "sha384-MlJdn/WNKDGXveldHDdyRP1R4CTHr3FeuDNfhsLPYrq2t0UBkUdK2jyTnXPEK1NQ",
		crossorigin: "anonymous",
	},
]

export const DEFAULT_SCRIPTS = [
	{
		src: "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.js",
		integrity: "sha384-VQ8d8WVFw0yHhCk5E8I86oOhv48xLpnDZx5T9GogA/Y84DcCKWXDmSDfn13bzFZY",
		crossorigin: "anonymous",
		defer: true
	},
]

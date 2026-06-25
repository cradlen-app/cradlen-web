import type { MDXComponents } from "mdx/types";
import { Callout, Steps, Step, Figure } from "@/components/marketing/guide/mdx";

// Custom components exposed by name to every guide MDX file, plus this is the
// required `mdx-components` convention for `@next/mdx` with the App Router.
// Base prose elements (h1/p/ul/…) are styled by the `prose` wrapper in the
// guide article layout, so they are intentionally left untouched here.
const components: MDXComponents = {
  Callout,
  Steps,
  Step,
  Figure,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

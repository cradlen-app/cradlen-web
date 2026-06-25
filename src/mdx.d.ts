// Ambient typing for MDX/Markdown imports. `@next/mdx` compiles these at
// build time; this just tells TypeScript each one default-exports a component.
declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType;
  export default MDXComponent;
}

declare module "*.md" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType;
  export default MDXComponent;
}

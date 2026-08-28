// React's <ViewTransition> is real and works at runtime in this exact
// Next.js build (16.3.2 aliases the "react" import to its own bundled
// canary-feature build for App Router code — confirmed by reading Next's
// compiled react.development.js/react.production.js directly), but its
// types live in `@types/react`'s separate `react/canary` subpath export,
// not the default `"react"` entry point this project's tsconfig resolves.
// This is a standard module augmentation (merges with, doesn't replace,
// the existing "react" module's exports) so `import { ViewTransition } from
// "react"` type-checks without switching the whole app to a different
// import path for one component. Mirrors @types/react's own canary.d.ts
// definition.

import type { ExoticComponent, ReactNode, Ref } from "react";

declare module "react" {
  export interface ViewTransitionInstance {
    name: string;
  }

  export type ViewTransitionClassPerType = Record<"default" | (string & {}), "none" | "auto" | (string & {})>;
  export type ViewTransitionClass = ViewTransitionClassPerType | ViewTransitionClassPerType[string];

  export interface ViewTransitionProps {
    children?: ReactNode | undefined;
    default?: ViewTransitionClass | undefined;
    enter?: ViewTransitionClass | undefined;
    exit?: ViewTransitionClass | undefined;
    name?: "auto" | (string & {}) | undefined;
    onEnter?: (instance: ViewTransitionInstance, types: Array<string>) => void | (() => void);
    onExit?: (instance: ViewTransitionInstance, types: Array<string>) => void | (() => void);
    onShare?: (instance: ViewTransitionInstance, types: Array<string>) => void | (() => void);
    onUpdate?: (instance: ViewTransitionInstance, types: Array<string>) => void | (() => void);
    ref?: Ref<ViewTransitionInstance> | undefined;
    share?: ViewTransitionClass | undefined;
    update?: ViewTransitionClass | undefined;
  }

  export const ViewTransition: ExoticComponent<ViewTransitionProps>;
}

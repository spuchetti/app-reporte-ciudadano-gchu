/// <reference types="jest" />

// src/types.d.ts
declare module "*.css" {
  const content: any;
  export default content;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "react-test-renderer" {
  import { ReactElement } from "react";

  export interface ReactTestInstance {
    props: {
      accessibilityLabel?: string;
      onChangeText: (texto: string) => void;
      onPress: () => void;
    };
    find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance;
  }

  export interface ReactTestRenderer {
    toJSON(): unknown;
    root: ReactTestInstance;
  }

  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): Promise<void>;
}

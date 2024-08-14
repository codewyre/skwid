declare module 'shell-parse' {
  export default function parse(str: string): any;
}

declare module 'merge-deep' {
  export default function mergeDeep(obj: any, ...objs: any[]): any;
}
declare module 'toposort' {
  export default function toposort(edges: Array<string[]>): string[];
  export function array(nodes: string[], edges: Array<[string, string]>): string[];
}
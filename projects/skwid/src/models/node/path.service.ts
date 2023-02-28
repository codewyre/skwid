export interface PathService {
  join(...pathParts: string[]): string;
  relative(first: string, second: string): string;
  dirname(path: string): string;
  resolve(...pathParts: string[]): string;
}
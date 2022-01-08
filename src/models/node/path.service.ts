export interface PathService {
  join(...pathParts: string[]): string;
  dirname(path: string): string;
}
export interface FileSystemService {
  existsSync(path: string): boolean;
  readFileSync(path: string): Buffer;
}
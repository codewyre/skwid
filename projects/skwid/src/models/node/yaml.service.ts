export interface YamlService {
  parse<T>(input: string): T;
}
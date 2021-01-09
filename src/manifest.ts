export interface Manifest<T> {
  name: string;
  display_name: string;
  moziot: Moziot<T>;
}

export interface Moziot<T> {
  exec: string;
  schema: Record<string, unknown>;
  config: T;
}

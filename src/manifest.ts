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

export interface ManifestFile {
  manifest_version: number;
  id: string;
  name: string;
  short_name: string;
  version: string;
  description: string;
  homepage_url: string;
  license: string;
  author: string;
  gateway_specific_settings: GatewaySpecificSettings;
  options?: Options;
  content_scripts?: ContentScript[];
  web_accessible_resources?: string[];
}
export interface GatewaySpecificSettings {
  webthings: WebthingsSettings;
}

export interface WebthingsSettings {
  exec?: string;
  strict_min_version: string;
  strict_max_version: string;
  primary_type: 'adapter' | 'notifier' | 'extension';
}

export interface Options {
  default?: Record<string, unknown>;
  schema: Record<string, unknown>;
}

interface ContentScript {
  css?: string[];
  js?: string[];
}

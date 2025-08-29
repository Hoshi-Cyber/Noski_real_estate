export const ASSET_VERSION = 'v2'; // bump to v3, v4... whenever you replace /public images
export const withV = (src: string) =>
  src.includes('?') ? `${src}&v=${ASSET_VERSION}` : `${src}?v=${ASSET_VERSION}`;

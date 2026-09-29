export const APP_VERSION = "0.8";
export const SAVE_SCHEMA_VERSION = 8;

export function isCompatiblePageVersion(pageVersion, schemaVersion) {
  return String(pageVersion || "") === APP_VERSION
    && Number(schemaVersion) === SAVE_SCHEMA_VERSION;
}

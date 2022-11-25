import {
  defaultLibraries,
  JSLibraries,
  libraryReservedNames,
} from "utils/DynamicBindingUtils";

export function resetJSLibraries() {
  JSLibraries.length = 0;
  JSLibraries.push(...defaultLibraries);
  const defaultLibraryAccessors = defaultLibraries.map(
    (lib) => lib.accessor[0],
  );
  for (const key of libraryReservedNames) {
    if (!defaultLibraryAccessors.includes(key)) {
      // @ts-expect-error: Types are not available
      self[key] = undefined;
      libraryReservedNames.delete(key);
    }
  }
  return JSLibraries;
}

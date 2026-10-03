/** Hands the Visitor a file to save, built in the browser. */
export function saveFile(
  name: string,
  content: string | Uint8Array<ArrayBuffer>,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** A file name from a description, without the characters file systems refuse. */
export function fileNameFor(name: string, extension: string): string {
  return `${name.replace(/[/\\:*?"<>|]/g, '-')}.${extension}`;
}

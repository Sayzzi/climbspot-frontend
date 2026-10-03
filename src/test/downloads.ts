import { afterEach, vi } from 'vitest';

export interface Download {
  readonly name: string;
  readonly type: string;
  readonly content: () => Promise<string>;
  readonly bytes: () => Promise<Uint8Array>;
}

const files = new Map<string, Blob>();
const downloads: Download[] = [];

/**
 * jsdom implements neither object URLs nor the navigation a download link triggers:
 * record the files the app saves instead.
 */
URL.createObjectURL = (blob: Blob | MediaSource) => {
  const url = `blob:test/${String(files.size)}`;
  files.set(url, blob as Blob);
  return url;
};
URL.revokeObjectURL = () => undefined;

vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
  this: HTMLAnchorElement,
) {
  const blob = files.get(this.href);
  if (this.download !== '' && blob) {
    downloads.push({
      name: this.download,
      type: blob.type,
      content: () => blob.text(),
      bytes: async () => new Uint8Array(await blob.arrayBuffer()),
    });
  }
});

/** The files the app saved, oldest first. */
export function savedFiles(): readonly Download[] {
  return downloads;
}

afterEach(() => {
  files.clear();
  downloads.length = 0;
});

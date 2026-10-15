// Node's fetch (since Node 26) builds and reads bodies with the global Blob and File,
// which jsdom replaces with its own: forms then travel as "[object FormData]", or with
// files short of their declared length. The tests put Node's own back, as a browser
// hands its own to its fetch.

// Imported by name at run time: the app's types are the browser's, not Node's.
const nodeBuffer = 'node:buffer';
const { Blob: NodeBlob, File: NodeFile } = (await import(/* @vite-ignore */ nodeBuffer)) as {
  readonly Blob: typeof Blob;
  readonly File: typeof File;
};
Object.assign(globalThis, { Blob: NodeBlob, File: NodeFile });

/** Node's own FormData, which it only hands out from a parsed body. */
const NodeFormData = (await new Response(new URLSearchParams()).formData())
  .constructor as typeof FormData;
/** Node's own Request, which Vitest wraps to convert jsdom's bodies. */
const NodeRequest = Object.getPrototypeOf(Request) as typeof Request;
Object.assign(globalThis, { FormData: NodeFormData, Request: NodeRequest });

// Node 18 does not expose the Web File constructor used by newer undici builds.
// This small compatibility shim keeps the production service bootable on Alibaba
// Cloud Linux until the server runtime is upgraded to Node 20+.
if (typeof globalThis.File === 'undefined' && typeof globalThis.Blob !== 'undefined') {
  globalThis.File = class File extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = String(name);
      this.lastModified = options.lastModified ?? Date.now();
    }
  };
}

// pdfmake 0.3 ships no typings. The CV code only uses this small surface.
type PdfMakeOutput = {
  getBuffer(): Promise<Uint8Array>;
  getBlob(): Promise<Blob>;
};

type PdfMakeInstance = {
  createPdf(document: Record<string, unknown>, options?: Record<string, unknown>): PdfMakeOutput;
  setFonts(fonts: Record<string, Record<string, string>>): void;
  addFonts(fonts: Record<string, Record<string, string>>): void;
  setUrlAccessPolicy(callback: (url: string) => boolean): void;
  setLocalAccessPolicy?(callback: (path: string) => boolean): void;
  addVirtualFileSystem?(vfs: Record<string, string>): void;
};

declare module "pdfmake" {
  const pdfmake: PdfMakeInstance;
  export default pdfmake;
}

declare module "pdfmake/build/pdfmake" {
  const pdfmake: PdfMakeInstance;
  export default pdfmake;
}

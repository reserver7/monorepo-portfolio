import { Buffer } from "node:buffer";
import * as Y from "yjs";
import { sanitizeDocumentTitle } from "./store-document-utils";

export const encodeBinary = (value: Uint8Array): string => Buffer.from(value).toString("base64");

export const decodeBinary = (encoded: string): Uint8Array => {
  return new Uint8Array(Buffer.from(encoded, "base64"));
};

export const replaceYText = (ytext: Y.Text, nextValue: string): void => {
  const currentValue = ytext.toString();
  if (currentValue === nextValue) {
    return;
  }

  ytext.delete(0, currentValue.length);
  if (nextValue.length > 0) {
    ytext.insert(0, nextValue);
  }
};

export const createYDoc = (title: string, content: string): Y.Doc => {
  const ydoc = new Y.Doc();
  ydoc.transact(() => {
    ydoc.getMap<string>("meta").set("title", sanitizeDocumentTitle(title));

    const ytext = ydoc.getText("content");
    if (content.trim().length > 0) {
      ytext.insert(0, content);
    }
  }, "seed");

  return ydoc;
};

export const readYDocState = (ydoc: Y.Doc): { title: string; content: string; yjsState: string } => {
  const titleMap = ydoc.getMap<string>("meta");
  const rawTitle = titleMap.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.slice(0, 120) : "";
  const content = ydoc.getText("content").toString();
  const yjsState = encodeBinary(Y.encodeStateAsUpdate(ydoc));

  return {
    title,
    content,
    yjsState
  };
};

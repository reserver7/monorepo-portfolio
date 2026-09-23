import assert from "node:assert/strict";

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { buildInvitationLoginPath } from "./invitation-next.ts";

assert.equal(
  buildInvitationLoginPath("?kind=document&id=doc-1&role=viewer"),
  "/login?next=%2Finvite%3Fkind%3Ddocument%26id%3Ddoc-1%26role%3Dviewer"
);

console.log("invitation next path: ok");

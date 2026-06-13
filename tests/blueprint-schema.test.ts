import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { templateBlueprintSchema } from "../src/lib/blueprint-schema";

const blueprint = JSON.parse(
  readFileSync(resolve(process.cwd(), "seed/example-blueprint.json"), "utf8"),
);

const parsed = templateBlueprintSchema.parse(blueprint);

assert.equal(parsed.version, "1.0");
assert.ok(parsed.databases.some((database) => database.key === "crm"));
assert.ok(parsed.pages.some((page) => page.key === "sop-hub"));

console.log("Blueprint schema validation passed.");

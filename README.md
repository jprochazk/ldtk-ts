# ldtk-ts

LDtk type definitions and parser.

It's just a wrapper over `JSON.parse`.

```ts
import { Project } from "ldtk";

async function loadAssets() {
    // From existing JSON
    const json = await (await fetch("assets/level/my_ldtk_level.ldtk")).json();
    const project: LDtkProject = Project.fromJSON(json);
    // Or as a convenience, from a URL
    // This just wraps `fetch`
    const project: LDtkProject = await Project.fromURL("assets/level/my_ldtk_level.ldtk");
}
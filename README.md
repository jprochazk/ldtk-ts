# ldtk-ts

[LDtk](https://ldtk.io/) file format type definitions and import wrapper.

This library provides an API without all the noise of LDtk "editor-only" values, 
definitions, etc., combined with many utilities to make usage easier.

If you just want the type definitions, they're fully compliant with the [schema](https://ldtk.io/files/JSON_SCHEMA.json).

Documentation is available [here](https://www.jan-prochazka.eu/ldtk-ts).

```s 
$ npm install ldtk
```

### Usage

**Basic usage**

```ts
import { World } from "ldtk";

World.loadRaw("assets/world.ldtk").then(async world => {
    // You have access to the raw `LDtk` JSON file here
    let currentLevel = world.levels[0];
    for (const layer of currentLevel.layerInstances) {
        console.log(layer);
        // the world is your oyster
    }
})
```

**Using the importer**

```ts
import { World, LDtk } from "ldtk";

World.fromURL("assets/world.ldtk").then(async world => {
    let currentLevel = world.levelMap["Level1"];
    function loop(time) {
        render(currentLevel);

        window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop)
});
```

### Versioning table

LDtk | ldtk-ts 
:-----:|:-------:
0.7.2 | 0.8.6
0.7.1 | 0.8.5
<0.7.0 | not supported
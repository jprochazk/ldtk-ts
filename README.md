# ldtk-ts

LDtk file format type definitions, and import wrapper. 

It provides an API without all the noise of LDtk "editor-only" values, definitions, etc.,
combined with many utilities to make using the format easier.

It's also possible to work with the raw JSON file without any preprocessing.

```s 
$ npm install ldtk
```

### Usage

**No preprocessing**

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

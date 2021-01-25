import { World, LDtk } from "./index";
import * as fs from "fs";

const fetch = <T = any>(path: string): T => JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));

process.chdir("test");

describe("importer", () => {
    it("raw load", async () => {

    });
    it("full API", () => {
        const data = fetch<LDtk.World>("test.ldtk");
        const world = World.fromJSON(data);
        expect(world.levels.length).toEqual(data.levels.length);
        expect(world.enums.length).toEqual(data.defs!.enums.length);
        expect(world.tilesets.length).toEqual(data.defs!.tilesets.length);
    });
    it("gridvania", () => {
        const data = fetch<LDtk.World>("test_gridvania.ldtk");
        World.fromJSON(data);
    });
    it("free layout", () => {
        const data = fetch<LDtk.World>("test_free.ldtk");
        World.fromJSON(data);
    });
    it("separate files", async () => {
        const data = fetch<LDtk.World>("test_separate.ldtk");
        const world = World.fromJSON(data);
        // separate files start with 0 levels
        expect(world.levels.length).toEqual(0);
        // load one
        await world.loadLevel("Level1");
        expect(world.levels.length).toEqual(1);
        // no duplicates
        await world.loadLevel("Level1");
        expect(world.levels.length).toEqual(1);
        // load the rest
        await world.loadLevels();
        expect(world.levels.length).toEqual(data.levels.length);
    });
});
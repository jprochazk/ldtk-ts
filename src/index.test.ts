import { World, LDtk, EnumField, Field } from "./index";
import * as fs from "fs";

const fetch = <T = any>(path: string): T => JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));

// we want to be inside the `test` directory so that 
// loading relative-path assets works correctly
process.chdir("test");

/**
 * Joins two arrays into an array of tuples.
 * If the two array lengths don't match, the extra
 * values from the longer one are paired with `null` values.
 * 
 * ```
 * zip([0, 1, 2], ['a', 'b', 'c']) // [[0, 'a'], [1, 'b'], [2, 'c']]
 * zip([0, 1], ['a', 'b', 'c']) // [[0, 'a'], [1, 'b'], [null, 'c']]
 * ```
 */
function zip<A, B>(a: A[], b: B[]) {
    const zipped: [A | null, B | null][] = [];
    for (let i = 0, len = a.length > b.length ? a.length : b.length; i < len; ++i) {
        zipped.push([a[i] ?? null, b[i] ?? null]);
    }
    return zipped;
}

function compareFields(o: LDtk.FieldInstance, p: Field) {
    // type check abbreviation
    const T = (name: string) => o.__type.includes(name);
    // TODO: separate test for type transformation
    // just check values here
    const o_val = o.__value as any;
    const p_val = p.value as any;
    switch (true) {
        // simple comparison - most can be compared
        // with just expect.toEqual
        case T("Int"): /* @fallthrough */
        case T("Float"): /* @fallthrough */
        case T("String"): /* @fallthrough */
        case T("Bool"): /* @fallthrough */
        case T("Color"): /* @fallthrough */
        case T("FilePath"):
            expect(o_val).toEqual(p_val);
            break;
        // array special-cases
        case T("Array"):
            switch (true) {
                case T("Point"):
                    zip<any, any>(o_val, p_val).forEach(([o, p]) =>
                        o == null
                            // if o is null, p should be too
                            ? expect(p).toBeNull()
                            // otherwise their fields should match
                            : (expect(o.cx).toEqual(p.x), expect(o.cy).toEqual(p.y)));
                    break;
                case T("Enum"):
                    expect(T((p as EnumField).ref.id)).toEqual(true);
                    break;
            }
            break;
        // non-array special cases
        case !T("Array"):
            switch (true) {
                case T("Point"):
                    o_val == null
                        ? expect(p_val).toBeNull()
                        : (expect(o_val.cx).toEqual(p_val.x), expect(o_val.cy).toEqual(p_val.y))
                    break;
                case T("Enum"):
                    expect(T((p as EnumField).ref.id)).toEqual(true);
            }
            break;
    }
}

describe("importer", () => {
    it("full API", () => { // Compares official Full API sample data with the processed data.
        const data = fetch<LDtk.World>("test.ldtk");
        const world = World.fromJSON(data);

        expect(world.bgColor).toEqual(data.bgColor);
        expect(world.layout).toEqual(data.worldLayout);
        expect(world.externalLevels).toEqual(data.externalLevels);
        // enums
        expect(data.defs!.enums.length).toEqual(world.enums.length);
        for (let enumIdx = 0; enumIdx < data.defs!.enums.length; ++enumIdx) {
            const o_enum = data.defs!.enums[enumIdx];
            const p_enum = world.enums[enumIdx];
            expect(p_enum.id).toEqual(o_enum.identifier);
            expect(p_enum.uid).toEqual(o_enum.uid);
            zip(o_enum.values, p_enum.values).forEach(([o, p]) => (
                expect(o?.id).toEqual(p?.id),
                expect(o?.__tileSrcRect[0]).toEqual(p?.tileSrcRect.x),
                expect(o?.__tileSrcRect[1]).toEqual(p?.tileSrcRect.y),
                expect(o?.__tileSrcRect[2]).toEqual(p?.tileSrcRect.width),
                expect(o?.__tileSrcRect[3]).toEqual(p?.tileSrcRect.height)));
            expect(o_enum.iconTilesetUid).toEqual(p_enum.tileset?.uid);
        }
        // tilesets
        expect(data.defs!.tilesets.length).toEqual(world.tilesets.length);
        for (let tilesetIdx = 0; tilesetIdx < data.defs!.tilesets.length; ++tilesetIdx) {
            const o_tileset = data.defs!.tilesets[tilesetIdx];
            const p_tileset = world.tilesets[tilesetIdx];
            expect(p_tileset.id).toEqual(o_tileset.identifier)
            expect(p_tileset.uid).toEqual(o_tileset.uid)
            expect(p_tileset.size.width).toEqual(o_tileset.pxWid);
            expect(p_tileset.size.height).toEqual(o_tileset.pxHei);
            expect(p_tileset.gridSize).toEqual(o_tileset.tileGridSize);
            expect(p_tileset.spacing).toEqual(o_tileset.spacing);
            expect(p_tileset.padding).toEqual(o_tileset.padding);
            expect(p_tileset.path).toEqual(o_tileset.relPath);
        }
        // levels
        expect(data.levels.length).toEqual(world.levels.length);
        for (let levelIdx = 0; levelIdx < data.levels.length; ++levelIdx) {
            // prefix 'o_' = original data
            // prefix 'p_' = processed data
            const o_level = data.levels[levelIdx];
            const p_level = world.levels[levelIdx];
            expect(p_level.id).toEqual(o_level.identifier);
            expect(p_level.uid).toEqual(o_level.uid);
            expect(p_level.background.color).toEqual(o_level.__bgColor);
            expect(p_level.background.path).toEqual(o_level.bgRelPath);
            expect(p_level.background.pivot.x).toEqual(o_level.bgPivotX);
            expect(p_level.background.pivot.y).toEqual(o_level.bgPivotY);
            expect(p_level.background.pos).toEqual(o_level.__bgPos);
            expect(p_level.size.width).toEqual(o_level.pxWid);
            expect(p_level.size.height).toEqual(o_level.pxHei);
            zip(o_level.__neighbours, p_level.neighbours).forEach(([o, p]) => (
                expect(o?.dir).toEqual(p?.dir),
                expect(o?.levelUid).toEqual(p?.level.uid)));
            if (o_level.layerInstances != null) {
                expect(o_level.layerInstances.length).toEqual(p_level.layers.length);
                for (let layerIdx = 0; layerIdx < o_level.layerInstances.length; ++layerIdx) {
                    const o_layer = o_level.layerInstances[layerIdx];
                    const p_layer = p_level.layers[layerIdx];
                    expect(p_layer.gridSize).toEqual(o_layer.__gridSize);
                    expect(p_layer.opacity).toEqual(o_layer.__opacity);
                    expect(p_layer.pxTotalOffset.x).toEqual(o_layer.__pxTotalOffsetX);
                    expect(p_layer.pxTotalOffset.y).toEqual(o_layer.__pxTotalOffsetY);
                    expect(p_layer.uid).toEqual(o_layer.layerDefUid);
                    expect(p_layer.size.width).toEqual(o_layer.__cWid);
                    expect(p_layer.size.height).toEqual(o_layer.__cHei);
                    expect(p_layer.type).toEqual(o_layer.__type);
                    expect(p_layer.tileset?.uid ?? null).toEqual(o_layer.__tilesetDefUid);
                    if (o_layer.__type === "AutoLayer") {
                        // auto layer tiles aren't preprocessed
                        expect(p_layer.autoLayerTiles).not.toBeNull();
                        expect(o_layer.autoLayerTiles).toEqual(p_layer.autoLayerTiles);
                    }
                    else if (o_layer.__type === "Entities") {
                        expect(p_layer.entities).not.toBeNull();
                        expect(o_layer.entityInstances.length).toEqual(p_layer.entities!.length);
                        for (let entityIdx = 0; entityIdx < o_layer.entityInstances.length; ++entityIdx) {
                            const o_entity = o_layer.entityInstances[entityIdx];
                            const p_entity = p_layer.entities![entityIdx];
                            expect(o_entity.fieldInstances.length).toEqual(Object.keys(p_entity.fields).length);
                            for (const o_field of o_entity.fieldInstances) {
                                const p_field = p_entity.fields[o_field.__identifier];
                                // field must exist
                                expect(p_field != null).toEqual(true);
                                compareFields(o_field, p_field);
                            }

                        }
                    }
                    else if (o_layer.__type === "Tiles") {
                        // grid tiles aren't preprocessed
                        expect(p_layer.gridTiles).not.toBeNull();
                        expect(o_layer.gridTiles).toEqual(p_layer.gridTiles);
                    }
                    else if (o_layer.__type === "IntGrid") {
                        // TODO
                        expect(p_layer.intGrid).not.toBeNull();
                        for (let intGridIdx = 0; intGridIdx < o_layer.intGrid.length; ++intGridIdx) {
                            const o_igValue = o_layer.intGrid[intGridIdx];
                            const y = Math.floor(o_igValue.coordId / o_layer.__cWid);
                            const x = o_igValue.coordId - y * o_layer.__cWid;
                            const p_igValue = p_layer.intGrid![x][y];
                            expect(o_igValue.v).toEqual(p_igValue);
                        }
                    }
                }
            }
        }
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
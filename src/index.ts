import { loadJSON } from "./util";
import * as LDtk from "./typedef";

// Re-export LDtk type definitions
export {
    LDtk
}

export interface Point {
    x: number,
    y: number
}

export interface Size {
    width: number,
    height: number
}

// TODO: instead of return new objects for things like Point and Size, instantiate them in the constructor
// TODO: auto-generate documentation https://den.dev/blog/docs-github-actions/#typescript-documentation-generator

export const enum FieldType {
    Int = "Int",
    IntArray = "IntArray",
    Float = "Float",
    FloatArray = "FloatArray",
    String = "String",
    StringArray = "StringArray",
    Bool = "Bool",
    BoolArray = "BoolArray",
    Color = "Color",
    ColorArray = "ColorArray",
    Point = "Point",
    PointArray = "PointArray",
    FilePath = "FilePath",
    FilePathArray = "FilePathArray",
    Enum = "Enum",
    EnumArray = "EnumArray",
}
export interface IntField {
    id: string,
    type: FieldType.Int
    value: number | null
}
export interface FloatField {
    id: string,
    type: FieldType.Float
    value: number | null
}
export interface StringField {
    id: string,
    type: FieldType.String
    value: string | null
}
export interface BoolField {
    id: string,
    type: FieldType.Bool
    value: boolean | null
}
export interface ColorField {
    id: string,
    type: FieldType.Color
    value: string | null
}
export interface PointField {
    id: string,
    type: FieldType.Point
    value: Point | null
}
export interface FilePathField {
    id: string,
    type: FieldType.FilePath
    value: string | null
}
export interface EnumField {
    id: string,
    type: FieldType.Enum
    value: string | null
    ref: Enum
}
export interface IntArrayField {
    id: string,
    type: FieldType.IntArray
    value: number[]
}
export interface FloatArrayField {
    id: string,
    type: FieldType.FloatArray
    value: number[]
}
export interface StringArrayField {
    id: string,
    type: FieldType.StringArray
    value: string[]
}
export interface BoolArrayField {
    id: string,
    type: FieldType.BoolArray
    value: boolean[]
}
export interface ColorArrayField {
    id: string,
    type: FieldType.ColorArray
    value: string[]
}
export interface PointArrayField {
    id: string,
    type: FieldType.PointArray
    value: Point[]
}
export interface FilePathArrayField {
    id: string,
    type: FieldType.FilePathArray
    value: string[]
}
export interface EnumArrayField {
    id: string,
    type: FieldType.EnumArray
    value: string[]
    /** Reference to the enum */
    ref: Enum
}

/**
 * Represents a pre-parsed Entity field
 * 
 * Examples: 
 * 
 * `Array<MyEnum.A>` will result in:
 * ```
 * { type: "Enum", value: "A", ref: MyEnum }
 * ```
 * Where `MyEnum` is not an identifier, but a
 * reference to the Enum:
 * ```
 * const entity = layer.entities[0];
 * entity.fields["enum_field"].ref.uid // you can access the enum properties
 * ```
 */
export type Field =
    | IntField
    | FloatField
    | StringField
    | BoolField
    | ColorField
    | PointField
    | FilePathField
    | EnumField
    | IntArrayField
    | FloatArrayField
    | StringArrayField
    | BoolArrayField
    | ColorArrayField
    | PointArrayField
    | FilePathArrayField
    | EnumArrayField

const FieldTypeRegex = /(?:Array<)*(?:(\w+)Enum)*\.*(\w+)>*/;
function parseField(field: LDtk.FieldInstance, world: World, entityId: string): Field {
    // search for type with format `(Array<)? (LocalEnum|ExternalEnum)? (.)? TYPE (>)?`
    // and capture $1 = (LocalEnum|ExternalEnum) and $2 = TYPE
    const result = FieldTypeRegex.exec(field.__type);

    if (result == null) // sanity check, should never happen
        throw new Error(`Error at field '${field.__identifier}' entity '${entityId}': Invalid type name ${field.__type}`);

    // it's an array type if it's in the form Array<T>
    const isArray = field.__type.startsWith("Array");
    // it's an enum type if capture $1 is not null
    const isEnum = result[1] != null;

    // no need to transform id, just use it directly
    const id = field.__identifier;

    // transform the type to fit our own definition
    // e.g. Array<T> -> TArray
    /** @see {FieldType} */
    let type = result[2] as any;
    const typeName = type;
    if (isEnum) type = "Enum";
    if (isArray) type += "Array";

    // grab the field value
    let value = field.__value;
    if (value != null && type === FieldType.Point)
        value = { x: (value as any)[0], y: (value as any)[1] };
    if (type === FieldType.PointArray)
        (value as [number, number][]).map(v => ({ x: v[0], y: v[1] }));

    const output = {
        id,
        type,
        value
    } as any;
    if (isEnum) output.ref = world.enumMap[typeName];

    return output;
}

class Entity {
    readonly fields: Readonly<Record<string, Field>>;

    private tileset_: Tileset | undefined;

    constructor(
        public readonly world: World,
        private data: LDtk.EntityInstance,
        private pxOffset: Point,
    ) {
        this.fields = {};
        for (let i = 0; i < data.fieldInstances.length; ++i) {
            const instance = data.fieldInstances[i];
            (this.fields as Record<string, Field>)[instance.__identifier] = parseField(instance, world, this.id);
        }

        // @ts-ignore accessing private property
        const worldData = world.data;
        const entities = worldData.defs?.entities;
        if (entities != null) {
            for (let i = 0; i < entities.length; ++i) {
                if (entities[i].uid === this.data.defUid) {
                    const tilesetId = entities[i].tilesetId
                    if (tilesetId != null) {
                        this.tileset_ = world.tilesetMap[tilesetId];
                    }
                }
            }
        }

    }

    /** Grid coordinates */
    get gridPos(): Point {
        return {
            x: this.data.__grid[0],
            y: this.data.__grid[1],
        };
    }

    /** Entity definition identifier */
    get id(): string {
        return this.data.__identifier;
    }

    /** Pivot coordinates (values are from 0 to 1) of the Entity */
    get pivot(): Point {
        return {
            x: this.data.__pivot[0],
            y: this.data.__pivot[1],
        };
    }

    /** 
     * Optional Tile used to display this entity (it could either be the default Entity tile, 
     * or some tile provided by a field value, like an Enum).
     */
    get tile() {
        return this.data.__tile;
    }

    /**
     * Optional Tileset used to display this etity
     */
    get tileset() {
        return this.tileset_;
    }

    /** 
     * Pixel coordinates with all offsets applied
     */
    get pos(): Point {
        return {
            x: this.data.px[0] + this.pxOffset.x,
            y: this.data.px[1] + this.pxOffset.y,
        };
    }

    /**
     * Pixel coordinates without applied offsets
     */
    get relativePos(): Point {
        return {
            x: this.data.px[0],
            y: this.data.px[1],
        };
    }
}

interface Tile {
    /** 
     * "Flip bits", a 2-bits integer to represent the mirror transformations of the tile.
     * - Bit 0 = X flip 
     * - Bit 1 = Y flip
     * 
     * Examples: 
     * - f == 0 -> no flip
     * - f == 1 -> X flip only
     * - f == 2 -> Y flip only
     * - f == 3 -> both flips
     */
    f: number
    /** 
     * Pixel coordinates of the tile in the **layer**. 
     * 
     * Don't forget optional layer offsets, if they exist! 
     */
    px: [x: number, y: number]
    /** Pixel coordinates of the tile in the **tileset** */
    src: [x: number, y: number]
    /** The *Tile ID* in the corresponding tileset. */
    t: number
}
interface IntGridValue {
    /** Coordinate ID in the layer grid */
    coordId: number
    /** IntGrid value */
    v: number
}
export const enum LayerType {
    AutoLayer = "AutoLayer",
    Entities = "Entities",
    IntGrid = "IntGrid",
    Tiles = "Tiles",
}
class Layer {
    private autoLayerTiles_: Tile[] | null = null;
    private entities_: Entity[] | null = null;
    private gridTiles_: Tile[] | null = null;
    private intGrid_: IntGridValue[] | null = null;

    constructor(
        public readonly world: World,
        private data: LDtk.LayerInstance
    ) {
        switch (this.type) {
            case LayerType.AutoLayer: {
                this.autoLayerTiles_ = data.autoLayerTiles;
            } break;
            case LayerType.Entities: {
                this.entities_ = [];
                for (let i = 0; i < data.entityInstances.length; ++i) {
                    const instance = data.entityInstances[i];
                    this.entities_[i] = new Entity(world, instance, this.pxTotalOffset);
                }
            } break;
            case LayerType.Tiles: {
                this.gridTiles_ = data.gridTiles;
            } break;
            case LayerType.IntGrid: {
                this.intGrid_ = data.intGrid;
            } break;
        }
    }

    /** Grid-based width/height. */
    get size(): Size {
        return {
            width: this.data.__cWid,
            height: this.data.__cHei,
        };
    }

    /** Size of a grid cell. */
    get gridSize() {
        return this.data.__gridSize;
    }

    get opacity() {
        return this.data.__opacity;
    }

    /** Total layer pixel offset, including both instance and definition offsets. */
    get pxTotalOffset(): Point {
        return {
            x: this.data.__pxTotalOffsetX,
            y: this.data.__pxTotalOffsetY,
        };
    }

    /** 
     * Possible values: `AutoLayer`, `Entities`, `Tiles`, `IntGrid`
     * 
     * @see LayerType
     */
    get type(): LayerType {
        return this.data.__type as LayerType;
    }

    /** Non-null if `this.type === "AutoLayer"` */
    get autoLayerTiles(): readonly Tile[] | null {
        return this.autoLayerTiles_;
    }

    /** Non-null if `this.type === "Entities"` */
    get entities(): readonly Entity[] | null {
        return this.entities_;
    }

    /** Non-null if `this.type === "Tiles"` */
    get gridTiles(): readonly Tile[] | null {
        return this.gridTiles_;
    }

    /** Non-null if `this.type === "IntGrid"` */
    get intGrid(): readonly IntGridValue[] | null {
        return this.intGrid_;
    }

    /** UID of the level this layer belongs to */
    get levelUid(): number {
        return this.data.levelId;
    }

    /** Optional tileset used to render the layer */
    get tileset(): Tileset | undefined {
        if (this.data.__tilesetDefUid == null) return;
        return this.world.tilesetMap[this.data.__tilesetDefUid];
    }
}

class Background {
    constructor(private data: LDtk.Level) { }

    get color() {
        return this.data.__bgColor;
    }

    get pos() {
        return this.data.__bgPos;
    }

    get pivot(): Point {
        return {
            x: this.data.bgPivotX,
            y: this.data.bgPivotY,
        };
    }

    get path() {
        return this.data.bgRelPath;
    }
}
interface Neighbour {
    dir: "n" | "s" | "w" | "e"
    level: Level
}
class Level {
    readonly background: Background;

    /** 
     * An array containing all layer instances.
     * 
     * This array is **sorted in display order**: the 1st layer is the top-most and the last is behind.
     */
    readonly layers: ReadonlyArray<Layer> = [];

    private neighbours_: Neighbour[] | null = [];

    constructor(
        public readonly world: World,
        private data: LDtk.Level
    ) {
        this.background = new Background(data);
        if (this.data.layerInstances != null) {
            for (let i = 0; i < this.data.layerInstances.length; ++i) {
                (this.layers as Array<Layer>)[i] = new Layer(world, this.data.layerInstances[i]);
            }
        }
    }

    /** Unique string identifier */
    get id() {
        return this.data.identifier;
    }

    /** Width/Height of the level in pixels */
    get size(): Size {
        return {
            width: this.data.pxWid,
            height: this.data.pxHei
        };
    }

    /** Unique Int identifier */
    get uid() {
        return this.data.uid;
    }

    /** World X/Y coordinates in pixels */
    get pos(): Point {
        return {
            x: this.data.worldX,
            y: this.data.worldY
        };
    }

    get neighbours(): Neighbour[] {
        // lazily load neighbours
        // reason: attempting to find neighbours before
        // all neighbours have been found may result in
        // returning undefined based on loading order
        if (this.neighbours_ == null) {
            this.neighbours_ = [];
            for (let i = 0; i < this.data.__neighbours.length; ++i) {
                const ref = this.world.findLevelByUid(this.data.__neighbours[i].levelUid);
                if (!ref) // sanity check, should never happen
                    throw new Error(`Neighbour '${this.data.__neighbours[i].levelUid}' for level '${this.data.identifier}' does not exist.`);
                (this.neighbours as Neighbour[])[i] = {
                    dir: this.data.__neighbours[i].dir,
                    level: ref,
                }
            }
        }
        return this.neighbours_;
    }
}

interface EnumValue {
    id: string
    tileId?: number
    tileSrcRect: { x: number, y: number, width: number, height: number }
}
class Enum {
    readonly valueMap: Readonly<Record<string, EnumValue>>;
    readonly valueKeys: string[];
    readonly values: EnumValue[];

    constructor(
        public readonly world: World,
        private data: LDtk.EnumDefinition
    ) {
        this.valueMap = {};
        for (let i = 0; i < data.values.length; ++i) {
            const v = data.values[i];
            (this.valueMap as Record<string, EnumValue>)[v.id] = {
                id: v.id,
                tileId: v.tileId,
                tileSrcRect: {
                    x: v.__tileSrcRect[0],
                    y: v.__tileSrcRect[1],
                    width: v.__tileSrcRect[2],
                    height: v.__tileSrcRect[3],
                }
            }
        }
        this.valueKeys = Object.keys(this.valueMap);
        this.values = Object.values(this.valueMap);
    }

    /** Unique string identifier */
    get id(): string {
        return this.data.identifier;
    }
    /** Unique Int identifier */
    get uid(): number {
        return this.data.uid;
    }
    /** Optional icon tileset */
    get tileset(): Tileset | undefined {
        if (this.data.iconTilesetUid == null) return;
        return this.world.tilesetMap[this.data.iconTilesetUid];
    }
}

class Tileset {
    constructor(
        public readonly world: World,
        private data: LDtk.TilesetDefinition
    ) { }

    /** Unique string identifier */
    get id(): string {
        return this.data.identifier;
    }
    /** Distance in pixels from image borders */
    get padding(): number {
        return this.data.padding;
    }
    /** Image width/height in pixels */
    get size(): Size {
        return {
            width: this.data.pxWid,
            height: this.data.pxHei,
        };
    }
    /** Path to the source file, relative to the current project JSON file */
    get path(): string {
        return this.data.relPath;
    }
    /** Space in pixels between all tiles */
    get spacing(): number {
        return this.data.spacing;
    }
    /** 
     * Size of one tile 
     * 
     * This represents both width and height, because non-uniform tiles
     * are not supported yet.
     */
    get gridSize(): number {
        return this.data.tileGridSize;
    }
    /** Unique Intidentifier */
    get uid(): number {
        return this.data.uid;
    }
}

export class World {
    readonly levelMap: Readonly<Record<string, Level>>;
    readonly levelKeys: string[];
    readonly levels: Level[];

    readonly tilesetMap: Readonly<Record<number, Tileset>>;
    readonly tilesetIds: string[];
    readonly tilesets: Tileset[];

    readonly enumMap: Readonly<Record<string, Enum>>;
    readonly enumKeys: string[];
    readonly enums: Enum[];

    private constructor(private data: LDtk.World) {
        this.tilesetMap = {};
        this.tilesetIds = [];
        this.tilesets = [];
        this.enumMap = {};
        this.enumKeys = [];
        this.enums = [];
        if (data.defs != null) {
            // load tilesets
            for (let i = 0; i < data.defs.tilesets.length; ++i) {
                const t = data.defs.tilesets[i];
                (this.tilesetMap as Record<string, Tileset>)[t.uid] = new Tileset(this, t);
            }
            this.tilesetIds = Object.keys(this.tilesetMap);
            this.tilesets = Object.values(this.tilesetMap);
            // load enums
            for (let i = 0; i < data.defs.enums.length; ++i) {
                const e = data.defs.enums[i];
                (this.enumMap as Record<string, Enum>)[e.identifier] = new Enum(this, e);
            }
            this.enumKeys = Object.keys(this.enumMap);
            this.enums = Object.values(this.enumMap);
        }

        this.levelMap = {};
        this.levelKeys = [];
        this.levels = [];
        if (!data.externalLevels) {
            // load levels if we don't have separate level files
            for (let i = 0; i < data.levels.length; ++i) {
                (this.levelMap as Record<string, Level>)[data.levels[i].identifier] = new Level(this, data.levels[i]);
            }
            this.levelKeys = Object.keys(this.levelMap);
            this.levels = Object.values(this.levelMap);
        }
    }

    findLevel(predicate: (l: Level) => boolean): Level | undefined {
        for (let i = 0; i < this.levels.length; ++i) {
            if (predicate(this.levels[i])) return this.levels[i];
        }
    }
    findTileset(predicate: (t: Tileset) => boolean): Tileset | undefined {
        for (let i = 0; i < this.tilesets.length; ++i) {
            if (predicate(this.tilesets[i])) return this.tilesets[i];
        }
    }
    findEnum(predicate: (e: Enum) => boolean): Enum | undefined {
        for (let i = 0; i < this.enums.length; ++i) {
            if (predicate(this.enums[i])) return this.enums[i];
        }
    }

    findLevelByUid(uid: number): Level | undefined {
        return this.findLevel(l => l.uid === uid);
    }
    findTilesetById(id: string): Tileset | undefined {
        return this.findTileset(t => t.id === id);
    }
    findTilesetByPath(path: string): Tileset | undefined {
        return this.findTileset(t => t.path === path);
    }
    findEnumByUid(uid: number): Enum | undefined {
        return this.findEnum(e => e.uid === uid);
    }

    get externalLevels(): boolean {
        return this.data.externalLevels;
    }

    get bgColor(): string {
        return this.data.bgColor;
    }

    get layout() {
        return this.data.worldLayout;
    }

    /**
     * Load and parse all external levels and enums.
     * 
     * If a level is already loaded, it won't be loaded again.
     */
    async loadLevels(): Promise<void> {
        const promises = [];
        const levels = this.data.levels;
        for (let i = 0; i < levels.length; ++i) {
            const level = levels[i];
            // don't load twice
            if (this.levelMap[level.identifier] != null) {
                continue;
            }
            // only load levels that are external
            // in theory, all levels in an `externalLevels: true`
            // world should be external, but this is just to
            // satisfy typescript
            const rel = level.externalRelPath
            if (rel != null) {
                promises.push(this.fetchLevel(rel).then(loaded => {
                    (this.levelMap as Record<string, Level>)[loaded.id] = loaded;
                    (this.levelKeys as string[])[i] = loaded.id;
                    (this.levels as Level[])[i] = loaded;
                }));
            }
        }
        // wait until all have loaded, then resolve
        await Promise.all(promises);
        return;
    }

    /**
     * Load and parse external level `identifier`.
     * 
     * This allows for dynamically loading individual levels.
     * 
     * If a level is already loaded, it won't be loaded again.
     */
    async loadLevel(identifier: string): Promise<void> {
        // don't load twice
        if (this.levelMap[identifier] != null) {
            return;
        }
        // grab the index so that we can maintain the level order
        let levelIndex = -1;
        let level = null;
        for (let i = 0; i < this.data.levels.length; ++i) {
            if (this.data.levels[i].identifier === identifier) {
                level = this.data.levels[i];
                levelIndex = i;
                break;
            }
        }
        if (level == null) throw new Error(`Level ${identifier} does not exist!`);
        const loaded = await this.fetchLevel(level.externalRelPath!);
        (this.levelMap as Record<string, Level>)[loaded.id] = loaded;
        (this.levelKeys as string[])[levelIndex] = loaded.id;
        (this.levels as Level[])[levelIndex] = loaded;
    }

    /**
     * Unload a single level.
     * 
     * This only works if you're not holding any strong references
     * to the level somewhere.
     */
    unloadLevel(identifier: string) {
        for (let i = 0; i < this.levelKeys.length; ++i) {
            const key = this.levelKeys[i];
            if (key === identifier) {
                delete (this.levelMap as Record<string, Level>)[key];
                delete this.levels[i];
                delete this.levelKeys[i];
                break;
            }
        }
    }

    /**
     * Parse an existing JSON object as an LDtk project file
     */
    static fromJSON(data: LDtk.World): World {
        // TODO: validation?
        return new World(data);
    }

    /**
     * Asynchronously load and parse an LDtk project file
     */
    static async fromURL(path: string): Promise<World> {
        return new World(await loadJSON(path));
    }

    private async fetchLevel(path: string): Promise<Level> {
        return new Level(this, await loadJSON(path));
    }

    /**
     * Load the raw JSON without any utilities.
     * 
     * This does the following in Node:
     * ```
     * const PATH = "assets/world.ldtk";
     * import * as fs from "fs";
     * const world = await new Promise((resolve, reject) => {
     *     fs.readFile(PATH, { encoding: "utf-8" }, (err, data) => {
     *          if (err) reject(err);
     *          else resolve(JSON.parse(data) as LDtk.World);
     *     });
     * })
     * ```
     * And in the browser:
     * ```
     * const PATH = "assets/world.ldtk";
     * const world = await (await fetch(PATH)).json() as LDtk.World;
     * ```
     */
    static async loadRaw(path: string): Promise<LDtk.World> {
        return await loadJSON(path);
    }
}
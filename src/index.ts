import { loadJSON } from "./util";
import * as LDtk from "./typedef";

// Re-export LDtk type definitions
export {
    LDtk
}

/**
 * Represents a point in 2D space (X, Y)
 */
export interface Point {
    x: number,
    y: number
}

/**
 * Represents a 2D size (width, height)
 */
export interface Size {
    width: number,
    height: number
}

// TODO: instead of return new objects for things like Point and Size, instantiate them in the constructor
// TODO: auto-generate documentation https://den.dev/blog/docs-github-actions/#typescript-documentation-generator

export const enum FieldType {
    /**
     * Value type: `number | null`
     * 
     * Associated interface: {@link IntField}
     */
    Int = "Int",
    /**
     * Value type: `number[]`
     * 
     * Associated interface: {@link IntArrayField}
     */
    IntArray = "IntArray",
    /**
     * Value type: `number | null`
     * 
     * Associated interface: {@link Float}
     */
    Float = "Float",
    /**
     * Value type: `number[]`
     * 
     * Associated interface: {@link FloatArrayField}
     */
    FloatArray = "FloatArray",
    /**
     * Value type: `string`
     * 
     * Associated interface: {@link StringField}
     */
    String = "String",
    /**
     * Value type: `string[]`
     * 
     * Associated interface: {@link StringArrayField}
     */
    StringArray = "StringArray",
    /**
     * Value type: `number`
     * 
     * Associated interface: {@link BoolField}
     */
    Bool = "Bool",
    /**
     * Value type: `number[]`
     * 
     * Associated interface: {@link BoolArrayField}
     */
    BoolArray = "BoolArray",
    /**
     * Value type: `string`
     * 
     * Associated interface: {@link ColorField}
     */
    Color = "Color",
    /**
     * Value type: `string[]`
     * 
     * Associated interface: {@link ColorArrayField}
     */
    ColorArray = "ColorArray",
    /**
     * Value type: `number`
     * 
     * Associated interface: {@link PointField}
     */
    Point = "Point",
    /**
     * Value type: `number[]`
     * 
     * Associated interface: {@link PointArrayField}
     */
    PointArray = "PointArray",
    /**
     * Value type: `string`
     * 
     * Associated interface: {@link FilePathField}
     */
    FilePath = "FilePath",
    /**
     * Value type: `string[]`
     * 
     * Associated interface: {@link FilePathField}
     */
    FilePathArray = "FilePathArray",
    /**
     * Value type: `string`
     * 
     * Associated interface: {@link EnumField}
     */
    Enum = "Enum",
    /**
     * Value type: `string[]`
     * 
     * Associated interface: {@link EnumArrayField}
     */
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
/** Enum fields contain a reference to the associated {@link Enum} */
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
/** Enum fields contain a reference to the associated {@link Enum} */
export interface EnumArrayField {
    id: string,
    type: FieldType.EnumArray
    value: string[]
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
 * 
 * Having all the field interfaces in a union allows narrowing a generic
 * field type down to a specific field type:
 * 
 * ```
 * const field: Field = // ...
 * if (field.type === FieldType.Int) {
 *     // value has type `number | null`
 *     const value = field.value; 
 * }
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
    // e.g. Array<Type> -> TypeArray
    /** @see {FieldType} */
    let type = result[2] as any;
    const typeName = type;
    // all enum types are widened to just `Enum`
    if (isEnum) type = "Enum";
    if (isArray) type += "Array";

    // grab the field value
    let value = field.__value;
    // if the type is `Point`, transform each value into a point
    if (value != null && type === FieldType.Point)
        value = { x: (value as any).cx, y: (value as any).cy };
    // if it's a point array, transform each array value to a point
    if (type === FieldType.PointArray)
        value = (value as any[]).map(v => ({ x: v.cx, y: v.cy }));

    const output = {
        id,
        type,
        value
    } as any;
    // if the type is `Enum`, additionally append a reference to the enum
    if (isEnum) output.ref = world.enumMap[typeName];

    return output;
}

/**
 * Entities are generic data that can be placed in your levels, 
 * such as the Player start position or Items to pick up.
 * 
 * Entities are collections of custom fields.
 * 
 * Each field has a `type` and `value`.
 * 
 * The possible types can be found in {@link FieldType}.
 * 
 * Visit https://ldtk.io/docs/general/editor-components/entities/ for more information.
 */
export class Entity {
    /**
     * Map of entity fields.
     * 
     * They can be accessed like regular properties. 
     * 
     * For a full list of field types, see {@link FieldType}.
     * All possible interfaces are under the {@link Field} union.
     * 
     * Usage:
     * ```
     * import { FieldType } from "ldtk";
     * 
     * const entity = ... ;
     * 
     * for (const field of Object.values(entity.fields)) {
     *     switch (field.type) {
     *         // thanks to the type system, `field` has type `IntField`
     *         // after you check that it's type is `FieldType.Int`.
     *         // value will have the type `number | null`.
     *         case FieldType.Int: UseEntityIntValue(field.value); break;
     *         // same goes for any other field type:
     *         case FieldType.Float: UseEntityFloatValue(field.value); break;
     *         case FieldType.String: UseEntityTextValue(field.value); break;
     *         // enum types have an extra field, `ref`, which holds
     *         // a reference to the parent enum.
     *         case FieldType.Enum: UseEntityEnumValue(field.value, field.ref); break;
     *         // array fields have separate entries in `FieldType`:
     *         case FieldType.IntArray: 
     *             // field.value type is `number[]`
     *             UseEntityIntArrayValue(field.value); break;
     *     }
     * }
     * ```
     */
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

    /** 
     * Grid coordinates 
     */
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

    /** 
     * Pivot coordinates (values are from 0 to 1) of the Entity 
     */
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
     * Optional Tileset used to display this entity
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

/**
 * Represents a single `Tile` instance.
 */
export interface Tile {
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
     * World position of a tile:
     * ```
     * const layer = ...;
     * for (tile in layer.tiles) {
     *     const tileWorldX = tile.px[0] + layer.pxTotalOffset.x
     *     const tileWorldY = tile.px[1] + layer.pxTotalOffset.y
     * }
     * ``` 
     */
    px: [x: number, y: number]
    /** Pixel coordinates of the tile in the **tileset** */
    src: [x: number, y: number]
    /** The *Tile ID* in the corresponding tileset. */
    t: number
}
/**
 * Enum of possible Layer types
 */
export const enum LayerType {
    AutoLayer = "AutoLayer",
    Entities = "Entities",
    IntGrid = "IntGrid",
    Tiles = "Tiles",
}
export interface IntGridValueDef {
    /** Color (RGB hex string) */
    color: string
    /** Unique string identifier */
    id?: string
}
/**
 * Layers support different kinds of data, specifically:
 * - [IntGrid](https://ldtk.io/docs/tutorials/intgrid-layers/)
 * - [Tile](https://ldtk.io/docs/tutorials/tile-layers/)
 * - [Entity](https://ldtk.io/docs/general/editor-components/entities/)
 * 
 * Visit https://ldtk.io/docs/general/editor-components/layers/ for more information about layers.
 */
export class Layer {
    private autoLayerTiles_: Tile[] | null = null;
    private entities_: Entity[] | null = null;
    private gridTiles_: Tile[] | null = null;
    private intGrid_: number[][] | null = null;

    /**
     * A map of IntGrid values to IntGrid value definitions.
     * 
     * The definition contains the editor color and optional identifier.
     * 
     * This is only populated if {@link Layer.type} is `IntGrid`.
     */
    readonly intGridValues: Readonly<Record<number, IntGridValueDef>> = {};

    constructor(
        public readonly world: World,
        private data: LDtk.LayerInstance
    ) {
        switch (this.type) {
            case LayerType.AutoLayer: {
                this.autoLayerTiles_ = data.autoLayerTiles;
            } break;
            case LayerType.Entities: {
                this.entities_ = new Array(data.entityInstances.length);
                for (let i = 0; i < data.entityInstances.length; ++i) {
                    const instance = data.entityInstances[i];
                    this.entities_[i] = new Entity(world, instance, this.pxTotalOffset);
                }
            } break;
            case LayerType.Tiles: {
                this.gridTiles_ = data.gridTiles;
            } break;
            case LayerType.IntGrid: {
                this.intGrid_ = new Array(this.size.width);
                for (let i = 0; i < data.intGrid.length; ++i) {
                    const instance = data.intGrid[i];
                    const y = Math.floor(instance.coordId / this.size.width);
                    const x = instance.coordId - y * this.size.width;
                    if (this.intGrid_[x] == null) {
                        this.intGrid_[x] = new Array(this.size.height);
                    }
                    this.intGrid_[x][y] = instance.v;
                }
                //@ts-ignore accessing private property
                const worldData = world.data;
                const layers = worldData.defs!.layers;
                if (layers != null) {
                    for (let i = 0; i < layers.length; ++i) {
                        if (layers[i].uid === this.uid) {
                            for (let idx = 0; idx < layers[i].intGridValues.length; ++idx) {
                                (this.intGridValues as Record<number, IntGridValueDef>)[idx] = {
                                    color: layers[i].intGridValues[idx].color,
                                    id: layers[i].intGridValues[idx].identifier
                                };
                            }
                        }
                    }
                }
            } break;
        }
    }

    /** 
     * Grid-based width/height.
     */
    get size(): Size {
        return {
            width: this.data.__cWid,
            height: this.data.__cHei,
        };
    }

    /** 
     * Size of a grid cell. 
     * 
     * Refers to both the width and height.
     */
    get gridSize() {
        return this.data.__gridSize;
    }

    /** Layer opacity */
    get opacity() {
        return this.data.__opacity;
    }

    /** 
     * Total layer pixel offset, including both instance and definition offsets.
     */
    get pxTotalOffset(): Point {
        return {
            x: this.data.__pxTotalOffsetX,
            y: this.data.__pxTotalOffsetY,
        };
    }

    /** 
     * Layer type, possible values: `AutoLayer`, `Entities`, `Tiles`, `IntGrid`
     */
    get type(): LayerType {
        return this.data.__type as LayerType;
    }

    /** 
     * Non-null if `this.type === "AutoLayer"` 
     * 
     * {@link Layer.type}
     */
    get autoLayerTiles(): readonly Tile[] | null {
        return this.autoLayerTiles_;
    }

    /** 
     * Non-null if `this.type === "Entities"` 
     * 
     * {@link Layer.type}
     */
    get entities(): readonly Entity[] | null {
        return this.entities_;
    }

    /** 
     * Non-null if `this.type === "Tiles"` 
     * 
     * {@link Layer.type}
     */
    get gridTiles(): readonly Tile[] | null {
        return this.gridTiles_;
    }

    /** 
     * This contains the values from the IntGrid, but stored in a 2D array.
     * 
     * ```
     * const layer: Layer = new Layer(...);
     * const grid = layer.intGridXY;
     * for (let x = 0; x < grid.length; ++x) {
     *     for (let y = 0; y < grid[x].length; ++y) {
     *         doSomethingWith(grid[x][y]);
     *     }
     * }
     * ```
     * 
     * Non-null if `this.type === "IntGrid"` 
     * 
     * {@link Layer.type}
     */
    get intGrid(): readonly number[][] | null {
        return this.intGrid_;
    }

    /** 
     * Parent Level
     */
    get level(): Level | undefined {
        return this.world.findLevelByUid(this.data.levelId);
    }

    /** 
     * Optional tileset used to render the layer
     */
    get tileset(): Tileset | undefined {
        if (this.data.__tilesetDefUid == null) return;
        return this.world.tilesetMap[this.data.__tilesetDefUid];
    }

    /** Unique Int identifier */
    get uid(): number {
        return this.data.layerDefUid;
    }
}

/**
 * Level background data
 */
export class Background {
    constructor(private data: LDtk.Level) { }

    /**
     * Background color (RGB hex string)
     */
    get color() {
        return this.data.__bgColor;
    }

    /**
     * Positional information
     * - Cropping
     * - Scale
     * - Top-Left corner
     * 
     * {@link LDtk.LevelBackgroundPosition}
     */
    get pos() {
        return this.data.__bgPos;
    }

    /**
     * Background pivot point, values are in the range (0, 1)
     */
    get pivot(): Point {
        return {
            x: this.data.bgPivotX,
            y: this.data.bgPivotY,
        };
    }

    /**
     * Background image URL
     */
    get path() {
        return this.data.bgRelPath;
    }
}
/**
 * Contains the neighbour's direction relative to this level
 * and a reference to the neighbour.
 */
export interface Neighbour {
    dir: "n" | "s" | "w" | "e"
    level: Level
}
/**
 * A level is made up of one or more {@link Layer} instances.
 * 
 * Each layer holds either bitmap image tiles, entities, or
 * integer values in a grid.
 * 
 * Visit https://ldtk.io/docs/general/world/ for more information.
 */
export class Level {
    readonly background: Background;

    /** 
     * An array layer instances.
     * 
     * This array is **sorted in display order**: the 1st layer is the top-most and the last is behind.
     */
    readonly layers: ReadonlyArray<Layer> = [];

    private neighbours_: Neighbour[] | null = null;

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

    /**
     * World X/Y coordinates in pixels
     */
    get pos(): Point {
        return {
            x: this.data.worldX,
            y: this.data.worldY
        };
    }

    /**
     * Get neighbouring levels
     * 
     * This property is lazily loaded. The first time you access this,
     * it fetches all neighbours and caches them.
     */
    get neighbours(): Neighbour[] {
        if (this.neighbours_ == null) {
            // load neighbours
            this.neighbours_ = [];
            for (let i = 0; i < this.data.__neighbours.length; ++i) {
                const ref = this.world.findLevelByUid(this.data.__neighbours[i].levelUid);
                if (ref == null) // sanity check, should never happen
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

/**
 * An Enum value
 */
export interface EnumValue {
    /**
     * Unique string identifier
     */
    id: string
    /**
     * Pixel x,y coordinates and width/height into the parent {@link Enum.tileset}
     */
    tileSrcRect: { x: number, y: number, width: number, height: number }
}
/**
 * Enums are special value types for Entities. ({@link Entity})
 * 
 * They could be for example the list of possible Enemy types, or a list of Item identifiers.
 * 
 * Each Enum is made up of one or more values. ({@link EnumValue})
 * 
 * Visit https://ldtk.io/docs/general/editor-components/enumerations-enums/ for more information.
 */
export class Enum {
    /**
     * A map of Enum value ids to Enum values.
     */
    readonly valueMap: Readonly<Record<string, EnumValue>>;
    /**
     * Array of this Enum's value ids
     */
    readonly valueIds: string[];
    /**
     * Array of this Enum's values
     */
    readonly values: EnumValue[];
    /** 
     * Optional icon tileset
     */
    readonly tileset: Tileset | null = null;

    constructor(
        public readonly world: World,
        private data: LDtk.EnumDefinition
    ) {
        this.valueMap = {};
        for (let i = 0; i < data.values.length; ++i) {
            const v = data.values[i];
            (this.valueMap as Record<string, EnumValue>)[v.id] = {
                id: v.id,
                tileSrcRect: {
                    x: v.__tileSrcRect[0],
                    y: v.__tileSrcRect[1],
                    width: v.__tileSrcRect[2],
                    height: v.__tileSrcRect[3],
                }
            }
        }
        this.valueIds = Object.keys(this.valueMap);
        this.values = Object.values(this.valueMap);
        if (this.data.iconTilesetUid != null) {
            this.tileset = world.findTilesetByUid(this.data.iconTilesetUid) ?? null
        }
    }

    /** Unique string identifier */
    get id(): string {
        return this.data.identifier;
    }
    /** Unique Int identifier */
    get uid(): number {
        return this.data.uid;
    }
}
/**
 * Tilesets are bitmap images which are used to render Tile layers.
 * 
 * See {@link Layer} for more information.
 * 
 * Visit https://ldtk.io/docs/tutorials/tile-layers/ for more information about tileset usage.
 */
export class Tileset {
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
     * This represents both width and height
     */
    get gridSize(): number {
        return this.data.tileGridSize;
    }
    /** Unique Intidentifier */
    get uid(): number {
        return this.data.uid;
    }
}

/**
 * Worlds contains various definitions ({@link Enum}, {@link Tileset}) and
 * are made up of one or more {@link Level}s, which utilise these definitions.
 * 
 * Worlds can have different layouts: `Linear`, `Free`, or `GridVania`.
 * 
 * Linear worlds are organized as a linear sequence of levels, either
 * horizontal or vertical.
 * 
 * Free worlds are not organized, all levels appear freely in 2D space.
 * 
 * GridVania worlds are organized into a uniform 2D grid, where each level 
 * can take up one or more grid cells.
 * 
 * Visit https://ldtk.io/docs/general/world/ for more information.
 */
export class World {
    /**
     * A map of Level ids to Levels.
     */
    readonly levelMap: Readonly<Record<string, Level>>;
    /**
     * Array Levels Ids defined for this World.
     */
    readonly levelIds: string[];
    /**
     * Array Levels defined for this World.
     */
    readonly levels: Level[];

    /**
     * A map of Tileset ids to Tilesets.
     */
    readonly tilesetMap: Readonly<Record<number, Tileset>>;
    /**
     * Array Tilesets Ids defined for this World.
     */
    readonly tilesetIds: string[];
    /**
     * Array Tilesets defined for this World.
     */
    readonly tilesets: Tileset[];

    /**
     * A map of Enum ids to Enums.
     */
    readonly enumMap: Readonly<Record<string, Enum>>;
    /**
     * Array Enum names defined for this World.
     */
    readonly enumIds: string[];
    /**
     * Array Enums defined for this World.
     */
    readonly enums: Enum[];

    private constructor(private data: LDtk.World) {
        this.tilesetMap = {};
        this.tilesetIds = [];
        this.tilesets = [];
        this.enumMap = {};
        this.enumIds = [];
        this.enums = [];
        if (data.defs != null) {
            // load tilesets
            for (let i = 0; i < data.defs.tilesets.length; ++i) {
                const t = data.defs.tilesets[i];
                (this.tilesetMap as Record<string, Tileset>)[t.identifier] = new Tileset(this, t);
            }
            this.tilesetIds = Object.keys(this.tilesetMap);
            this.tilesets = Object.values(this.tilesetMap);
            // load enums
            for (let i = 0; i < data.defs.enums.length; ++i) {
                const e = data.defs.enums[i];
                (this.enumMap as Record<string, Enum>)[e.identifier] = new Enum(this, e);
            }
            this.enumIds = Object.keys(this.enumMap);
            this.enums = Object.values(this.enumMap);
        }

        this.levelMap = {};
        this.levelIds = [];
        this.levels = [];
        if (!data.externalLevels) {
            // load levels if we don't have separate level files
            for (let i = 0; i < data.levels.length; ++i) {
                (this.levelMap as Record<string, Level>)[data.levels[i].identifier] = new Level(this, data.levels[i]);
            }
            this.levelIds = Object.keys(this.levelMap);
            this.levels = Object.values(this.levelMap);
        }
    }

    /**
     * Find a level for which a given `predicate` is true.
     */
    findLevel(predicate: (l: Level) => boolean): Level | undefined {
        for (let i = 0; i < this.levels.length; ++i) {
            if (predicate(this.levels[i])) return this.levels[i];
        }
    }
    /**
     * Find a tileset for which a given `predicate` is true.
     */
    findTileset(predicate: (t: Tileset) => boolean): Tileset | undefined {
        for (let i = 0; i < this.tilesets.length; ++i) {
            if (predicate(this.tilesets[i])) return this.tilesets[i];
        }
    }
    /**
     * Find an enum for which a given `predicate` is true.
     */
    findEnum(predicate: (e: Enum) => boolean): Enum | undefined {
        for (let i = 0; i < this.enums.length; ++i) {
            if (predicate(this.enums[i])) return this.enums[i];
        }
    }

    /**
     * Find a level by its `uid`.
     */
    findLevelByUid(uid: number): Level | undefined {
        return this.findLevel(l => l.uid === uid);
    }
    /**
     * Find a tileset by its `uid`.
     */
    findTilesetByUid(uid: number): Tileset | undefined {
        return this.findTileset(t => t.uid === uid);
    }
    /**
     * Find a tileset by its `path`.
     */
    findTilesetByPath(path: string): Tileset | undefined {
        return this.findTileset(t => t.path === path);
    }
    /**
     * Find an enum by its `uid`.
     */
    findEnumByUid(uid: number): Enum | undefined {
        return this.findEnum(e => e.uid === uid);
    }

    /**
     * True if this world was saved with `separate level files` option.
     */
    get externalLevels(): boolean {
        return this.data.externalLevels;
    }

    /**
     * Background color (RGB hex string)
     */
    get bgColor(): string {
        return this.data.bgColor;
    }

    /**
     * The world layout
     * 
     * Possible values: "Free", "GridVania", "LinearHorizontal", "LinearVertical" 
     */
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
                    // NOTE(safety): this may be incorrect
                    (this.levelMap as Record<string, Level>)[loaded.id] = loaded;
                    (this.levelIds as string[])[i] = loaded.id;
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
        let levelIndex = -1;
        let level = null;
        // find the raw level data
        for (let i = 0; i < this.data.levels.length; ++i) {
            if (this.data.levels[i].identifier === identifier) {
                level = this.data.levels[i];
                // grab the index so that we can maintain the level order
                levelIndex = i;
                break;
            }
        }
        if (level == null) throw new Error(`Level ${identifier} does not exist!`);
        // fetch and insert it into the level storage
        const loaded = await this.fetchLevel(level.externalRelPath!);
        // NOTE(safety): this may be incorrect
        (this.levelMap as Record<string, Level>)[loaded.id] = loaded;
        (this.levelIds as string[])[levelIndex] = loaded.id;
        (this.levels as Level[])[levelIndex] = loaded;
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

    /**
     * Used for fetching external levels
     */
    private async fetchLevel(path: string): Promise<Level> {
        return new Level(this, await loadJSON(path));
    }

    /**
     * Load the raw JSON without any utilities.
     * 
     * This does the following in Node:
     * ```
     * const path = ... ;
     * import * as fs from "fs";
     * const world = await new Promise((resolve, reject) => {
     *     fs.readFile(path, { encoding: "utf-8" }, (err, data) => {
     *          if (err) reject(err);
     *          else resolve(JSON.parse(data) as LDtk.World);
     *     });
     * })
     * ```
     * And in the browser:
     * ```
     * const path = ... ;
     * const world = await (await fetch(path)).json() as LDtk.World;
     * ```
     */
    static async loadRaw(path: string): Promise<LDtk.World> {
        return await loadJSON(path);
    }
}
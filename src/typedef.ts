/**
 * @packageDocumentation
 * This file contains LDtk file format types mapped 1:1 to TypeScript types.
 */

/**
 * This is the root of any Project JSON file. 
 * 
 * It contains:  
 * - the project settings, 
 * - an array of levels, 
 * - and a definition object (that can probably be safely ignored for most users). 
 */
export interface World {
    /** Number of backup files to keep, if the "backupOnSave" is TRUE */
    backupLimit: number
    /** If TRUE, an extra copy of the project will be created in a sub folder, when saving. */
    backupOnSave: boolean
    /** Project background color */
    bgColor: string
    /** Default grid size for new layers */
    defaultGridSize: number
    /** Default background color of levels */
    defaultLevelBgColor: string
    /** Default X pivot (0 to 1) for new entities */
    defaultPivotX: number
    /** Default Y pivot (0 to 1) for new entities */
    defaultPivotY: number
    /** A interfaceure containing all the definitions of this project */
    defs: Definitions
    /** If TRUE, all layers in all levels will also be exported as PNG along with the project file (default is FALSE) */
    exportPng: boolean
    /** File naming pattern for exported PNGs */
    pngFilePattern?: string
    /** If TRUE, a Tiled compatible file will also be generated along with the LDtk JSON file (default is FALSE) */
    exportTiled: boolean
    /** If TRUE, one file will be saved the project (incl. all its definitions) and one file per-level in a sub-folder. */
    externalLevels: boolean
    /** File format version */
    jsonVersion: string
    /** All levels. 
     * 
     * The order of this array is only relevant in "LinearHorizontal" and "linearVertical" world layouts (see "worldLayout" value). 
     * 
     * Otherwise, you should refer to the "worldX","worldY" coordinates of each Level. 
     */
    levels: Array<Level>
    /** If TRUE, the Json is partially minified (no indentation, nor line breaks, default is FALSE) */
    minifyJson: boolean
    nextUid: number
    /** Height of the world grid in pixels. */
    worldGridHeight: number
    /** Width of the world grid in pixels. */
    worldGridWidth: number
    /** 
     * An enum that describes how levels are organized in this project (ie. linearly or in a 2D space). 
     * 
     * Possible values: "Free", "GridVania", "LinearHorizontal", "LinearVertical" 
     */
    worldLayout: WorldLayout
}
/** 
 * A interface containing all the definitions of this project If you're writing your own LDtk importer, 
 * you should probably just ignore *most* stuff in the "defs" section, 
 * as it contains data that are mostly important to the editor. 
 * 
 * To keep you away from the "defs" section and avoid some unnecessary JSON parsing, 
 * important data from definitions is often duplicated in fields prefixed with a double underscore (eg. "__identifier" or "__type"). 
 * 
 * The 2 only definition types you might need here are **Tilesets** and **Enums**. 
 */
export interface Definitions {
    entities: Array<EntityDefinition>
    enums: Array<EnumDefinition>
    /** Note: external enums are exactly the same as "enums", except they have a "relPath" to point to an external source file. */
    externalEnums: Array<EnumDefinition>
    layers: Array<LayerDefinition>
    tilesets: Array<TilesetDefinition>
}
export interface EntityDefinition {
    /** Base entity color */
    color: string
    /** Array of field definitions */
    fieldDefs: Array<FieldDefinition>
    /** Pixel height */
    height: number
    /** Unique string identifier */
    identifier: string
    /** Possible values: "DiscardOldOnes", "PreventAdding", "MoveLastOne" */
    limitBehavior?: LimitBehavior
    /** Max instances per level */
    maxPerLevel: number
    /** Pivot X coordinate (from 0 to 1.0) */
    pivotX: number
    /** Pivot Y coordinate (from 0 to 1.0) */
    pivotY: number
    /** Possible values: "Rectangle", "Ellipse", "Tile", "Cross" */
    renderMode?: RenderMode
    /** Display entity name in editor */
    showName: boolean
    /** Tile ID used for optional tile display */
    tileId?: number
    /** Possible values: "Stretch", "Crop" */
    tileRenderMode?: TileRenderMode
    /** Tileset ID used for optional tile display */
    tilesetId?: number
    /** Unique Int identifier */
    uid: number
    /** Pixel width */
    width: number
}
/** 
 * This section is mostly only intended for the LDtk editor app itself. 
 * You can safely ignore it. 
 */
export interface FieldDefinition {
    /** 
     * Human readable value type (eg. "Int", "Float", "Point", etc.). 
     * 
     * If the field is an array, this field will look like "Array<...>" (eg. "Array<Int>", "Array<Point>" etc.) 
     */
    __type: string
    /** 
     * Optional list of accepted file extensions for FilePath value type. 
     * 
     * Includes the dot: ".ext" */
    acceptFileTypes?: Array<string>
    /** Array max length */
    arrayMaxLength?: number
    /** Array min length */
    arrayMinLength?: number
    /** 
     * TRUE if the value can be null. 
     * 
     * For arrays, TRUE means it can contain null values (exception: array of Points can't have null values). */
    canBeNull: boolean
    /** Default value if selected value is null or invalid. */
    defaultOverride?: unknown
    editorAlwaysShow: boolean
    /** Possible values: "Hidden", "ValueOnly", "NameAndValue", "EntityTile", "PointStar", "PointPath", "RadiusPx", "RadiusGrid" */
    editorDisplayMode?: EditorDisplayMode
    /** Possible values: "Above", "Center", "Beneath" */
    editorDisplayPos?: EditorDisplayPos
    /** Unique string identifier */
    identifier: string
    /** TRUE if the value is an array of multiple values */
    isArray: boolean
    /** Max limit for value, if applicable */
    max?: number
    /** Min limit for value, if applicable */
    min?: number
    /** 
     * Optional regular expression that needs to be matched to accept values. 
     * 
     * Expected format: "/someRegEx/g", with optional "i" flag. 
     */
    regex?: string
    /** Internal type enum */
    purpleType?: unknown
    /** Unique Intidentifier */
    uid: number
}
export interface EnumDefinition {
    externalFileChecksum?: string
    /** Relative path to the external file providing this Enum */
    externalRelPath?: string
    /** Tileset UID if provided */
    iconTilesetUid?: number
    /** Unique string identifier */
    identifier: string
    /** Unique Int identifier */
    uid: number
    /** All possible enum values, with their optional Tile infos. */
    values: Array<EnumValueDefinition>
}
export interface EnumValueDefinition {
    /** An array of 4 Int values that refers to the tile in the tileset image: "[ x, y, width, height ]" */
    __tileSrcRect: [x: number, y: number, width: number, height: number]
    /** Enum value */
    id: string
    /** The optional ID of the tile */
    tileId?: number
}
export interface LayerDefinition {
    /** Type of the layer (*IntGrid, Entities, Tiles, AutoLayer*) */
    __type: string
    autoSourceLayerDefUid?: number
    /** Reference to the Tileset UID being used by this auto-layer rules */
    autoTilesetDefUid?: number
    /** Opacity of the layer (0 to 1.0) */
    displayOpacity: number
    /** Width and height of the grid in pixels */
    gridSize: number
    /** Unique string identifier */
    identifier: string
    /** An array (using IntGrid value as array index, starting from 0) that defines extra optional info for each IntGrid value. */
    intGridValues: Array<IntGridValueDefinition>
    /** X offset of the layer, in pixels (IMPORTANT: this should be added to the "LayerInstance" optional offset) */
    pxOffsetX: number
    /** Y offset of the layer, in pixels (IMPORTANT: this should be added to the "LayerInstance" optional offset) */
    pxOffsetY: number
    /** If the tiles are smaller or larger than the layer grid, the pivot value will be used to position the tile relatively its grid cell. */
    tilePivotX: number
    /** If the tiles are smaller or larger than the layer grid, the pivot value will be used to position the tile relatively its grid cell. */
    tilePivotY: number
    /** Reference to the Tileset UID being used by this Tile layer */
    tilesetDefUid?: number
    /** Type of the layer as an Enum Possible values: "IntGrid", "Entities", "Tiles", "AutoLayer" */
    purpleType?: Type
    /** Unique Int identifier */
    uid: number
}
/** IntGrid value definition */
export interface IntGridValueDefinition {
    color: string
    /** Unique string identifier */
    identifier?: string
}
/** 
 * The "Tileset" definition is the most important part among project definitions. 
 * 
 * It contains some extra informations about each integrated tileset. 
 * 
 * If you only had to parse one definition section, that would be the one. 
 */
export interface TilesetDefinition {
    /** 
     * The following data is used internally for various optimizations.
     * 
     *  It's always synced with source image changes. 
     */
    cachedPixelData?: { [i: string]: unknown }
    /** Unique string identifier */
    identifier: string
    /** Distance in pixels from image borders */
    padding: number
    /** Image height in pixels */
    pxHei: number
    /** Image width in pixels */
    pxWid: number
    /** Path to the source file, relative to the current project JSON file */
    relPath: string
    /** Array of group of tiles selections, only meant to be used in the editor */
    savedSelections: Array<{ [i: string]: unknown }>
    /** Space in pixels between all tiles */
    spacing: number
    tileGridSize: number
    /** Unique Intidentifier */
    uid: number
}
/** 
 * This section contains all the level data. 
 * 
 * It can be found in 2 distinct forms, depending on Project current settings:  
 * - If "*Separate level files*" is **disabled** (default): 
 * 
 * Full level data is *embedded* inside the main Project JSON file
 * 
 * - If "*Separate level files*" is **enabled**: 
 * 
 * Level data is stored in *separate* standalone ".ldtkl" files (one per level). 
 * In this case, the main Project JSON file will still contain most level data, except heavy sections, like the "layerInstances" array (which will be null). 
 * The "externalRelPath" string points to the "ldtkl" file.  A "ldtkl" file is just a JSON file containing exactly what is described below. 
 */
export interface Level {
    /** Background color of the level (same as "bgColor", except the default value is automatically used here if its value is "null") */
    __bgColor: string
    /** Position informations of the background image, if there is one. */
    __bgPos?: LevelBackgroundPosition
    /** An array listing all other levels touching this one on the world map. In "linear" world layouts, this array is populated with previous/next levels in array, and "dir" depends on the linear horizontal/vertical layout. */
    __neighbours: Array<NeighbourLevel>
    /** Background color of the level. If "null", the project "defaultLevelBgColor" should be used. */
    bgColor?: string
    /** Background image X pivot (0-1) */
    bgPivotX: number
    /** Background image Y pivot (0-1) */
    bgPivotY: number
    /** 
     * An enum defining the way the background image (if any) is positioned on the level. 
     * 
     * See "__bgPos" for resulting position info. 
     * 
     * Possible values: "Unscaled", "Contain", "Cover", "CoverDirty" 
     */
    bgPos?: BgPos
    /** The *optional* relative path to the level background image. */
    bgRelPath?: string
    /** 
     * This value is not null if the project option "*Save levels separately*" is enabled. 
     * 
     * In this case, this **relative** path points to the level Json file. 
     */
    externalRelPath?: string
    /** Unique string identifier */
    identifier: string
    /** 
     * An array containing all Layer instances. 
     * 
     * **IMPORTANT**: if the project option "*Save levels separately*" is enabled, 
     * this field will be "null".
     * 
     * This array is **sorted in display order**: the 1st layer is the top-most and the last is behind. 
     */
    layerInstances?: Array<LayerInstance>
    /** Height of the level in pixels */
    pxHei: number
    /** Width of the level in pixels */
    pxWid: number
    /** Unique Int identifier */
    uid: number
    /** World X coordinate in pixels */
    worldX: number
    /** World Y coordinate in pixels */
    worldY: number
}
/** 
 * Position informations of the background image, if there is one. 
 * 
 * Level background image position info 
 */
export interface LevelBackgroundPosition {
    /** 
     * An array of 4 float values describing the cropped sub-rectangle of the displayed background image. 
     * 
     * This cropping happens when original is larger than the level bounds. 
     * 
     * Array format: "[ cropX, cropY, cropWidth, cropHeight ]" 
     */
    cropRect: [cropX: number, cropY: number, cropWidth: number, cropHeight: number]
    /** 
     * An array containing the "[scaleX,scaleY]" values of the **cropped** background image, 
     * depending on "bgPos" option. 
     */
    scale: [scaleX: number, scaleY: number]
    /** 
     * An array containing the "[x,y]" pixel coordinates of the top-left corner of the **cropped** background image, 
     * depending on "bgPos" option. 
     */
    topLeftPx: [x: number, y: number]
}
export interface LayerInstance {
    /** Grid-based height */
    __cHei: number
    /** Grid-based width */
    __cWid: number
    /** Grid size */
    __gridSize: number
    /** Layer definition identifier */
    __identifier: string
    /** Layer opacity as Float [0-1] */
    __opacity: number
    /** Total layer X pixel offset, including both instance and definition offsets. */
    __pxTotalOffsetX: number
    /** Total layer Y pixel offset, including both instance and definition offsets. */
    __pxTotalOffsetY: number
    /** The definition UID of corresponding Tileset, if any. */
    __tilesetDefUid?: number
    /** The relative path to corresponding Tileset, if any. */
    __tilesetRelPath?: string
    /** Layer type (possible values: IntGrid, Entities, Tiles or AutoLayer) */
    __type: string
    /** 
     * An array containing all tiles generated by Auto-layer rules. 
     * 
     * The array is already sorted in display order (ie. 1st tile is beneath 2nd, which is beneath 3rd etc.).
     * 
     * Note: if multiple tiles are stacked in the same cell as the result of different rules, 
     * all tiles behind opaque ones will be discarded. 
     */
    autoLayerTiles: Array<TileInstance>
    entityInstances: Array<EntityInstance>
    gridTiles: Array<TileInstance>
    intGrid: Array<IntGridValueInstance>
    /** Reference the Layer definition UID */
    layerDefUid: number
    /** Reference to the UID of the level containing this layer instance */
    levelId: number
    /** 
     * X offset in pixels to render this layer, usually 0
     * 
     * **IMPORTANT**: this should be added to the "LayerDef" optional offset, see "__pxTotalOffsetX"
     */
    pxOffsetX: number
    /** 
     * Y offset in pixels to render this layer, usually 0
     * 
     * **IMPORTANT**: this should be added to the "LayerDef" optional offset, see "__pxTotalOffsetY"
     */
    pxOffsetY: number
    /** Random seed used for Auto-Layers rendering */
    seed: number
}
/** This interfaceure represents a single tile from a given Tileset. */
export interface TileInstance {
    /** 
     * Internal data used by the editor.
     * 
     * For auto-layer tiles: "[ruleId, coordId]".
     * 
     * For tile-layer tiles: "[coordId]".
     */
    d: [ruleId: number, coordId: number] | [coordId: number]
    /** 
     * "Flip bits", a 2-bits integer to represent the mirror transformations of the tile.
     * - Bit 0 = X flip<br/>   
     * - Bit 1 = Y flip<br/>
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
export interface EntityInstance {
    /** Grid-based coordinates */
    __grid: [x: number, y: number]
    /** Entity definition identifier */
    __identifier: string
    /** Pivot coordinates (values are from 0 to 1) of the Entity */
    __pivot: [x: number, y: number]
    /** 
     * Optional Tile used to display this entity (it could either be the default Entity tile, 
     * or some tile provided by a field value, like an Enum).
     */
    __tile?: EntityInstanceTile
    /** Reference of the **Entity definition** UID */
    defUid: number
    fieldInstances: Array<FieldInstance>
    /** 
     * Pixel coordinates in current level coordinate space. 
     * 
     * Don't forget optional layer offsets, if they exist! 
     */
    px: [x: number, y: number]
}
export interface FieldInstance {
    /** Field definition identifier */
    __identifier: string
    /** Type of the field, such as "Int", "Float", "Enum(myEnumName)", "boolean", etc. */
    __type: string
    /** 
     * Actual value of the field instance. 
     * 
     * The value type may vary, depending on "__type" (Integer, booleanean, string etc.)
     * 
     * It can also be an "Array" of those same types.
     */
    __value?: unknown
    /** Reference of the **Field definition** UID */
    defUid: number
    /** Editor internal raw values */
    realEditorValues: Array<unknown>
}
/** 
 * Optional Tile used to display this entity (it could either be the default Entity tile, 
 * or some tile provided by a field value, like an Enum). 
 * 
 * Tile data in an Entity instance 
 */
export interface EntityInstanceTile {
    /** An array of 4 Int values that refers to the tile in the tileset image */
    srcRect: [x: number, y: number, width: number, height: number]
    /** Tileset ID */
    tilesetUid: number
}
/** IntGrid value instance */
export interface IntGridValueInstance {
    /** Coordinate ID in the layer grid */
    coordId: number
    /** IntGrid value */
    v: number
}
/** Nearby level info */
export interface NeighbourLevel {
    /** A single lowercase character tipping on the level location ("n"orth, "s"outh, "w"est, "e"ast). */
    dir: "n" | "s" | "w" | "e"
    levelUid: number
}
/** Possible values: "EntityTile", "Hidden", "NameAndValue", "PointPath", "PointStar", "RadiusGrid", "RadiusPx", "ValueOnly" */
export const enum EditorDisplayMode {
    EntityTile = "EntityTile",
    Hidden = "Hidden",
    NameAndValue = "NameAndValue",
    PointPath = "PointPath",
    PointStar = "PointStar",
    RadiusGrid = "RadiusGrid",
    RadiusPx = "RadiusPx",
    ValueOnly = "ValueOnly",
}
/** Possible values: "Above", "Beneath", "Center" */
export const enum EditorDisplayPos {
    Above = "Above",
    Beneath = "Beneath",
    Center = "Center",
}
/** Possible values: "DiscardOldOnes", "MoveLastOne", "PreventAdding" */
export const enum LimitBehavior {
    DiscardOldOnes = "DiscardOldOnes",
    MoveLastOne = "MoveLastOne",
    PreventAdding = "PreventAdding",
}
/** Possible values: "Cross", "Ellipse", "Rectangle", "Tile" */
export const enum RenderMode {
    Cross = "Cross",
    Ellipse = "Ellipse",
    Rectangle = "Rectangle",
    Tile = "Tile",
}
/** Possible values: "Crop", "Stretch" */
export const enum TileRenderMode {
    Crop = "Crop",
    Stretch = "Stretch",
}
/** 
 * Type of the layer as an Enum 
 * 
 * Possible values: "AutoLayer", "Entities", "IntGrid", "Tiles"
 */
export const enum Type {
    AutoLayer = "AutoLayer",
    Entities = "Entities",
    IntGrid = "IntGrid",
    Tiles = "Tiles",
}
/** 
 * An enum defining the way the background image (if any) is positioned on the level. 
 * 
 * See "__bgPos" for resulting position info. 
 * 
 * Possible values: "Unscaled", "Contain", "Cover", "CoverDirty" 
 */
export const enum BgPos {
    Contain = "Contain",
    Cover = "Cover",
    CoverDirty = "CoverDirty",
    Unscaled = "Unscaled",
}
/** 
 * An enum that describes how levels are organized in this project (ie. linearly or in a 2D space). 
 * 
 * Possible values: "Free", "GridVania", "LinearHorizontal", "LinearVertical" 
 */
export const enum WorldLayout {
    Free = "Free",
    GridVania = "GridVania",
    LinearHorizontal = "LinearHorizontal",
    LinearVertical = "LinearVertical",
}
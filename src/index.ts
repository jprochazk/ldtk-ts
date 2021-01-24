export abstract class Project {
    /**
     * Parse an existing JSON object as an LDtk project file
     */
    static fromJSON(data: unknown): LDtkProject {
        // TODO: validation?
        return data as LDtkProject;
    }

    /**
     * Asynchronously load and parse an LDtk project file
     */
    static async fromURL(path: string): Promise<LDtkProject> {
        const data = await fetch(path);
        return Project.fromJSON(await data.json());
    }
}

/**
 * This is the root of any Project JSON file. 
 * 
 * It contains:  
 * - the project settings, 
 * - an array of levels, 
 * - and a definition object (that can probably be safely ignored for most users). 
 */
export interface LDtkProject {
    /** Number of backup files to keep, if the "backupOnSave" is TRUE */
    backup_limit: number
    /** If TRUE, an extra copy of the project will be created in a sub folder, when saving. */
    backup_on_save: boolean
    /** Project background color */
    bg_color: string
    /** Default grid size for new layers */
    default_grid_size: number
    /** Default background color of levels */
    default_level_bg_color: string
    /** Default X pivot (0 to 1) for new entities */
    default_pivot_x: number
    /** Default Y pivot (0 to 1) for new entities */
    default_pivot_y: number
    /** A interfaceure containing all the definitions of this project */
    defs?: Definitions
    /** If TRUE, all layers in all levels will also be exported as PNG along with the project file (default is FALSE) */
    export_png: boolean
    /** If TRUE, a Tiled compatible file will also be generated along with the LDtk JSON file (default is FALSE) */
    export_tiled: boolean
    /** If TRUE, one file will be saved the project (incl. all its definitions) and one file per-level in a sub-folder. */
    external_levels: boolean
    /** File format version */
    json_version: string
    /** All levels. 
     * 
     * The order of this array is only relevant in "LinearHorizontal" and "linearVertical" world layouts (see "worldLayout" value). 
     * 
     * Otherwise, you should refer to the "worldX","worldY" coordinates of each Level. 
     */
    levels: Array<Level>
    /** If TRUE, the Json is partially minified (no indentation, nor line breaks, default is FALSE) */
    minify_json: boolean
    next_uid: number
    /** Height of the world grid in pixels. */
    world_grid_height: number
    /** Width of the world grid in pixels. */
    world_grid_width: number
    /** 
     * An enum that describes how levels are organized in this project (ie. linearly or in a 2D space). 
     * 
     * Possible values: "Free", "GridVania", "LinearHorizontal", "LinearVertical" 
     */
    world_layout?: WorldLayout
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
    external_enums: Array<EnumDefinition>
    layers: Array<LayerDefinition>
    tilesets: Array<TilesetDefinition>
}
export interface EntityDefinition {
    /** Base entity color */
    color: string
    /** Array of field definitions */
    field_defs: Array<FieldDefinition>
    /** Pixel height */
    height: number
    /** Unique string identifier */
    identifier: string
    /** Possible values: "DiscardOldOnes", "PreventAdding", "MoveLastOne" */
    limit_behavior?: LimitBehavior
    /** Max instances per level */
    max_per_level: number
    /** Pivot X coordinate (from 0 to 1.0) */
    pivot_x: number
    /** Pivot Y coordinate (from 0 to 1.0) */
    pivot_y: number
    /** Possible values: "Rectangle", "Ellipse", "Tile", "Cross" */
    render_mode?: RenderMode
    /** Display entity name in editor */
    show_name: boolean
    /** Tile ID used for optional tile display */
    tile_id?: number
    /** Possible values: "Stretch", "Crop" */
    tile_render_mode?: TileRenderMode
    /** Tileset ID used for optional tile display */
    tileset_id?: number
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
    field_definition_type: string
    /** 
     * Optional list of accepted file extensions for FilePath value type. 
     * 
     * Includes the dot: ".ext" */
    accept_file_types?: Array<string>
    /** Array max length */
    array_max_length?: number
    /** Array min length */
    array_min_length?: number
    /** 
     * TRUE if the value can be null. 
     * 
     * For arrays, TRUE means it can contain null values (exception: array of Points can't have null values). */
    can_be_null: boolean
    /** Default value if selected value is null or invalid. */
    default_override?: unknown
    editor_always_show: boolean
    /** Possible values: "Hidden", "ValueOnly", "NameAndValue", "EntityTile", "PointStar", "PointPath", "RadiusPx", "RadiusGrid" */
    editor_display_mode?: EditorDisplayMode
    /** Possible values: "Above", "Center", "Beneath" */
    editor_display_pos?: EditorDisplayPos
    /** Unique string identifier */
    identifier: string
    /** TRUE if the value is an array of multiple values */
    is_array: boolean
    /** Max limit for value, if applicable */
    max?: number
    /** Min limit for value, if applicable */
    min?: number
    /** 
     * Optional regular expression that needs to be matched to accept values. 
     * 
     * Expected format: "/some_reg_ex/g", with optional "i" flag. 
     */
    regex?: string
    /** Internal type enum */
    purple_type?: unknown
    /** Unique Intidentifier */
    uid: number
}
export interface EnumDefinition {
    external_file_checksum?: string
    /** Relative path to the external file providing this Enum */
    external_rel_path?: string
    /** Tileset UID if provided */
    icon_tileset_uid?: number
    /** Unique string identifier */
    identifier: string
    /** Unique Int identifier */
    uid: number
    /** All possible enum values, with their optional Tile infos. */
    values: Array<EnumValueDefinition>
}
export interface EnumValueDefinition {
    /** An array of 4 Int values that refers to the tile in the tileset image: "[ x, y, width, height ]" */
    tile_src_rect: Array<number>
    /** Enum value */
    id: string
    /** The optional ID of the tile */
    tile_id?: number
}
export interface LayerDefinition {
    /** Type of the layer (*IntGrid, Entities, Tiles, AutoLayer*) */
    layer_definition_type: string
    /** Contains all the auto-layer rule definitions. */
    auto_rule_groups: Array<{ [i: string]: unknown }>,
    auto_source_layer_def_uid?: number
    /** Reference to the Tileset UID being used by this auto-layer rules */
    auto_tileset_def_uid?: number
    /** Opacity of the layer (0 to 1.0) */
    display_opacity: number
    /** Width and height of the grid in pixels */
    grid_size: number
    /** Unique string identifier */
    identifier: string
    /** An array (using IntGrid value as array index, starting from 0) that defines extra optional info for each IntGrid value. */
    int_grid_values: Array<IntGridValueDefinition>
    /** X offset of the layer, in pixels (IMPORTANT: this should be added to the "LayerInstance" optional offset) */
    px_offset_x: number
    /** Y offset of the layer, in pixels (IMPORTANT: this should be added to the "LayerInstance" optional offset) */
    px_offset_y: number
    /** If the tiles are smaller or larger than the layer grid, the pivot value will be used to position the tile relatively its grid cell. */
    tile_pivot_x: number
    /** If the tiles are smaller or larger than the layer grid, the pivot value will be used to position the tile relatively its grid cell. */
    tile_pivot_y: number
    /** Reference to the Tileset UID being used by this Tile layer */
    tileset_def_uid?: number
    /** Type of the layer as an Enum Possible values: "IntGrid", "Entities", "Tiles", "AutoLayer" */
    purple_type?: Type
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
    cached_pixel_data?: { [i: string]: unknown }
    /** Unique string identifier */
    identifier: string
    /** Distance in pixels from image borders */
    padding: number
    /** Image height in pixels */
    px_hei: number
    /** Image width in pixels */
    px_wid: number
    /** Path to the source file, relative to the current project JSON file */
    rel_path: string
    /** Array of group of tiles selections, only meant to be used in the editor */
    saved_selections: Array<{ [i: string]: unknown }>
    /** Space in pixels between all tiles */
    spacing: number
    tile_grid_size: number
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
    bg_color: string
    /** Position informations of the background image, if there is one. */
    bg_pos?: LevelBackgroundPosition
    /** An array listing all other levels touching this one on the world map. In "linear" world layouts, this array is populated with previous/next levels in array, and "dir" depends on the linear horizontal/vertical layout. */
    neighbours: Array<NeighbourLevel>
    /** Background color of the level. If "null", the project "defaultLevelBgColor" should be used. */
    level_bg_color?: string
    /** Background image X pivot (0-1) */
    bg_pivot_x: number
    /** Background image Y pivot (0-1) */
    bg_pivot_y: number
    /** 
     * An enum defining the way the background image (if any) is positioned on the level. 
     * 
     * See "__bgPos" for resulting position info. 
     * 
     * Possible values: "Unscaled", "Contain", "Cover", "CoverDirty" 
     */
    level_bg_pos?: BgPos
    /** The *optional* relative path to the level background image. */
    bg_rel_path?: string
    /** 
     * This value is not null if the project option "*Save levels separately*" is enabled. 
     * 
     * In this case, this **relative** path points to the level Json file. 
     */
    external_rel_path?: string
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
    layer_instances?: Array<LayerInstance>
    /** Height of the level in pixels */
    px_hei: number
    /** Width of the level in pixels */
    px_wid: number
    /** Unique Int identifier */
    uid: number
    /** World X coordinate in pixels */
    world_x: number
    /** World Y coordinate in pixels */
    world_y: number
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
    crop_rect: [cropX: number, cropY: number, cropWidth: number, cropHeight: number]
    /** 
     * An array containing the "[scaleX,scaleY]" values of the **cropped** background image, 
     * depending on "bgPos" option. 
     */
    scale: [scaleX: number, scaleY: number]
    /** 
     * An array containing the "[x,y]" pixel coordinates of the top-left corner of the **cropped** background image, 
     * depending on "bgPos" option. 
     */
    top_left_px: [x: number, y: number]
}
export interface LayerInstance {
    /** Grid-based height */
    c_hei: number
    /** Grid-based width */
    c_wid: number
    /** Grid size */
    grid_size: number
    /** Layer definition identifier */
    identifier: string
    /** Layer opacity as Float [0-1] */
    opacity: number
    /** Total layer X pixel offset, including both instance and definition offsets. */
    px_total_offset_x: number
    /** Total layer Y pixel offset, including both instance and definition offsets. */
    px_total_offset_y: number
    /** The definition UID of corresponding Tileset, if any. */
    tileset_def_uid?: number
    /** The relative path to corresponding Tileset, if any. */
    tileset_rel_path?: string
    /** Layer type (possible values: IntGrid, Entities, Tiles or AutoLayer) */
    layer_instance_type: string
    /** 
     * An array containing all tiles generated by Auto-layer rules. 
     * 
     * The array is already sorted in display order (ie. 1st tile is beneath 2nd, which is beneath 3rd etc.).
     * 
     * Note: if multiple tiles are stacked in the same cell as the result of different rules, 
     * all tiles behind opaque ones will be discarded. 
     */
    auto_layer_tiles: Array<TileInstance>
    entity_instances: Array<EntityInstance>
    grid_tiles: Array<TileInstance>
    int_grid: Array<IntGridValueInstance>
    /** Reference the Layer definition UID */
    layer_def_uid: number
    /** Reference to the UID of the level containing this layer instance */
    level_id: number
    /** 
     * X offset in pixels to render this layer, usually 0
     * 
     * **IMPORTANT**: this should be added to the "LayerDef" optional offset, see "__pxTotalOffsetX"
     */
    px_offset_x: number
    /** 
     * Y offset in pixels to render this layer, usually 0
     * 
     * **IMPORTANT**: this should be added to the "LayerDef" optional offset, see "__pxTotalOffsetY"
     */
    px_offset_y: number
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
    grid: [x: number, y: number]
    /** Entity definition identifier */
    identifier: string
    /** Pivot coordinates (values are from 0 to 1) of the Entity */
    pivot: [x: number, y: number]
    /** 
     * Optional Tile used to display this entity (it could either be the default Entity tile, 
     * or some tile provided by a field value, like an Enum).
     */
    tile?: EntityInstanceTile
    /** Reference of the **Entity definition** UID */
    def_uid: number
    field_instances: Array<FieldInstance>
    /** 
     * Pixel coordinates in current level coordinate space. 
     * 
     * Don't forget optional layer offsets, if they exist! 
     */
    px: [x: number, y: number]
}
export interface FieldInstance {
    /** Field definition identifier */
    identifier: string
    /** Type of the field, such as "Int", "Float", "Enum(my_enum_name)", "boolean", etc. */
    field_instance_type: string
    /** 
     * Actual value of the field instance. 
     * 
     * The value type may vary, depending on "__type" (Integer, booleanean, string etc.)
     * 
     * It can also be an "Array" of those same types.
     */
    value?: unknown
    /** Reference of the **Field definition** UID */
    def_uid: number
    /** Editor internal raw values */
    real_editor_values: Array<unknown>
}
/** 
 * Optional Tile used to display this entity (it could either be the default Entity tile, 
 * or some tile provided by a field value, like an Enum). 
 * 
 * Tile data in an Entity instance 
 */
export interface EntityInstanceTile {
    /** An array of 4 Int values that refers to the tile in the tileset image */
    src_rect: [x: number, y: number, width: number, height: number]
    /** Tileset ID */
    tileset_uid: number
}
/** IntGrid value instance */
export interface IntGridValueInstance {
    /** Coordinate ID in the layer grid */
    coord_id: number
    /** IntGrid value */
    v: number
}
/** Nearby level info */
export interface NeighbourLevel {
    /** A single lowercase character tipping on the level location ("n"orth, "s"outh, "w"est, "e"ast). */
    dir: string
    level_uid: number
}
/** Possible values: "EntityTile", "Hidden", "NameAndValue", "PointPath", "PointStar", "RadiusGrid", "RadiusPx", "ValueOnly" */
export const enum EditorDisplayMode {
    EntityTile,
    Hidden,
    NameAndValue,
    PointPath,
    PointStar,
    RadiusGrid,
    RadiusPx,
    ValueOnly,
}
/** Possible values: "Above", "Beneath", "Center" */
export const enum EditorDisplayPos {
    Above,
    Beneath,
    Center,
}
/** Possible values: "DiscardOldOnes", "MoveLastOne", "PreventAdding" */
export const enum LimitBehavior {
    DiscardOldOnes,
    MoveLastOne,
    PreventAdding,
}
/** Possible values: "Cross", "Ellipse", "Rectangle", "Tile" */
export const enum RenderMode {
    Cross,
    Ellipse,
    Rectangle,
    Tile,
}
/** Possible values: "Crop", "Stretch" */
export const enum TileRenderMode {
    Crop,
    Stretch,
}
/** 
 * Type of the layer as an Enum 
 * 
 * Possible values: "AutoLayer", "Entities", "IntGrid", "Tiles"
 */
export const enum Type {
    AutoLayer,
    Entities,
    IntGrid,
    Tiles,
}
/** 
 * An enum defining the way the background image (if any) is positioned on the level. 
 * 
 * See "__bgPos" for resulting position info. 
 * 
 * Possible values: "Unscaled", "Contain", "Cover", "CoverDirty" 
 */
export const enum BgPos {
    Contain,
    Cover,
    CoverDirty,
    Unscaled,
}
/** 
 * An enum that describes how levels are organized in this project (ie. linearly or in a 2D space). 
 * 
 * Possible values: "Free", "GridVania", "LinearHorizontal", "LinearVertical" 
 */
export const enum WorldLayout {
    Free,
    GridVania,
    LinearHorizontal,
    LinearVertical,
}
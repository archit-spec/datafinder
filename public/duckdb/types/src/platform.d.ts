export declare const isNode: () => boolean;
export declare const isFirefox: () => boolean;
export declare const isSafari: () => boolean;
/** Bundles have different characteristics:
  * - MVP: minimum viable product (uses features from first stable version of WebAssembly standard)
  * - EH: exception handling
  * - COI: cross origin isolation
  */
export interface DuckDBBundles {
    mvp: {
        mainModule: string;
        mainWorker: string;
    };
    eh?: {
        mainModule: string;
        mainWorker: string;
    };
    coi?: {
        mainModule: string;
        mainWorker: string;
        pthreadWorker: string;
    };
}
export declare function getJsDelivrBundles(): DuckDBBundles;
export interface DuckDBBundle {
    mainModule: string;
    mainWorker: string | null;
    pthreadWorker: string | null;
}
export interface PlatformFeatures {
    bigInt64Array: boolean;
    crossOriginIsolated: boolean;
    wasmExceptions: boolean;
    wasmSIMD: boolean;
    wasmBulkMemory: boolean;
    wasmThreads: boolean;
}
export declare function getPlatformFeatures(): Promise<PlatformFeatures>;
export declare function selectBundle(bundles: DuckDBBundles): Promise<DuckDBBundle>;

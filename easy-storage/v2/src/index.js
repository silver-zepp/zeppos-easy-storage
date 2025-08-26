/** @about Easy Storage 2.0.0 @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

// CORE
export { Storage }          from './storage.js';
export { AsyncStorage }     from './async-storage.js';

// STORAGE TYPES
export { EasyStorage }      from './easy-storage.js';
export { EasyStorageAsync } from './easy-storage-async.js';
export { EasyTempStorage }  from './easy-temp-storage.js';
export { EasyFlashStorage } from './easy-flash-storage.js';
export { EasyTSDB }         from './easy-tsdb.js';

/**
 * @changelog
 * 2.0.0
 * - @add AsyncStorage: async storage solution that doesn't render block the UI
 * - @add EasyStorageAsync: same as original but now uses async making UI interaction buttery smooth
 * - @upd library restruct into multiple files to bring the ram consumption to the very minimum
 * - @upd Storage class expanded with new static methods FileInfo, Exists, CopyFile, MoveFile, IsDir, IsFile, FileChangeTime, FileSize
 * - @upd significantly improved write speeds of all storage solutions compared to a built-in writeFileSync
 * - @upd significantly improved read & write speads on older devices like Bip 5 Unity compared to built-in LocalStorage & writeFileSync
 * - @upd optimized str2ab and ab2str utils
 * - @upd better documentation
 * - @fix EasyStorage: object preservation instead of [object Object]
 * 1.6.7
 * - EasyFlashStorage: -------------------------------------------------------
 * - @upd getKey() returns proper errors when key or file don't exist
 * - @add #parseJSON utility
 * - @add minification to address OOMs
 * 1.6.4
 * - @upd npm docs
 * 1.6.3
 * - @rem EasyFlashStorage -> use_index
 * - @upd docs
 * 1.6.1
 * - @upd docs
 * 1.6.0
 * - EasyStorage: 	   -------------------------------------------------------
 * - @upd getAllKeys() -> getStorageSnapshot() to be more descriptive
 * - EasyFlashStorage: -------------------------------------------------------
 * - @add getAllValues()
 * - @add getStorageSnapshot()
 * - @fix index file excluded from .size() and .count() methods as it should not be counted as a regular file
 * - @add constructor(..., use_index = true). index is used by default.
 * 		benefit - quicker filename resolution. con - all the keys (without their content, sit in the memory).
 * 		now with use_index = false, the flash lib will solely rely on the flash storage and use of readdirSync
 * - @upd getKey() making sure that retrieved file is in the index, otherwise - update it
 * - @rem index dropped, the complexity and memory requirement not worth it - full ssd approach from now. need it for a test? find easy-storage-index.js
 * - Storage:	--------------------------------------------------------------
 * - @add ListDirectory and MakeDirectory methods
 * - Utilities: --------------------------------------------------------------
 * - @add listDirectory() and makeDirectory()
 * - Other: 	--------------------------------------------------------------
 * - @add class EasyTSDB, the time-series database
 * 1.4.0
 * - @add EasyFlashStorage, a file storage for operating heavy files with a simple JSON approach
 * - @upd getContents() depracated; use getAllKeys() instead
 * - @add removeFile() utility
 * 1.2.0
 * - @upd library migration to ZeppOS v2
 * - @upd getContents() by default returns json object but accepts additional `stringify` param
 * - @fix proper getKey empty return type "undefined" != undefined
 * - @add ab2str
 * 1.0.7
 * - @upd getContents() returns a stringified version of JSON object (as in the original easy-save library)
 * 1.0.6
 * - @upd getContents() that retrieves whole contents of the storage as a JSON object
 * 1.0.5
 * - @fix consistency
 * - @add toHex / fromHex string extensions
 * 1.0.3
 * - @fix "return this.#content_obj[key]" was returning null without typecast; now returns strict string
 * - @add possibility to write/read arbitrary files
 * - @add separation between manual writes and easystorage
 * 1.0.0
 * - initial release
 */
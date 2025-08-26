/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { 
  listDirectory, loadJson, makeDirectory, readAsset, 
  readFile, removeFile, saveJson, stat, writeAsset, writeFile 
} from "./core/core";

/**
 * Storage: 
 * - Direct file operations that happen immediately and block until complete
 * - Perfect for small files and simple read/write tasks where you need the result right away
 * - No queuing or async complexity - just straightforward "save this now" functionality
 * - Use `AsyncStorage` instead if you're dealing with large files or don't want UI stuttering
 */
export class Storage {
  /**
   * Writes a JSON object to a specified file.
   * @param {string} filename - The name of the file to write the JSON object to.
   * @param {object} json - The JSON object to be written.
   * @example
   * ```js
   * Storage.WriteJson('config.json', { key: 'value' });
   * ```
   */
  static WriteJson(filename, json) {
    saveJson(filename, json);
  }

  /**
   * Reads a JSON object from a specified file.
   * @param {string} filename - The name of the file to read the JSON object from.
   * @param {boolean} stringify - (optional) If `true` returns stringified JSON object.
   * @return {object} The JSON object read from the file.
   * @example
   * ```js
   * const config = Storage.ReadJson('config.json');
   * ```
   */
  static ReadJson(filename, strinfigy=false) {
    return !strinfigy ? loadJson(filename) : JSON.stringify(loadJson(filename));
  }

  /**
   * Writes data to a specified file.
   * @param {string} filename - The name of the file to write data to.
   * @param {string|ArrayBuffer} data - The data to be written.
   * @example
   * ```js
   * Storage.WriteFile('example.txt', 'Hello, World!');
   * ```
   */
  static WriteFile(filename, data) {
    writeFile(filename, data);
  }

  /**
   * Reads data from a specified file.
   * @param {string} filename - The name of the file to read data from.
   * @return {string} The data read from the file.
   * @example
   * ```js
   * const data = Storage.ReadFile('example.txt');
   * ```
   */
  static ReadFile(filename) {
    return readFile(filename);
  }

  /**
   * Removes a specified file from the filesystem.
   * @param {string} filename - The name of the file to be removed.
   * @example
   * ```js
   * Storage.RemoveFile('obsolete_data.txt');
   * ```
   */
  static RemoveFile(filename) {
    return removeFile(filename);
  }

  /**
   * Writes data to a specified asset file.
   * @param {string} filename - The name of the asset file to write data to.
   * @param {string|ArrayBuffer} data - The data to be written.
   * @example
   * ```js
   * Storage.WriteAsset('image.png', image_data);
   * ```
   */
  static WriteAsset(filename, data) {
    writeAsset(filename, data);
  }

  /**
   * Reads data from a specified asset file.
   * @param {string} filename - The name of the asset file to read data from.
   * @return {string} The data read from the asset file.
   * @example
   * ```js
   * const image = Storage.ReadAsset('image.png');
   * ```
   */
  static ReadAsset(filename) {
    return readAsset(filename);
  }

  /**
   * Creates a new directory with the specified name. If the directory already exists, the behavior may depend on the underlying filesystem's implementation (it might throw an error or do nothing).
   * @param {string} dirname - The name (and path) of the directory to create.
   * @example
   * ```js
   * Storage.MakeDirectory('new_folder');
   * ```
   */
  static MakeDirectory(dirname) {
    return makeDirectory(dirname);
  }

  /**
   * Lists all files and directories within the specified directory. This method is useful for retrieving the contents of a directory to process or display them, such as generating a list of available files or performing operations on each file.
   * @param {string} dirname - The name (and path) of the directory whose contents are to be listed.
   * @return {string[]} An array of names representing the contents of the directory. This may include both files and directories.
   * @example
   * ```js
   * const contents = Storage.ListDirectory('documents');
   * console.log(contents); // Outputs: ['file1.txt', 'file2.txt', 'subdirectory']
   * ```
   */
  static ListDirectory(dirname) {
    return listDirectory(dirname);
  }

  /**
   * Returns detailed information about a file or directory.
   * @param  {string} path – Absolute or relative path to inspect.
   * @return {object|null} stat object from @zos/fs (size, mtime, etc.), or null if the path does not exist.
   * @example
   * const info = Storage.FileInfo('data.json');
   * console.log(info.size);  // bytes
   */
  static FileInfo(path) {
    return stat(path);
  }

  /**
   * Checks whether a file or directory exists.
   * @param  {string} path – Path to test.
   * @return {boolean} true if present, false otherwise.
   * @example
   * if (Storage.Exists('config.json')) { … }
   */
  static Exists(path) {
    const info = Storage.FileInfo(path);
    return info !== null && info !== undefined && typeof info === 'object';
  }

  /**
   * Copies one file to another location.
   * @param {string} src  – Source file path.
   * @param {string} dest – Destination file path.
   * @example
   * Storage.CopyFile('a.txt', 'backup/a.txt');
   */
  static CopyFile(src, dest) {
    const data = Storage.ReadFile(src);
    if (data !== "") Storage.WriteFile(dest, data);
  }

  /**
   * Moves (renames) a file.
   * Implemented as copy + delete so it stays portable.
   * @param {string} src  – Source file path.
   * @param {string} dest – Destination file path.
   * @example
   * Storage.MoveFile('sensor.json', 'backup/sensor.json');
   */
  static MoveFile(src, dest) {
    Storage.CopyFile(src, dest);
    Storage.RemoveFile(src);
  }

  /**
   * Checks if the specified path is a regular file.
   * @param {string} path - Path to test.
   * @return {boolean} True if path exists and is a file.
   * ```
   * // example: process only actual files, not directories
   * const items = Storage.ListDirectory('data');
   * items.forEach(item => {
   *   if (Storage.IsFile(`data/${item}`)) {
   *     console.log(`processing file: ${item}`);
   *   }
   * });
   * ```
   */
  static IsFile(path) {
    const info = Storage.FileInfo(path);
    return info ? info.isFile : false;
  }

  /**
   * Checks if the specified path is a directory.
   * @param {string} path - Path to test.
   * @return {boolean} True if path exists and is a directory.
   * ```
   * // example: check if data folder exists before listing contents
   * if (Storage.IsDir('user-data')) {
   *   const files = Storage.ListDirectory('user-data');
   *   console.log(`found ${files.length} files in user-data`);
   * }
   * ```
   */
  static IsDir(path) {
    const info = Storage.FileInfo(path);
    return info ? info.isDir : false;
  }

  /**
   * Gets the size of a file in bytes.
   * @param {string} path - Path to the file.
   * @return {number} File size in bytes, or 0 if file doesn't exist.
   * ```
   * console.log(Storage.FileSize('big-data.json') / 1024, "KB"); // 1KB (1024B)
   * ```
   */
  static FileSize(path) {
    const info = Storage.FileInfo(path);
    return info ? info.size : 0;
  }

  /**
   * Gets when a file was last modified.
   * @param {string} path - Path to the file.
   * @return {number} Last modification time in ms, or 0 if file doesn't exist.
   * ```
   * // example: check if config file was recently updated
   * const last_mod_time = Storage.FileChangeTime('config.json');
   * const hour_ago = Date.now() - (60 * 60 * 1000);
   * if (last_mod_time > hour_ago) {
   *   console.log('config was updated recently:', new Date(last_mod_time));
   * }
   * ```
   */
  static FileChangeTime(path) {
    const info = Storage.FileInfo(path);
    return info ? info.mtimeMs : 0;
  }
}
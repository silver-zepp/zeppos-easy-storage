/** @about Easy Storage 1.0.7 @zeppos 1.0 @author: Silver, Zepp Health. @license: MIT */

const ES_DEFAULT_FILE_NAME = "easy_storage.json";

export class Storage {
	static WriteJson(filename, json){
		saveJson(filename, json);
	}

	static ReadJson(filename){
		return loadJson(filename);
	}

	static WriteFile(filename, data){
		writeFile(filename, data);
	}

	static ReadFile(filename){
		return readFile(filename);
	}

	static WriteAsset(filename, data){
		writeAsset(filename, data);
	}

	static ReadAsset(filename){
		return readAsset(filename);
	}
}

export class EasyStorage {
	#filename;  // specify the name of you database
	#content_obj = {};
	#autosave = true; // should autosave on each write action?
	
	constructor(filename=ES_DEFAULT_FILE_NAME) {
		this.#filename = filename; 
		this.#content_obj = loadJson(filename);
	}

	/**
	 * @param {*} key 
	 * @param {*} value 
	 * @comment saves the VALUE into the specified KEY.
	 */
	setKey(key, value) {
		this.#content_obj[key] = value;
		if (this.#autosave) this.saveAll();
	}

	/**
	 * @param {*} key 
	 * @param {*} default_value 
	 * @returns value if found or default value if assigned. Otherwise "undefined".
	 */
	getKey(key, default_value = "") {
		if (this.#content_obj.hasOwnProperty(key)) {
			return this.#content_obj[key].toString();
		} return default_value !== "" ? default_value : "undefined";
	}

	/**
	 * @param key
	 * @returns TRUE/FALSE depending if the key exists in the storage.
	 */
	hasKey(key) {
		return this.#content_obj.hasOwnProperty(key);
	}

	/**
	 * @param key 
	 * @comment removes the KEY from the storage.
	 */
	removeKey(key) {
		delete this.#content_obj[key];
		if (this.#autosave) this.saveAll();
	}

	/**
	 * @comment writes all the KEYS into the storage for the case when AUTOSAVE_ENABLED is turned off.
	 */
	saveAll() {
		saveJson(this.#filename, this.#content_obj);
	}

	/**
	 * @comment removes all the KEYS from the storage. If autosave is enabled saves the changes to the file.
	 */
	deleteAll() {
		this.#content_obj = {};
		if (this.#autosave) this.saveAll();
	}

	/**
	 * @returns a STRING of all contents in the storage.
	 */
	printContents() { console.log("Storage contents: " + JSON.stringify(this.#content_obj)); }

	/**
	 * @returns the whole object stored in the storage.
	 */
	getContents() { return JSON.stringify(this.#content_obj); } // @upd 1.0.7

	setAutosave(bool){ this.#autosave = bool; }

	getStorageFilename() { return this.#filename; }
}

function writeFile(filename, data){
	const buffer = str2ab(data);
	const file = hmFS.open(filename, hmFS.O_RDWR | hmFS.O_TRUNC);
	hmFS.write(file, buffer, 0, buffer.byteLength);
	hmFS.close(file);
}

function readFile(filename){
	const [fs_stat, err] = hmFS.stat(filename);
	if (err === 0) {
		const { size } = fs_stat;
		const file_content_buffer = new Uint16Array(new ArrayBuffer(size));
		const file = hmFS.open(filename, hmFS.O_RDONLY | hmFS.O_CREAT);
		hmFS.seek(file, 0, hmFS.SEEK_SET);
		hmFS.read(file, file_content_buffer.buffer, 0, size);
		hmFS.close(file);

		return String.fromCharCode.apply(null, file_content_buffer);
	} else { } // file not found handler
}

function writeAsset(filename, data) {
	const buffer = str2ab(data); //data
	const file = hmFS.open_asset(filename, hmFS.O_WRONLY | hmFS.O_CREAT);
	hmFS.write(file, buffer, 0, buffer.byteLength);
	hmFS.close(file);
}

function readAsset(filename){
	const [fs_stat, err] = hmFS.stat_asset(filename);
	if (err === 0) {
		const { size } = fs_stat;
		const file_content_buffer = new Uint16Array(new ArrayBuffer(size));
		const file = hmFS.open_asset(filename, hmFS.O_RDONLY | hmFS.O_CREAT);
		hmFS.seek(file, 0, hmFS.SEEK_SET);
		hmFS.read(file, file_content_buffer.buffer, 0, size);
		hmFS.close(file);

		return String.fromCharCode.apply(null, file_content_buffer);
	} else { } // file not found handler
}

function saveJson(filename, json) {
	writeFile(filename, JSON.stringify(json));
}

function loadJson(filename) {
	let json = {};
	try {
		const val = readFile(filename);
		json = val ? JSON.parse(val) : {};
	} catch (error) {
		json = {};
	} return json;
}

function str2ab(str) {
	const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	const buf_view = new Uint16Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		buf_view[i] = str.charCodeAt(i);
	} return buf;
}

// var hex_string = "Hello World!".toHex();
// console.log(hex_string) // "48656c6c6f20576f726c6421"
String.prototype.toHex = function () {
    var result = "";
    for (var i = 0; i < this.length; i++) {
        result += this.charCodeAt(i).toString(16);
    }
    return result;
}

// var hex_string = "48656c6c6f20576f726c6421";
// console.log(hex_string.fromHex()); // "Hello World!"
String.prototype.fromHex = function () {
    var hex_string = this.toString(); // Ensure we have a string
    var result = "";
    for (var i = 0; i < hex_string.length; i += 2) {
        result += String.fromCharCode(parseInt(hex_string.substr(i, 2), 16));
    } return result;
}

/**
 * @changelog
 * 1.0.0
 * - initial release
 * 1.0.3
 * - (fix) "return this.#content_obj[key]" was returning null without typecast; now returns strict string
 * - (add) possibility to write/read arbitrary files
 * - (add) separation between manual writes and easystorage
 * 1.0.5
 * - consistency
 * - toHex / fromHex string extensions
 * 1.0.6
 * - getContents() that retrieves whole contents of the storage as a JSON object
 * 1.0.7
 * - getContents() returns a stringified version of JSON object (as in the original easy-save library)
 */
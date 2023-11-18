'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const DEFAULT_SETTINGS = {
    moveAttachmentsWithNote: true,
    deleteAttachmentsWithNote: true,
    updateLinks: true,
    deleteEmptyFolders: true,
    deleteExistFilesWhenMoveNote: true,
    changeNoteBacklinksAlt: false,
    ignoreFolders: [".git/", ".obsidian/"],
    ignoreFiles: ["consistency\\-report\\.md"],
    ignoreFilesRegex: [/consistency\-report\.md/],
    attachmentsSubfolder: "",
    consistencyReportFile: "consistency-report.md",
    useBuiltInObsidianLinkCaching: false,
};
class SettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Consistent attachments and links - Settings' });
        new obsidian.Setting(containerEl)
            .setName('Move Attachments with Note')
            .setDesc('Automatically move attachments when a note is relocated. This includes attachments located in the same folder or any of its subfolders.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.moveAttachmentsWithNote = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.moveAttachmentsWithNote));
        new obsidian.Setting(containerEl)
            .setName('Delete Unused Attachments with Note')
            .setDesc('Automatically remove attachments that are no longer referenced in other notes when the note is deleted.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.deleteAttachmentsWithNote = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.deleteAttachmentsWithNote));
        new obsidian.Setting(containerEl)
            .setName('Update Links')
            .setDesc('Automatically update links to attachments and other notes when moving notes or attachments.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.updateLinks = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.updateLinks));
        new obsidian.Setting(containerEl)
            .setName('Delete Empty Folders')
            .setDesc('Automatically remove empty folders after moving notes with attachments.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.deleteEmptyFolders = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.deleteEmptyFolders));
        new obsidian.Setting(containerEl)
            .setName('Delete Duplicate Attachments on Note Move')
            .setDesc('Automatically delete attachments when moving a note if a file with the same name exists in the destination folder. If disabled, the file will be renamed and moved.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.deleteExistFilesWhenMoveNote = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.deleteExistFilesWhenMoveNote));
        new obsidian.Setting(containerEl)
            .setName('Update Backlink Text on Note Rename')
            .setDesc('When a note is renamed, its linked references are automatically updated. If this option is enabled, the text of backlinks to this note will also be modified.')
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.changeNoteBacklinksAlt = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.changeNoteBacklinksAlt));
        new obsidian.Setting(containerEl)
            .setName("Ignore Folders")
            .setDesc("Specify a list of folders to ignore. Enter each folder on a new line.")
            .addTextArea(cb => cb
            .setPlaceholder("Example: .git, .obsidian")
            .setValue(this.plugin.settings.ignoreFolders.join("\n"))
            .onChange((value) => {
            let paths = value.trim().split("\n").map(value => this.getNormalizedPath(value) + "/");
            this.plugin.settings.ignoreFolders = paths;
            this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("Ignore Files")
            .setDesc("Specify a list of files to ignore. Enter each file on a new line.")
            .addTextArea(cb => cb
            .setPlaceholder("Example: consistant-report.md")
            .setValue(this.plugin.settings.ignoreFiles.join("\n"))
            .onChange((value) => {
            let paths = value.trim().split("\n");
            this.plugin.settings.ignoreFiles = paths;
            this.plugin.settings.ignoreFilesRegex = paths.map(file => RegExp(file));
            this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("Attachment Subfolder")
            .setDesc("Specify the subfolder within the note folder to collect attachments into when using the \"Collect All Attachments\" hotkey. Leave empty to collect attachments directly into the note folder. You can use ${filename} as a placeholder for the current note name.")
            .addText(cb => cb
            .setPlaceholder("Example: _attachments")
            .setValue(this.plugin.settings.attachmentsSubfolder)
            .onChange((value) => {
            this.plugin.settings.attachmentsSubfolder = value;
            this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("Consistency Report Filename")
            .setDesc("Specify the name of the file for the consistency report.")
            .addText(cb => cb
            .setPlaceholder("Example: consistency-report.md")
            .setValue(this.plugin.settings.consistencyReportFile)
            .onChange((value) => {
            this.plugin.settings.consistencyReportFile = value;
            this.plugin.saveSettings();
        }));
        new obsidian.Setting(containerEl)
            .setName("EXPERIMENTAL: Use Built-in Obsidian Link Caching for Moved Notes")
            .setDesc("Enable this option to use the experimental built-in Obsidian link caching for processing moved notes. Turn it off if the plugin misbehaves.")
            .addToggle(cb => cb.onChange(value => {
            this.plugin.settings.useBuiltInObsidianLinkCaching = value;
            this.plugin.saveSettings();
        }).setValue(this.plugin.settings.useBuiltInObsidianLinkCaching));
    }
    getNormalizedPath(path) {
        return path.length == 0 ? path : obsidian.normalizePath(path);
    }
}

class Utils {
    static delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    static normalizePathForFile(path) {
        path = path.replace(/\\/gi, "/"); //replace \ to /
        path = path.replace(/%20/gi, " "); //replace %20 to space
        return path;
    }
    static normalizePathForLink(path) {
        path = path.replace(/\\/gi, "/"); //replace \ to /
        path = path.replace(/ /gi, "%20"); //replace space to %20
        return path;
    }
    static normalizeLinkSection(section) {
        section = decodeURI(section);
        return section;
    }
}

class path {
    static join(...parts) {
        if (arguments.length === 0)
            return '.';
        var joined;
        for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            if (arg.length > 0) {
                if (joined === undefined)
                    joined = arg;
                else
                    joined += '/' + arg;
            }
        }
        if (joined === undefined)
            return '.';
        return this.posixNormalize(joined);
    }
    static dirname(path) {
        if (path.length === 0)
            return '.';
        var code = path.charCodeAt(0);
        var hasRoot = code === 47 /*/*/;
        var end = -1;
        var matchedSlash = true;
        for (var i = path.length - 1; i >= 1; --i) {
            code = path.charCodeAt(i);
            if (code === 47 /*/*/) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            }
            else {
                // We saw the first non-path separator
                matchedSlash = false;
            }
        }
        if (end === -1)
            return hasRoot ? '/' : '.';
        if (hasRoot && end === 1)
            return '//';
        return path.slice(0, end);
    }
    static basename(path, ext) {
        if (ext !== undefined && typeof ext !== 'string')
            throw new TypeError('"ext" argument must be a string');
        var start = 0;
        var end = -1;
        var matchedSlash = true;
        var i;
        if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path)
                return '';
            var extIdx = ext.length - 1;
            var firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
                var code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else {
                    if (firstNonSlashEnd === -1) {
                        // We saw the first non-path separator, remember this index in case
                        // we need it if the extension ends up not matching
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                        // Try to match the explicit extension
                        if (code === ext.charCodeAt(extIdx)) {
                            if (--extIdx === -1) {
                                // We matched the extension, so mark this as the end of our path
                                // component
                                end = i;
                            }
                        }
                        else {
                            // Extension does not match, so our result is the entire path
                            // component
                            extIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
            if (start === end)
                end = firstNonSlashEnd;
            else if (end === -1)
                end = path.length;
            return path.slice(start, end);
        }
        else {
            for (i = path.length - 1; i >= 0; --i) {
                if (path.charCodeAt(i) === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                }
            }
            if (end === -1)
                return '';
            return path.slice(start, end);
        }
    }
    static extname(path) {
        var startDot = -1;
        var startPart = 0;
        var end = -1;
        var matchedSlash = true;
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        var preDotState = 0;
        for (var i = path.length - 1; i >= 0; --i) {
            var code = path.charCodeAt(i);
            if (code === 47 /*/*/) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if (code === 46 /*.*/) {
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }
        if (startDot === -1 || end === -1 ||
            // We saw a non-dot character immediately before the dot
            preDotState === 0 ||
            // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            return '';
        }
        return path.slice(startDot, end);
    }
    static parse(path) {
        var ret = { root: '', dir: '', base: '', ext: '', name: '' };
        if (path.length === 0)
            return ret;
        var code = path.charCodeAt(0);
        var isAbsolute = code === 47 /*/*/;
        var start;
        if (isAbsolute) {
            ret.root = '/';
            start = 1;
        }
        else {
            start = 0;
        }
        var startDot = -1;
        var startPart = 0;
        var end = -1;
        var matchedSlash = true;
        var i = path.length - 1;
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        var preDotState = 0;
        // Get non-dir info
        for (; i >= start; --i) {
            code = path.charCodeAt(i);
            if (code === 47 /*/*/) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if (code === 46 /*.*/) {
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }
        if (startDot === -1 || end === -1 ||
            // We saw a non-dot character immediately before the dot
            preDotState === 0 ||
            // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            if (end !== -1) {
                if (startPart === 0 && isAbsolute)
                    ret.base = ret.name = path.slice(1, end);
                else
                    ret.base = ret.name = path.slice(startPart, end);
            }
        }
        else {
            if (startPart === 0 && isAbsolute) {
                ret.name = path.slice(1, startDot);
                ret.base = path.slice(1, end);
            }
            else {
                ret.name = path.slice(startPart, startDot);
                ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
        }
        if (startPart > 0)
            ret.dir = path.slice(0, startPart - 1);
        else if (isAbsolute)
            ret.dir = '/';
        return ret;
    }
    static posixNormalize(path) {
        if (path.length === 0)
            return '.';
        var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
        var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;
        // Normalize the path
        path = this.normalizeStringPosix(path, !isAbsolute);
        if (path.length === 0 && !isAbsolute)
            path = '.';
        if (path.length > 0 && trailingSeparator)
            path += '/';
        if (isAbsolute)
            return '/' + path;
        return path;
    }
    static normalizeStringPosix(path, allowAboveRoot) {
        var res = '';
        var lastSegmentLength = 0;
        var lastSlash = -1;
        var dots = 0;
        var code;
        for (var i = 0; i <= path.length; ++i) {
            if (i < path.length)
                code = path.charCodeAt(i);
            else if (code === 47 /*/*/)
                break;
            else
                code = 47 /*/*/;
            if (code === 47 /*/*/) {
                if (lastSlash === i - 1 || dots === 1) ;
                else if (lastSlash !== i - 1 && dots === 2) {
                    if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
                        if (res.length > 2) {
                            var lastSlashIndex = res.lastIndexOf('/');
                            if (lastSlashIndex !== res.length - 1) {
                                if (lastSlashIndex === -1) {
                                    res = '';
                                    lastSegmentLength = 0;
                                }
                                else {
                                    res = res.slice(0, lastSlashIndex);
                                    lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                                }
                                lastSlash = i;
                                dots = 0;
                                continue;
                            }
                        }
                        else if (res.length === 2 || res.length === 1) {
                            res = '';
                            lastSegmentLength = 0;
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    }
                    if (allowAboveRoot) {
                        if (res.length > 0)
                            res += '/..';
                        else
                            res = '..';
                        lastSegmentLength = 2;
                    }
                }
                else {
                    if (res.length > 0)
                        res += '/' + path.slice(lastSlash + 1, i);
                    else
                        res = path.slice(lastSlash + 1, i);
                    lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
            }
            else if (code === 46 /*.*/ && dots !== -1) {
                ++dots;
            }
            else {
                dots = -1;
            }
        }
        return res;
    }
    static posixResolve(...args) {
        var resolvedPath = '';
        var resolvedAbsolute = false;
        var cwd;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path;
            if (i >= 0)
                path = args[i];
            else {
                if (cwd === undefined)
                    cwd = process.cwd();
                path = cwd;
            }
            // Skip empty entries
            if (path.length === 0) {
                continue;
            }
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        // Normalize the path
        resolvedPath = this.normalizeStringPosix(resolvedPath, !resolvedAbsolute);
        if (resolvedAbsolute) {
            if (resolvedPath.length > 0)
                return '/' + resolvedPath;
            else
                return '/';
        }
        else if (resolvedPath.length > 0) {
            return resolvedPath;
        }
        else {
            return '.';
        }
    }
    static relative(from, to) {
        if (from === to)
            return '';
        from = this.posixResolve(from);
        to = this.posixResolve(to);
        if (from === to)
            return '';
        // Trim any leading backslashes
        var fromStart = 1;
        for (; fromStart < from.length; ++fromStart) {
            if (from.charCodeAt(fromStart) !== 47 /*/*/)
                break;
        }
        var fromEnd = from.length;
        var fromLen = fromEnd - fromStart;
        // Trim any leading backslashes
        var toStart = 1;
        for (; toStart < to.length; ++toStart) {
            if (to.charCodeAt(toStart) !== 47 /*/*/)
                break;
        }
        var toEnd = to.length;
        var toLen = toEnd - toStart;
        // Compare paths to find the longest common path from root
        var length = fromLen < toLen ? fromLen : toLen;
        var lastCommonSep = -1;
        var i = 0;
        for (; i <= length; ++i) {
            if (i === length) {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === 47 /*/*/) {
                        // We get here if `from` is the exact base path for `to`.
                        // For example: from='/foo/bar'; to='/foo/bar/baz'
                        return to.slice(toStart + i + 1);
                    }
                    else if (i === 0) {
                        // We get here if `from` is the root
                        // For example: from='/'; to='/foo'
                        return to.slice(toStart + i);
                    }
                }
                else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
                        // We get here if `to` is the exact base path for `from`.
                        // For example: from='/foo/bar/baz'; to='/foo/bar'
                        lastCommonSep = i;
                    }
                    else if (i === 0) {
                        // We get here if `to` is the root.
                        // For example: from='/foo'; to='/'
                        lastCommonSep = 0;
                    }
                }
                break;
            }
            var fromCode = from.charCodeAt(fromStart + i);
            var toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
                break;
            else if (fromCode === 47 /*/*/)
                lastCommonSep = i;
        }
        var out = '';
        // Generate the relative path based on the path difference between `to`
        // and `from`
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
                if (out.length === 0)
                    out += '..';
                else
                    out += '/..';
            }
        }
        // Lastly, append the rest of the destination (`to`) path that comes after
        // the common path parts
        if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
        else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === 47 /*/*/)
                ++toStart;
            return to.slice(toStart);
        }
    }
}

//simple regex
// const markdownLinkOrEmbedRegexSimple = /\[(.*?)\]\((.*?)\)/gim
// const markdownLinkRegexSimple = /(?<!\!)\[(.*?)\]\((.*?)\)/gim;
// const markdownEmbedRegexSimple = /\!\[(.*?)\]\((.*?)\)/gim
// const wikiLinkOrEmbedRegexSimple = /\[\[(.*?)\]\]/gim
// const wikiLinkRegexSimple = /(?<!\!)\[\[(.*?)\]\]/gim;
// const wikiEmbedRegexSimple = /\!\[\[(.*?)\]\]/gim
//with escaping \ characters
const markdownLinkOrEmbedRegexG = /(?<!\\)\[(.*?)(?<!\\)\]\((.*?)(?<!\\)\)/gim;
const markdownLinkRegexG = /(?<!\!)(?<!\\)\[(.*?)(?<!\\)\]\((.*?)(?<!\\)(?:#(.*?))?\)/gim;
const markdownEmbedRegexG = /(?<!\\)\!\[(.*?)(?<!\\)\]\((.*?)(?<!\\)\)/gim;
const wikiLinkOrEmbedRegexG = /(?<!\\)\[\[(.*?)(?<!\\)\]\]/gim;
const wikiLinkRegexG = /(?<!\!)(?<!\\)\[\[(.*?)(?<!\\)\]\]/gim;
const wikiEmbedRegexG = /(?<!\\)\!\[\[(.*?)(?<!\\)\]\]/gim;
const markdownLinkOrEmbedRegex = /(?<!\\)\[(.*?)(?<!\\)\]\((.*?)(?<!\\)\)/im;
const markdownLinkRegex = /(?<!\!)(?<!\\)\[(.*?)(?<!\\)\]\((.*?)(?<!\\)\)/im;
class LinksHandler {
    constructor(app, consoleLogPrefix = "", ignoreFolders = [], ignoreFilesRegex = []) {
        this.app = app;
        this.consoleLogPrefix = consoleLogPrefix;
        this.ignoreFolders = ignoreFolders;
        this.ignoreFilesRegex = ignoreFilesRegex;
    }
    isPathIgnored(path) {
        if (path.startsWith("./"))
            path = path.substring(2);
        for (let folder of this.ignoreFolders) {
            if (path.startsWith(folder)) {
                return true;
            }
        }
        for (let fileRegex of this.ignoreFilesRegex) {
            if (fileRegex.test(path)) {
                return true;
            }
        }
    }
    checkIsCorrectMarkdownEmbed(text) {
        let elements = text.match(markdownEmbedRegexG);
        return (elements != null && elements.length > 0);
    }
    checkIsCorrectMarkdownLink(text) {
        let elements = text.match(markdownLinkRegexG);
        return (elements != null && elements.length > 0);
    }
    checkIsCorrectMarkdownEmbedOrLink(text) {
        let elements = text.match(markdownLinkOrEmbedRegexG);
        return (elements != null && elements.length > 0);
    }
    checkIsCorrectWikiEmbed(text) {
        let elements = text.match(wikiEmbedRegexG);
        return (elements != null && elements.length > 0);
    }
    checkIsCorrectWikiLink(text) {
        let elements = text.match(wikiLinkRegexG);
        return (elements != null && elements.length > 0);
    }
    checkIsCorrectWikiEmbedOrLink(text) {
        let elements = text.match(wikiLinkOrEmbedRegexG);
        return (elements != null && elements.length > 0);
    }
    getFileByLink(link, owningNotePath, allowInvalidLink = true) {
        link = this.splitLinkToPathAndSection(link).link;
        if (allowInvalidLink) {
            return this.app.metadataCache.getFirstLinkpathDest(link, owningNotePath);
        }
        let fullPath = this.getFullPathForLink(link, owningNotePath);
        return this.getFileByPath(fullPath);
    }
    getFileByPath(path) {
        path = Utils.normalizePathForFile(path);
        return app.vault.getAbstractFileByPath(path);
    }
    getFullPathForLink(link, owningNotePath) {
        link = this.splitLinkToPathAndSection(link).link;
        link = Utils.normalizePathForFile(link);
        owningNotePath = Utils.normalizePathForFile(owningNotePath);
        let parentFolder = owningNotePath.substring(0, owningNotePath.lastIndexOf("/"));
        let fullPath = path.join(parentFolder, link);
        fullPath = Utils.normalizePathForFile(fullPath);
        return fullPath;
    }
    getAllCachedLinksToFile(filePath) {
        var _a;
        let allLinks = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (note.path == filePath)
                    continue;
                //!!! this can return undefined if note was just updated
                let links = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.links;
                if (links) {
                    for (let link of links) {
                        let linkFullPath = this.getFullPathForLink(link.link, note.path);
                        if (linkFullPath == filePath) {
                            if (!allLinks[note.path])
                                allLinks[note.path] = [];
                            allLinks[note.path].push(link);
                        }
                    }
                }
            }
        }
        return allLinks;
    }
    getAllCachedEmbedsToFile(filePath) {
        var _a;
        let allEmbeds = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (note.path == filePath)
                    continue;
                //!!! this can return undefined if note was just updated
                let embeds = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.embeds;
                if (embeds) {
                    for (let embed of embeds) {
                        let linkFullPath = this.getFullPathForLink(embed.link, note.path);
                        if (linkFullPath == filePath) {
                            if (!allEmbeds[note.path])
                                allEmbeds[note.path] = [];
                            allEmbeds[note.path].push(embed);
                        }
                    }
                }
            }
        }
        return allEmbeds;
    }
    getAllBadLinks() {
        var _a;
        let allLinks = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let links = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.links;
                if (links) {
                    for (let link of links) {
                        if (link.link.startsWith("#")) //internal section link
                            continue;
                        if (this.checkIsCorrectWikiLink(link.original))
                            continue;
                        let file = this.getFileByLink(link.link, note.path, false);
                        if (!file) {
                            if (!allLinks[note.path])
                                allLinks[note.path] = [];
                            allLinks[note.path].push(link);
                        }
                    }
                }
            }
        }
        return allLinks;
    }
    getAllBadEmbeds() {
        var _a;
        let allEmbeds = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let embeds = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.embeds;
                if (embeds) {
                    for (let embed of embeds) {
                        if (this.checkIsCorrectWikiEmbed(embed.original))
                            continue;
                        let file = this.getFileByLink(embed.link, note.path, false);
                        if (!file) {
                            if (!allEmbeds[note.path])
                                allEmbeds[note.path] = [];
                            allEmbeds[note.path].push(embed);
                        }
                    }
                }
            }
        }
        return allEmbeds;
    }
    getAllGoodLinks() {
        var _a;
        let allLinks = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let links = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.links;
                if (links) {
                    for (let link of links) {
                        if (link.link.startsWith("#")) //internal section link
                            continue;
                        if (this.checkIsCorrectWikiLink(link.original))
                            continue;
                        let file = this.getFileByLink(link.link, note.path);
                        if (file) {
                            if (!allLinks[note.path])
                                allLinks[note.path] = [];
                            allLinks[note.path].push(link);
                        }
                    }
                }
            }
        }
        return allLinks;
    }
    getAllBadSectionLinks() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let allLinks = {};
            let notes = this.app.vault.getMarkdownFiles();
            if (notes) {
                for (let note of notes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    //!!! this can return undefined if note was just updated
                    let links = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.links;
                    if (links) {
                        for (let link of links) {
                            if (this.checkIsCorrectWikiLink(link.original))
                                continue;
                            let li = this.splitLinkToPathAndSection(link.link);
                            if (!li.hasSection)
                                continue;
                            let file = this.getFileByLink(link.link, note.path, false);
                            if (file) {
                                if (file.extension === "pdf" && li.section.startsWith("page=")) {
                                    continue;
                                }
                                let text = yield this.app.vault.read(file);
                                let section = Utils.normalizeLinkSection(li.section);
                                if (section.startsWith("^")) //skip ^ links
                                    continue;
                                let regex = /[ !@$%^&*()-=_+\\/;'\[\]\"\|\?.\,\<\>\`\~\{\}]/gim;
                                text = text.replace(regex, '');
                                section = section.replace(regex, '');
                                if (!text.contains("#" + section)) {
                                    if (!allLinks[note.path])
                                        allLinks[note.path] = [];
                                    allLinks[note.path].push(link);
                                }
                            }
                        }
                    }
                }
            }
            return allLinks;
        });
    }
    getAllGoodEmbeds() {
        var _a;
        let allEmbeds = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let embeds = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.embeds;
                if (embeds) {
                    for (let embed of embeds) {
                        if (this.checkIsCorrectWikiEmbed(embed.original))
                            continue;
                        let file = this.getFileByLink(embed.link, note.path);
                        if (file) {
                            if (!allEmbeds[note.path])
                                allEmbeds[note.path] = [];
                            allEmbeds[note.path].push(embed);
                        }
                    }
                }
            }
        }
        return allEmbeds;
    }
    getAllWikiLinks() {
        var _a;
        let allLinks = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let links = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.links;
                if (links) {
                    for (let link of links) {
                        if (!this.checkIsCorrectWikiLink(link.original))
                            continue;
                        if (!allLinks[note.path])
                            allLinks[note.path] = [];
                        allLinks[note.path].push(link);
                    }
                }
            }
        }
        return allLinks;
    }
    getAllWikiEmbeds() {
        var _a;
        let allEmbeds = {};
        let notes = this.app.vault.getMarkdownFiles();
        if (notes) {
            for (let note of notes) {
                if (this.isPathIgnored(note.path))
                    continue;
                //!!! this can return undefined if note was just updated
                let embeds = (_a = this.app.metadataCache.getCache(note.path)) === null || _a === void 0 ? void 0 : _a.embeds;
                if (embeds) {
                    for (let embed of embeds) {
                        if (!this.checkIsCorrectWikiEmbed(embed.original))
                            continue;
                        if (!allEmbeds[note.path])
                            allEmbeds[note.path] = [];
                        allEmbeds[note.path].push(embed);
                    }
                }
            }
        }
        return allEmbeds;
    }
    updateLinksToRenamedFile(oldNotePath, newNotePath, changelinksAlt = false, useBuiltInObsidianLinkCaching = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(oldNotePath) || this.isPathIgnored(newNotePath))
                return;
            let notes = useBuiltInObsidianLinkCaching ? this.getCachedNotesThatHaveLinkToFile(oldNotePath) : yield this.getNotesThatHaveLinkToFile(oldNotePath);
            let links = [{ oldPath: oldNotePath, newPath: newNotePath }];
            if (notes) {
                for (let note of notes) {
                    yield this.updateChangedPathsInNote(note, links, changelinksAlt);
                }
            }
        });
    }
    updateChangedPathInNote(notePath, oldLink, newLink, changelinksAlt = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let changes = [{ oldPath: oldLink, newPath: newLink }];
            return yield this.updateChangedPathsInNote(notePath, changes, changelinksAlt);
        });
    }
    updateChangedPathsInNote(notePath, changedLinks, changelinksAlt = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let file = this.getFileByPath(notePath);
            if (!file) {
                console.error(this.consoleLogPrefix + "cant update links in note, file not found: " + notePath);
                return;
            }
            let text = yield this.app.vault.read(file);
            let dirty = false;
            let elements = text.match(markdownLinkOrEmbedRegexG);
            if (elements != null && elements.length > 0) {
                for (let el of elements) {
                    let alt = el.match(markdownLinkOrEmbedRegex)[1];
                    let link = el.match(markdownLinkOrEmbedRegex)[2];
                    let li = this.splitLinkToPathAndSection(link);
                    if (li.hasSection) // for links with sections like [](note.md#section)
                        link = li.link;
                    let fullLink = this.getFullPathForLink(link, notePath);
                    for (let changedLink of changedLinks) {
                        if (fullLink == changedLink.oldPath) {
                            let newRelLink = path.relative(notePath, changedLink.newPath);
                            newRelLink = Utils.normalizePathForLink(newRelLink);
                            if (newRelLink.startsWith("../")) {
                                newRelLink = newRelLink.substring(3);
                            }
                            if (changelinksAlt && newRelLink.endsWith(".md")) {
                                //rename only if old alt == old note name
                                if (alt === path.basename(changedLink.oldPath, path.extname(changedLink.oldPath))) {
                                    let ext = path.extname(newRelLink);
                                    let baseName = path.basename(newRelLink, ext);
                                    alt = Utils.normalizePathForFile(baseName);
                                }
                            }
                            if (li.hasSection)
                                text = text.replace(el, '[' + alt + ']' + '(' + newRelLink + '#' + li.section + ')');
                            else
                                text = text.replace(el, '[' + alt + ']' + '(' + newRelLink + ')');
                            dirty = true;
                            console.log(this.consoleLogPrefix + "link updated in cached note [note, old link, new link]: \n   "
                                + file.path + "\n   " + link + "\n   " + newRelLink);
                        }
                    }
                }
            }
            if (dirty)
                yield this.app.vault.modify(file, text);
        });
    }
    updateInternalLinksInMovedNote(oldNotePath, newNotePath, attachmentsAlreadyMoved) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(oldNotePath) || this.isPathIgnored(newNotePath))
                return;
            let file = this.getFileByPath(newNotePath);
            if (!file) {
                console.error(this.consoleLogPrefix + "can't update internal links, file not found: " + newNotePath);
                return;
            }
            let text = yield this.app.vault.read(file);
            let dirty = false;
            let elements = text.match(markdownLinkOrEmbedRegexG);
            if (elements != null && elements.length > 0) {
                for (let el of elements) {
                    let alt = el.match(markdownLinkOrEmbedRegex)[1];
                    let link = el.match(markdownLinkOrEmbedRegex)[2];
                    let li = this.splitLinkToPathAndSection(link);
                    if (link.startsWith("#")) //internal section link
                        continue;
                    if (li.hasSection) // for links with sections like [](note.md#section)
                        link = li.link;
                    //startsWith("../") - for not skipping files that not in the note dir
                    if (attachmentsAlreadyMoved && !link.endsWith(".md") && !link.startsWith("../"))
                        continue;
                    let file = this.getFileByLink(link, oldNotePath);
                    if (!file) {
                        file = this.getFileByLink(link, newNotePath);
                        if (!file) {
                            console.error(this.consoleLogPrefix + newNotePath + " has bad link (file does not exist): " + link);
                            continue;
                        }
                    }
                    let newRelLink = path.relative(newNotePath, file.path);
                    newRelLink = Utils.normalizePathForLink(newRelLink);
                    if (newRelLink.startsWith("../")) {
                        newRelLink = newRelLink.substring(3);
                    }
                    if (li.hasSection)
                        text = text.replace(el, '[' + alt + ']' + '(' + newRelLink + '#' + li.section + ')');
                    else
                        text = text.replace(el, '[' + alt + ']' + '(' + newRelLink + ')');
                    dirty = true;
                    console.log(this.consoleLogPrefix + "link updated in moved note [note, old link, new link]: \n   "
                        + file.path + "\n   " + link + "   \n" + newRelLink);
                }
            }
            if (dirty)
                yield this.app.vault.modify(file, text);
        });
    }
    getCachedNotesThatHaveLinkToFile(filePath) {
        var _a, _b;
        let notes = [];
        let allNotes = this.app.vault.getMarkdownFiles();
        if (allNotes) {
            for (let note of allNotes) {
                if (this.isPathIgnored(note.path))
                    continue;
                let notePath = note.path;
                if (note.path == filePath)
                    continue;
                //!!! this can return undefined if note was just updated
                let embeds = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.embeds;
                if (embeds) {
                    for (let embed of embeds) {
                        let linkPath = this.getFullPathForLink(embed.link, note.path);
                        if (linkPath == filePath) {
                            if (!notes.contains(notePath))
                                notes.push(notePath);
                        }
                    }
                }
                //!!! this can return undefined if note was just updated
                let links = (_b = this.app.metadataCache.getCache(notePath)) === null || _b === void 0 ? void 0 : _b.links;
                if (links) {
                    for (let link of links) {
                        let linkPath = this.getFullPathForLink(link.link, note.path);
                        if (linkPath == filePath) {
                            if (!notes.contains(notePath))
                                notes.push(notePath);
                        }
                    }
                }
            }
        }
        return notes;
    }
    getNotesThatHaveLinkToFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let notes = [];
            let allNotes = this.app.vault.getMarkdownFiles();
            if (allNotes) {
                for (let note of allNotes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    let notePath = note.path;
                    if (notePath == filePath)
                        continue;
                    let links = yield this.getLinksFromNote(notePath);
                    for (let link of links) {
                        let li = this.splitLinkToPathAndSection(link.link);
                        let linkFullPath = this.getFullPathForLink(li.link, notePath);
                        if (linkFullPath == filePath) {
                            if (!notes.contains(notePath))
                                notes.push(notePath);
                        }
                    }
                }
            }
            return notes;
        });
    }
    splitLinkToPathAndSection(link) {
        let res = {
            hasSection: false,
            link: link,
            section: ""
        };
        if (!link.contains('#'))
            return res;
        let linkBeforeHash = link.match(/(.*?)#(.*?)$/)[1];
        let section = link.match(/(.*?)#(.*?)$/)[2];
        let isMarkdownSection = section != "" && linkBeforeHash.endsWith(".md"); // for links with sections like [](note.md#section)
        let isPdfPageSection = section.startsWith("page=") && linkBeforeHash.endsWith(".pdf"); // for links with sections like [](note.pdf#page=42)
        if (isMarkdownSection || isPdfPageSection) {
            res = {
                hasSection: true,
                link: linkBeforeHash,
                section: section
            };
        }
        return res;
    }
    getFilePathWithRenamedBaseName(filePath, newBaseName) {
        return Utils.normalizePathForFile(path.join(path.dirname(filePath), newBaseName + path.extname(filePath)));
    }
    getLinksFromNote(notePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = this.getFileByPath(notePath);
            if (!file) {
                console.error(this.consoleLogPrefix + "can't get embeds, file not found: " + notePath);
                return;
            }
            let text = yield this.app.vault.read(file);
            let links = [];
            let elements = text.match(markdownLinkOrEmbedRegexG);
            if (elements != null && elements.length > 0) {
                for (let el of elements) {
                    let alt = el.match(markdownLinkOrEmbedRegex)[1];
                    let link = el.match(markdownLinkOrEmbedRegex)[2];
                    let emb = {
                        link: link,
                        displayText: alt,
                        original: el,
                        position: {
                            start: {
                                col: 0,
                                line: 0,
                                offset: 0
                            },
                            end: {
                                col: 0,
                                line: 0,
                                offset: 0
                            }
                        }
                    };
                    links.push(emb);
                }
            }
            return links;
        });
    }
    convertAllNoteEmbedsPathsToRelative(notePath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let changedEmbeds = [];
            let embeds = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.embeds;
            if (embeds) {
                for (let embed of embeds) {
                    let isMarkdownEmbed = this.checkIsCorrectMarkdownEmbed(embed.original);
                    let isWikiEmbed = this.checkIsCorrectWikiEmbed(embed.original);
                    if (isMarkdownEmbed || isWikiEmbed) {
                        let file = this.getFileByLink(embed.link, notePath);
                        if (file)
                            continue;
                        file = this.app.metadataCache.getFirstLinkpathDest(embed.link, notePath);
                        if (file) {
                            let newRelLink = path.relative(notePath, file.path);
                            newRelLink = isMarkdownEmbed ? Utils.normalizePathForLink(newRelLink) : Utils.normalizePathForFile(newRelLink);
                            if (newRelLink.startsWith("../")) {
                                newRelLink = newRelLink.substring(3);
                            }
                            changedEmbeds.push({ old: embed, newLink: newRelLink });
                        }
                        else {
                            console.error(this.consoleLogPrefix + notePath + " has bad embed (file does not exist): " + embed.link);
                        }
                    }
                    else {
                        console.error(this.consoleLogPrefix + notePath + " has bad embed (format of link is not markdown or wiki link): " + embed.original);
                    }
                }
            }
            yield this.updateChangedEmbedInNote(notePath, changedEmbeds);
            return changedEmbeds;
        });
    }
    convertAllNoteLinksPathsToRelative(notePath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let changedLinks = [];
            let links = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.links;
            if (links) {
                for (let link of links) {
                    let isMarkdownLink = this.checkIsCorrectMarkdownLink(link.original);
                    let isWikiLink = this.checkIsCorrectWikiLink(link.original);
                    if (isMarkdownLink || isWikiLink) {
                        if (link.link.startsWith("#")) //internal section link
                            continue;
                        let file = this.getFileByLink(link.link, notePath);
                        if (file)
                            continue;
                        //!!! link.displayText is always "" - OBSIDIAN BUG?, so get display text manualy
                        if (isMarkdownLink) {
                            let elements = link.original.match(markdownLinkRegex);
                            if (elements)
                                link.displayText = elements[1];
                        }
                        file = this.app.metadataCache.getFirstLinkpathDest(link.link, notePath);
                        if (file) {
                            let newRelLink = path.relative(notePath, file.path);
                            newRelLink = isMarkdownLink ? Utils.normalizePathForLink(newRelLink) : Utils.normalizePathForFile(newRelLink);
                            if (newRelLink.startsWith("../")) {
                                newRelLink = newRelLink.substring(3);
                            }
                            changedLinks.push({ old: link, newLink: newRelLink });
                        }
                        else {
                            console.error(this.consoleLogPrefix + notePath + " has bad link (file does not exist): " + link.link);
                        }
                    }
                    else {
                        console.error(this.consoleLogPrefix + notePath + " has bad link (format of link is not markdown or wiki link): " + link.original);
                    }
                }
            }
            yield this.updateChangedLinkInNote(notePath, changedLinks);
            return changedLinks;
        });
    }
    updateChangedEmbedInNote(notePath, changedEmbeds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let noteFile = this.getFileByPath(notePath);
            if (!noteFile) {
                console.error(this.consoleLogPrefix + "can't update embeds in note, file not found: " + notePath);
                return;
            }
            let text = yield this.app.vault.read(noteFile);
            let dirty = false;
            if (changedEmbeds && changedEmbeds.length > 0) {
                for (let embed of changedEmbeds) {
                    if (embed.old.link == embed.newLink)
                        continue;
                    if (this.checkIsCorrectMarkdownEmbed(embed.old.original)) {
                        text = text.replace(embed.old.original, '![' + embed.old.displayText + ']' + '(' + embed.newLink + ')');
                    }
                    else if (this.checkIsCorrectWikiEmbed(embed.old.original)) {
                        text = text.replace(embed.old.original, '![[' + embed.newLink + ']]');
                    }
                    else {
                        console.error(this.consoleLogPrefix + notePath + " has bad embed (format of link is not maekdown or wiki link): " + embed.old.original);
                        continue;
                    }
                    console.log(this.consoleLogPrefix + "embed updated in note [note, old link, new link]: \n   "
                        + noteFile.path + "\n   " + embed.old.link + "\n   " + embed.newLink);
                    dirty = true;
                }
            }
            if (dirty)
                yield this.app.vault.modify(noteFile, text);
        });
    }
    updateChangedLinkInNote(notePath, chandedLinks) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let noteFile = this.getFileByPath(notePath);
            if (!noteFile) {
                console.error(this.consoleLogPrefix + "can't update links in note, file not found: " + notePath);
                return;
            }
            let text = yield this.app.vault.read(noteFile);
            let dirty = false;
            if (chandedLinks && chandedLinks.length > 0) {
                for (let link of chandedLinks) {
                    if (link.old.link == link.newLink)
                        continue;
                    if (this.checkIsCorrectMarkdownLink(link.old.original)) {
                        text = text.replace(link.old.original, '[' + link.old.displayText + ']' + '(' + link.newLink + ')');
                    }
                    else if (this.checkIsCorrectWikiLink(link.old.original)) {
                        text = text.replace(link.old.original, '[[' + link.newLink + ']]');
                    }
                    else {
                        console.error(this.consoleLogPrefix + notePath + " has bad link (format of link is not maekdown or wiki link): " + link.old.original);
                        continue;
                    }
                    console.log(this.consoleLogPrefix + "cached link updated in note [note, old link, new link]: \n   "
                        + noteFile.path + "\n   " + link.old.link + "\n   " + link.newLink);
                    dirty = true;
                }
            }
            if (dirty)
                yield this.app.vault.modify(noteFile, text);
        });
    }
    replaceAllNoteWikilinksWithMarkdownLinks(notePath) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let res = {
                links: [],
                embeds: [],
            };
            let noteFile = this.getFileByPath(notePath);
            if (!noteFile) {
                console.error(this.consoleLogPrefix + "can't update wikilinks in note, file not found: " + notePath);
                return;
            }
            let links = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.links;
            let embeds = (_b = this.app.metadataCache.getCache(notePath)) === null || _b === void 0 ? void 0 : _b.embeds;
            let text = yield this.app.vault.read(noteFile);
            let dirty = false;
            if (embeds) { //embeds must go first!
                for (let embed of embeds) {
                    if (this.checkIsCorrectWikiEmbed(embed.original)) {
                        let newPath = Utils.normalizePathForLink(embed.link);
                        let newLink = '![' + ']' + '(' + newPath + ')';
                        text = text.replace(embed.original, newLink);
                        console.log(this.consoleLogPrefix + "wiki link (embed) replaced in note [note, old link, new link]: \n   "
                            + noteFile.path + "\n   " + embed.original + "\n   " + newLink);
                        res.embeds.push({ old: embed, newLink: newLink });
                        dirty = true;
                    }
                }
            }
            if (links) {
                for (let link of links) {
                    if (this.checkIsCorrectWikiLink(link.original)) {
                        let newPath = Utils.normalizePathForLink(link.link);
                        let file = this.app.metadataCache.getFirstLinkpathDest(link.link, notePath);
                        if (file && file.extension == "md" && !newPath.endsWith(".md"))
                            newPath = newPath + ".md";
                        let newLink = '[' + link.displayText + ']' + '(' + newPath + ')';
                        text = text.replace(link.original, newLink);
                        console.log(this.consoleLogPrefix + "wiki link replaced in note [note, old link, new link]: \n   "
                            + noteFile.path + "\n   " + link.original + "\n   " + newLink);
                        res.links.push({ old: link, newLink: newLink });
                        dirty = true;
                    }
                }
            }
            if (dirty)
                yield this.app.vault.modify(noteFile, text);
            return res;
        });
    }
}

class FilesHandler {
    constructor(app, lh, consoleLogPrefix = "", ignoreFolders = [], ignoreFilesRegex = []) {
        this.app = app;
        this.lh = lh;
        this.consoleLogPrefix = consoleLogPrefix;
        this.ignoreFolders = ignoreFolders;
        this.ignoreFilesRegex = ignoreFilesRegex;
    }
    isPathIgnored(path) {
        if (path.startsWith("./"))
            path = path.substring(2);
        for (let folder of this.ignoreFolders) {
            if (path.startsWith(folder)) {
                return true;
            }
        }
        for (let fileRegex of this.ignoreFilesRegex) {
            let testResult = fileRegex.test(path);
            // console.log(path,fileRegex,testResult)
            if (testResult) {
                return true;
            }
        }
    }
    createFolderForAttachmentFromLink(link, owningNotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let newFullPath = this.lh.getFullPathForLink(link, owningNotePath);
            return yield this.createFolderForAttachmentFromPath(newFullPath);
        });
    }
    createFolderForAttachmentFromPath(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let newParentFolder = filePath.substring(0, filePath.lastIndexOf("/"));
            try {
                //todo check filder exist
                yield this.app.vault.createFolder(newParentFolder);
            }
            catch (_a) { }
        });
    }
    generateFileCopyName(originalName) {
        let ext = path.extname(originalName);
        let baseName = path.basename(originalName, ext);
        let dir = path.dirname(originalName);
        for (let i = 1; i < 100000; i++) {
            let newName = dir + "/" + baseName + " " + i + ext;
            let existFile = this.lh.getFileByPath(newName);
            if (!existFile)
                return newName;
        }
        return "";
    }
    moveCachedNoteAttachments(oldNotePath, newNotePath, deleteExistFiles, attachmentsSubfolder) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(oldNotePath) || this.isPathIgnored(newNotePath))
                return;
            //try to get embeds for old or new path (metadataCache can be updated or not)
            //!!! this can return undefined if note was just updated
            let embeds = (_a = this.app.metadataCache.getCache(newNotePath)) === null || _a === void 0 ? void 0 : _a.embeds;
            if (!embeds)
                embeds = (_b = this.app.metadataCache.getCache(oldNotePath)) === null || _b === void 0 ? void 0 : _b.embeds;
            if (!embeds)
                return;
            let result = {
                movedAttachments: [],
                renamedFiles: []
            };
            for (let embed of embeds) {
                let link = embed.link;
                let oldLinkPath = this.lh.getFullPathForLink(link, oldNotePath);
                if (result.movedAttachments.findIndex(x => x.oldPath == oldLinkPath) != -1)
                    continue; //already moved
                let file = this.lh.getFileByLink(link, oldNotePath);
                if (!file) {
                    file = this.lh.getFileByLink(link, newNotePath);
                    if (!file) {
                        console.error(this.consoleLogPrefix + oldNotePath + " has bad embed (file does not exist): " + link);
                        continue;
                    }
                }
                //if attachment not in the note folder, skip it
                // = "." means that note was at root path, so do not skip it
                if (path.dirname(oldNotePath) != "." && !path.dirname(oldLinkPath).startsWith(path.dirname(oldNotePath)))
                    continue;
                let newLinkPath = this.lh.getFullPathForLink(link, newNotePath);
                if (attachmentsSubfolder.contains("${filename}")) {
                    let oldLinkPathBySetting = this.getNewAttachmentPath(file.path, oldNotePath, attachmentsSubfolder);
                    if (oldLinkPath == oldLinkPathBySetting) {
                        newLinkPath = this.getNewAttachmentPath(file.path, newNotePath, attachmentsSubfolder);
                    }
                }
                if (newLinkPath == file.path)
                    continue; //nothing to change
                let res = yield this.moveAttachment(file, newLinkPath, [oldNotePath, newNotePath], deleteExistFiles);
                result.movedAttachments = result.movedAttachments.concat(res.movedAttachments);
                result.renamedFiles = result.renamedFiles.concat(res.renamedFiles);
            }
            return result;
        });
    }
    getNewAttachmentPath(oldAttachmentPath, notePath, subfolderName) {
        let resolvedSubFolderName = subfolderName.replace(/\${filename}/g, path.basename(notePath, ".md"));
        let newPath = (resolvedSubFolderName == "") ? path.dirname(notePath) : path.join(path.dirname(notePath), resolvedSubFolderName);
        newPath = Utils.normalizePathForFile(path.join(newPath, path.basename(oldAttachmentPath)));
        return newPath;
    }
    collectAttachmentsForCachedNote(notePath, subfolderName, deleteExistFiles) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            let result = {
                movedAttachments: [],
                renamedFiles: []
            };
            //!!! this can return undefined if note was just updated
            let embeds = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.embeds;
            if (embeds) {
                for (let embed of embeds) {
                    let link = embed.link;
                    let fillPathLink = this.lh.getFullPathForLink(link, notePath);
                    if (result.movedAttachments.findIndex(x => x.oldPath == fillPathLink) != -1)
                        continue; //already moved
                    let file = this.lh.getFileByLink(link, notePath);
                    if (!file) {
                        console.error(this.consoleLogPrefix + notePath + " has bad embed (file does not exist): " + link);
                        continue;
                    }
                    let newPath = this.getNewAttachmentPath(file.path, notePath, subfolderName);
                    if (newPath == file.path) //nothing to move
                        continue;
                    let res = yield this.moveAttachment(file, newPath, [notePath], deleteExistFiles);
                    result.movedAttachments = result.movedAttachments.concat(res.movedAttachments);
                    result.renamedFiles = result.renamedFiles.concat(res.renamedFiles);
                }
            }
            //!!! this can return undefined if note was just updated
            let links = (_b = this.app.metadataCache.getCache(notePath)) === null || _b === void 0 ? void 0 : _b.links;
            if (links) {
                for (let l of links) {
                    let link = this.lh.splitLinkToPathAndSection(l.link).link;
                    if (link.startsWith("#")) //internal section link
                        continue;
                    if (link.endsWith(".md") || link.endsWith(".canvas")) //internal file link
                        continue;
                    let fillPathLink = this.lh.getFullPathForLink(link, notePath);
                    if (result.movedAttachments.findIndex(x => x.oldPath == fillPathLink) != -1)
                        continue; //already moved
                    let file = this.lh.getFileByLink(link, notePath);
                    if (!file) {
                        console.error(this.consoleLogPrefix + notePath + " has bad link (file does not exist): " + link);
                        continue;
                    }
                    if (file.extension == "md" || file.extension == "canvas") //internal file link
                        continue;
                    let newPath = this.getNewAttachmentPath(file.path, notePath, subfolderName);
                    if (newPath == file.path) //nothing to move
                        continue;
                    let res = yield this.moveAttachment(file, newPath, [notePath], deleteExistFiles);
                    result.movedAttachments = result.movedAttachments.concat(res.movedAttachments);
                    result.renamedFiles = result.renamedFiles.concat(res.renamedFiles);
                }
            }
            return result;
        });
    }
    moveAttachment(file, newLinkPath, parentNotePaths, deleteExistFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = file.path;
            let result = {
                movedAttachments: [],
                renamedFiles: []
            };
            if (this.isPathIgnored(path))
                return result;
            if (path == newLinkPath) {
                console.warn(this.consoleLogPrefix + "Can't move file. Source and destination path the same.");
                return result;
            }
            yield this.createFolderForAttachmentFromPath(newLinkPath);
            let linkedNotes = this.lh.getCachedNotesThatHaveLinkToFile(path);
            if (parentNotePaths) {
                for (let notePath of parentNotePaths) {
                    linkedNotes.remove(notePath);
                }
            }
            if (path !== file.path) {
                console.warn(this.consoleLogPrefix + "File was moved already");
                return yield this.moveAttachment(file, newLinkPath, parentNotePaths, deleteExistFiles);
            }
            //if no other file has link to this file - try to move file
            //if file already exist at new location - delete or move with new name
            if (linkedNotes.length == 0) {
                let existFile = this.lh.getFileByPath(newLinkPath);
                if (!existFile) {
                    //move
                    console.log(this.consoleLogPrefix + "move file [from, to]: \n   " + path + "\n   " + newLinkPath);
                    result.movedAttachments.push({ oldPath: path, newPath: newLinkPath });
                    yield this.app.vault.rename(file, newLinkPath);
                }
                else {
                    if (deleteExistFiles) {
                        //delete
                        console.log(this.consoleLogPrefix + "delete file: \n   " + path);
                        result.movedAttachments.push({ oldPath: path, newPath: newLinkPath });
                        yield this.app.vault.trash(file, true);
                    }
                    else {
                        //move with new name
                        let newFileCopyName = this.generateFileCopyName(newLinkPath);
                        console.log(this.consoleLogPrefix + "copy file with new name [from, to]: \n   " + path + "\n   " + newFileCopyName);
                        result.movedAttachments.push({ oldPath: path, newPath: newFileCopyName });
                        yield this.app.vault.rename(file, newFileCopyName);
                        result.renamedFiles.push({ oldPath: newLinkPath, newPath: newFileCopyName });
                    }
                }
            }
            //if some other file has link to this file - try to copy file
            //if file already exist at new location - copy file with new name or do nothing
            else {
                let existFile = this.lh.getFileByPath(newLinkPath);
                if (!existFile) {
                    //copy
                    console.log(this.consoleLogPrefix + "copy file [from, to]: \n   " + path + "\n   " + newLinkPath);
                    result.movedAttachments.push({ oldPath: path, newPath: newLinkPath });
                    yield this.app.vault.copy(file, newLinkPath);
                }
                else {
                    if (deleteExistFiles) ;
                    else {
                        //copy with new name
                        let newFileCopyName = this.generateFileCopyName(newLinkPath);
                        console.log(this.consoleLogPrefix + "copy file with new name [from, to]: \n   " + path + "\n   " + newFileCopyName);
                        result.movedAttachments.push({ oldPath: file.path, newPath: newFileCopyName });
                        yield this.app.vault.copy(file, newFileCopyName);
                        result.renamedFiles.push({ oldPath: newLinkPath, newPath: newFileCopyName });
                    }
                }
            }
            return result;
        });
    }
    deleteEmptyFolders(dirName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(dirName))
                return;
            if (dirName.startsWith("./"))
                dirName = dirName.substring(2);
            let list = yield this.app.vault.adapter.list(dirName);
            for (let folder of list.folders) {
                yield this.deleteEmptyFolders(folder);
            }
            list = yield this.app.vault.adapter.list(dirName);
            if (list.files.length == 0 && list.folders.length == 0) {
                console.log(this.consoleLogPrefix + "delete empty folder: \n   " + dirName);
                if (yield this.app.vault.adapter.exists(dirName))
                    yield this.app.vault.adapter.rmdir(dirName, false);
            }
        });
    }
    deleteUnusedAttachmentsForCachedNote(notePath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(notePath))
                return;
            //!!! this can return undefined if note was just updated
            let embeds = (_a = this.app.metadataCache.getCache(notePath)) === null || _a === void 0 ? void 0 : _a.embeds;
            if (embeds) {
                for (let embed of embeds) {
                    let link = embed.link;
                    let fullPath = this.lh.getFullPathForLink(link, notePath);
                    let linkedNotes = this.lh.getCachedNotesThatHaveLinkToFile(fullPath);
                    if (linkedNotes.length == 0) {
                        let file = this.lh.getFileByLink(link, notePath, false);
                        if (file) {
                            try {
                                yield this.app.vault.trash(file, true);
                            }
                            catch (_b) { }
                        }
                    }
                }
            }
        });
    }
}

class ConsistentAttachmentsAndLinks extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.recentlyRenamedFiles = [];
        this.currentlyRenamingFiles = [];
        this.renamingIsActive = false;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addSettingTab(new SettingTab(this.app, this));
            this.registerEvent(this.app.vault.on('delete', (file) => this.handleDeletedFile(file)));
            this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.handleRenamedFile(file, oldPath)));
            this.addCommand({
                id: 'collect-all-attachments',
                name: 'Collect All Attachments',
                callback: () => this.collectAllAttachments()
            });
            this.addCommand({
                id: 'collect-attachments-current-note',
                name: 'Collect Attachments in Current Note',
                editorCallback: (editor, view) => this.collectAttachmentsCurrentNote(editor, view)
            });
            this.addCommand({
                id: 'delete-empty-folders',
                name: 'Delete Empty Folders',
                callback: () => this.deleteEmptyFolders()
            });
            this.addCommand({
                id: 'convert-all-link-paths-to-relative',
                name: 'Convert All Link Paths to Relative',
                callback: () => this.convertAllLinkPathsToRelative()
            });
            this.addCommand({
                id: 'convert-all-embed-paths-to-relative',
                name: 'Convert All Embed Paths to Relative',
                callback: () => this.convertAllEmbedsPathsToRelative()
            });
            this.addCommand({
                id: 'replace-all-wikilinks-with-markdown-links',
                name: 'Replace All Wiki Links with Markdown Links',
                callback: () => this.replaceAllWikilinksWithMarkdownLinks()
            });
            this.addCommand({
                id: 'reorganize-vault',
                name: 'Reorganize Vault',
                callback: () => this.reorganizeVault()
            });
            this.addCommand({
                id: 'check-consistency',
                name: 'Check Vault consistency',
                callback: () => this.checkConsistency()
            });
            // make regex from given strings 
            this.settings.ignoreFilesRegex = this.settings.ignoreFiles.map(val => RegExp(val));
            this.lh = new LinksHandler(this.app, "Consistent Attachments and Links: ", this.settings.ignoreFolders, this.settings.ignoreFilesRegex);
            this.fh = new FilesHandler(this.app, this.lh, "Consistent Attachments and Links: ", this.settings.ignoreFolders, this.settings.ignoreFilesRegex);
        });
    }
    isPathIgnored(path) {
        if (path.startsWith("./"))
            path = path.substring(2);
        for (let folder of this.settings.ignoreFolders) {
            if (path.startsWith(folder)) {
                return true;
            }
        }
        for (let fileRegex of this.settings.ignoreFilesRegex) {
            if (fileRegex.test(path)) {
                return true;
            }
        }
    }
    handleDeletedFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPathIgnored(file.path))
                return;
            let fileExt = file.path.substring(file.path.lastIndexOf("."));
            if (fileExt == ".md") {
                if (this.settings.deleteAttachmentsWithNote) {
                    yield this.fh.deleteUnusedAttachmentsForCachedNote(file.path);
                }
                //delete child folders (do not delete parent)
                if (this.settings.deleteEmptyFolders) {
                    if (yield this.app.vault.adapter.exists(path.dirname(file.path))) {
                        let list = yield this.app.vault.adapter.list(path.dirname(file.path));
                        for (let folder of list.folders) {
                            yield this.fh.deleteEmptyFolders(folder);
                        }
                    }
                }
            }
        });
    }
    handleRenamedFile(file, oldPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.recentlyRenamedFiles.push({ oldPath: oldPath, newPath: file.path });
            clearTimeout(this.timerId);
            this.timerId = setTimeout(() => { this.HandleRecentlyRenamedFiles(); }, 3000);
        });
    }
    HandleRecentlyRenamedFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.recentlyRenamedFiles || this.recentlyRenamedFiles.length == 0) //nothing to rename
                return;
            if (this.renamingIsActive) //already started
                return;
            this.renamingIsActive = true;
            this.currentlyRenamingFiles = this.recentlyRenamedFiles; //clear array for pushing new files async
            this.recentlyRenamedFiles = [];
            new obsidian.Notice("Fixing consistency for " + this.currentlyRenamingFiles.length + " renamed files" + "...");
            console.log("Consistent Attachments and Links:\nFixing consistency for " + this.currentlyRenamingFiles.length + " renamed files" + "...");
            try {
                for (let file of this.currentlyRenamingFiles) {
                    if (this.isPathIgnored(file.newPath) || this.isPathIgnored(file.oldPath))
                        return;
                    // await Utils.delay(10); //waiting for update vault
                    let result;
                    let fileExt = file.oldPath.substring(file.oldPath.lastIndexOf("."));
                    if (fileExt == ".md") {
                        // await Utils.delay(500);//waiting for update metadataCache
                        if ((path.dirname(file.oldPath) != path.dirname(file.newPath)) || (this.settings.attachmentsSubfolder.contains("${filename}"))) {
                            if (this.settings.moveAttachmentsWithNote) {
                                result = yield this.fh.moveCachedNoteAttachments(file.oldPath, file.newPath, this.settings.deleteExistFilesWhenMoveNote, this.settings.attachmentsSubfolder);
                                if (this.settings.updateLinks && result) {
                                    let changedFiles = result.renamedFiles.concat(result.movedAttachments);
                                    if (changedFiles.length > 0) {
                                        yield this.lh.updateChangedPathsInNote(file.newPath, changedFiles);
                                    }
                                }
                            }
                            if (this.settings.updateLinks) {
                                yield this.lh.updateInternalLinksInMovedNote(file.oldPath, file.newPath, this.settings.moveAttachmentsWithNote);
                            }
                            //delete child folders (do not delete parent)
                            if (this.settings.deleteEmptyFolders) {
                                if (yield this.app.vault.adapter.exists(path.dirname(file.oldPath))) {
                                    let list = yield this.app.vault.adapter.list(path.dirname(file.oldPath));
                                    for (let folder of list.folders) {
                                        yield this.fh.deleteEmptyFolders(folder);
                                    }
                                }
                            }
                        }
                    }
                    let updateAlts = this.settings.changeNoteBacklinksAlt && fileExt == ".md";
                    if (this.settings.updateLinks) {
                        yield this.lh.updateLinksToRenamedFile(file.oldPath, file.newPath, updateAlts, this.settings.useBuiltInObsidianLinkCaching);
                    }
                    if (result && result.movedAttachments && result.movedAttachments.length > 0) {
                        new obsidian.Notice("Moved " + result.movedAttachments.length + " attachment" + (result.movedAttachments.length > 1 ? "s" : ""));
                    }
                }
            }
            catch (e) {
                console.error("Consistent Attachments and Links: \n" + e);
            }
            new obsidian.Notice("Fixing Consistency Complete");
            console.log("Consistent Attachments and Links:\nFixing consistency complete");
            this.renamingIsActive = false;
            if (this.recentlyRenamedFiles && this.recentlyRenamedFiles.length > 0) {
                clearTimeout(this.timerId);
                this.timerId = setTimeout(() => { this.HandleRecentlyRenamedFiles(); }, 500);
            }
        });
    }
    collectAttachmentsCurrentNote(editor, view) {
        return __awaiter(this, void 0, void 0, function* () {
            let note = view.file;
            if (this.isPathIgnored(note.path)) {
                new obsidian.Notice("Note path is ignored");
                return;
            }
            let result = yield this.fh.collectAttachmentsForCachedNote(note.path, this.settings.attachmentsSubfolder, this.settings.deleteExistFilesWhenMoveNote);
            if (result && result.movedAttachments && result.movedAttachments.length > 0) {
                yield this.lh.updateChangedPathsInNote(note.path, result.movedAttachments);
            }
            if (result.movedAttachments.length == 0)
                new obsidian.Notice("No files found that need to be moved");
            else
                new obsidian.Notice("Moved " + result.movedAttachments.length + " attachment" + (result.movedAttachments.length > 1 ? "s" : ""));
        });
    }
    collectAllAttachments() {
        return __awaiter(this, void 0, void 0, function* () {
            let movedAttachmentsCount = 0;
            let processedNotesCount = 0;
            let notes = this.app.vault.getMarkdownFiles();
            if (notes) {
                for (let note of notes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    let result = yield this.fh.collectAttachmentsForCachedNote(note.path, this.settings.attachmentsSubfolder, this.settings.deleteExistFilesWhenMoveNote);
                    if (result && result.movedAttachments && result.movedAttachments.length > 0) {
                        yield this.lh.updateChangedPathsInNote(note.path, result.movedAttachments);
                        movedAttachmentsCount += result.movedAttachments.length;
                        processedNotesCount++;
                    }
                }
            }
            if (movedAttachmentsCount == 0)
                new obsidian.Notice("No files found that need to be moved");
            else
                new obsidian.Notice("Moved " + movedAttachmentsCount + " attachment" + (movedAttachmentsCount > 1 ? "s" : "")
                    + " from " + processedNotesCount + " note" + (processedNotesCount > 1 ? "s" : ""));
        });
    }
    convertAllEmbedsPathsToRelative() {
        return __awaiter(this, void 0, void 0, function* () {
            let changedEmbedCount = 0;
            let processedNotesCount = 0;
            let notes = this.app.vault.getMarkdownFiles();
            if (notes) {
                for (let note of notes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    let result = yield this.lh.convertAllNoteEmbedsPathsToRelative(note.path);
                    if (result && result.length > 0) {
                        changedEmbedCount += result.length;
                        processedNotesCount++;
                    }
                }
            }
            if (changedEmbedCount == 0)
                new obsidian.Notice("No embeds found that need to be converted");
            else
                new obsidian.Notice("Converted " + changedEmbedCount + " embed" + (changedEmbedCount > 1 ? "s" : "")
                    + " from " + processedNotesCount + " note" + (processedNotesCount > 1 ? "s" : ""));
        });
    }
    convertAllLinkPathsToRelative() {
        return __awaiter(this, void 0, void 0, function* () {
            let changedLinksCount = 0;
            let processedNotesCount = 0;
            let notes = this.app.vault.getMarkdownFiles();
            if (notes) {
                for (let note of notes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    let result = yield this.lh.convertAllNoteLinksPathsToRelative(note.path);
                    if (result && result.length > 0) {
                        changedLinksCount += result.length;
                        processedNotesCount++;
                    }
                }
            }
            if (changedLinksCount == 0)
                new obsidian.Notice("No links found that need to be converted");
            else
                new obsidian.Notice("Converted " + changedLinksCount + " link" + (changedLinksCount > 1 ? "s" : "")
                    + " from " + processedNotesCount + " note" + (processedNotesCount > 1 ? "s" : ""));
        });
    }
    replaceAllWikilinksWithMarkdownLinks() {
        return __awaiter(this, void 0, void 0, function* () {
            let changedLinksCount = 0;
            let processedNotesCount = 0;
            let notes = this.app.vault.getMarkdownFiles();
            if (notes) {
                for (let note of notes) {
                    if (this.isPathIgnored(note.path))
                        continue;
                    let result = yield this.lh.replaceAllNoteWikilinksWithMarkdownLinks(note.path);
                    if (result && (result.links.length > 0 || result.embeds.length > 0)) {
                        changedLinksCount += result.links.length;
                        changedLinksCount += result.embeds.length;
                        processedNotesCount++;
                    }
                }
            }
            if (changedLinksCount == 0)
                new obsidian.Notice("No wiki links found that need to be replaced");
            else
                new obsidian.Notice("Replaced " + changedLinksCount + " wikilink" + (changedLinksCount > 1 ? "s" : "")
                    + " from " + processedNotesCount + " note" + (processedNotesCount > 1 ? "s" : ""));
        });
    }
    deleteEmptyFolders() {
        this.fh.deleteEmptyFolders("/");
    }
    checkConsistency() {
        return __awaiter(this, void 0, void 0, function* () {
            let badLinks = this.lh.getAllBadLinks();
            let badSectionLinks = yield this.lh.getAllBadSectionLinks();
            let badEmbeds = this.lh.getAllBadEmbeds();
            let wikiLinks = this.lh.getAllWikiLinks();
            let wikiEmbeds = this.lh.getAllWikiEmbeds();
            let text = "";
            let badLinksCount = Object.keys(badLinks).length;
            let badEmbedsCount = Object.keys(badEmbeds).length;
            let badSectionLinksCount = Object.keys(badSectionLinks).length;
            let wikiLinksCount = Object.keys(wikiLinks).length;
            let wikiEmbedsCount = Object.keys(wikiEmbeds).length;
            if (badLinksCount > 0) {
                text += "# Bad links (" + badLinksCount + " files)\n";
                for (let note in badLinks) {
                    text += "[" + note + "](" + Utils.normalizePathForLink(note) + "): " + "\n";
                    for (let link of badLinks[note]) {
                        text += "- (line " + (link.position.start.line + 1) + "): `" + link.link + "`\n";
                    }
                    text += "\n\n";
                }
            }
            else {
                text += "# Bad links \n";
                text += "No problems found\n\n";
            }
            if (badSectionLinksCount > 0) {
                text += "\n\n# Bad note link sections (" + badSectionLinksCount + " files)\n";
                for (let note in badSectionLinks) {
                    text += "[" + note + "](" + Utils.normalizePathForLink(note) + "): " + "\n";
                    for (let link of badSectionLinks[note]) {
                        let li = this.lh.splitLinkToPathAndSection(link.link);
                        let section = Utils.normalizeLinkSection(li.section);
                        text += "- (line " + (link.position.start.line + 1) + "): `" + li.link + "#" + section + "`\n";
                    }
                    text += "\n\n";
                }
            }
            else {
                text += "\n\n# Bad note link sections\n";
                text += "No problems found\n\n";
            }
            if (badEmbedsCount > 0) {
                text += "\n\n# Bad embeds (" + badEmbedsCount + " files)\n";
                for (let note in badEmbeds) {
                    text += "[" + note + "](" + Utils.normalizePathForLink(note) + "): " + "\n";
                    for (let link of badEmbeds[note]) {
                        text += "- (line " + (link.position.start.line + 1) + "): `" + link.link + "`\n";
                    }
                    text += "\n\n";
                }
            }
            else {
                text += "\n\n# Bad embeds \n";
                text += "No problems found\n\n";
            }
            if (wikiLinksCount > 0) {
                text += "# Wiki links (" + wikiLinksCount + " files)\n";
                for (let note in wikiLinks) {
                    text += "[" + note + "](" + Utils.normalizePathForLink(note) + "): " + "\n";
                    for (let link of wikiLinks[note]) {
                        text += "- (line " + (link.position.start.line + 1) + "): `" + link.original + "`\n";
                    }
                    text += "\n\n";
                }
            }
            else {
                text += "# Wiki links \n";
                text += "No problems found\n\n";
            }
            if (wikiEmbedsCount > 0) {
                text += "\n\n# Wiki embeds (" + wikiEmbedsCount + " files)\n";
                for (let note in wikiEmbeds) {
                    text += "[" + note + "](" + Utils.normalizePathForLink(note) + "): " + "\n";
                    for (let link of wikiEmbeds[note]) {
                        text += "- (line " + (link.position.start.line + 1) + "): `" + link.original + "`\n";
                    }
                    text += "\n\n";
                }
            }
            else {
                text += "\n\n# Wiki embeds \n";
                text += "No problems found\n\n";
            }
            let notePath = this.settings.consistencyReportFile;
            yield this.app.vault.adapter.write(notePath, text);
            let fileOpened = false;
            this.app.workspace.iterateAllLeaves(leaf => {
                if (leaf.getDisplayText() != "" && notePath.startsWith(leaf.getDisplayText())) {
                    fileOpened = true;
                }
            });
            if (!fileOpened)
                this.app.workspace.openLinkText(notePath, "/", false);
        });
    }
    reorganizeVault() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.replaceAllWikilinksWithMarkdownLinks();
            yield this.convertAllEmbedsPathsToRelative();
            yield this.convertAllLinkPathsToRelative();
            //- Rename all attachments (using Unique attachments, optional)
            yield this.collectAllAttachments();
            yield this.deleteEmptyFolders();
            new obsidian.Notice("Reorganization of the vault completed");
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
            this.lh = new LinksHandler(this.app, "Consistent Attachments and Links: ", this.settings.ignoreFolders, this.settings.ignoreFilesRegex);
            this.fh = new FilesHandler(this.app, this.lh, "Consistent Attachments and Links: ", this.settings.ignoreFolders, this.settings.ignoreFilesRegex);
        });
    }
}

module.exports = ConsistentAttachmentsAndLinks;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9zZXR0aW5ncy50cyIsInNyYy91dGlscy50cyIsInNyYy9wYXRoLnRzIiwic3JjL2xpbmtzLWhhbmRsZXIudHMiLCJzcmMvZmlsZXMtaGFuZGxlci50cyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfSk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuIiwiaW1wb3J0IHsgQXBwLCBub3JtYWxpemVQYXRoLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IENvbnNpc3RlbnRBdHRhY2htZW50c0FuZExpbmtzIGZyb20gJy4vbWFpbic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBsdWdpblNldHRpbmdzIHtcclxuICAgIG1vdmVBdHRhY2htZW50c1dpdGhOb3RlOiBib29sZWFuO1xyXG4gICAgZGVsZXRlQXR0YWNobWVudHNXaXRoTm90ZTogYm9vbGVhbjtcclxuICAgIHVwZGF0ZUxpbmtzOiBib29sZWFuO1xyXG4gICAgZGVsZXRlRW1wdHlGb2xkZXJzOiBib29sZWFuO1xyXG4gICAgZGVsZXRlRXhpc3RGaWxlc1doZW5Nb3ZlTm90ZTogYm9vbGVhbjtcclxuICAgIGNoYW5nZU5vdGVCYWNrbGlua3NBbHQ6IGJvb2xlYW47XHJcbiAgICBpZ25vcmVGb2xkZXJzOiBzdHJpbmdbXTtcclxuICAgIGlnbm9yZUZpbGVzOiBzdHJpbmdbXTtcclxuICAgIGlnbm9yZUZpbGVzUmVnZXg6IFJlZ0V4cFtdO1xyXG4gICAgYXR0YWNobWVudHNTdWJmb2xkZXI6IHN0cmluZztcclxuICAgIGNvbnNpc3RlbmN5UmVwb3J0RmlsZTogc3RyaW5nO1xyXG4gICAgdXNlQnVpbHRJbk9ic2lkaWFuTGlua0NhY2hpbmc6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBQbHVnaW5TZXR0aW5ncyA9IHtcclxuICAgIG1vdmVBdHRhY2htZW50c1dpdGhOb3RlOiB0cnVlLFxyXG4gICAgZGVsZXRlQXR0YWNobWVudHNXaXRoTm90ZTogdHJ1ZSxcclxuICAgIHVwZGF0ZUxpbmtzOiB0cnVlLFxyXG4gICAgZGVsZXRlRW1wdHlGb2xkZXJzOiB0cnVlLFxyXG4gICAgZGVsZXRlRXhpc3RGaWxlc1doZW5Nb3ZlTm90ZTogdHJ1ZSxcclxuICAgIGNoYW5nZU5vdGVCYWNrbGlua3NBbHQ6IGZhbHNlLFxyXG4gICAgaWdub3JlRm9sZGVyczogW1wiLmdpdC9cIiwgXCIub2JzaWRpYW4vXCJdLFxyXG4gICAgaWdub3JlRmlsZXM6IFtcImNvbnNpc3RlbmN5XFxcXC1yZXBvcnRcXFxcLm1kXCJdLFxyXG4gICAgaWdub3JlRmlsZXNSZWdleDogWy9jb25zaXN0ZW5jeVxcLXJlcG9ydFxcLm1kL10sXHJcbiAgICBhdHRhY2htZW50c1N1YmZvbGRlcjogXCJcIixcclxuICAgIGNvbnNpc3RlbmN5UmVwb3J0RmlsZTogXCJjb25zaXN0ZW5jeS1yZXBvcnQubWRcIixcclxuICAgIHVzZUJ1aWx0SW5PYnNpZGlhbkxpbmtDYWNoaW5nOiBmYWxzZSxcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuICAgIHBsdWdpbjogQ29uc2lzdGVudEF0dGFjaG1lbnRzQW5kTGlua3M7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQ29uc2lzdGVudEF0dGFjaG1lbnRzQW5kTGlua3MpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBsZXQgeyBjb250YWluZXJFbCB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiAnQ29uc2lzdGVudCBhdHRhY2htZW50cyBhbmQgbGlua3MgLSBTZXR0aW5ncycgfSk7XHJcblxyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoJ01vdmUgQXR0YWNobWVudHMgd2l0aCBOb3RlJylcclxuICAgICAgICAgICAgLnNldERlc2MoJ0F1dG9tYXRpY2FsbHkgbW92ZSBhdHRhY2htZW50cyB3aGVuIGEgbm90ZSBpcyByZWxvY2F0ZWQuIFRoaXMgaW5jbHVkZXMgYXR0YWNobWVudHMgbG9jYXRlZCBpbiB0aGUgc2FtZSBmb2xkZXIgb3IgYW55IG9mIGl0cyBzdWJmb2xkZXJzLicpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoY2IgPT4gY2Iub25DaGFuZ2UodmFsdWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubW92ZUF0dGFjaG1lbnRzV2l0aE5vdGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICkuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubW92ZUF0dGFjaG1lbnRzV2l0aE5vdGUpKTtcclxuXHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSgnRGVsZXRlIFVudXNlZCBBdHRhY2htZW50cyB3aXRoIE5vdGUnKVxyXG4gICAgICAgICAgICAuc2V0RGVzYygnQXV0b21hdGljYWxseSByZW1vdmUgYXR0YWNobWVudHMgdGhhdCBhcmUgbm8gbG9uZ2VyIHJlZmVyZW5jZWQgaW4gb3RoZXIgbm90ZXMgd2hlbiB0aGUgbm90ZSBpcyBkZWxldGVkLicpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoY2IgPT4gY2Iub25DaGFuZ2UodmFsdWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlQXR0YWNobWVudHNXaXRoTm90ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVBdHRhY2htZW50c1dpdGhOb3RlKSk7XHJcblxyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoJ1VwZGF0ZSBMaW5rcycpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKCdBdXRvbWF0aWNhbGx5IHVwZGF0ZSBsaW5rcyB0byBhdHRhY2htZW50cyBhbmQgb3RoZXIgbm90ZXMgd2hlbiBtb3Zpbmcgbm90ZXMgb3IgYXR0YWNobWVudHMuJylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZShjYiA9PiBjYi5vbkNoYW5nZSh2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy51cGRhdGVMaW5rcyA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy51cGRhdGVMaW5rcykpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoJ0RlbGV0ZSBFbXB0eSBGb2xkZXJzJylcclxuICAgICAgICAgICAgLnNldERlc2MoJ0F1dG9tYXRpY2FsbHkgcmVtb3ZlIGVtcHR5IGZvbGRlcnMgYWZ0ZXIgbW92aW5nIG5vdGVzIHdpdGggYXR0YWNobWVudHMuJylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZShjYiA9PiBjYi5vbkNoYW5nZSh2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVFbXB0eUZvbGRlcnMgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICkuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlRW1wdHlGb2xkZXJzKSk7XHJcblxyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoJ0RlbGV0ZSBEdXBsaWNhdGUgQXR0YWNobWVudHMgb24gTm90ZSBNb3ZlJylcclxuICAgICAgICAgICAgLnNldERlc2MoJ0F1dG9tYXRpY2FsbHkgZGVsZXRlIGF0dGFjaG1lbnRzIHdoZW4gbW92aW5nIGEgbm90ZSBpZiBhIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lIGV4aXN0cyBpbiB0aGUgZGVzdGluYXRpb24gZm9sZGVyLiBJZiBkaXNhYmxlZCwgdGhlIGZpbGUgd2lsbCBiZSByZW5hbWVkIGFuZCBtb3ZlZC4nKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKGNiID0+IGNiLm9uQ2hhbmdlKHZhbHVlID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlbGV0ZUV4aXN0RmlsZXNXaGVuTW92ZU5vdGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICkuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlRXhpc3RGaWxlc1doZW5Nb3ZlTm90ZSkpO1xyXG5cclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKCdVcGRhdGUgQmFja2xpbmsgVGV4dCBvbiBOb3RlIFJlbmFtZScpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKCdXaGVuIGEgbm90ZSBpcyByZW5hbWVkLCBpdHMgbGlua2VkIHJlZmVyZW5jZXMgYXJlIGF1dG9tYXRpY2FsbHkgdXBkYXRlZC4gSWYgdGhpcyBvcHRpb24gaXMgZW5hYmxlZCwgdGhlIHRleHQgb2YgYmFja2xpbmtzIHRvIHRoaXMgbm90ZSB3aWxsIGFsc28gYmUgbW9kaWZpZWQuJylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZShjYiA9PiBjYi5vbkNoYW5nZSh2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jaGFuZ2VOb3RlQmFja2xpbmtzQWx0ID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNoYW5nZU5vdGVCYWNrbGlua3NBbHQpKTtcclxuXHJcblxyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJJZ25vcmUgRm9sZGVyc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIlNwZWNpZnkgYSBsaXN0IG9mIGZvbGRlcnMgdG8gaWdub3JlLiBFbnRlciBlYWNoIGZvbGRlciBvbiBhIG5ldyBsaW5lLlwiKVxyXG4gICAgICAgICAgICAuYWRkVGV4dEFyZWEoY2IgPT4gY2JcclxuICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IC5naXQsIC5vYnNpZGlhblwiKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmlnbm9yZUZvbGRlcnMuam9pbihcIlxcblwiKSlcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aHMgPSB2YWx1ZS50cmltKCkuc3BsaXQoXCJcXG5cIikubWFwKHZhbHVlID0+IHRoaXMuZ2V0Tm9ybWFsaXplZFBhdGgodmFsdWUpICsgXCIvXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmlnbm9yZUZvbGRlcnMgPSBwYXRocztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiSWdub3JlIEZpbGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiU3BlY2lmeSBhIGxpc3Qgb2YgZmlsZXMgdG8gaWdub3JlLiBFbnRlciBlYWNoIGZpbGUgb24gYSBuZXcgbGluZS5cIilcclxuICAgICAgICAgICAgLmFkZFRleHRBcmVhKGNiID0+IGNiXHJcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJFeGFtcGxlOiBjb25zaXN0YW50LXJlcG9ydC5tZFwiKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmlnbm9yZUZpbGVzLmpvaW4oXCJcXG5cIikpXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGhzID0gdmFsdWUudHJpbSgpLnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmlnbm9yZUZpbGVzID0gcGF0aHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaWdub3JlRmlsZXNSZWdleCA9IHBhdGhzLm1hcChmaWxlID0+IFJlZ0V4cChmaWxlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkF0dGFjaG1lbnQgU3ViZm9sZGVyXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiU3BlY2lmeSB0aGUgc3ViZm9sZGVyIHdpdGhpbiB0aGUgbm90ZSBmb2xkZXIgdG8gY29sbGVjdCBhdHRhY2htZW50cyBpbnRvIHdoZW4gdXNpbmcgdGhlIFxcXCJDb2xsZWN0IEFsbCBBdHRhY2htZW50c1xcXCIgaG90a2V5LiBMZWF2ZSBlbXB0eSB0byBjb2xsZWN0IGF0dGFjaG1lbnRzIGRpcmVjdGx5IGludG8gdGhlIG5vdGUgZm9sZGVyLiBZb3UgY2FuIHVzZSAke2ZpbGVuYW1lfSBhcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgY3VycmVudCBub3RlIG5hbWUuXCIpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KGNiID0+IGNiXHJcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJFeGFtcGxlOiBfYXR0YWNobWVudHNcIilcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdHRhY2htZW50c1N1YmZvbGRlcilcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdHRhY2htZW50c1N1YmZvbGRlciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiQ29uc2lzdGVuY3kgUmVwb3J0IEZpbGVuYW1lXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiU3BlY2lmeSB0aGUgbmFtZSBvZiB0aGUgZmlsZSBmb3IgdGhlIGNvbnNpc3RlbmN5IHJlcG9ydC5cIilcclxuICAgICAgICAgICAgLmFkZFRleHQoY2IgPT4gY2JcclxuICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGNvbnNpc3RlbmN5LXJlcG9ydC5tZFwiKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbnNpc3RlbmN5UmVwb3J0RmlsZSlcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb25zaXN0ZW5jeVJlcG9ydEZpbGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVYUEVSSU1FTlRBTDogVXNlIEJ1aWx0LWluIE9ic2lkaWFuIExpbmsgQ2FjaGluZyBmb3IgTW92ZWQgTm90ZXNcIilcclxuICAgICAgICAgICAgLnNldERlc2MoXCJFbmFibGUgdGhpcyBvcHRpb24gdG8gdXNlIHRoZSBleHBlcmltZW50YWwgYnVpbHQtaW4gT2JzaWRpYW4gbGluayBjYWNoaW5nIGZvciBwcm9jZXNzaW5nIG1vdmVkIG5vdGVzLiBUdXJuIGl0IG9mZiBpZiB0aGUgcGx1Z2luIG1pc2JlaGF2ZXMuXCIpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoY2IgPT4gY2Iub25DaGFuZ2UodmFsdWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlQnVpbHRJbk9ic2lkaWFuTGlua0NhY2hpbmcgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICkuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlQnVpbHRJbk9ic2lkaWFuTGlua0NhY2hpbmcpKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROb3JtYWxpemVkUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA9PSAwID8gcGF0aCA6IG5vcm1hbGl6ZVBhdGgocGF0aCk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY2xhc3MgVXRpbHMge1xyXG5cclxuXHRzdGF0aWMgYXN5bmMgZGVsYXkobXM6IG51bWJlcikge1xyXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xyXG5cdH1cclxuXHJcblxyXG5cdHN0YXRpYyBub3JtYWxpemVQYXRoRm9yRmlsZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9naSwgXCIvXCIpOyAvL3JlcGxhY2UgXFwgdG8gL1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvJTIwL2dpLCBcIiBcIik7IC8vcmVwbGFjZSAlMjAgdG8gc3BhY2VcclxuXHRcdHJldHVybiBwYXRoO1xyXG5cdH1cclxuXHJcblxyXG5cdHN0YXRpYyBub3JtYWxpemVQYXRoRm9yTGluayhwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9naSwgXCIvXCIpOyAvL3JlcGxhY2UgXFwgdG8gL1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvIC9naSwgXCIlMjBcIik7IC8vcmVwbGFjZSBzcGFjZSB0byAlMjBcclxuXHRcdHJldHVybiBwYXRoO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIG5vcm1hbGl6ZUxpbmtTZWN0aW9uKHNlY3Rpb246IHN0cmluZyk6IHN0cmluZyB7XHJcblx0XHRzZWN0aW9uID0gZGVjb2RlVVJJKHNlY3Rpb24pO1xyXG5cdFx0cmV0dXJuIHNlY3Rpb247XHJcblx0fVxyXG59IiwiZXhwb3J0IGNsYXNzIHBhdGgge1xyXG4gICAgc3RhdGljIGpvaW4oLi4ucGFydHM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiAnLic7XHJcbiAgICAgICAgdmFyIGpvaW5lZDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoYXJnLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICBqb2luZWQgPSBhcmc7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgam9pbmVkICs9ICcvJyArIGFyZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiAnLic7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXhOb3JtYWxpemUoam9pbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZGlybmFtZShwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XHJcbiAgICAgICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgICAgdmFyIGhhc1Jvb3QgPSBjb2RlID09PSA0NyAvKi8qLztcclxuICAgICAgICB2YXIgZW5kID0gLTE7XHJcbiAgICAgICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcclxuICAgICAgICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gaGFzUm9vdCA/ICcvJyA6ICcuJztcclxuICAgICAgICBpZiAoaGFzUm9vdCAmJiBlbmQgPT09IDEpIHJldHVybiAnLy8nO1xyXG4gICAgICAgIHJldHVybiBwYXRoLnNsaWNlKDAsIGVuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgZXh0Pzogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBleHQgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImV4dFwiIGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnKTtcclxuXHJcbiAgICAgICAgdmFyIHN0YXJ0ID0gMDtcclxuICAgICAgICB2YXIgZW5kID0gLTE7XHJcbiAgICAgICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XHJcbiAgICAgICAgdmFyIGk7XHJcblxyXG4gICAgICAgIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiBleHQubGVuZ3RoID4gMCAmJiBleHQubGVuZ3RoIDw9IHBhdGgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChleHQubGVuZ3RoID09PSBwYXRoLmxlbmd0aCAmJiBleHQgPT09IHBhdGgpIHJldHVybiAnJztcclxuICAgICAgICAgICAgdmFyIGV4dElkeCA9IGV4dC5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB2YXIgZmlyc3ROb25TbGFzaEVuZCA9IC0xO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3ROb25TbGFzaEVuZCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIGl0IGlmIHRoZSBleHRlbnNpb24gZW5kcyB1cCBub3QgbWF0Y2hpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4dElkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBtYXRjaCB0aGUgZXhwbGljaXQgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCB0aGUgZXh0ZW5zaW9uLCBzbyBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXIgcGF0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHRlbnNpb24gZG9lcyBub3QgbWF0Y2gsIHNvIG91ciByZXN1bHQgaXMgdGhlIGVudGlyZSBwYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb21wb25lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dElkeCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gZmlyc3ROb25TbGFzaEVuZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIGVuZCA9IGZpcnN0Tm9uU2xhc2hFbmQ7IGVsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhdGggY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZXh0bmFtZShwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB2YXIgc3RhcnREb3QgPSAtMTtcclxuICAgICAgICB2YXIgc3RhcnRQYXJ0ID0gMDtcclxuICAgICAgICB2YXIgZW5kID0gLTE7XHJcbiAgICAgICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XHJcbiAgICAgICAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxyXG4gICAgICAgIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXHJcbiAgICAgICAgdmFyIHByZURvdFN0YXRlID0gMDtcclxuICAgICAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxyXG4gICAgICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVuc2lvblxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBlbmQgPSBpICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBzdGFydERvdCA9IGk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSlcclxuICAgICAgICAgICAgICAgICAgICBwcmVEb3RTdGF0ZSA9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxyXG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cclxuICAgICAgICAgICAgICAgIHByZURvdFN0YXRlID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGFydERvdCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fFxyXG4gICAgICAgICAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxyXG4gICAgICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxyXG4gICAgICAgICAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXHJcbiAgICAgICAgICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBzdGF0aWMgcGFyc2UocGF0aDogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIHZhciByZXQgPSB7IHJvb3Q6ICcnLCBkaXI6ICcnLCBiYXNlOiAnJywgZXh0OiAnJywgbmFtZTogJycgfTtcclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiByZXQ7XHJcbiAgICAgICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgICAgdmFyIGlzQWJzb2x1dGUgPSBjb2RlID09PSA0NyAvKi8qLztcclxuICAgICAgICB2YXIgc3RhcnQ7XHJcbiAgICAgICAgaWYgKGlzQWJzb2x1dGUpIHtcclxuICAgICAgICAgICAgcmV0LnJvb3QgPSAnLyc7XHJcbiAgICAgICAgICAgIHN0YXJ0ID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdGFydCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBzdGFydERvdCA9IC0xO1xyXG4gICAgICAgIHZhciBzdGFydFBhcnQgPSAwO1xyXG4gICAgICAgIHZhciBlbmQgPSAtMTtcclxuICAgICAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcclxuICAgICAgICB2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgICAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxyXG4gICAgICAgIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXHJcbiAgICAgICAgdmFyIHByZURvdFN0YXRlID0gMDtcclxuXHJcbiAgICAgICAgLy8gR2V0IG5vbi1kaXIgaW5mb1xyXG4gICAgICAgIGZvciAoOyBpID49IHN0YXJ0OyAtLWkpIHtcclxuICAgICAgICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxyXG4gICAgICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVuc2lvblxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBlbmQgPSBpICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpOyBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSkgcHJlRG90U3RhdGUgPSAxO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcclxuICAgICAgICAgICAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcclxuICAgICAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcclxuICAgICAgICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcclxuICAgICAgICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xyXG4gICAgICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xyXG4gICAgICAgICAgICBpZiAoZW5kICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0UGFydCA9PT0gMCAmJiBpc0Fic29sdXRlKSByZXQuYmFzZSA9IHJldC5uYW1lID0gcGF0aC5zbGljZSgxLCBlbmQpOyBlbHNlIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIHN0YXJ0RG90KTtcclxuICAgICAgICAgICAgICAgIHJldC5iYXNlID0gcGF0aC5zbGljZSgxLCBlbmQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgc3RhcnREb3QpO1xyXG4gICAgICAgICAgICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGFydFBhcnQgPiAwKSByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTsgZWxzZSBpZiAoaXNBYnNvbHV0ZSkgcmV0LmRpciA9ICcvJztcclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcbiAgICBzdGF0aWMgcG9zaXhOb3JtYWxpemUocGF0aDogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcclxuXHJcbiAgICAgICAgdmFyIGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IDQ3IC8qLyovO1xyXG4gICAgICAgIHZhciB0cmFpbGluZ1NlcGFyYXRvciA9IHBhdGguY2hhckNvZGVBdChwYXRoLmxlbmd0aCAtIDEpID09PSA0NyAvKi8qLztcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXHJcbiAgICAgICAgcGF0aCA9IHRoaXMubm9ybWFsaXplU3RyaW5nUG9zaXgocGF0aCwgIWlzQWJzb2x1dGUpO1xyXG5cclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDAgJiYgIWlzQWJzb2x1dGUpIHBhdGggPSAnLic7XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gMCAmJiB0cmFpbGluZ1NlcGFyYXRvcikgcGF0aCArPSAnLyc7XHJcblxyXG4gICAgICAgIGlmIChpc0Fic29sdXRlKSByZXR1cm4gJy8nICsgcGF0aDtcclxuICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbm9ybWFsaXplU3RyaW5nUG9zaXgocGF0aDogc3RyaW5nLCBhbGxvd0Fib3ZlUm9vdDogYm9vbGVhbikge1xyXG4gICAgICAgIHZhciByZXMgPSAnJztcclxuICAgICAgICB2YXIgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xyXG4gICAgICAgIHZhciBsYXN0U2xhc2ggPSAtMTtcclxuICAgICAgICB2YXIgZG90cyA9IDA7XHJcbiAgICAgICAgdmFyIGNvZGU7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gcGF0aC5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAoaSA8IHBhdGgubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY29kZSA9PT0gNDcgLyovKi8pXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY29kZSA9IDQ3IC8qLyovO1xyXG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcclxuICAgICAgICAgICAgICAgIGlmIChsYXN0U2xhc2ggPT09IGkgLSAxIHx8IGRvdHMgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOT09QXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RTbGFzaCAhPT0gaSAtIDEgJiYgZG90cyA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMubGVuZ3RoIDwgMiB8fCBsYXN0U2VnbWVudExlbmd0aCAhPT0gMiB8fCByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMSkgIT09IDQ2IC8qLiovIHx8IHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gNDYgLyouKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFNsYXNoSW5kZXggPSByZXMubGFzdEluZGV4T2YoJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCAhPT0gcmVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLnNsaWNlKDAsIGxhc3RTbGFzaEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSByZXMubGVuZ3RoIC0gMSAtIHJlcy5sYXN0SW5kZXhPZignLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvdHMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG90cyA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9ICcvLi4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSAnLi4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSAnLycgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcclxuICAgICAgICAgICAgICAgIGRvdHMgPSAwO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDQ2IC8qLiovICYmIGRvdHMgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICArK2RvdHM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb3RzID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcG9zaXhSZXNvbHZlKC4uLmFyZ3M6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgdmFyIHJlc29sdmVkUGF0aCA9ICcnO1xyXG4gICAgICAgIHZhciByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGN3ZDtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGFyZ3MubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRoO1xyXG4gICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgcGF0aCA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGN3ZCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIGN3ZCA9IHByb2Nlc3MuY3dkKCk7XHJcbiAgICAgICAgICAgICAgICBwYXRoID0gY3dkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXHJcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XHJcbiAgICAgICAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IDQ3IC8qLyovO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxyXG4gICAgICAgIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxyXG5cclxuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcclxuICAgICAgICByZXNvbHZlZFBhdGggPSB0aGlzLm5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHJlc29sdmVkUGF0aCwgIXJlc29sdmVkQWJzb2x1dGUpO1xyXG5cclxuICAgICAgICBpZiAocmVzb2x2ZWRBYnNvbHV0ZSkge1xyXG4gICAgICAgICAgICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJy8nICsgcmVzb2x2ZWRQYXRoO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJy8nO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gJy4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVsYXRpdmUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuICcnO1xyXG5cclxuICAgICAgICBmcm9tID0gdGhpcy5wb3NpeFJlc29sdmUoZnJvbSk7XHJcbiAgICAgICAgdG8gPSB0aGlzLnBvc2l4UmVzb2x2ZSh0byk7XHJcblxyXG4gICAgICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuICcnO1xyXG5cclxuICAgICAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXHJcbiAgICAgICAgdmFyIGZyb21TdGFydCA9IDE7XHJcbiAgICAgICAgZm9yICg7IGZyb21TdGFydCA8IGZyb20ubGVuZ3RoOyArK2Zyb21TdGFydCkge1xyXG4gICAgICAgICAgICBpZiAoZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCkgIT09IDQ3IC8qLyovKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBmcm9tRW5kID0gZnJvbS5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGZyb21MZW4gPSBmcm9tRW5kIC0gZnJvbVN0YXJ0O1xyXG5cclxuICAgICAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXHJcbiAgICAgICAgdmFyIHRvU3RhcnQgPSAxO1xyXG4gICAgICAgIGZvciAoOyB0b1N0YXJ0IDwgdG8ubGVuZ3RoOyArK3RvU3RhcnQpIHtcclxuICAgICAgICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgIT09IDQ3IC8qLyovKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0b0VuZCA9IHRvLmxlbmd0aDtcclxuICAgICAgICB2YXIgdG9MZW4gPSB0b0VuZCAtIHRvU3RhcnQ7XHJcblxyXG4gICAgICAgIC8vIENvbXBhcmUgcGF0aHMgdG8gZmluZCB0aGUgbG9uZ2VzdCBjb21tb24gcGF0aCBmcm9tIHJvb3RcclxuICAgICAgICB2YXIgbGVuZ3RoID0gZnJvbUxlbiA8IHRvTGVuID8gZnJvbUxlbiA6IHRvTGVuO1xyXG4gICAgICAgIHZhciBsYXN0Q29tbW9uU2VwID0gLTE7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIGZvciAoOyBpIDw9IGxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0by5jaGFyQ29kZUF0KHRvU3RhcnQgKyBpKSA9PT0gNDcgLyovKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYGZyb21gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGB0b2AuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vL2Jhcic7IHRvPScvZm9vL2Jhci9iYXonXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0ICsgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIHJvb3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy8nOyB0bz0nL2ZvbydcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQgKyBpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZyb21MZW4gPiBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpID09PSA0NyAvKi8qLykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28vYmFyL2Jheic7IHRvPScvZm9vL2JhcidcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIHJvb3QuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vJzsgdG89Jy8nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RDb21tb25TZXAgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBmcm9tQ29kZSA9IGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKTtcclxuICAgICAgICAgICAgdmFyIHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xyXG4gICAgICAgICAgICBpZiAoZnJvbUNvZGUgIT09IHRvQ29kZSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gNDcgLyovKi8pXHJcbiAgICAgICAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gaTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBvdXQgPSAnJztcclxuICAgICAgICAvLyBHZW5lcmF0ZSB0aGUgcmVsYXRpdmUgcGF0aCBiYXNlZCBvbiB0aGUgcGF0aCBkaWZmZXJlbmNlIGJldHdlZW4gYHRvYFxyXG4gICAgICAgIC8vIGFuZCBgZnJvbWBcclxuICAgICAgICBmb3IgKGkgPSBmcm9tU3RhcnQgKyBsYXN0Q29tbW9uU2VwICsgMTsgaSA8PSBmcm9tRW5kOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG91dC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ICs9ICcuLic7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ICs9ICcvLi4nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBMYXN0bHksIGFwcGVuZCB0aGUgcmVzdCBvZiB0aGUgZGVzdGluYXRpb24gKGB0b2ApIHBhdGggdGhhdCBjb21lcyBhZnRlclxyXG4gICAgICAgIC8vIHRoZSBjb21tb24gcGF0aCBwYXJ0c1xyXG4gICAgICAgIGlmIChvdXQubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgcmV0dXJuIG91dCArIHRvLnNsaWNlKHRvU3RhcnQgKyBsYXN0Q29tbW9uU2VwKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdG9TdGFydCArPSBsYXN0Q29tbW9uU2VwO1xyXG4gICAgICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSA9PT0gNDcgLyovKi8pXHJcbiAgICAgICAgICAgICAgICArK3RvU3RhcnQ7XHJcbiAgICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBBcHAsIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBFbWJlZENhY2hlLCBMaW5rQ2FjaGUsIFBvcyB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0IHsgcGF0aCB9IGZyb20gJy4vcGF0aCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhDaGFuZ2VJbmZvIHtcclxuXHRvbGRQYXRoOiBzdHJpbmcsXHJcblx0bmV3UGF0aDogc3RyaW5nLFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEVtYmVkQ2hhbmdlSW5mbyB7XHJcblx0b2xkOiBFbWJlZENhY2hlLFxyXG5cdG5ld0xpbms6IHN0cmluZyxcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMaW5rQ2hhbmdlSW5mbyB7XHJcblx0b2xkOiBMaW5rQ2FjaGUsXHJcblx0bmV3TGluazogc3RyaW5nLFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIExpbmtzQW5kRW1iZWRzQ2hhbmdlZEluZm8ge1xyXG5cdGVtYmVkczogRW1iZWRDaGFuZ2VJbmZvW11cclxuXHRsaW5rczogTGlua0NoYW5nZUluZm9bXVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMaW5rU2VjdGlvbkluZm8ge1xyXG5cdGhhc1NlY3Rpb246IGJvb2xlYW5cclxuXHRsaW5rOiBzdHJpbmdcclxuXHRzZWN0aW9uOiBzdHJpbmdcclxufVxyXG5cclxuXHJcbi8vc2ltcGxlIHJlZ2V4XHJcbi8vIGNvbnN0IG1hcmtkb3duTGlua09yRW1iZWRSZWdleFNpbXBsZSA9IC9cXFsoLio/KVxcXVxcKCguKj8pXFwpL2dpbVxyXG4vLyBjb25zdCBtYXJrZG93bkxpbmtSZWdleFNpbXBsZSA9IC8oPzwhXFwhKVxcWyguKj8pXFxdXFwoKC4qPylcXCkvZ2ltO1xyXG4vLyBjb25zdCBtYXJrZG93bkVtYmVkUmVnZXhTaW1wbGUgPSAvXFwhXFxbKC4qPylcXF1cXCgoLio/KVxcKS9naW1cclxuXHJcbi8vIGNvbnN0IHdpa2lMaW5rT3JFbWJlZFJlZ2V4U2ltcGxlID0gL1xcW1xcWyguKj8pXFxdXFxdL2dpbVxyXG4vLyBjb25zdCB3aWtpTGlua1JlZ2V4U2ltcGxlID0gLyg/PCFcXCEpXFxbXFxbKC4qPylcXF1cXF0vZ2ltO1xyXG4vLyBjb25zdCB3aWtpRW1iZWRSZWdleFNpbXBsZSA9IC9cXCFcXFtcXFsoLio/KVxcXVxcXS9naW1cclxuXHJcbi8vd2l0aCBlc2NhcGluZyBcXCBjaGFyYWN0ZXJzXHJcbmNvbnN0IG1hcmtkb3duTGlua09yRW1iZWRSZWdleEcgPSAvKD88IVxcXFwpXFxbKC4qPykoPzwhXFxcXClcXF1cXCgoLio/KSg/PCFcXFxcKVxcKS9naW1cclxuY29uc3QgbWFya2Rvd25MaW5rUmVnZXhHID0gLyg/PCFcXCEpKD88IVxcXFwpXFxbKC4qPykoPzwhXFxcXClcXF1cXCgoLio/KSg/PCFcXFxcKSg/OiMoLio/KSk/XFwpL2dpbTtcclxuY29uc3QgbWFya2Rvd25FbWJlZFJlZ2V4RyA9IC8oPzwhXFxcXClcXCFcXFsoLio/KSg/PCFcXFxcKVxcXVxcKCguKj8pKD88IVxcXFwpXFwpL2dpbVxyXG5cclxuY29uc3Qgd2lraUxpbmtPckVtYmVkUmVnZXhHID0gLyg/PCFcXFxcKVxcW1xcWyguKj8pKD88IVxcXFwpXFxdXFxdL2dpbVxyXG5jb25zdCB3aWtpTGlua1JlZ2V4RyA9IC8oPzwhXFwhKSg/PCFcXFxcKVxcW1xcWyguKj8pKD88IVxcXFwpXFxdXFxdL2dpbTtcclxuY29uc3Qgd2lraUVtYmVkUmVnZXhHID0gLyg/PCFcXFxcKVxcIVxcW1xcWyguKj8pKD88IVxcXFwpXFxdXFxdL2dpbVxyXG5cclxuY29uc3QgbWFya2Rvd25MaW5rT3JFbWJlZFJlZ2V4ID0gLyg/PCFcXFxcKVxcWyguKj8pKD88IVxcXFwpXFxdXFwoKC4qPykoPzwhXFxcXClcXCkvaW1cclxuY29uc3QgbWFya2Rvd25MaW5rUmVnZXggPSAvKD88IVxcISkoPzwhXFxcXClcXFsoLio/KSg/PCFcXFxcKVxcXVxcKCguKj8pKD88IVxcXFwpXFwpL2ltO1xyXG5jb25zdCBtYXJrZG93bkVtYmVkUmVnZXggPSAvKD88IVxcXFwpXFwhXFxbKC4qPykoPzwhXFxcXClcXF1cXCgoLio/KSg/PCFcXFxcKVxcKS9pbVxyXG5cclxuY29uc3Qgd2lraUxpbmtPckVtYmVkUmVnZXggPSAvKD88IVxcXFwpXFxbXFxbKC4qPykoPzwhXFxcXClcXF1cXF0vaW1cclxuY29uc3Qgd2lraUxpbmtSZWdleCA9IC8oPzwhXFwhKSg/PCFcXFxcKVxcW1xcWyguKj8pKD88IVxcXFwpXFxdXFxdL2ltO1xyXG5jb25zdCB3aWtpRW1iZWRSZWdleCA9IC8oPzwhXFxcXClcXCFcXFtcXFsoLio/KSg/PCFcXFxcKVxcXVxcXS9pbVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBMaW5rc0hhbmRsZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvcihcclxuXHRcdHByaXZhdGUgYXBwOiBBcHAsXHJcblx0XHRwcml2YXRlIGNvbnNvbGVMb2dQcmVmaXg6IHN0cmluZyA9IFwiXCIsXHJcblx0XHRwcml2YXRlIGlnbm9yZUZvbGRlcnM6IHN0cmluZ1tdID0gW10sXHJcblx0XHRwcml2YXRlIGlnbm9yZUZpbGVzUmVnZXg6IFJlZ0V4cFtdID0gW10sXHJcblx0KSB7IH1cclxuXHJcblx0aXNQYXRoSWdub3JlZChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHRcdGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIuL1wiKSlcclxuXHRcdFx0cGF0aCA9IHBhdGguc3Vic3RyaW5nKDIpO1xyXG5cclxuXHRcdGZvciAobGV0IGZvbGRlciBvZiB0aGlzLmlnbm9yZUZvbGRlcnMpIHtcclxuXHRcdFx0aWYgKHBhdGguc3RhcnRzV2l0aChmb2xkZXIpKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGxldCBmaWxlUmVnZXggb2YgdGhpcy5pZ25vcmVGaWxlc1JlZ2V4KSB7XHJcblx0XHRcdGlmIChmaWxlUmVnZXgudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjaGVja0lzQ29ycmVjdE1hcmtkb3duRW1iZWQodGV4dDogc3RyaW5nKSB7XHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKG1hcmtkb3duRW1iZWRSZWdleEcpO1xyXG5cdFx0cmV0dXJuIChlbGVtZW50cyAhPSBudWxsICYmIGVsZW1lbnRzLmxlbmd0aCA+IDApXHJcblx0fVxyXG5cclxuXHRjaGVja0lzQ29ycmVjdE1hcmtkb3duTGluayh0ZXh0OiBzdHJpbmcpIHtcclxuXHRcdGxldCBlbGVtZW50cyA9IHRleHQubWF0Y2gobWFya2Rvd25MaW5rUmVnZXhHKTtcclxuXHRcdHJldHVybiAoZWxlbWVudHMgIT0gbnVsbCAmJiBlbGVtZW50cy5sZW5ndGggPiAwKVxyXG5cdH1cclxuXHJcblx0Y2hlY2tJc0NvcnJlY3RNYXJrZG93bkVtYmVkT3JMaW5rKHRleHQ6IHN0cmluZykge1xyXG5cdFx0bGV0IGVsZW1lbnRzID0gdGV4dC5tYXRjaChtYXJrZG93bkxpbmtPckVtYmVkUmVnZXhHKTtcclxuXHRcdHJldHVybiAoZWxlbWVudHMgIT0gbnVsbCAmJiBlbGVtZW50cy5sZW5ndGggPiAwKVxyXG5cdH1cclxuXHJcblx0Y2hlY2tJc0NvcnJlY3RXaWtpRW1iZWQodGV4dDogc3RyaW5nKSB7XHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKHdpa2lFbWJlZFJlZ2V4Ryk7XHJcblx0XHRyZXR1cm4gKGVsZW1lbnRzICE9IG51bGwgJiYgZWxlbWVudHMubGVuZ3RoID4gMClcclxuXHR9XHJcblxyXG5cdGNoZWNrSXNDb3JyZWN0V2lraUxpbmsodGV4dDogc3RyaW5nKSB7XHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKHdpa2lMaW5rUmVnZXhHKTtcclxuXHRcdHJldHVybiAoZWxlbWVudHMgIT0gbnVsbCAmJiBlbGVtZW50cy5sZW5ndGggPiAwKVxyXG5cdH1cclxuXHJcblx0Y2hlY2tJc0NvcnJlY3RXaWtpRW1iZWRPckxpbmsodGV4dDogc3RyaW5nKSB7XHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKHdpa2lMaW5rT3JFbWJlZFJlZ2V4Ryk7XHJcblx0XHRyZXR1cm4gKGVsZW1lbnRzICE9IG51bGwgJiYgZWxlbWVudHMubGVuZ3RoID4gMClcclxuXHR9XHJcblxyXG5cclxuXHRnZXRGaWxlQnlMaW5rKGxpbms6IHN0cmluZywgb3duaW5nTm90ZVBhdGg6IHN0cmluZywgYWxsb3dJbnZhbGlkTGluazogYm9vbGVhbiA9IHRydWUpOiBURmlsZSB7XHJcblx0XHRsaW5rID0gdGhpcy5zcGxpdExpbmtUb1BhdGhBbmRTZWN0aW9uKGxpbmspLmxpbms7XHJcblx0XHRpZiAoYWxsb3dJbnZhbGlkTGluaykge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChsaW5rLCBvd25pbmdOb3RlUGF0aCk7XHJcblx0XHR9XHJcblx0XHRsZXQgZnVsbFBhdGggPSB0aGlzLmdldEZ1bGxQYXRoRm9yTGluayhsaW5rLCBvd25pbmdOb3RlUGF0aCk7XHJcblx0XHRyZXR1cm4gdGhpcy5nZXRGaWxlQnlQYXRoKGZ1bGxQYXRoKTtcclxuXHR9XHJcblxyXG5cclxuXHRnZXRGaWxlQnlQYXRoKHBhdGg6IHN0cmluZyk6IFRGaWxlIHtcclxuXHRcdHBhdGggPSBVdGlscy5ub3JtYWxpemVQYXRoRm9yRmlsZShwYXRoKTtcclxuXHRcdHJldHVybiBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpIGFzIFRGaWxlO1xyXG5cdH1cclxuXHJcblxyXG5cdGdldEZ1bGxQYXRoRm9yTGluayhsaW5rOiBzdHJpbmcsIG93bmluZ05vdGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdFx0bGluayA9IHRoaXMuc3BsaXRMaW5rVG9QYXRoQW5kU2VjdGlvbihsaW5rKS5saW5rO1xyXG5cdFx0bGluayA9IFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JGaWxlKGxpbmspO1xyXG5cdFx0b3duaW5nTm90ZVBhdGggPSBVdGlscy5ub3JtYWxpemVQYXRoRm9yRmlsZShvd25pbmdOb3RlUGF0aCk7XHJcblxyXG5cdFx0bGV0IHBhcmVudEZvbGRlciA9IG93bmluZ05vdGVQYXRoLnN1YnN0cmluZygwLCBvd25pbmdOb3RlUGF0aC5sYXN0SW5kZXhPZihcIi9cIikpO1xyXG5cdFx0bGV0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHBhcmVudEZvbGRlciwgbGluayk7XHJcblxyXG5cdFx0ZnVsbFBhdGggPSBVdGlscy5ub3JtYWxpemVQYXRoRm9yRmlsZShmdWxsUGF0aCk7XHJcblx0XHRyZXR1cm4gZnVsbFBhdGg7XHJcblx0fVxyXG5cclxuXHJcblx0Z2V0QWxsQ2FjaGVkTGlua3NUb0ZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IHsgW25vdGVQYXRoOiBzdHJpbmddOiBMaW5rQ2FjaGVbXTsgfSB7XHJcblx0XHRsZXQgYWxsTGlua3M6IHsgW25vdGVQYXRoOiBzdHJpbmddOiBMaW5rQ2FjaGVbXTsgfSA9IHt9O1xyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKG5vdGUucGF0aCA9PSBmaWxlUGF0aClcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0XHRcdGxldCBsaW5rcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZS5wYXRoKT8ubGlua3M7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdFx0XHRsZXQgbGlua0Z1bGxQYXRoID0gdGhpcy5nZXRGdWxsUGF0aEZvckxpbmsobGluay5saW5rLCBub3RlLnBhdGgpO1xyXG5cdFx0XHRcdFx0XHRpZiAobGlua0Z1bGxQYXRoID09IGZpbGVQYXRoKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCFhbGxMaW5rc1tub3RlLnBhdGhdKVxyXG5cdFx0XHRcdFx0XHRcdFx0YWxsTGlua3Nbbm90ZS5wYXRoXSA9IFtdO1xyXG5cdFx0XHRcdFx0XHRcdGFsbExpbmtzW25vdGUucGF0aF0ucHVzaChsaW5rKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhbGxMaW5rcztcclxuXHR9XHJcblxyXG5cclxuXHRnZXRBbGxDYWNoZWRFbWJlZHNUb0ZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IHsgW25vdGVQYXRoOiBzdHJpbmddOiBFbWJlZENhY2hlW107IH0ge1xyXG5cdFx0bGV0IGFsbEVtYmVkczogeyBbbm90ZVBhdGg6IHN0cmluZ106IEVtYmVkQ2FjaGVbXTsgfSA9IHt9O1xyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKG5vdGUucGF0aCA9PSBmaWxlUGF0aClcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0XHRcdGxldCBlbWJlZHMgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKG5vdGUucGF0aCk/LmVtYmVkcztcclxuXHJcblx0XHRcdFx0aWYgKGVtYmVkcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZW1iZWQgb2YgZW1iZWRzKSB7XHJcblx0XHRcdFx0XHRcdGxldCBsaW5rRnVsbFBhdGggPSB0aGlzLmdldEZ1bGxQYXRoRm9yTGluayhlbWJlZC5saW5rLCBub3RlLnBhdGgpO1xyXG5cdFx0XHRcdFx0XHRpZiAobGlua0Z1bGxQYXRoID09IGZpbGVQYXRoKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCFhbGxFbWJlZHNbbm90ZS5wYXRoXSlcclxuXHRcdFx0XHRcdFx0XHRcdGFsbEVtYmVkc1tub3RlLnBhdGhdID0gW107XHJcblx0XHRcdFx0XHRcdFx0YWxsRW1iZWRzW25vdGUucGF0aF0ucHVzaChlbWJlZCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWxsRW1iZWRzO1xyXG5cdH1cclxuXHJcblxyXG5cclxuXHRnZXRBbGxCYWRMaW5rcygpOiB7IFtub3RlUGF0aDogc3RyaW5nXTogTGlua0NhY2hlW107IH0ge1xyXG5cdFx0bGV0IGFsbExpbmtzOiB7IFtub3RlUGF0aDogc3RyaW5nXTogTGlua0NhY2hlW107IH0gPSB7fTtcclxuXHRcdGxldCBub3RlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuXHJcblx0XHRpZiAobm90ZXMpIHtcclxuXHRcdFx0Zm9yIChsZXQgbm90ZSBvZiBub3Rlcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZS5wYXRoKSlcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0XHRcdGxldCBsaW5rcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZS5wYXRoKT8ubGlua3M7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdFx0XHRpZiAobGluay5saW5rLnN0YXJ0c1dpdGgoXCIjXCIpKSAvL2ludGVybmFsIHNlY3Rpb24gbGlua1xyXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpTGluayhsaW5rLm9yaWdpbmFsKSlcclxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0XHRcdGxldCBmaWxlID0gdGhpcy5nZXRGaWxlQnlMaW5rKGxpbmsubGluaywgbm90ZS5wYXRoLCBmYWxzZSk7XHJcblx0XHRcdFx0XHRcdGlmICghZmlsZSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghYWxsTGlua3Nbbm90ZS5wYXRoXSlcclxuXHRcdFx0XHRcdFx0XHRcdGFsbExpbmtzW25vdGUucGF0aF0gPSBbXTtcclxuXHRcdFx0XHRcdFx0XHRhbGxMaW5rc1tub3RlLnBhdGhdLnB1c2gobGluayk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWxsTGlua3M7XHJcblx0fVxyXG5cclxuXHRnZXRBbGxCYWRFbWJlZHMoKTogeyBbbm90ZVBhdGg6IHN0cmluZ106IEVtYmVkQ2FjaGVbXTsgfSB7XHJcblx0XHRsZXQgYWxsRW1iZWRzOiB7IFtub3RlUGF0aDogc3RyaW5nXTogRW1iZWRDYWNoZVtdOyB9ID0ge307XHJcblx0XHRsZXQgbm90ZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG5cdFx0aWYgKG5vdGVzKSB7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgb2Ygbm90ZXMpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGUucGF0aCkpXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0Ly8hISEgdGhpcyBjYW4gcmV0dXJuIHVuZGVmaW5lZCBpZiBub3RlIHdhcyBqdXN0IHVwZGF0ZWRcclxuXHRcdFx0XHRsZXQgZW1iZWRzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlLnBhdGgpPy5lbWJlZHM7XHJcblxyXG5cdFx0XHRcdGlmIChlbWJlZHMpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5jaGVja0lzQ29ycmVjdFdpa2lFbWJlZChlbWJlZC5vcmlnaW5hbCkpXHJcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHRoaXMuZ2V0RmlsZUJ5TGluayhlbWJlZC5saW5rLCBub3RlLnBhdGgsIGZhbHNlKTtcclxuXHRcdFx0XHRcdFx0aWYgKCFmaWxlKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCFhbGxFbWJlZHNbbm90ZS5wYXRoXSlcclxuXHRcdFx0XHRcdFx0XHRcdGFsbEVtYmVkc1tub3RlLnBhdGhdID0gW107XHJcblx0XHRcdFx0XHRcdFx0YWxsRW1iZWRzW25vdGUucGF0aF0ucHVzaChlbWJlZCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWxsRW1iZWRzO1xyXG5cdH1cclxuXHJcblxyXG5cdGdldEFsbEdvb2RMaW5rcygpOiB7IFtub3RlUGF0aDogc3RyaW5nXTogTGlua0NhY2hlW107IH0ge1xyXG5cdFx0bGV0IGFsbExpbmtzOiB7IFtub3RlUGF0aDogc3RyaW5nXTogTGlua0NhY2hlW107IH0gPSB7fTtcclxuXHRcdGxldCBub3RlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuXHJcblx0XHRpZiAobm90ZXMpIHtcclxuXHRcdFx0Zm9yIChsZXQgbm90ZSBvZiBub3Rlcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZS5wYXRoKSlcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0XHRcdGxldCBsaW5rcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZS5wYXRoKT8ubGlua3M7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdFx0XHRpZiAobGluay5saW5rLnN0YXJ0c1dpdGgoXCIjXCIpKSAvL2ludGVybmFsIHNlY3Rpb24gbGlua1xyXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpTGluayhsaW5rLm9yaWdpbmFsKSlcclxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0XHRcdGxldCBmaWxlID0gdGhpcy5nZXRGaWxlQnlMaW5rKGxpbmsubGluaywgbm90ZS5wYXRoKTtcclxuXHRcdFx0XHRcdFx0aWYgKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoIWFsbExpbmtzW25vdGUucGF0aF0pXHJcblx0XHRcdFx0XHRcdFx0XHRhbGxMaW5rc1tub3RlLnBhdGhdID0gW107XHJcblx0XHRcdFx0XHRcdFx0YWxsTGlua3Nbbm90ZS5wYXRoXS5wdXNoKGxpbmspO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGFsbExpbmtzO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgZ2V0QWxsQmFkU2VjdGlvbkxpbmtzKCk6IFByb21pc2U8eyBbbm90ZVBhdGg6IHN0cmluZ106IExpbmtDYWNoZVtdOyB9PiB7XHJcblx0XHRsZXQgYWxsTGlua3M6IHsgW25vdGVQYXRoOiBzdHJpbmddOiBMaW5rQ2FjaGVbXTsgfSA9IHt9O1xyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdC8vISEhIHRoaXMgY2FuIHJldHVybiB1bmRlZmluZWQgaWYgbm90ZSB3YXMganVzdCB1cGRhdGVkXHJcblx0XHRcdFx0bGV0IGxpbmtzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlLnBhdGgpPy5saW5rcztcclxuXHRcdFx0XHRpZiAobGlua3MpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGxpbmsgb2YgbGlua3MpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpTGluayhsaW5rLm9yaWdpbmFsKSlcclxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0XHRcdGxldCBsaSA9IHRoaXMuc3BsaXRMaW5rVG9QYXRoQW5kU2VjdGlvbihsaW5rLmxpbmspO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWxpLmhhc1NlY3Rpb24pXHJcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHRoaXMuZ2V0RmlsZUJ5TGluayhsaW5rLmxpbmssIG5vdGUucGF0aCwgZmFsc2UpO1xyXG5cdFx0XHRcdFx0XHRpZiAoZmlsZSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChmaWxlLmV4dGVuc2lvbiA9PT0gXCJwZGZcIiAmJiBsaS5zZWN0aW9uLnN0YXJ0c1dpdGgoXCJwYWdlPVwiKSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRsZXQgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcblx0XHRcdFx0XHRcdFx0bGV0IHNlY3Rpb24gPSBVdGlscy5ub3JtYWxpemVMaW5rU2VjdGlvbihsaS5zZWN0aW9uKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHNlY3Rpb24uc3RhcnRzV2l0aChcIl5cIikpIC8vc2tpcCBeIGxpbmtzXHJcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0XHRcdFx0bGV0IHJlZ2V4ID0gL1sgIUAkJV4mKigpLT1fK1xcXFwvOydcXFtcXF1cXFwiXFx8XFw/LlxcLFxcPFxcPlxcYFxcflxce1xcfV0vZ2ltO1xyXG5cdFx0XHRcdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsICcnKTtcclxuXHRcdFx0XHRcdFx0XHRzZWN0aW9uID0gc2VjdGlvbi5yZXBsYWNlKHJlZ2V4LCAnJyk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICghdGV4dC5jb250YWlucyhcIiNcIiArIHNlY3Rpb24pKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAoIWFsbExpbmtzW25vdGUucGF0aF0pXHJcblx0XHRcdFx0XHRcdFx0XHRcdGFsbExpbmtzW25vdGUucGF0aF0gPSBbXTtcclxuXHRcdFx0XHRcdFx0XHRcdGFsbExpbmtzW25vdGUucGF0aF0ucHVzaChsaW5rKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWxsTGlua3M7XHJcblx0fVxyXG5cclxuXHRnZXRBbGxHb29kRW1iZWRzKCk6IHsgW25vdGVQYXRoOiBzdHJpbmddOiBFbWJlZENhY2hlW107IH0ge1xyXG5cdFx0bGV0IGFsbEVtYmVkczogeyBbbm90ZVBhdGg6IHN0cmluZ106IEVtYmVkQ2FjaGVbXTsgfSA9IHt9O1xyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdC8vISEhIHRoaXMgY2FuIHJldHVybiB1bmRlZmluZWQgaWYgbm90ZSB3YXMganVzdCB1cGRhdGVkXHJcblx0XHRcdFx0bGV0IGVtYmVkcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZS5wYXRoKT8uZW1iZWRzO1xyXG5cclxuXHRcdFx0XHRpZiAoZW1iZWRzKSB7XHJcblx0XHRcdFx0XHRmb3IgKGxldCBlbWJlZCBvZiBlbWJlZHMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpRW1iZWQoZW1iZWQub3JpZ2luYWwpKVxyXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0bGV0IGZpbGUgPSB0aGlzLmdldEZpbGVCeUxpbmsoZW1iZWQubGluaywgbm90ZS5wYXRoKTtcclxuXHRcdFx0XHRcdFx0aWYgKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoIWFsbEVtYmVkc1tub3RlLnBhdGhdKVxyXG5cdFx0XHRcdFx0XHRcdFx0YWxsRW1iZWRzW25vdGUucGF0aF0gPSBbXTtcclxuXHRcdFx0XHRcdFx0XHRhbGxFbWJlZHNbbm90ZS5wYXRoXS5wdXNoKGVtYmVkKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhbGxFbWJlZHM7XHJcblx0fVxyXG5cclxuXHRnZXRBbGxXaWtpTGlua3MoKTogeyBbbm90ZVBhdGg6IHN0cmluZ106IExpbmtDYWNoZVtdOyB9IHtcclxuXHRcdGxldCBhbGxMaW5rczogeyBbbm90ZVBhdGg6IHN0cmluZ106IExpbmtDYWNoZVtdOyB9ID0ge307XHJcblx0XHRsZXQgbm90ZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG5cdFx0aWYgKG5vdGVzKSB7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgb2Ygbm90ZXMpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGUucGF0aCkpXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0Ly8hISEgdGhpcyBjYW4gcmV0dXJuIHVuZGVmaW5lZCBpZiBub3RlIHdhcyBqdXN0IHVwZGF0ZWRcclxuXHRcdFx0XHRsZXQgbGlua3MgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKG5vdGUucGF0aCk/LmxpbmtzO1xyXG5cclxuXHRcdFx0XHRpZiAobGlua3MpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGxpbmsgb2YgbGlua3MpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmNoZWNrSXNDb3JyZWN0V2lraUxpbmsobGluay5vcmlnaW5hbCkpXHJcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoIWFsbExpbmtzW25vdGUucGF0aF0pXHJcblx0XHRcdFx0XHRcdFx0YWxsTGlua3Nbbm90ZS5wYXRoXSA9IFtdO1xyXG5cdFx0XHRcdFx0XHRhbGxMaW5rc1tub3RlLnBhdGhdLnB1c2gobGluayk7XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhbGxMaW5rcztcclxuXHR9XHJcblxyXG5cdGdldEFsbFdpa2lFbWJlZHMoKTogeyBbbm90ZVBhdGg6IHN0cmluZ106IEVtYmVkQ2FjaGVbXTsgfSB7XHJcblx0XHRsZXQgYWxsRW1iZWRzOiB7IFtub3RlUGF0aDogc3RyaW5nXTogRW1iZWRDYWNoZVtdOyB9ID0ge307XHJcblx0XHRsZXQgbm90ZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG5cdFx0aWYgKG5vdGVzKSB7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgb2Ygbm90ZXMpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGUucGF0aCkpXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0Ly8hISEgdGhpcyBjYW4gcmV0dXJuIHVuZGVmaW5lZCBpZiBub3RlIHdhcyBqdXN0IHVwZGF0ZWRcclxuXHRcdFx0XHRsZXQgZW1iZWRzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlLnBhdGgpPy5lbWJlZHM7XHJcblxyXG5cdFx0XHRcdGlmIChlbWJlZHMpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpRW1iZWQoZW1iZWQub3JpZ2luYWwpKVxyXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCFhbGxFbWJlZHNbbm90ZS5wYXRoXSlcclxuXHRcdFx0XHRcdFx0XHRhbGxFbWJlZHNbbm90ZS5wYXRoXSA9IFtdO1xyXG5cdFx0XHRcdFx0XHRhbGxFbWJlZHNbbm90ZS5wYXRoXS5wdXNoKGVtYmVkKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYWxsRW1iZWRzO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUxpbmtzVG9SZW5hbWVkRmlsZShvbGROb3RlUGF0aDogc3RyaW5nLCBuZXdOb3RlUGF0aDogc3RyaW5nLCBjaGFuZ2VsaW5rc0FsdCA9IGZhbHNlLCB1c2VCdWlsdEluT2JzaWRpYW5MaW5rQ2FjaGluZyA9IGZhbHNlKSB7XHJcblx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG9sZE5vdGVQYXRoKSB8fCB0aGlzLmlzUGF0aElnbm9yZWQobmV3Tm90ZVBhdGgpKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IG5vdGVzID0gdXNlQnVpbHRJbk9ic2lkaWFuTGlua0NhY2hpbmcgPyB0aGlzLmdldENhY2hlZE5vdGVzVGhhdEhhdmVMaW5rVG9GaWxlKG9sZE5vdGVQYXRoKSA6IGF3YWl0IHRoaXMuZ2V0Tm90ZXNUaGF0SGF2ZUxpbmtUb0ZpbGUob2xkTm90ZVBhdGgpO1xyXG5cdFx0bGV0IGxpbmtzOiBQYXRoQ2hhbmdlSW5mb1tdID0gW3sgb2xkUGF0aDogb2xkTm90ZVBhdGgsIG5ld1BhdGg6IG5ld05vdGVQYXRoIH1dO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0YXdhaXQgdGhpcy51cGRhdGVDaGFuZ2VkUGF0aHNJbk5vdGUobm90ZSwgbGlua3MsIGNoYW5nZWxpbmtzQWx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUNoYW5nZWRQYXRoSW5Ob3RlKG5vdGVQYXRoOiBzdHJpbmcsIG9sZExpbms6IHN0cmluZywgbmV3TGluazogc3RyaW5nLCBjaGFuZ2VsaW5rc0FsdCA9IGZhbHNlKSB7XHJcblx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGVQYXRoKSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGxldCBjaGFuZ2VzOiBQYXRoQ2hhbmdlSW5mb1tdID0gW3sgb2xkUGF0aDogb2xkTGluaywgbmV3UGF0aDogbmV3TGluayB9XTtcclxuXHRcdHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZUNoYW5nZWRQYXRoc0luTm90ZShub3RlUGF0aCwgY2hhbmdlcywgY2hhbmdlbGlua3NBbHQpO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUNoYW5nZWRQYXRoc0luTm90ZShub3RlUGF0aDogc3RyaW5nLCBjaGFuZ2VkTGlua3M6IFBhdGhDaGFuZ2VJbmZvW10sIGNoYW5nZWxpbmtzQWx0ID0gZmFsc2UpIHtcclxuXHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZVBhdGgpKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IGZpbGUgPSB0aGlzLmdldEZpbGVCeVBhdGgobm90ZVBhdGgpO1xyXG5cdFx0aWYgKCFmaWxlKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJjYW50IHVwZGF0ZSBsaW5rcyBpbiBub3RlLCBmaWxlIG5vdCBmb3VuZDogXCIgKyBub3RlUGF0aCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcblx0XHRsZXQgZGlydHkgPSBmYWxzZTtcclxuXHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKG1hcmtkb3duTGlua09yRW1iZWRSZWdleEcpO1xyXG5cdFx0aWYgKGVsZW1lbnRzICE9IG51bGwgJiYgZWxlbWVudHMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRmb3IgKGxldCBlbCBvZiBlbGVtZW50cykge1xyXG5cdFx0XHRcdGxldCBhbHQgPSBlbC5tYXRjaChtYXJrZG93bkxpbmtPckVtYmVkUmVnZXgpWzFdO1xyXG5cdFx0XHRcdGxldCBsaW5rID0gZWwubWF0Y2gobWFya2Rvd25MaW5rT3JFbWJlZFJlZ2V4KVsyXTtcclxuXHRcdFx0XHRsZXQgbGkgPSB0aGlzLnNwbGl0TGlua1RvUGF0aEFuZFNlY3Rpb24obGluayk7XHJcblxyXG5cdFx0XHRcdGlmIChsaS5oYXNTZWN0aW9uKSAgLy8gZm9yIGxpbmtzIHdpdGggc2VjdGlvbnMgbGlrZSBbXShub3RlLm1kI3NlY3Rpb24pXHJcblx0XHRcdFx0XHRsaW5rID0gbGkubGluaztcclxuXHJcblx0XHRcdFx0bGV0IGZ1bGxMaW5rID0gdGhpcy5nZXRGdWxsUGF0aEZvckxpbmsobGluaywgbm90ZVBhdGgpO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBjaGFuZ2VkTGluayBvZiBjaGFuZ2VkTGlua3MpIHtcclxuXHRcdFx0XHRcdGlmIChmdWxsTGluayA9PSBjaGFuZ2VkTGluay5vbGRQYXRoKSB7XHJcblx0XHRcdFx0XHRcdGxldCBuZXdSZWxMaW5rOiBzdHJpbmcgPSBwYXRoLnJlbGF0aXZlKG5vdGVQYXRoLCBjaGFuZ2VkTGluay5uZXdQYXRoKTtcclxuXHRcdFx0XHRcdFx0bmV3UmVsTGluayA9IFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JMaW5rKG5ld1JlbExpbmspO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKG5ld1JlbExpbmsuc3RhcnRzV2l0aChcIi4uL1wiKSkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld1JlbExpbmsgPSBuZXdSZWxMaW5rLnN1YnN0cmluZygzKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZWxpbmtzQWx0ICYmIG5ld1JlbExpbmsuZW5kc1dpdGgoXCIubWRcIikpIHtcclxuXHRcdFx0XHRcdFx0XHQvL3JlbmFtZSBvbmx5IGlmIG9sZCBhbHQgPT0gb2xkIG5vdGUgbmFtZVxyXG5cdFx0XHRcdFx0XHRcdGlmIChhbHQgPT09IHBhdGguYmFzZW5hbWUoY2hhbmdlZExpbmsub2xkUGF0aCwgcGF0aC5leHRuYW1lKGNoYW5nZWRMaW5rLm9sZFBhdGgpKSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGV4dCA9IHBhdGguZXh0bmFtZShuZXdSZWxMaW5rKTtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBiYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUobmV3UmVsTGluaywgZXh0KTtcclxuXHRcdFx0XHRcdFx0XHRcdGFsdCA9IFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JGaWxlKGJhc2VOYW1lKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChsaS5oYXNTZWN0aW9uKVxyXG5cdFx0XHRcdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoZWwsICdbJyArIGFsdCArICddJyArICcoJyArIG5ld1JlbExpbmsgKyAnIycgKyBsaS5zZWN0aW9uICsgJyknKTtcclxuXHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoZWwsICdbJyArIGFsdCArICddJyArICcoJyArIG5ld1JlbExpbmsgKyAnKScpO1xyXG5cclxuXHRcdFx0XHRcdFx0ZGlydHkgPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJsaW5rIHVwZGF0ZWQgaW4gY2FjaGVkIG5vdGUgW25vdGUsIG9sZCBsaW5rLCBuZXcgbGlua106IFxcbiAgIFwiXHJcblx0XHRcdFx0XHRcdFx0KyBmaWxlLnBhdGggKyBcIlxcbiAgIFwiICsgbGluayArIFwiXFxuICAgXCIgKyBuZXdSZWxMaW5rKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkaXJ0eSlcclxuXHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIHRleHQpO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUludGVybmFsTGlua3NJbk1vdmVkTm90ZShvbGROb3RlUGF0aDogc3RyaW5nLCBuZXdOb3RlUGF0aDogc3RyaW5nLCBhdHRhY2htZW50c0FscmVhZHlNb3ZlZDogYm9vbGVhbikge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChvbGROb3RlUGF0aCkgfHwgdGhpcy5pc1BhdGhJZ25vcmVkKG5ld05vdGVQYXRoKSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGxldCBmaWxlID0gdGhpcy5nZXRGaWxlQnlQYXRoKG5ld05vdGVQYXRoKTtcclxuXHRcdGlmICghZmlsZSkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY2FuJ3QgdXBkYXRlIGludGVybmFsIGxpbmtzLCBmaWxlIG5vdCBmb3VuZDogXCIgKyBuZXdOb3RlUGF0aCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcblx0XHRsZXQgZGlydHkgPSBmYWxzZTtcclxuXHJcblx0XHRsZXQgZWxlbWVudHMgPSB0ZXh0Lm1hdGNoKG1hcmtkb3duTGlua09yRW1iZWRSZWdleEcpO1xyXG5cdFx0aWYgKGVsZW1lbnRzICE9IG51bGwgJiYgZWxlbWVudHMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRmb3IgKGxldCBlbCBvZiBlbGVtZW50cykge1xyXG5cdFx0XHRcdGxldCBhbHQgPSBlbC5tYXRjaChtYXJrZG93bkxpbmtPckVtYmVkUmVnZXgpWzFdO1xyXG5cdFx0XHRcdGxldCBsaW5rID0gZWwubWF0Y2gobWFya2Rvd25MaW5rT3JFbWJlZFJlZ2V4KVsyXTtcclxuXHRcdFx0XHRsZXQgbGkgPSB0aGlzLnNwbGl0TGlua1RvUGF0aEFuZFNlY3Rpb24obGluayk7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoXCIjXCIpKSAvL2ludGVybmFsIHNlY3Rpb24gbGlua1xyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGlmIChsaS5oYXNTZWN0aW9uKSAgLy8gZm9yIGxpbmtzIHdpdGggc2VjdGlvbnMgbGlrZSBbXShub3RlLm1kI3NlY3Rpb24pXHJcblx0XHRcdFx0XHRsaW5rID0gbGkubGluaztcclxuXHJcblxyXG5cdFx0XHRcdC8vc3RhcnRzV2l0aChcIi4uL1wiKSAtIGZvciBub3Qgc2tpcHBpbmcgZmlsZXMgdGhhdCBub3QgaW4gdGhlIG5vdGUgZGlyXHJcblx0XHRcdFx0aWYgKGF0dGFjaG1lbnRzQWxyZWFkeU1vdmVkICYmICFsaW5rLmVuZHNXaXRoKFwiLm1kXCIpICYmICFsaW5rLnN0YXJ0c1dpdGgoXCIuLi9cIikpXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0bGV0IGZpbGUgPSB0aGlzLmdldEZpbGVCeUxpbmsobGluaywgb2xkTm90ZVBhdGgpO1xyXG5cdFx0XHRcdGlmICghZmlsZSkge1xyXG5cdFx0XHRcdFx0ZmlsZSA9IHRoaXMuZ2V0RmlsZUJ5TGluayhsaW5rLCBuZXdOb3RlUGF0aCk7XHJcblx0XHRcdFx0XHRpZiAoIWZpbGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcih0aGlzLmNvbnNvbGVMb2dQcmVmaXggKyBuZXdOb3RlUGF0aCArIFwiIGhhcyBiYWQgbGluayAoZmlsZSBkb2VzIG5vdCBleGlzdCk6IFwiICsgbGluayk7XHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRcdGxldCBuZXdSZWxMaW5rOiBzdHJpbmcgPSBwYXRoLnJlbGF0aXZlKG5ld05vdGVQYXRoLCBmaWxlLnBhdGgpO1xyXG5cdFx0XHRcdG5ld1JlbExpbmsgPSBVdGlscy5ub3JtYWxpemVQYXRoRm9yTGluayhuZXdSZWxMaW5rKTtcclxuXHJcblx0XHRcdFx0aWYgKG5ld1JlbExpbmsuc3RhcnRzV2l0aChcIi4uL1wiKSkge1xyXG5cdFx0XHRcdFx0bmV3UmVsTGluayA9IG5ld1JlbExpbmsuc3Vic3RyaW5nKDMpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKGxpLmhhc1NlY3Rpb24pXHJcblx0XHRcdFx0XHR0ZXh0ID0gdGV4dC5yZXBsYWNlKGVsLCAnWycgKyBhbHQgKyAnXScgKyAnKCcgKyBuZXdSZWxMaW5rICsgJyMnICsgbGkuc2VjdGlvbiArICcpJyk7XHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZShlbCwgJ1snICsgYWx0ICsgJ10nICsgJygnICsgbmV3UmVsTGluayArICcpJyk7XHJcblxyXG5cdFx0XHRcdGRpcnR5ID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJsaW5rIHVwZGF0ZWQgaW4gbW92ZWQgbm90ZSBbbm90ZSwgb2xkIGxpbmssIG5ldyBsaW5rXTogXFxuICAgXCJcclxuXHRcdFx0XHRcdCsgZmlsZS5wYXRoICsgXCJcXG4gICBcIiArIGxpbmsgKyBcIiAgIFxcblwiICsgbmV3UmVsTGluayk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGlydHkpXHJcblx0XHRcdGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCB0ZXh0KTtcclxuXHR9XHJcblxyXG5cclxuXHRnZXRDYWNoZWROb3Rlc1RoYXRIYXZlTGlua1RvRmlsZShmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nW10ge1xyXG5cdFx0bGV0IG5vdGVzOiBzdHJpbmdbXSA9IFtdO1xyXG5cdFx0bGV0IGFsbE5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChhbGxOb3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIGFsbE5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCBub3RlUGF0aCA9IG5vdGUucGF0aDtcclxuXHRcdFx0XHRpZiAobm90ZS5wYXRoID09IGZpbGVQYXRoKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdC8vISEhIHRoaXMgY2FuIHJldHVybiB1bmRlZmluZWQgaWYgbm90ZSB3YXMganVzdCB1cGRhdGVkXHJcblx0XHRcdFx0bGV0IGVtYmVkcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZVBhdGgpPy5lbWJlZHM7XHJcblx0XHRcdFx0aWYgKGVtYmVkcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgZW1iZWQgb2YgZW1iZWRzKSB7XHJcblx0XHRcdFx0XHRcdGxldCBsaW5rUGF0aCA9IHRoaXMuZ2V0RnVsbFBhdGhGb3JMaW5rKGVtYmVkLmxpbmssIG5vdGUucGF0aCk7XHJcblx0XHRcdFx0XHRcdGlmIChsaW5rUGF0aCA9PSBmaWxlUGF0aCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghbm90ZXMuY29udGFpbnMobm90ZVBhdGgpKVxyXG5cdFx0XHRcdFx0XHRcdFx0bm90ZXMucHVzaChub3RlUGF0aCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vISEhIHRoaXMgY2FuIHJldHVybiB1bmRlZmluZWQgaWYgbm90ZSB3YXMganVzdCB1cGRhdGVkXHJcblx0XHRcdFx0bGV0IGxpbmtzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlUGF0aCk/LmxpbmtzO1xyXG5cdFx0XHRcdGlmIChsaW5rcykge1xyXG5cdFx0XHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdFx0XHRsZXQgbGlua1BhdGggPSB0aGlzLmdldEZ1bGxQYXRoRm9yTGluayhsaW5rLmxpbmssIG5vdGUucGF0aCk7XHJcblx0XHRcdFx0XHRcdGlmIChsaW5rUGF0aCA9PSBmaWxlUGF0aCkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghbm90ZXMuY29udGFpbnMobm90ZVBhdGgpKVxyXG5cdFx0XHRcdFx0XHRcdFx0bm90ZXMucHVzaChub3RlUGF0aCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbm90ZXM7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgZ2V0Tm90ZXNUaGF0SGF2ZUxpbmtUb0ZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuXHRcdGxldCBub3Rlczogc3RyaW5nW10gPSBbXTtcclxuXHRcdGxldCBhbGxOb3RlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuXHJcblx0XHRpZiAoYWxsTm90ZXMpIHtcclxuXHRcdFx0Zm9yIChsZXQgbm90ZSBvZiBhbGxOb3Rlcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZS5wYXRoKSlcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRsZXQgbm90ZVBhdGggPSBub3RlLnBhdGg7XHJcblx0XHRcdFx0aWYgKG5vdGVQYXRoID09IGZpbGVQYXRoKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCBsaW5rcyA9IGF3YWl0IHRoaXMuZ2V0TGlua3NGcm9tTm90ZShub3RlUGF0aCk7XHJcblx0XHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdFx0bGV0IGxpID0gdGhpcy5zcGxpdExpbmtUb1BhdGhBbmRTZWN0aW9uKGxpbmsubGluayk7XHJcblx0XHRcdFx0XHRsZXQgbGlua0Z1bGxQYXRoID0gdGhpcy5nZXRGdWxsUGF0aEZvckxpbmsobGkubGluaywgbm90ZVBhdGgpO1xyXG5cdFx0XHRcdFx0aWYgKGxpbmtGdWxsUGF0aCA9PSBmaWxlUGF0aCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoIW5vdGVzLmNvbnRhaW5zKG5vdGVQYXRoKSlcclxuXHRcdFx0XHRcdFx0XHRub3Rlcy5wdXNoKG5vdGVQYXRoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbm90ZXM7XHJcblx0fVxyXG5cclxuXHRzcGxpdExpbmtUb1BhdGhBbmRTZWN0aW9uKGxpbms6IHN0cmluZyk6IExpbmtTZWN0aW9uSW5mbyB7XHJcblx0XHRsZXQgcmVzOiBMaW5rU2VjdGlvbkluZm8gPSB7XHJcblx0XHRcdGhhc1NlY3Rpb246IGZhbHNlLFxyXG5cdFx0XHRsaW5rOiBsaW5rLFxyXG5cdFx0XHRzZWN0aW9uOiBcIlwiXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFsaW5rLmNvbnRhaW5zKCcjJykpXHJcblx0XHRcdHJldHVybiByZXM7XHJcblxyXG5cclxuXHRcdGxldCBsaW5rQmVmb3JlSGFzaCA9IGxpbmsubWF0Y2goLyguKj8pIyguKj8pJC8pWzFdO1xyXG5cdFx0bGV0IHNlY3Rpb24gPSBsaW5rLm1hdGNoKC8oLio/KSMoLio/KSQvKVsyXTtcclxuXHJcblx0XHRsZXQgaXNNYXJrZG93blNlY3Rpb24gPSBzZWN0aW9uICE9IFwiXCIgJiYgbGlua0JlZm9yZUhhc2guZW5kc1dpdGgoXCIubWRcIik7IC8vIGZvciBsaW5rcyB3aXRoIHNlY3Rpb25zIGxpa2UgW10obm90ZS5tZCNzZWN0aW9uKVxyXG5cdFx0bGV0IGlzUGRmUGFnZVNlY3Rpb24gPSBzZWN0aW9uLnN0YXJ0c1dpdGgoXCJwYWdlPVwiKSAmJiBsaW5rQmVmb3JlSGFzaC5lbmRzV2l0aChcIi5wZGZcIik7IC8vIGZvciBsaW5rcyB3aXRoIHNlY3Rpb25zIGxpa2UgW10obm90ZS5wZGYjcGFnZT00MilcclxuXHJcblx0XHRpZiAoaXNNYXJrZG93blNlY3Rpb24gfHwgaXNQZGZQYWdlU2VjdGlvbikge1xyXG5cdFx0XHRyZXMgPSB7XHJcblx0XHRcdFx0aGFzU2VjdGlvbjogdHJ1ZSxcclxuXHRcdFx0XHRsaW5rOiBsaW5rQmVmb3JlSGFzaCxcclxuXHRcdFx0XHRzZWN0aW9uOiBzZWN0aW9uXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzO1xyXG5cdH1cclxuXHJcblxyXG5cdGdldEZpbGVQYXRoV2l0aFJlbmFtZWRCYXNlTmFtZShmaWxlUGF0aDogc3RyaW5nLCBuZXdCYXNlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdHJldHVybiBVdGlscy5ub3JtYWxpemVQYXRoRm9yRmlsZShwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSwgbmV3QmFzZU5hbWUgKyBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpKSk7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgZ2V0TGlua3NGcm9tTm90ZShub3RlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxMaW5rQ2FjaGVbXT4ge1xyXG5cdFx0bGV0IGZpbGUgPSB0aGlzLmdldEZpbGVCeVBhdGgobm90ZVBhdGgpO1xyXG5cdFx0aWYgKCFmaWxlKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJjYW4ndCBnZXQgZW1iZWRzLCBmaWxlIG5vdCBmb3VuZDogXCIgKyBub3RlUGF0aCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcblxyXG5cdFx0bGV0IGxpbmtzOiBMaW5rQ2FjaGVbXSA9IFtdO1xyXG5cclxuXHRcdGxldCBlbGVtZW50cyA9IHRleHQubWF0Y2gobWFya2Rvd25MaW5rT3JFbWJlZFJlZ2V4Ryk7XHJcblx0XHRpZiAoZWxlbWVudHMgIT0gbnVsbCAmJiBlbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAobGV0IGVsIG9mIGVsZW1lbnRzKSB7XHJcblx0XHRcdFx0bGV0IGFsdCA9IGVsLm1hdGNoKG1hcmtkb3duTGlua09yRW1iZWRSZWdleClbMV07XHJcblx0XHRcdFx0bGV0IGxpbmsgPSBlbC5tYXRjaChtYXJrZG93bkxpbmtPckVtYmVkUmVnZXgpWzJdO1xyXG5cclxuXHRcdFx0XHRsZXQgZW1iOiBMaW5rQ2FjaGUgPSB7XHJcblx0XHRcdFx0XHRsaW5rOiBsaW5rLFxyXG5cdFx0XHRcdFx0ZGlzcGxheVRleHQ6IGFsdCxcclxuXHRcdFx0XHRcdG9yaWdpbmFsOiBlbCxcclxuXHRcdFx0XHRcdHBvc2l0aW9uOiB7XHJcblx0XHRcdFx0XHRcdHN0YXJ0OiB7XHJcblx0XHRcdFx0XHRcdFx0Y29sOiAwLC8vdG9kb1xyXG5cdFx0XHRcdFx0XHRcdGxpbmU6IDAsXHJcblx0XHRcdFx0XHRcdFx0b2Zmc2V0OiAwXHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdGVuZDoge1xyXG5cdFx0XHRcdFx0XHRcdGNvbDogMCwvL3RvZG9cclxuXHRcdFx0XHRcdFx0XHRsaW5lOiAwLFxyXG5cdFx0XHRcdFx0XHRcdG9mZnNldDogMFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0bGlua3MucHVzaChlbWIpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbGlua3M7XHJcblx0fVxyXG5cclxuXHJcblxyXG5cclxuXHRhc3luYyBjb252ZXJ0QWxsTm90ZUVtYmVkc1BhdGhzVG9SZWxhdGl2ZShub3RlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxFbWJlZENoYW5nZUluZm9bXT4ge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlUGF0aCkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgY2hhbmdlZEVtYmVkczogRW1iZWRDaGFuZ2VJbmZvW10gPSBbXTtcclxuXHJcblx0XHRsZXQgZW1iZWRzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlUGF0aCk/LmVtYmVkcztcclxuXHJcblx0XHRpZiAoZW1iZWRzKSB7XHJcblx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRcdGxldCBpc01hcmtkb3duRW1iZWQgPSB0aGlzLmNoZWNrSXNDb3JyZWN0TWFya2Rvd25FbWJlZChlbWJlZC5vcmlnaW5hbCk7XHJcblx0XHRcdFx0bGV0IGlzV2lraUVtYmVkID0gdGhpcy5jaGVja0lzQ29ycmVjdFdpa2lFbWJlZChlbWJlZC5vcmlnaW5hbCk7XHJcblx0XHRcdFx0aWYgKGlzTWFya2Rvd25FbWJlZCB8fCBpc1dpa2lFbWJlZCkge1xyXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSB0aGlzLmdldEZpbGVCeUxpbmsoZW1iZWQubGluaywgbm90ZVBhdGgpO1xyXG5cdFx0XHRcdFx0aWYgKGZpbGUpXHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGVtYmVkLmxpbmssIG5vdGVQYXRoKTtcclxuXHRcdFx0XHRcdGlmIChmaWxlKSB7XHJcblx0XHRcdFx0XHRcdGxldCBuZXdSZWxMaW5rOiBzdHJpbmcgPSBwYXRoLnJlbGF0aXZlKG5vdGVQYXRoLCBmaWxlLnBhdGgpO1xyXG5cdFx0XHRcdFx0XHRuZXdSZWxMaW5rID0gaXNNYXJrZG93bkVtYmVkID8gVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsobmV3UmVsTGluaykgOiBVdGlscy5ub3JtYWxpemVQYXRoRm9yRmlsZShuZXdSZWxMaW5rKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChuZXdSZWxMaW5rLnN0YXJ0c1dpdGgoXCIuLi9cIikpIHtcclxuXHRcdFx0XHRcdFx0XHRuZXdSZWxMaW5rID0gbmV3UmVsTGluay5zdWJzdHJpbmcoMyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGNoYW5nZWRFbWJlZHMucHVzaCh7IG9sZDogZW1iZWQsIG5ld0xpbms6IG5ld1JlbExpbmsgfSlcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgbm90ZVBhdGggKyBcIiBoYXMgYmFkIGVtYmVkIChmaWxlIGRvZXMgbm90IGV4aXN0KTogXCIgKyBlbWJlZC5saW5rKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcih0aGlzLmNvbnNvbGVMb2dQcmVmaXggKyBub3RlUGF0aCArIFwiIGhhcyBiYWQgZW1iZWQgKGZvcm1hdCBvZiBsaW5rIGlzIG5vdCBtYXJrZG93biBvciB3aWtpIGxpbmspOiBcIiArIGVtYmVkLm9yaWdpbmFsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRhd2FpdCB0aGlzLnVwZGF0ZUNoYW5nZWRFbWJlZEluTm90ZShub3RlUGF0aCwgY2hhbmdlZEVtYmVkcyk7XHJcblx0XHRyZXR1cm4gY2hhbmdlZEVtYmVkcztcclxuXHR9XHJcblxyXG5cclxuXHRhc3luYyBjb252ZXJ0QWxsTm90ZUxpbmtzUGF0aHNUb1JlbGF0aXZlKG5vdGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPExpbmtDaGFuZ2VJbmZvW10+IHtcclxuXHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZVBhdGgpKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IGNoYW5nZWRMaW5rczogTGlua0NoYW5nZUluZm9bXSA9IFtdO1xyXG5cclxuXHRcdGxldCBsaW5rcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZVBhdGgpPy5saW5rcztcclxuXHJcblx0XHRpZiAobGlua3MpIHtcclxuXHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdGxldCBpc01hcmtkb3duTGluayA9IHRoaXMuY2hlY2tJc0NvcnJlY3RNYXJrZG93bkxpbmsobGluay5vcmlnaW5hbCk7XHJcblx0XHRcdFx0bGV0IGlzV2lraUxpbmsgPSB0aGlzLmNoZWNrSXNDb3JyZWN0V2lraUxpbmsobGluay5vcmlnaW5hbCk7XHJcblx0XHRcdFx0aWYgKGlzTWFya2Rvd25MaW5rIHx8IGlzV2lraUxpbmspIHtcclxuXHRcdFx0XHRcdGlmIChsaW5rLmxpbmsuc3RhcnRzV2l0aChcIiNcIikpIC8vaW50ZXJuYWwgc2VjdGlvbiBsaW5rXHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdGxldCBmaWxlID0gdGhpcy5nZXRGaWxlQnlMaW5rKGxpbmsubGluaywgbm90ZVBhdGgpO1xyXG5cdFx0XHRcdFx0aWYgKGZpbGUpXHJcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRcdC8vISEhIGxpbmsuZGlzcGxheVRleHQgaXMgYWx3YXlzIFwiXCIgLSBPQlNJRElBTiBCVUc/LCBzbyBnZXQgZGlzcGxheSB0ZXh0IG1hbnVhbHlcclxuXHRcdFx0XHRcdGlmIChpc01hcmtkb3duTGluaykge1xyXG5cdFx0XHRcdFx0XHRsZXQgZWxlbWVudHMgPSBsaW5rLm9yaWdpbmFsLm1hdGNoKG1hcmtkb3duTGlua1JlZ2V4KTtcclxuXHRcdFx0XHRcdFx0aWYgKGVsZW1lbnRzKVxyXG5cdFx0XHRcdFx0XHRcdGxpbmsuZGlzcGxheVRleHQgPSBlbGVtZW50c1sxXTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRmaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChsaW5rLmxpbmssIG5vdGVQYXRoKTtcclxuXHRcdFx0XHRcdGlmIChmaWxlKSB7XHJcblx0XHRcdFx0XHRcdGxldCBuZXdSZWxMaW5rOiBzdHJpbmcgPSBwYXRoLnJlbGF0aXZlKG5vdGVQYXRoLCBmaWxlLnBhdGgpO1xyXG5cdFx0XHRcdFx0XHRuZXdSZWxMaW5rID0gaXNNYXJrZG93bkxpbmsgPyBVdGlscy5ub3JtYWxpemVQYXRoRm9yTGluayhuZXdSZWxMaW5rKSA6IFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JGaWxlKG5ld1JlbExpbmspO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKG5ld1JlbExpbmsuc3RhcnRzV2l0aChcIi4uL1wiKSkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld1JlbExpbmsgPSBuZXdSZWxMaW5rLnN1YnN0cmluZygzKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Y2hhbmdlZExpbmtzLnB1c2goeyBvbGQ6IGxpbmssIG5ld0xpbms6IG5ld1JlbExpbmsgfSlcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgbm90ZVBhdGggKyBcIiBoYXMgYmFkIGxpbmsgKGZpbGUgZG9lcyBub3QgZXhpc3QpOiBcIiArIGxpbmsubGluayk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgbm90ZVBhdGggKyBcIiBoYXMgYmFkIGxpbmsgKGZvcm1hdCBvZiBsaW5rIGlzIG5vdCBtYXJrZG93biBvciB3aWtpIGxpbmspOiBcIiArIGxpbmsub3JpZ2luYWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGF3YWl0IHRoaXMudXBkYXRlQ2hhbmdlZExpbmtJbk5vdGUobm90ZVBhdGgsIGNoYW5nZWRMaW5rcyk7XHJcblx0XHRyZXR1cm4gY2hhbmdlZExpbmtzO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUNoYW5nZWRFbWJlZEluTm90ZShub3RlUGF0aDogc3RyaW5nLCBjaGFuZ2VkRW1iZWRzOiBFbWJlZENoYW5nZUluZm9bXSkge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlUGF0aCkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgbm90ZUZpbGUgPSB0aGlzLmdldEZpbGVCeVBhdGgobm90ZVBhdGgpO1xyXG5cdFx0aWYgKCFub3RlRmlsZSkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY2FuJ3QgdXBkYXRlIGVtYmVkcyBpbiBub3RlLCBmaWxlIG5vdCBmb3VuZDogXCIgKyBub3RlUGF0aCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQobm90ZUZpbGUpO1xyXG5cdFx0bGV0IGRpcnR5ID0gZmFsc2U7XHJcblxyXG5cdFx0aWYgKGNoYW5nZWRFbWJlZHMgJiYgY2hhbmdlZEVtYmVkcy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGNoYW5nZWRFbWJlZHMpIHtcclxuXHRcdFx0XHRpZiAoZW1iZWQub2xkLmxpbmsgPT0gZW1iZWQubmV3TGluaylcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRpZiAodGhpcy5jaGVja0lzQ29ycmVjdE1hcmtkb3duRW1iZWQoZW1iZWQub2xkLm9yaWdpbmFsKSkge1xyXG5cdFx0XHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZShlbWJlZC5vbGQub3JpZ2luYWwsICchWycgKyBlbWJlZC5vbGQuZGlzcGxheVRleHQgKyAnXScgKyAnKCcgKyBlbWJlZC5uZXdMaW5rICsgJyknKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuY2hlY2tJc0NvcnJlY3RXaWtpRW1iZWQoZW1iZWQub2xkLm9yaWdpbmFsKSkge1xyXG5cdFx0XHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZShlbWJlZC5vbGQub3JpZ2luYWwsICchW1snICsgZW1iZWQubmV3TGluayArICddXScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIG5vdGVQYXRoICsgXCIgaGFzIGJhZCBlbWJlZCAoZm9ybWF0IG9mIGxpbmsgaXMgbm90IG1hZWtkb3duIG9yIHdpa2kgbGluayk6IFwiICsgZW1iZWQub2xkLm9yaWdpbmFsKTtcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJlbWJlZCB1cGRhdGVkIGluIG5vdGUgW25vdGUsIG9sZCBsaW5rLCBuZXcgbGlua106IFxcbiAgIFwiXHJcblx0XHRcdFx0XHQrIG5vdGVGaWxlLnBhdGggKyBcIlxcbiAgIFwiICsgZW1iZWQub2xkLmxpbmsgKyBcIlxcbiAgIFwiICsgZW1iZWQubmV3TGluaylcclxuXHJcblx0XHRcdFx0ZGlydHkgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRpcnR5KVxyXG5cdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobm90ZUZpbGUsIHRleHQpO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIHVwZGF0ZUNoYW5nZWRMaW5rSW5Ob3RlKG5vdGVQYXRoOiBzdHJpbmcsIGNoYW5kZWRMaW5rczogTGlua0NoYW5nZUluZm9bXSkge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlUGF0aCkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgbm90ZUZpbGUgPSB0aGlzLmdldEZpbGVCeVBhdGgobm90ZVBhdGgpO1xyXG5cdFx0aWYgKCFub3RlRmlsZSkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY2FuJ3QgdXBkYXRlIGxpbmtzIGluIG5vdGUsIGZpbGUgbm90IGZvdW5kOiBcIiArIG5vdGVQYXRoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChub3RlRmlsZSk7XHJcblx0XHRsZXQgZGlydHkgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoY2hhbmRlZExpbmtzICYmIGNoYW5kZWRMaW5rcy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAobGV0IGxpbmsgb2YgY2hhbmRlZExpbmtzKSB7XHJcblx0XHRcdFx0aWYgKGxpbmsub2xkLmxpbmsgPT0gbGluay5uZXdMaW5rKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGlmICh0aGlzLmNoZWNrSXNDb3JyZWN0TWFya2Rvd25MaW5rKGxpbmsub2xkLm9yaWdpbmFsKSkge1xyXG5cdFx0XHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZShsaW5rLm9sZC5vcmlnaW5hbCwgJ1snICsgbGluay5vbGQuZGlzcGxheVRleHQgKyAnXScgKyAnKCcgKyBsaW5rLm5ld0xpbmsgKyAnKScpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5jaGVja0lzQ29ycmVjdFdpa2lMaW5rKGxpbmsub2xkLm9yaWdpbmFsKSkge1xyXG5cdFx0XHRcdFx0dGV4dCA9IHRleHQucmVwbGFjZShsaW5rLm9sZC5vcmlnaW5hbCwgJ1tbJyArIGxpbmsubmV3TGluayArICddXScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIG5vdGVQYXRoICsgXCIgaGFzIGJhZCBsaW5rIChmb3JtYXQgb2YgbGluayBpcyBub3QgbWFla2Rvd24gb3Igd2lraSBsaW5rKTogXCIgKyBsaW5rLm9sZC5vcmlnaW5hbCk7XHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY2FjaGVkIGxpbmsgdXBkYXRlZCBpbiBub3RlIFtub3RlLCBvbGQgbGluaywgbmV3IGxpbmtdOiBcXG4gICBcIlxyXG5cdFx0XHRcdFx0KyBub3RlRmlsZS5wYXRoICsgXCJcXG4gICBcIiArIGxpbmsub2xkLmxpbmsgKyBcIlxcbiAgIFwiICsgbGluay5uZXdMaW5rKVxyXG5cclxuXHRcdFx0XHRkaXJ0eSA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGlydHkpXHJcblx0XHRcdGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShub3RlRmlsZSwgdGV4dCk7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgcmVwbGFjZUFsbE5vdGVXaWtpbGlua3NXaXRoTWFya2Rvd25MaW5rcyhub3RlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxMaW5rc0FuZEVtYmVkc0NoYW5nZWRJbmZvPiB7XHJcblx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGVQYXRoKSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGxldCByZXM6IExpbmtzQW5kRW1iZWRzQ2hhbmdlZEluZm8gPSB7XHJcblx0XHRcdGxpbmtzOiBbXSxcclxuXHRcdFx0ZW1iZWRzOiBbXSxcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbm90ZUZpbGUgPSB0aGlzLmdldEZpbGVCeVBhdGgobm90ZVBhdGgpO1xyXG5cdFx0aWYgKCFub3RlRmlsZSkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY2FuJ3QgdXBkYXRlIHdpa2lsaW5rcyBpbiBub3RlLCBmaWxlIG5vdCBmb3VuZDogXCIgKyBub3RlUGF0aCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbGlua3MgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKG5vdGVQYXRoKT8ubGlua3M7XHJcblx0XHRsZXQgZW1iZWRzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlUGF0aCk/LmVtYmVkcztcclxuXHRcdGxldCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChub3RlRmlsZSk7XHJcblx0XHRsZXQgZGlydHkgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoZW1iZWRzKSB7IC8vZW1iZWRzIG11c3QgZ28gZmlyc3QhXHJcblx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmNoZWNrSXNDb3JyZWN0V2lraUVtYmVkKGVtYmVkLm9yaWdpbmFsKSkge1xyXG5cclxuXHRcdFx0XHRcdGxldCBuZXdQYXRoID0gVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsoZW1iZWQubGluaylcclxuXHRcdFx0XHRcdGxldCBuZXdMaW5rID0gJyFbJyArICddJyArICcoJyArIG5ld1BhdGggKyAnKSdcclxuXHRcdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoZW1iZWQub3JpZ2luYWwsIG5ld0xpbmspO1xyXG5cclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwid2lraSBsaW5rIChlbWJlZCkgcmVwbGFjZWQgaW4gbm90ZSBbbm90ZSwgb2xkIGxpbmssIG5ldyBsaW5rXTogXFxuICAgXCJcclxuXHRcdFx0XHRcdFx0KyBub3RlRmlsZS5wYXRoICsgXCJcXG4gICBcIiArIGVtYmVkLm9yaWdpbmFsICsgXCJcXG4gICBcIiArIG5ld0xpbmspXHJcblxyXG5cdFx0XHRcdFx0cmVzLmVtYmVkcy5wdXNoKHsgb2xkOiBlbWJlZCwgbmV3TGluazogbmV3TGluayB9KVxyXG5cclxuXHRcdFx0XHRcdGRpcnR5ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAobGlua3MpIHtcclxuXHRcdFx0Zm9yIChsZXQgbGluayBvZiBsaW5rcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmNoZWNrSXNDb3JyZWN0V2lraUxpbmsobGluay5vcmlnaW5hbCkpIHtcclxuXHRcdFx0XHRcdGxldCBuZXdQYXRoID0gVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsobGluay5saW5rKVxyXG5cclxuXHRcdFx0XHRcdGxldCBmaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChsaW5rLmxpbmssIG5vdGVQYXRoKTtcclxuXHRcdFx0XHRcdGlmIChmaWxlICYmIGZpbGUuZXh0ZW5zaW9uID09IFwibWRcIiAmJiAhbmV3UGF0aC5lbmRzV2l0aChcIi5tZFwiKSlcclxuXHRcdFx0XHRcdFx0bmV3UGF0aCA9IG5ld1BhdGggKyBcIi5tZFwiO1xyXG5cclxuXHRcdFx0XHRcdGxldCBuZXdMaW5rID0gJ1snICsgbGluay5kaXNwbGF5VGV4dCArICddJyArICcoJyArIG5ld1BhdGggKyAnKSdcclxuXHRcdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UobGluay5vcmlnaW5hbCwgbmV3TGluayk7XHJcblxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5jb25zb2xlTG9nUHJlZml4ICsgXCJ3aWtpIGxpbmsgcmVwbGFjZWQgaW4gbm90ZSBbbm90ZSwgb2xkIGxpbmssIG5ldyBsaW5rXTogXFxuICAgXCJcclxuXHRcdFx0XHRcdFx0KyBub3RlRmlsZS5wYXRoICsgXCJcXG4gICBcIiArIGxpbmsub3JpZ2luYWwgKyBcIlxcbiAgIFwiICsgbmV3TGluaylcclxuXHJcblx0XHRcdFx0XHRyZXMubGlua3MucHVzaCh7IG9sZDogbGluaywgbmV3TGluazogbmV3TGluayB9KVxyXG5cclxuXHRcdFx0XHRcdGRpcnR5ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGlydHkpXHJcblx0XHRcdGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShub3RlRmlsZSwgdGV4dCk7XHJcblxyXG5cdFx0cmV0dXJuIHJlcztcclxuXHR9XHJcbn1cclxuIiwiaW1wb3J0IHsgQXBwLCBUQWJzdHJhY3RGaWxlLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgTGlua3NIYW5kbGVyLCBQYXRoQ2hhbmdlSW5mbyB9IGZyb20gJy4vbGlua3MtaGFuZGxlcic7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi91dGlscyc7XHJcbmltcG9ydCB7IHBhdGggfSBmcm9tICcuL3BhdGgnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNb3ZlZEF0dGFjaG1lbnRSZXN1bHQge1xyXG5cdG1vdmVkQXR0YWNobWVudHM6IFBhdGhDaGFuZ2VJbmZvW11cclxuXHRyZW5hbWVkRmlsZXM6IFBhdGhDaGFuZ2VJbmZvW10sXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGaWxlc0hhbmRsZXIge1xyXG5cdGNvbnN0cnVjdG9yKFxyXG5cdFx0cHJpdmF0ZSBhcHA6IEFwcCxcclxuXHRcdHByaXZhdGUgbGg6IExpbmtzSGFuZGxlcixcclxuXHRcdHByaXZhdGUgY29uc29sZUxvZ1ByZWZpeDogc3RyaW5nID0gXCJcIixcclxuXHRcdHByaXZhdGUgaWdub3JlRm9sZGVyczogc3RyaW5nW10gPSBbXSxcclxuXHRcdHByaXZhdGUgaWdub3JlRmlsZXNSZWdleDogUmVnRXhwW10gPSBbXSxcclxuXHQpIHsgfVxyXG5cclxuXHRpc1BhdGhJZ25vcmVkKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG5cdFx0aWYgKHBhdGguc3RhcnRzV2l0aChcIi4vXCIpKVxyXG5cdFx0XHRwYXRoID0gcGF0aC5zdWJzdHJpbmcoMik7XHJcblxyXG5cdFx0Zm9yIChsZXQgZm9sZGVyIG9mIHRoaXMuaWdub3JlRm9sZGVycykge1xyXG5cdFx0XHRpZiAocGF0aC5zdGFydHNXaXRoKGZvbGRlcikpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAobGV0IGZpbGVSZWdleCBvZiB0aGlzLmlnbm9yZUZpbGVzUmVnZXgpIHtcclxuXHRcdFx0bGV0IHRlc3RSZXN1bHQgPSBmaWxlUmVnZXgudGVzdChwYXRoKVxyXG5cdFx0XHQvLyBjb25zb2xlLmxvZyhwYXRoLGZpbGVSZWdleCx0ZXN0UmVzdWx0KVxyXG5cdFx0XHRpZih0ZXN0UmVzdWx0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGFzeW5jIGNyZWF0ZUZvbGRlckZvckF0dGFjaG1lbnRGcm9tTGluayhsaW5rOiBzdHJpbmcsIG93bmluZ05vdGVQYXRoOiBzdHJpbmcpIHtcclxuXHRcdGxldCBuZXdGdWxsUGF0aCA9IHRoaXMubGguZ2V0RnVsbFBhdGhGb3JMaW5rKGxpbmssIG93bmluZ05vdGVQYXRoKTtcclxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZUZvbGRlckZvckF0dGFjaG1lbnRGcm9tUGF0aChuZXdGdWxsUGF0aCk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBjcmVhdGVGb2xkZXJGb3JBdHRhY2htZW50RnJvbVBhdGgoZmlsZVBhdGg6IHN0cmluZykge1xyXG5cdFx0bGV0IG5ld1BhcmVudEZvbGRlciA9IGZpbGVQYXRoLnN1YnN0cmluZygwLCBmaWxlUGF0aC5sYXN0SW5kZXhPZihcIi9cIikpO1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0Ly90b2RvIGNoZWNrIGZpbGRlciBleGlzdFxyXG5cdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIobmV3UGFyZW50Rm9sZGVyKVxyXG5cdFx0fSBjYXRjaCB7IH1cclxuXHR9XHJcblxyXG5cdGdlbmVyYXRlRmlsZUNvcHlOYW1lKG9yaWdpbmFsTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdGxldCBleHQgPSBwYXRoLmV4dG5hbWUob3JpZ2luYWxOYW1lKTtcclxuXHRcdGxldCBiYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUob3JpZ2luYWxOYW1lLCBleHQpO1xyXG5cdFx0bGV0IGRpciA9IHBhdGguZGlybmFtZShvcmlnaW5hbE5hbWUpO1xyXG5cdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCAxMDAwMDA7IGkrKykge1xyXG5cdFx0XHRsZXQgbmV3TmFtZSA9IGRpciArIFwiL1wiICsgYmFzZU5hbWUgKyBcIiBcIiArIGkgKyBleHQ7XHJcblx0XHRcdGxldCBleGlzdEZpbGUgPSB0aGlzLmxoLmdldEZpbGVCeVBhdGgobmV3TmFtZSk7XHJcblx0XHRcdGlmICghZXhpc3RGaWxlKVxyXG5cdFx0XHRcdHJldHVybiBuZXdOYW1lO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFwiXCI7XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdGFzeW5jIG1vdmVDYWNoZWROb3RlQXR0YWNobWVudHMob2xkTm90ZVBhdGg6IHN0cmluZywgbmV3Tm90ZVBhdGg6IHN0cmluZyxcclxuXHRcdGRlbGV0ZUV4aXN0RmlsZXM6IGJvb2xlYW4sIGF0dGFjaG1lbnRzU3ViZm9sZGVyOiBzdHJpbmcpOiBQcm9taXNlPE1vdmVkQXR0YWNobWVudFJlc3VsdD4ge1xyXG5cclxuXHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQob2xkTm90ZVBhdGgpIHx8IHRoaXMuaXNQYXRoSWdub3JlZChuZXdOb3RlUGF0aCkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHQvL3RyeSB0byBnZXQgZW1iZWRzIGZvciBvbGQgb3IgbmV3IHBhdGggKG1ldGFkYXRhQ2FjaGUgY2FuIGJlIHVwZGF0ZWQgb3Igbm90KVxyXG5cdFx0Ly8hISEgdGhpcyBjYW4gcmV0dXJuIHVuZGVmaW5lZCBpZiBub3RlIHdhcyBqdXN0IHVwZGF0ZWRcclxuXHRcdGxldCBlbWJlZHMgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKG5ld05vdGVQYXRoKT8uZW1iZWRzO1xyXG5cdFx0aWYgKCFlbWJlZHMpXHJcblx0XHRcdGVtYmVkcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUob2xkTm90ZVBhdGgpPy5lbWJlZHM7XHJcblxyXG5cdFx0aWYgKCFlbWJlZHMpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgcmVzdWx0OiBNb3ZlZEF0dGFjaG1lbnRSZXN1bHQgPSB7XHJcblx0XHRcdG1vdmVkQXR0YWNobWVudHM6IFtdLFxyXG5cdFx0XHRyZW5hbWVkRmlsZXM6IFtdXHJcblx0XHR9O1xyXG5cclxuXHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRsZXQgbGluayA9IGVtYmVkLmxpbms7XHJcblx0XHRcdGxldCBvbGRMaW5rUGF0aCA9IHRoaXMubGguZ2V0RnVsbFBhdGhGb3JMaW5rKGxpbmssIG9sZE5vdGVQYXRoKTtcclxuXHJcblx0XHRcdGlmIChyZXN1bHQubW92ZWRBdHRhY2htZW50cy5maW5kSW5kZXgoeCA9PiB4Lm9sZFBhdGggPT0gb2xkTGlua1BhdGgpICE9IC0xKVxyXG5cdFx0XHRcdGNvbnRpbnVlOy8vYWxyZWFkeSBtb3ZlZFxyXG5cclxuXHRcdFx0bGV0IGZpbGUgPSB0aGlzLmxoLmdldEZpbGVCeUxpbmsobGluaywgb2xkTm90ZVBhdGgpO1xyXG5cdFx0XHRpZiAoIWZpbGUpIHtcclxuXHRcdFx0XHRmaWxlID0gdGhpcy5saC5nZXRGaWxlQnlMaW5rKGxpbmssIG5ld05vdGVQYXRoKTtcclxuXHRcdFx0XHRpZiAoIWZpbGUpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgb2xkTm90ZVBhdGggKyBcIiBoYXMgYmFkIGVtYmVkIChmaWxlIGRvZXMgbm90IGV4aXN0KTogXCIgKyBsaW5rKTtcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9pZiBhdHRhY2htZW50IG5vdCBpbiB0aGUgbm90ZSBmb2xkZXIsIHNraXAgaXRcclxuXHRcdFx0Ly8gPSBcIi5cIiBtZWFucyB0aGF0IG5vdGUgd2FzIGF0IHJvb3QgcGF0aCwgc28gZG8gbm90IHNraXAgaXRcclxuXHRcdFx0aWYgKHBhdGguZGlybmFtZShvbGROb3RlUGF0aCkgIT0gXCIuXCIgJiYgIXBhdGguZGlybmFtZShvbGRMaW5rUGF0aCkuc3RhcnRzV2l0aChwYXRoLmRpcm5hbWUob2xkTm90ZVBhdGgpKSlcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdGxldCBuZXdMaW5rUGF0aCA9IHRoaXMubGguZ2V0RnVsbFBhdGhGb3JMaW5rKGxpbmssIG5ld05vdGVQYXRoKTtcclxuXHJcblx0XHRcdGlmIChhdHRhY2htZW50c1N1YmZvbGRlci5jb250YWlucyhcIiR7ZmlsZW5hbWV9XCIpKSB7XHJcblx0XHRcdFx0bGV0IG9sZExpbmtQYXRoQnlTZXR0aW5nID0gdGhpcy5nZXROZXdBdHRhY2htZW50UGF0aChmaWxlLnBhdGgsIG9sZE5vdGVQYXRoLCBhdHRhY2htZW50c1N1YmZvbGRlcik7XHJcblx0XHRcdFx0aWYgKG9sZExpbmtQYXRoID09IG9sZExpbmtQYXRoQnlTZXR0aW5nKSB7XHJcblx0XHRcdFx0XHRuZXdMaW5rUGF0aCA9IHRoaXMuZ2V0TmV3QXR0YWNobWVudFBhdGgoZmlsZS5wYXRoLCBuZXdOb3RlUGF0aCwgYXR0YWNobWVudHNTdWJmb2xkZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG5ld0xpbmtQYXRoID09IGZpbGUucGF0aClcclxuXHRcdFx0XHRjb250aW51ZTsgLy9ub3RoaW5nIHRvIGNoYW5nZVxyXG5cclxuXHJcblx0XHRcdGxldCByZXMgPSBhd2FpdCB0aGlzLm1vdmVBdHRhY2htZW50KGZpbGUsIG5ld0xpbmtQYXRoLCBbb2xkTm90ZVBhdGgsIG5ld05vdGVQYXRoXSwgZGVsZXRlRXhpc3RGaWxlcyk7XHJcblx0XHRcdHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzID0gcmVzdWx0Lm1vdmVkQXR0YWNobWVudHMuY29uY2F0KHJlcy5tb3ZlZEF0dGFjaG1lbnRzKTtcclxuXHRcdFx0cmVzdWx0LnJlbmFtZWRGaWxlcyA9IHJlc3VsdC5yZW5hbWVkRmlsZXMuY29uY2F0KHJlcy5yZW5hbWVkRmlsZXMpO1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1cclxuXHJcblx0Z2V0TmV3QXR0YWNobWVudFBhdGgob2xkQXR0YWNobWVudFBhdGg6IHN0cmluZywgbm90ZVBhdGg6IHN0cmluZywgc3ViZm9sZGVyTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdGxldCByZXNvbHZlZFN1YkZvbGRlck5hbWUgPSBzdWJmb2xkZXJOYW1lLnJlcGxhY2UoL1xcJHtmaWxlbmFtZX0vZywgcGF0aC5iYXNlbmFtZShub3RlUGF0aCwgXCIubWRcIikpO1xyXG5cdFx0bGV0IG5ld1BhdGggPSAocmVzb2x2ZWRTdWJGb2xkZXJOYW1lID09IFwiXCIpID8gcGF0aC5kaXJuYW1lKG5vdGVQYXRoKSA6IHBhdGguam9pbihwYXRoLmRpcm5hbWUobm90ZVBhdGgpLCByZXNvbHZlZFN1YkZvbGRlck5hbWUpO1xyXG5cdFx0bmV3UGF0aCA9IFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JGaWxlKHBhdGguam9pbihuZXdQYXRoLCBwYXRoLmJhc2VuYW1lKG9sZEF0dGFjaG1lbnRQYXRoKSkpO1xyXG5cdFx0cmV0dXJuIG5ld1BhdGg7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgY29sbGVjdEF0dGFjaG1lbnRzRm9yQ2FjaGVkTm90ZShub3RlUGF0aDogc3RyaW5nLCBzdWJmb2xkZXJOYW1lOiBzdHJpbmcsXHJcblx0XHRkZWxldGVFeGlzdEZpbGVzOiBib29sZWFuKTogUHJvbWlzZTxNb3ZlZEF0dGFjaG1lbnRSZXN1bHQ+IHtcclxuXHJcblx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGVQYXRoKSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGxldCByZXN1bHQ6IE1vdmVkQXR0YWNobWVudFJlc3VsdCA9IHtcclxuXHRcdFx0bW92ZWRBdHRhY2htZW50czogW10sXHJcblx0XHRcdHJlbmFtZWRGaWxlczogW11cclxuXHRcdH07XHJcblxyXG5cdFx0Ly8hISEgdGhpcyBjYW4gcmV0dXJuIHVuZGVmaW5lZCBpZiBub3RlIHdhcyBqdXN0IHVwZGF0ZWRcclxuXHRcdGxldCBlbWJlZHMgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKG5vdGVQYXRoKT8uZW1iZWRzO1xyXG5cdFx0aWYgKGVtYmVkcykge1xyXG5cdFx0XHRmb3IgKGxldCBlbWJlZCBvZiBlbWJlZHMpIHtcclxuXHRcdFx0XHRsZXQgbGluayA9IGVtYmVkLmxpbms7XHJcblxyXG5cdFx0XHRcdGxldCBmaWxsUGF0aExpbmsgPSB0aGlzLmxoLmdldEZ1bGxQYXRoRm9yTGluayhsaW5rLCBub3RlUGF0aCk7XHJcblx0XHRcdFx0aWYgKHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLmZpbmRJbmRleCh4ID0+IHgub2xkUGF0aCA9PSBmaWxsUGF0aExpbmspICE9IC0xKVxyXG5cdFx0XHRcdFx0Y29udGludWU7IC8vYWxyZWFkeSBtb3ZlZFxyXG5cclxuXHRcdFx0XHRsZXQgZmlsZSA9IHRoaXMubGguZ2V0RmlsZUJ5TGluayhsaW5rLCBub3RlUGF0aClcclxuXHRcdFx0XHRpZiAoIWZpbGUpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5jb25zb2xlTG9nUHJlZml4ICsgbm90ZVBhdGggKyBcIiBoYXMgYmFkIGVtYmVkIChmaWxlIGRvZXMgbm90IGV4aXN0KTogXCIgKyBsaW5rKTtcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblxyXG5cclxuXHRcdFx0XHRsZXQgbmV3UGF0aCA9IHRoaXMuZ2V0TmV3QXR0YWNobWVudFBhdGgoZmlsZS5wYXRoLCBub3RlUGF0aCwgc3ViZm9sZGVyTmFtZSk7XHJcblxyXG5cclxuXHRcdFx0XHRpZiAobmV3UGF0aCA9PSBmaWxlLnBhdGgpIC8vbm90aGluZyB0byBtb3ZlXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0bGV0IHJlcyA9IGF3YWl0IHRoaXMubW92ZUF0dGFjaG1lbnQoZmlsZSwgbmV3UGF0aCwgW25vdGVQYXRoXSwgZGVsZXRlRXhpc3RGaWxlcyk7XHJcblxyXG5cdFx0XHRcdHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzID0gcmVzdWx0Lm1vdmVkQXR0YWNobWVudHMuY29uY2F0KHJlcy5tb3ZlZEF0dGFjaG1lbnRzKTtcclxuXHRcdFx0XHRyZXN1bHQucmVuYW1lZEZpbGVzID0gcmVzdWx0LnJlbmFtZWRGaWxlcy5jb25jYXQocmVzLnJlbmFtZWRGaWxlcyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0bGV0IGxpbmtzID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRDYWNoZShub3RlUGF0aCk/LmxpbmtzO1xyXG5cdFx0aWYgKGxpbmtzKSB7XHJcblx0XHRcdGZvciAobGV0IGwgb2YgbGlua3MpIHtcclxuXHRcdFx0XHRsZXQgbGluayA9IHRoaXMubGguc3BsaXRMaW5rVG9QYXRoQW5kU2VjdGlvbihsLmxpbmspLmxpbms7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rLnN0YXJ0c1dpdGgoXCIjXCIpKSAvL2ludGVybmFsIHNlY3Rpb24gbGlua1xyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGlmIChsaW5rLmVuZHNXaXRoKFwiLm1kXCIpIHx8IGxpbmsuZW5kc1dpdGgoXCIuY2FudmFzXCIpKSAvL2ludGVybmFsIGZpbGUgbGlua1xyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCBmaWxsUGF0aExpbmsgPSB0aGlzLmxoLmdldEZ1bGxQYXRoRm9yTGluayhsaW5rLCBub3RlUGF0aCk7XHJcblx0XHRcdFx0aWYgKHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLmZpbmRJbmRleCh4ID0+IHgub2xkUGF0aCA9PSBmaWxsUGF0aExpbmspICE9IC0xKVxyXG5cdFx0XHRcdFx0Y29udGludWU7Ly9hbHJlYWR5IG1vdmVkXHJcblxyXG5cdFx0XHRcdGxldCBmaWxlID0gdGhpcy5saC5nZXRGaWxlQnlMaW5rKGxpbmssIG5vdGVQYXRoKVxyXG5cdFx0XHRcdGlmICghZmlsZSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcih0aGlzLmNvbnNvbGVMb2dQcmVmaXggKyBub3RlUGF0aCArIFwiIGhhcyBiYWQgbGluayAoZmlsZSBkb2VzIG5vdCBleGlzdCk6IFwiICsgbGluayk7XHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChmaWxlLmV4dGVuc2lvbiA9PSBcIm1kXCIgfHwgZmlsZS5leHRlbnNpb24gPT0gXCJjYW52YXNcIikgLy9pbnRlcm5hbCBmaWxlIGxpbmtcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRsZXQgbmV3UGF0aCA9IHRoaXMuZ2V0TmV3QXR0YWNobWVudFBhdGgoZmlsZS5wYXRoLCBub3RlUGF0aCwgc3ViZm9sZGVyTmFtZSk7XHJcblxyXG5cdFx0XHRcdGlmIChuZXdQYXRoID09IGZpbGUucGF0aCkvL25vdGhpbmcgdG8gbW92ZVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCByZXMgPSBhd2FpdCB0aGlzLm1vdmVBdHRhY2htZW50KGZpbGUsIG5ld1BhdGgsIFtub3RlUGF0aF0sIGRlbGV0ZUV4aXN0RmlsZXMpO1xyXG5cclxuXHRcdFx0XHRyZXN1bHQubW92ZWRBdHRhY2htZW50cyA9IHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLmNvbmNhdChyZXMubW92ZWRBdHRhY2htZW50cyk7XHJcblx0XHRcdFx0cmVzdWx0LnJlbmFtZWRGaWxlcyA9IHJlc3VsdC5yZW5hbWVkRmlsZXMuY29uY2F0KHJlcy5yZW5hbWVkRmlsZXMpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cclxuXHRhc3luYyBtb3ZlQXR0YWNobWVudChmaWxlOiBURmlsZSwgbmV3TGlua1BhdGg6IHN0cmluZywgcGFyZW50Tm90ZVBhdGhzOiBzdHJpbmdbXSwgZGVsZXRlRXhpc3RGaWxlczogYm9vbGVhbik6IFByb21pc2U8TW92ZWRBdHRhY2htZW50UmVzdWx0PiB7XHJcblx0XHRjb25zdCBwYXRoID0gZmlsZS5wYXRoO1xyXG5cclxuXHRcdGxldCByZXN1bHQ6IE1vdmVkQXR0YWNobWVudFJlc3VsdCA9IHtcclxuXHRcdFx0bW92ZWRBdHRhY2htZW50czogW10sXHJcblx0XHRcdHJlbmFtZWRGaWxlczogW11cclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChwYXRoKSlcclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblxyXG5cdFx0aWYgKHBhdGggPT0gbmV3TGlua1BhdGgpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiQ2FuJ3QgbW92ZSBmaWxlLiBTb3VyY2UgYW5kIGRlc3RpbmF0aW9uIHBhdGggdGhlIHNhbWUuXCIpXHJcblx0XHRcdHJldHVybiByZXN1bHQ7XHJcblx0XHR9XHJcblxyXG5cdFx0YXdhaXQgdGhpcy5jcmVhdGVGb2xkZXJGb3JBdHRhY2htZW50RnJvbVBhdGgobmV3TGlua1BhdGgpO1xyXG5cclxuXHRcdGxldCBsaW5rZWROb3RlcyA9IHRoaXMubGguZ2V0Q2FjaGVkTm90ZXNUaGF0SGF2ZUxpbmtUb0ZpbGUocGF0aCk7XHJcblx0XHRpZiAocGFyZW50Tm90ZVBhdGhzKSB7XHJcblx0XHRcdGZvciAobGV0IG5vdGVQYXRoIG9mIHBhcmVudE5vdGVQYXRocykge1xyXG5cdFx0XHRcdGxpbmtlZE5vdGVzLnJlbW92ZShub3RlUGF0aCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAocGF0aCAhPT0gZmlsZS5wYXRoKSB7XHJcblx0XHRcdGNvbnNvbGUud2Fybih0aGlzLmNvbnNvbGVMb2dQcmVmaXggKyBcIkZpbGUgd2FzIG1vdmVkIGFscmVhZHlcIilcclxuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMubW92ZUF0dGFjaG1lbnQoZmlsZSwgbmV3TGlua1BhdGgsIHBhcmVudE5vdGVQYXRocywgZGVsZXRlRXhpc3RGaWxlcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9pZiBubyBvdGhlciBmaWxlIGhhcyBsaW5rIHRvIHRoaXMgZmlsZSAtIHRyeSB0byBtb3ZlIGZpbGVcclxuXHRcdC8vaWYgZmlsZSBhbHJlYWR5IGV4aXN0IGF0IG5ldyBsb2NhdGlvbiAtIGRlbGV0ZSBvciBtb3ZlIHdpdGggbmV3IG5hbWVcclxuXHRcdGlmIChsaW5rZWROb3Rlcy5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRsZXQgZXhpc3RGaWxlID0gdGhpcy5saC5nZXRGaWxlQnlQYXRoKG5ld0xpbmtQYXRoKTtcclxuXHRcdFx0aWYgKCFleGlzdEZpbGUpIHtcclxuXHRcdFx0XHQvL21vdmVcclxuXHRcdFx0XHRjb25zb2xlLmxvZyh0aGlzLmNvbnNvbGVMb2dQcmVmaXggKyBcIm1vdmUgZmlsZSBbZnJvbSwgdG9dOiBcXG4gICBcIiArIHBhdGggKyBcIlxcbiAgIFwiICsgbmV3TGlua1BhdGgpXHJcblx0XHRcdFx0cmVzdWx0Lm1vdmVkQXR0YWNobWVudHMucHVzaCh7IG9sZFBhdGg6IHBhdGgsIG5ld1BhdGg6IG5ld0xpbmtQYXRoIH0pXHJcblx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQucmVuYW1lKGZpbGUsIG5ld0xpbmtQYXRoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAoZGVsZXRlRXhpc3RGaWxlcykge1xyXG5cdFx0XHRcdFx0Ly9kZWxldGVcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiZGVsZXRlIGZpbGU6IFxcbiAgIFwiICsgcGF0aClcclxuXHRcdFx0XHRcdHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLnB1c2goeyBvbGRQYXRoOiBwYXRoLCBuZXdQYXRoOiBuZXdMaW5rUGF0aCB9KVxyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQudHJhc2goZmlsZSwgdHJ1ZSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdC8vbW92ZSB3aXRoIG5ldyBuYW1lXHJcblx0XHRcdFx0XHRsZXQgbmV3RmlsZUNvcHlOYW1lID0gdGhpcy5nZW5lcmF0ZUZpbGVDb3B5TmFtZShuZXdMaW5rUGF0aClcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY29weSBmaWxlIHdpdGggbmV3IG5hbWUgW2Zyb20sIHRvXTogXFxuICAgXCIgKyBwYXRoICsgXCJcXG4gICBcIiArIG5ld0ZpbGVDb3B5TmFtZSlcclxuXHRcdFx0XHRcdHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLnB1c2goeyBvbGRQYXRoOiBwYXRoLCBuZXdQYXRoOiBuZXdGaWxlQ29weU5hbWUgfSlcclxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlbmFtZShmaWxlLCBuZXdGaWxlQ29weU5hbWUpO1xyXG5cdFx0XHRcdFx0cmVzdWx0LnJlbmFtZWRGaWxlcy5wdXNoKHsgb2xkUGF0aDogbmV3TGlua1BhdGgsIG5ld1BhdGg6IG5ld0ZpbGVDb3B5TmFtZSB9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9pZiBzb21lIG90aGVyIGZpbGUgaGFzIGxpbmsgdG8gdGhpcyBmaWxlIC0gdHJ5IHRvIGNvcHkgZmlsZVxyXG5cdFx0Ly9pZiBmaWxlIGFscmVhZHkgZXhpc3QgYXQgbmV3IGxvY2F0aW9uIC0gY29weSBmaWxlIHdpdGggbmV3IG5hbWUgb3IgZG8gbm90aGluZ1xyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGxldCBleGlzdEZpbGUgPSB0aGlzLmxoLmdldEZpbGVCeVBhdGgobmV3TGlua1BhdGgpO1xyXG5cdFx0XHRpZiAoIWV4aXN0RmlsZSkge1xyXG5cdFx0XHRcdC8vY29weVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY29weSBmaWxlIFtmcm9tLCB0b106IFxcbiAgIFwiICsgcGF0aCArIFwiXFxuICAgXCIgKyBuZXdMaW5rUGF0aClcclxuXHRcdFx0XHRyZXN1bHQubW92ZWRBdHRhY2htZW50cy5wdXNoKHsgb2xkUGF0aDogcGF0aCwgbmV3UGF0aDogbmV3TGlua1BhdGggfSlcclxuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5jb3B5KGZpbGUsIG5ld0xpbmtQYXRoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAoZGVsZXRlRXhpc3RGaWxlcykge1xyXG5cdFx0XHRcdFx0Ly9kbyBub3RoaW5nXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdC8vY29weSB3aXRoIG5ldyBuYW1lXHJcblx0XHRcdFx0XHRsZXQgbmV3RmlsZUNvcHlOYW1lID0gdGhpcy5nZW5lcmF0ZUZpbGVDb3B5TmFtZShuZXdMaW5rUGF0aClcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiY29weSBmaWxlIHdpdGggbmV3IG5hbWUgW2Zyb20sIHRvXTogXFxuICAgXCIgKyBwYXRoICsgXCJcXG4gICBcIiArIG5ld0ZpbGVDb3B5TmFtZSlcclxuXHRcdFx0XHRcdHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLnB1c2goeyBvbGRQYXRoOiBmaWxlLnBhdGgsIG5ld1BhdGg6IG5ld0ZpbGVDb3B5TmFtZSB9KVxyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQuY29weShmaWxlLCBuZXdGaWxlQ29weU5hbWUpO1xyXG5cdFx0XHRcdFx0cmVzdWx0LnJlbmFtZWRGaWxlcy5wdXNoKHsgb2xkUGF0aDogbmV3TGlua1BhdGgsIG5ld1BhdGg6IG5ld0ZpbGVDb3B5TmFtZSB9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cclxuXHJcblxyXG5cdGFzeW5jIGRlbGV0ZUVtcHR5Rm9sZGVycyhkaXJOYW1lOiBzdHJpbmcpIHtcclxuXHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQoZGlyTmFtZSkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRpZiAoZGlyTmFtZS5zdGFydHNXaXRoKFwiLi9cIikpXHJcblx0XHRcdGRpck5hbWUgPSBkaXJOYW1lLnN1YnN0cmluZygyKTtcclxuXHJcblxyXG5cdFx0bGV0IGxpc3QgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmxpc3QoZGlyTmFtZSk7XHJcblx0XHRmb3IgKGxldCBmb2xkZXIgb2YgbGlzdC5mb2xkZXJzKSB7XHJcblx0XHRcdGF3YWl0IHRoaXMuZGVsZXRlRW1wdHlGb2xkZXJzKGZvbGRlcilcclxuXHRcdH1cclxuXHJcblx0XHRsaXN0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5saXN0KGRpck5hbWUpO1xyXG5cdFx0aWYgKGxpc3QuZmlsZXMubGVuZ3RoID09IDAgJiYgbGlzdC5mb2xkZXJzLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKHRoaXMuY29uc29sZUxvZ1ByZWZpeCArIFwiZGVsZXRlIGVtcHR5IGZvbGRlcjogXFxuICAgXCIgKyBkaXJOYW1lKVxyXG5cdFx0XHRpZiAoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMoZGlyTmFtZSkpXHJcblx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5ybWRpcihkaXJOYW1lLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRhc3luYyBkZWxldGVVbnVzZWRBdHRhY2htZW50c0ZvckNhY2hlZE5vdGUobm90ZVBhdGg6IHN0cmluZykge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlUGF0aCkpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHQvLyEhISB0aGlzIGNhbiByZXR1cm4gdW5kZWZpbmVkIGlmIG5vdGUgd2FzIGp1c3QgdXBkYXRlZFxyXG5cdFx0bGV0IGVtYmVkcyA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Q2FjaGUobm90ZVBhdGgpPy5lbWJlZHM7XHJcblx0XHRpZiAoZW1iZWRzKSB7XHJcblx0XHRcdGZvciAobGV0IGVtYmVkIG9mIGVtYmVkcykge1xyXG5cdFx0XHRcdGxldCBsaW5rID0gZW1iZWQubGluaztcclxuXHJcblx0XHRcdFx0bGV0IGZ1bGxQYXRoID0gdGhpcy5saC5nZXRGdWxsUGF0aEZvckxpbmsobGluaywgbm90ZVBhdGgpO1xyXG5cdFx0XHRcdGxldCBsaW5rZWROb3RlcyA9IHRoaXMubGguZ2V0Q2FjaGVkTm90ZXNUaGF0SGF2ZUxpbmtUb0ZpbGUoZnVsbFBhdGgpO1xyXG5cdFx0XHRcdGlmIChsaW5rZWROb3Rlcy5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSB0aGlzLmxoLmdldEZpbGVCeUxpbmsobGluaywgbm90ZVBhdGgsIGZhbHNlKTtcclxuXHRcdFx0XHRcdGlmIChmaWxlKSB7XHJcblx0XHRcdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQudHJhc2goZmlsZSwgdHJ1ZSk7XHJcblx0XHRcdFx0XHRcdH0gY2F0Y2ggeyB9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG5cclxuXHJcbiIsImltcG9ydCB7IEFwcCwgUGx1Z2luLCBUQWJzdHJhY3RGaWxlLCBURmlsZSwgRW1iZWRDYWNoZSwgTGlua0NhY2hlLCBOb3RpY2UsIEVkaXRvciwgTWFya2Rvd25WaWV3IH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBQbHVnaW5TZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgU2V0dGluZ1RhYiB9IGZyb20gJy4vc2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4vdXRpbHMnO1xyXG5pbXBvcnQgeyBMaW5rc0hhbmRsZXIsIFBhdGhDaGFuZ2VJbmZvIH0gZnJvbSAnLi9saW5rcy1oYW5kbGVyJztcclxuaW1wb3J0IHsgRmlsZXNIYW5kbGVyLCBNb3ZlZEF0dGFjaG1lbnRSZXN1bHQgfSBmcm9tICcuL2ZpbGVzLWhhbmRsZXInO1xyXG5pbXBvcnQgeyBwYXRoIH0gZnJvbSAnLi9wYXRoJztcclxuXHJcblxyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnNpc3RlbnRBdHRhY2htZW50c0FuZExpbmtzIGV4dGVuZHMgUGx1Z2luIHtcclxuXHRzZXR0aW5nczogUGx1Z2luU2V0dGluZ3M7XHJcblx0bGg6IExpbmtzSGFuZGxlcjtcclxuXHRmaDogRmlsZXNIYW5kbGVyO1xyXG5cclxuXHRyZWNlbnRseVJlbmFtZWRGaWxlczogUGF0aENoYW5nZUluZm9bXSA9IFtdO1xyXG5cdGN1cnJlbnRseVJlbmFtaW5nRmlsZXM6IFBhdGhDaGFuZ2VJbmZvW10gPSBbXTtcclxuXHR0aW1lcklkOiBOb2RlSlMuVGltZW91dDtcclxuXHRyZW5hbWluZ0lzQWN0aXZlID0gZmFsc2U7XHJcblxyXG5cdGFzeW5jIG9ubG9hZCgpIHtcclxuXHRcdGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XHJcblxyXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KFxyXG5cdFx0XHR0aGlzLmFwcC52YXVsdC5vbignZGVsZXRlJywgKGZpbGUpID0+IHRoaXMuaGFuZGxlRGVsZXRlZEZpbGUoZmlsZSkpLFxyXG5cdFx0KTtcclxuXHJcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQoXHJcblx0XHRcdHRoaXMuYXBwLnZhdWx0Lm9uKCdyZW5hbWUnLCAoZmlsZSwgb2xkUGF0aCkgPT4gdGhpcy5oYW5kbGVSZW5hbWVkRmlsZShmaWxlLCBvbGRQYXRoKSksXHJcblx0XHQpO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiAnY29sbGVjdC1hbGwtYXR0YWNobWVudHMnLFxyXG5cdFx0XHRuYW1lOiAnQ29sbGVjdCBBbGwgQXR0YWNobWVudHMnLFxyXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5jb2xsZWN0QWxsQXR0YWNobWVudHMoKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdjb2xsZWN0LWF0dGFjaG1lbnRzLWN1cnJlbnQtbm90ZScsXHJcblx0XHRcdG5hbWU6ICdDb2xsZWN0IEF0dGFjaG1lbnRzIGluIEN1cnJlbnQgTm90ZScsXHJcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIHZpZXc6IE1hcmtkb3duVmlldykgPT4gdGhpcy5jb2xsZWN0QXR0YWNobWVudHNDdXJyZW50Tm90ZShlZGl0b3IsIHZpZXcpXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogJ2RlbGV0ZS1lbXB0eS1mb2xkZXJzJyxcclxuXHRcdFx0bmFtZTogJ0RlbGV0ZSBFbXB0eSBGb2xkZXJzJyxcclxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHRoaXMuZGVsZXRlRW1wdHlGb2xkZXJzKClcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiAnY29udmVydC1hbGwtbGluay1wYXRocy10by1yZWxhdGl2ZScsXHJcblx0XHRcdG5hbWU6ICdDb252ZXJ0IEFsbCBMaW5rIFBhdGhzIHRvIFJlbGF0aXZlJyxcclxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHRoaXMuY29udmVydEFsbExpbmtQYXRoc1RvUmVsYXRpdmUoKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdjb252ZXJ0LWFsbC1lbWJlZC1wYXRocy10by1yZWxhdGl2ZScsXHJcblx0XHRcdG5hbWU6ICdDb252ZXJ0IEFsbCBFbWJlZCBQYXRocyB0byBSZWxhdGl2ZScsXHJcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLmNvbnZlcnRBbGxFbWJlZHNQYXRoc1RvUmVsYXRpdmUoKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdyZXBsYWNlLWFsbC13aWtpbGlua3Mtd2l0aC1tYXJrZG93bi1saW5rcycsXHJcblx0XHRcdG5hbWU6ICdSZXBsYWNlIEFsbCBXaWtpIExpbmtzIHdpdGggTWFya2Rvd24gTGlua3MnLFxyXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5yZXBsYWNlQWxsV2lraWxpbmtzV2l0aE1hcmtkb3duTGlua3MoKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdyZW9yZ2FuaXplLXZhdWx0JyxcclxuXHRcdFx0bmFtZTogJ1Jlb3JnYW5pemUgVmF1bHQnLFxyXG5cdFx0XHRjYWxsYmFjazogKCkgPT4gdGhpcy5yZW9yZ2FuaXplVmF1bHQoKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdjaGVjay1jb25zaXN0ZW5jeScsXHJcblx0XHRcdG5hbWU6ICdDaGVjayBWYXVsdCBjb25zaXN0ZW5jeScsXHJcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB0aGlzLmNoZWNrQ29uc2lzdGVuY3koKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gbWFrZSByZWdleCBmcm9tIGdpdmVuIHN0cmluZ3MgXHJcblx0XHR0aGlzLnNldHRpbmdzLmlnbm9yZUZpbGVzUmVnZXggPSB0aGlzLnNldHRpbmdzLmlnbm9yZUZpbGVzLm1hcCh2YWw9PlJlZ0V4cCh2YWwpKVxyXG5cclxuXHRcdHRoaXMubGggPSBuZXcgTGlua3NIYW5kbGVyKFxyXG5cdFx0XHR0aGlzLmFwcCxcclxuXHRcdFx0XCJDb25zaXN0ZW50IEF0dGFjaG1lbnRzIGFuZCBMaW5rczogXCIsXHJcblx0XHRcdHRoaXMuc2V0dGluZ3MuaWdub3JlRm9sZGVycyxcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5pZ25vcmVGaWxlc1JlZ2V4XHJcblx0XHQpO1xyXG5cclxuXHRcdHRoaXMuZmggPSBuZXcgRmlsZXNIYW5kbGVyKFxyXG5cdFx0XHR0aGlzLmFwcCxcclxuXHRcdFx0dGhpcy5saCxcclxuXHRcdFx0XCJDb25zaXN0ZW50IEF0dGFjaG1lbnRzIGFuZCBMaW5rczogXCIsXHJcblx0XHRcdHRoaXMuc2V0dGluZ3MuaWdub3JlRm9sZGVycyxcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5pZ25vcmVGaWxlc1JlZ2V4XHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0aXNQYXRoSWdub3JlZChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHRcdGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIuL1wiKSlcclxuXHRcdFx0cGF0aCA9IHBhdGguc3Vic3RyaW5nKDIpO1xyXG5cclxuXHRcdGZvciAobGV0IGZvbGRlciBvZiB0aGlzLnNldHRpbmdzLmlnbm9yZUZvbGRlcnMpIHtcclxuXHRcdFx0aWYgKHBhdGguc3RhcnRzV2l0aChmb2xkZXIpKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGxldCBmaWxlUmVnZXggb2YgdGhpcy5zZXR0aW5ncy5pZ25vcmVGaWxlc1JlZ2V4KSB7XHJcblx0XHRcdGlmIChmaWxlUmVnZXgudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgaGFuZGxlRGVsZXRlZEZpbGUoZmlsZTogVEFic3RyYWN0RmlsZSkge1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChmaWxlLnBhdGgpKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IGZpbGVFeHQgPSBmaWxlLnBhdGguc3Vic3RyaW5nKGZpbGUucGF0aC5sYXN0SW5kZXhPZihcIi5cIikpO1xyXG5cdFx0aWYgKGZpbGVFeHQgPT0gXCIubWRcIikge1xyXG5cdFx0XHRpZiAodGhpcy5zZXR0aW5ncy5kZWxldGVBdHRhY2htZW50c1dpdGhOb3RlKSB7XHJcblx0XHRcdFx0YXdhaXQgdGhpcy5maC5kZWxldGVVbnVzZWRBdHRhY2htZW50c0ZvckNhY2hlZE5vdGUoZmlsZS5wYXRoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9kZWxldGUgY2hpbGQgZm9sZGVycyAoZG8gbm90IGRlbGV0ZSBwYXJlbnQpXHJcblx0XHRcdGlmICh0aGlzLnNldHRpbmdzLmRlbGV0ZUVtcHR5Rm9sZGVycykge1xyXG5cdFx0XHRcdGlmIChhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyhwYXRoLmRpcm5hbWUoZmlsZS5wYXRoKSkpIHtcclxuXHRcdFx0XHRcdGxldCBsaXN0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5saXN0KHBhdGguZGlybmFtZShmaWxlLnBhdGgpKTtcclxuXHRcdFx0XHRcdGZvciAobGV0IGZvbGRlciBvZiBsaXN0LmZvbGRlcnMpIHtcclxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5maC5kZWxldGVFbXB0eUZvbGRlcnMoZm9sZGVyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGFzeW5jIGhhbmRsZVJlbmFtZWRGaWxlKGZpbGU6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZykge1xyXG5cdFx0dGhpcy5yZWNlbnRseVJlbmFtZWRGaWxlcy5wdXNoKHsgb2xkUGF0aDogb2xkUGF0aCwgbmV3UGF0aDogZmlsZS5wYXRoIH0pO1xyXG5cclxuXHRcdGNsZWFyVGltZW91dCh0aGlzLnRpbWVySWQpO1xyXG5cdFx0dGhpcy50aW1lcklkID0gc2V0VGltZW91dCgoKSA9PiB7IHRoaXMuSGFuZGxlUmVjZW50bHlSZW5hbWVkRmlsZXMoKSB9LCAzMDAwKTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIEhhbmRsZVJlY2VudGx5UmVuYW1lZEZpbGVzKCkge1xyXG5cdFx0aWYgKCF0aGlzLnJlY2VudGx5UmVuYW1lZEZpbGVzIHx8IHRoaXMucmVjZW50bHlSZW5hbWVkRmlsZXMubGVuZ3RoID09IDApIC8vbm90aGluZyB0byByZW5hbWVcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGlmICh0aGlzLnJlbmFtaW5nSXNBY3RpdmUpIC8vYWxyZWFkeSBzdGFydGVkXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR0aGlzLnJlbmFtaW5nSXNBY3RpdmUgPSB0cnVlO1xyXG5cclxuXHRcdHRoaXMuY3VycmVudGx5UmVuYW1pbmdGaWxlcyA9IHRoaXMucmVjZW50bHlSZW5hbWVkRmlsZXM7IC8vY2xlYXIgYXJyYXkgZm9yIHB1c2hpbmcgbmV3IGZpbGVzIGFzeW5jXHJcblx0XHR0aGlzLnJlY2VudGx5UmVuYW1lZEZpbGVzID0gW107XHJcblxyXG5cdFx0bmV3IE5vdGljZShcIkZpeGluZyBjb25zaXN0ZW5jeSBmb3IgXCIgKyB0aGlzLmN1cnJlbnRseVJlbmFtaW5nRmlsZXMubGVuZ3RoICsgXCIgcmVuYW1lZCBmaWxlc1wiICsgXCIuLi5cIik7XHJcblx0XHRjb25zb2xlLmxvZyhcIkNvbnNpc3RlbnQgQXR0YWNobWVudHMgYW5kIExpbmtzOlxcbkZpeGluZyBjb25zaXN0ZW5jeSBmb3IgXCIgKyB0aGlzLmN1cnJlbnRseVJlbmFtaW5nRmlsZXMubGVuZ3RoICsgXCIgcmVuYW1lZCBmaWxlc1wiICsgXCIuLi5cIik7XHJcblxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0Zm9yIChsZXQgZmlsZSBvZiB0aGlzLmN1cnJlbnRseVJlbmFtaW5nRmlsZXMpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKGZpbGUubmV3UGF0aCkgfHwgdGhpcy5pc1BhdGhJZ25vcmVkKGZpbGUub2xkUGF0aCkpXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0XHRcdC8vIGF3YWl0IFV0aWxzLmRlbGF5KDEwKTsgLy93YWl0aW5nIGZvciB1cGRhdGUgdmF1bHRcclxuXHJcblx0XHRcdFx0bGV0IHJlc3VsdDogTW92ZWRBdHRhY2htZW50UmVzdWx0O1xyXG5cclxuXHRcdFx0XHRsZXQgZmlsZUV4dCA9IGZpbGUub2xkUGF0aC5zdWJzdHJpbmcoZmlsZS5vbGRQYXRoLmxhc3RJbmRleE9mKFwiLlwiKSk7XHJcblxyXG5cdFx0XHRcdGlmIChmaWxlRXh0ID09IFwiLm1kXCIpIHtcclxuXHRcdFx0XHRcdC8vIGF3YWl0IFV0aWxzLmRlbGF5KDUwMCk7Ly93YWl0aW5nIGZvciB1cGRhdGUgbWV0YWRhdGFDYWNoZVxyXG5cclxuXHRcdFx0XHRcdGlmICgocGF0aC5kaXJuYW1lKGZpbGUub2xkUGF0aCkgIT0gcGF0aC5kaXJuYW1lKGZpbGUubmV3UGF0aCkpIHx8ICh0aGlzLnNldHRpbmdzLmF0dGFjaG1lbnRzU3ViZm9sZGVyLmNvbnRhaW5zKFwiJHtmaWxlbmFtZX1cIikpKSB7XHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNldHRpbmdzLm1vdmVBdHRhY2htZW50c1dpdGhOb3RlKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gYXdhaXQgdGhpcy5maC5tb3ZlQ2FjaGVkTm90ZUF0dGFjaG1lbnRzKFxyXG5cdFx0XHRcdFx0XHRcdFx0ZmlsZS5vbGRQYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZmlsZS5uZXdQYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5kZWxldGVFeGlzdEZpbGVzV2hlbk1vdmVOb3RlLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5hdHRhY2htZW50c1N1YmZvbGRlclxyXG5cdFx0XHRcdFx0XHRcdClcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuc2V0dGluZ3MudXBkYXRlTGlua3MgJiYgcmVzdWx0KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgY2hhbmdlZEZpbGVzID0gcmVzdWx0LnJlbmFtZWRGaWxlcy5jb25jYXQocmVzdWx0Lm1vdmVkQXR0YWNobWVudHMpO1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNoYW5nZWRGaWxlcy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IHRoaXMubGgudXBkYXRlQ2hhbmdlZFBhdGhzSW5Ob3RlKGZpbGUubmV3UGF0aCwgY2hhbmdlZEZpbGVzKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc2V0dGluZ3MudXBkYXRlTGlua3MpIHtcclxuXHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmxoLnVwZGF0ZUludGVybmFsTGlua3NJbk1vdmVkTm90ZShmaWxlLm9sZFBhdGgsIGZpbGUubmV3UGF0aCwgdGhpcy5zZXR0aW5ncy5tb3ZlQXR0YWNobWVudHNXaXRoTm90ZSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Ly9kZWxldGUgY2hpbGQgZm9sZGVycyAoZG8gbm90IGRlbGV0ZSBwYXJlbnQpXHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNldHRpbmdzLmRlbGV0ZUVtcHR5Rm9sZGVycykge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyhwYXRoLmRpcm5hbWUoZmlsZS5vbGRQYXRoKSkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBsaXN0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5saXN0KHBhdGguZGlybmFtZShmaWxlLm9sZFBhdGgpKTtcclxuXHRcdFx0XHRcdFx0XHRcdGZvciAobGV0IGZvbGRlciBvZiBsaXN0LmZvbGRlcnMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5maC5kZWxldGVFbXB0eUZvbGRlcnMoZm9sZGVyKTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGxldCB1cGRhdGVBbHRzID0gdGhpcy5zZXR0aW5ncy5jaGFuZ2VOb3RlQmFja2xpbmtzQWx0ICYmIGZpbGVFeHQgPT0gXCIubWRcIjtcclxuXHRcdFx0XHRpZiAodGhpcy5zZXR0aW5ncy51cGRhdGVMaW5rcykge1xyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5saC51cGRhdGVMaW5rc1RvUmVuYW1lZEZpbGUoZmlsZS5vbGRQYXRoLCBmaWxlLm5ld1BhdGgsIHVwZGF0ZUFsdHMsIHRoaXMuc2V0dGluZ3MudXNlQnVpbHRJbk9ic2lkaWFuTGlua0NhY2hpbmcpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHJlc3VsdCAmJiByZXN1bHQubW92ZWRBdHRhY2htZW50cyAmJiByZXN1bHQubW92ZWRBdHRhY2htZW50cy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0XHRuZXcgTm90aWNlKFwiTW92ZWQgXCIgKyByZXN1bHQubW92ZWRBdHRhY2htZW50cy5sZW5ndGggKyBcIiBhdHRhY2htZW50XCIgKyAocmVzdWx0Lm1vdmVkQXR0YWNobWVudHMubGVuZ3RoID4gMSA/IFwic1wiIDogXCJcIikpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKFwiQ29uc2lzdGVudCBBdHRhY2htZW50cyBhbmQgTGlua3M6IFxcblwiICsgZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0bmV3IE5vdGljZShcIkZpeGluZyBDb25zaXN0ZW5jeSBDb21wbGV0ZVwiKTtcclxuXHRcdGNvbnNvbGUubG9nKFwiQ29uc2lzdGVudCBBdHRhY2htZW50cyBhbmQgTGlua3M6XFxuRml4aW5nIGNvbnNpc3RlbmN5IGNvbXBsZXRlXCIpO1xyXG5cclxuXHRcdHRoaXMucmVuYW1pbmdJc0FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuXHRcdGlmICh0aGlzLnJlY2VudGx5UmVuYW1lZEZpbGVzICYmIHRoaXMucmVjZW50bHlSZW5hbWVkRmlsZXMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRjbGVhclRpbWVvdXQodGhpcy50aW1lcklkKTtcclxuXHRcdFx0dGhpcy50aW1lcklkID0gc2V0VGltZW91dCgoKSA9PiB7IHRoaXMuSGFuZGxlUmVjZW50bHlSZW5hbWVkRmlsZXMoKSB9LCA1MDApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIGNvbGxlY3RBdHRhY2htZW50c0N1cnJlbnROb3RlKGVkaXRvcjogRWRpdG9yLCB2aWV3OiBNYXJrZG93blZpZXcpIHtcclxuXHRcdGxldCBub3RlID0gdmlldy5maWxlO1xyXG5cdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKSB7XHJcblx0XHRcdG5ldyBOb3RpY2UoXCJOb3RlIHBhdGggaXMgaWdub3JlZFwiKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByZXN1bHQgPSBhd2FpdCB0aGlzLmZoLmNvbGxlY3RBdHRhY2htZW50c0ZvckNhY2hlZE5vdGUoXHJcblx0XHRcdG5vdGUucGF0aCxcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5hdHRhY2htZW50c1N1YmZvbGRlcixcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5kZWxldGVFeGlzdEZpbGVzV2hlbk1vdmVOb3RlKTtcclxuXHJcblx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzICYmIHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0YXdhaXQgdGhpcy5saC51cGRhdGVDaGFuZ2VkUGF0aHNJbk5vdGUobm90ZS5wYXRoLCByZXN1bHQubW92ZWRBdHRhY2htZW50cylcclxuXHRcdH1cclxuXHJcblx0XHRpZiAocmVzdWx0Lm1vdmVkQXR0YWNobWVudHMubGVuZ3RoID09IDApXHJcblx0XHRcdG5ldyBOb3RpY2UoXCJObyBmaWxlcyBmb3VuZCB0aGF0IG5lZWQgdG8gYmUgbW92ZWRcIik7XHJcblx0XHRlbHNlXHJcblx0XHRcdG5ldyBOb3RpY2UoXCJNb3ZlZCBcIiArIHJlc3VsdC5tb3ZlZEF0dGFjaG1lbnRzLmxlbmd0aCArIFwiIGF0dGFjaG1lbnRcIiArIChyZXN1bHQubW92ZWRBdHRhY2htZW50cy5sZW5ndGggPiAxID8gXCJzXCIgOiBcIlwiKSk7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgY29sbGVjdEFsbEF0dGFjaG1lbnRzKCkge1xyXG5cdFx0bGV0IG1vdmVkQXR0YWNobWVudHNDb3VudCA9IDA7XHJcblx0XHRsZXQgcHJvY2Vzc2VkTm90ZXNDb3VudCA9IDA7XHJcblxyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCByZXN1bHQgPSBhd2FpdCB0aGlzLmZoLmNvbGxlY3RBdHRhY2htZW50c0ZvckNhY2hlZE5vdGUoXHJcblx0XHRcdFx0XHRub3RlLnBhdGgsXHJcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmF0dGFjaG1lbnRzU3ViZm9sZGVyLFxyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5kZWxldGVFeGlzdEZpbGVzV2hlbk1vdmVOb3RlKTtcclxuXHJcblxyXG5cdFx0XHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0Lm1vdmVkQXR0YWNobWVudHMgJiYgcmVzdWx0Lm1vdmVkQXR0YWNobWVudHMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5saC51cGRhdGVDaGFuZ2VkUGF0aHNJbk5vdGUobm90ZS5wYXRoLCByZXN1bHQubW92ZWRBdHRhY2htZW50cylcclxuXHRcdFx0XHRcdG1vdmVkQXR0YWNobWVudHNDb3VudCArPSByZXN1bHQubW92ZWRBdHRhY2htZW50cy5sZW5ndGg7XHJcblx0XHRcdFx0XHRwcm9jZXNzZWROb3Rlc0NvdW50Kys7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG1vdmVkQXR0YWNobWVudHNDb3VudCA9PSAwKVxyXG5cdFx0XHRuZXcgTm90aWNlKFwiTm8gZmlsZXMgZm91bmQgdGhhdCBuZWVkIHRvIGJlIG1vdmVkXCIpO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRuZXcgTm90aWNlKFwiTW92ZWQgXCIgKyBtb3ZlZEF0dGFjaG1lbnRzQ291bnQgKyBcIiBhdHRhY2htZW50XCIgKyAobW92ZWRBdHRhY2htZW50c0NvdW50ID4gMSA/IFwic1wiIDogXCJcIilcclxuXHRcdFx0XHQrIFwiIGZyb20gXCIgKyBwcm9jZXNzZWROb3Rlc0NvdW50ICsgXCIgbm90ZVwiICsgKHByb2Nlc3NlZE5vdGVzQ291bnQgPiAxID8gXCJzXCIgOiBcIlwiKSk7XHJcblx0fVxyXG5cclxuXHJcblx0YXN5bmMgY29udmVydEFsbEVtYmVkc1BhdGhzVG9SZWxhdGl2ZSgpIHtcclxuXHRcdGxldCBjaGFuZ2VkRW1iZWRDb3VudCA9IDA7XHJcblx0XHRsZXQgcHJvY2Vzc2VkTm90ZXNDb3VudCA9IDA7XHJcblxyXG5cdFx0bGV0IG5vdGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG5cclxuXHRcdGlmIChub3Rlcykge1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIG9mIG5vdGVzKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuaXNQYXRoSWdub3JlZChub3RlLnBhdGgpKVxyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblxyXG5cdFx0XHRcdGxldCByZXN1bHQgPSBhd2FpdCB0aGlzLmxoLmNvbnZlcnRBbGxOb3RlRW1iZWRzUGF0aHNUb1JlbGF0aXZlKG5vdGUucGF0aCk7XHJcblxyXG5cdFx0XHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRcdGNoYW5nZWRFbWJlZENvdW50ICs9IHJlc3VsdC5sZW5ndGg7XHJcblx0XHRcdFx0XHRwcm9jZXNzZWROb3Rlc0NvdW50Kys7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGNoYW5nZWRFbWJlZENvdW50ID09IDApXHJcblx0XHRcdG5ldyBOb3RpY2UoXCJObyBlbWJlZHMgZm91bmQgdGhhdCBuZWVkIHRvIGJlIGNvbnZlcnRlZFwiKTtcclxuXHRcdGVsc2VcclxuXHRcdFx0bmV3IE5vdGljZShcIkNvbnZlcnRlZCBcIiArIGNoYW5nZWRFbWJlZENvdW50ICsgXCIgZW1iZWRcIiArIChjaGFuZ2VkRW1iZWRDb3VudCA+IDEgPyBcInNcIiA6IFwiXCIpXHJcblx0XHRcdFx0KyBcIiBmcm9tIFwiICsgcHJvY2Vzc2VkTm90ZXNDb3VudCArIFwiIG5vdGVcIiArIChwcm9jZXNzZWROb3Rlc0NvdW50ID4gMSA/IFwic1wiIDogXCJcIikpO1xyXG5cdH1cclxuXHJcblxyXG5cdGFzeW5jIGNvbnZlcnRBbGxMaW5rUGF0aHNUb1JlbGF0aXZlKCkge1xyXG5cdFx0bGV0IGNoYW5nZWRMaW5rc0NvdW50ID0gMDtcclxuXHRcdGxldCBwcm9jZXNzZWROb3Rlc0NvdW50ID0gMDtcclxuXHJcblx0XHRsZXQgbm90ZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG5cdFx0aWYgKG5vdGVzKSB7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgb2Ygbm90ZXMpIHtcclxuXHRcdFx0XHRpZiAodGhpcy5pc1BhdGhJZ25vcmVkKG5vdGUucGF0aCkpXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHJcblx0XHRcdFx0bGV0IHJlc3VsdCA9IGF3YWl0IHRoaXMubGguY29udmVydEFsbE5vdGVMaW5rc1BhdGhzVG9SZWxhdGl2ZShub3RlLnBhdGgpO1xyXG5cclxuXHRcdFx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0XHRjaGFuZ2VkTGlua3NDb3VudCArPSByZXN1bHQubGVuZ3RoO1xyXG5cdFx0XHRcdFx0cHJvY2Vzc2VkTm90ZXNDb3VudCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjaGFuZ2VkTGlua3NDb3VudCA9PSAwKVxyXG5cdFx0XHRuZXcgTm90aWNlKFwiTm8gbGlua3MgZm91bmQgdGhhdCBuZWVkIHRvIGJlIGNvbnZlcnRlZFwiKTtcclxuXHRcdGVsc2VcclxuXHRcdFx0bmV3IE5vdGljZShcIkNvbnZlcnRlZCBcIiArIGNoYW5nZWRMaW5rc0NvdW50ICsgXCIgbGlua1wiICsgKGNoYW5nZWRMaW5rc0NvdW50ID4gMSA/IFwic1wiIDogXCJcIilcclxuXHRcdFx0XHQrIFwiIGZyb20gXCIgKyBwcm9jZXNzZWROb3Rlc0NvdW50ICsgXCIgbm90ZVwiICsgKHByb2Nlc3NlZE5vdGVzQ291bnQgPiAxID8gXCJzXCIgOiBcIlwiKSk7XHJcblx0fVxyXG5cclxuXHRhc3luYyByZXBsYWNlQWxsV2lraWxpbmtzV2l0aE1hcmtkb3duTGlua3MoKSB7XHJcblx0XHRsZXQgY2hhbmdlZExpbmtzQ291bnQgPSAwO1xyXG5cdFx0bGV0IHByb2Nlc3NlZE5vdGVzQ291bnQgPSAwO1xyXG5cclxuXHRcdGxldCBub3RlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuXHJcblx0XHRpZiAobm90ZXMpIHtcclxuXHRcdFx0Zm9yIChsZXQgbm90ZSBvZiBub3Rlcykge1xyXG5cdFx0XHRcdGlmICh0aGlzLmlzUGF0aElnbm9yZWQobm90ZS5wYXRoKSlcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gYXdhaXQgdGhpcy5saC5yZXBsYWNlQWxsTm90ZVdpa2lsaW5rc1dpdGhNYXJrZG93bkxpbmtzKG5vdGUucGF0aCk7XHJcblxyXG5cdFx0XHRcdGlmIChyZXN1bHQgJiYgKHJlc3VsdC5saW5rcy5sZW5ndGggPiAwIHx8IHJlc3VsdC5lbWJlZHMubGVuZ3RoID4gMCkpIHtcclxuXHRcdFx0XHRcdGNoYW5nZWRMaW5rc0NvdW50ICs9IHJlc3VsdC5saW5rcy5sZW5ndGg7XHJcblx0XHRcdFx0XHRjaGFuZ2VkTGlua3NDb3VudCArPSByZXN1bHQuZW1iZWRzLmxlbmd0aDtcclxuXHRcdFx0XHRcdHByb2Nlc3NlZE5vdGVzQ291bnQrKztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY2hhbmdlZExpbmtzQ291bnQgPT0gMClcclxuXHRcdFx0bmV3IE5vdGljZShcIk5vIHdpa2kgbGlua3MgZm91bmQgdGhhdCBuZWVkIHRvIGJlIHJlcGxhY2VkXCIpO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRuZXcgTm90aWNlKFwiUmVwbGFjZWQgXCIgKyBjaGFuZ2VkTGlua3NDb3VudCArIFwiIHdpa2lsaW5rXCIgKyAoY2hhbmdlZExpbmtzQ291bnQgPiAxID8gXCJzXCIgOiBcIlwiKVxyXG5cdFx0XHRcdCsgXCIgZnJvbSBcIiArIHByb2Nlc3NlZE5vdGVzQ291bnQgKyBcIiBub3RlXCIgKyAocHJvY2Vzc2VkTm90ZXNDb3VudCA+IDEgPyBcInNcIiA6IFwiXCIpKTtcclxuXHR9XHJcblxyXG5cdGRlbGV0ZUVtcHR5Rm9sZGVycygpIHtcclxuXHRcdHRoaXMuZmguZGVsZXRlRW1wdHlGb2xkZXJzKFwiL1wiKVxyXG5cdH1cclxuXHJcblx0YXN5bmMgY2hlY2tDb25zaXN0ZW5jeSgpIHtcclxuXHRcdGxldCBiYWRMaW5rcyA9IHRoaXMubGguZ2V0QWxsQmFkTGlua3MoKTtcclxuXHRcdGxldCBiYWRTZWN0aW9uTGlua3MgPSBhd2FpdCB0aGlzLmxoLmdldEFsbEJhZFNlY3Rpb25MaW5rcygpO1xyXG5cdFx0bGV0IGJhZEVtYmVkcyA9IHRoaXMubGguZ2V0QWxsQmFkRW1iZWRzKCk7XHJcblx0XHRsZXQgd2lraUxpbmtzID0gdGhpcy5saC5nZXRBbGxXaWtpTGlua3MoKTtcclxuXHRcdGxldCB3aWtpRW1iZWRzID0gdGhpcy5saC5nZXRBbGxXaWtpRW1iZWRzKCk7XHJcblxyXG5cdFx0bGV0IHRleHQgPSBcIlwiO1xyXG5cclxuXHRcdGxldCBiYWRMaW5rc0NvdW50ID0gT2JqZWN0LmtleXMoYmFkTGlua3MpLmxlbmd0aDtcclxuXHRcdGxldCBiYWRFbWJlZHNDb3VudCA9IE9iamVjdC5rZXlzKGJhZEVtYmVkcykubGVuZ3RoO1xyXG5cdFx0bGV0IGJhZFNlY3Rpb25MaW5rc0NvdW50ID0gT2JqZWN0LmtleXMoYmFkU2VjdGlvbkxpbmtzKS5sZW5ndGg7XHJcblx0XHRsZXQgd2lraUxpbmtzQ291bnQgPSBPYmplY3Qua2V5cyh3aWtpTGlua3MpLmxlbmd0aDtcclxuXHRcdGxldCB3aWtpRW1iZWRzQ291bnQgPSBPYmplY3Qua2V5cyh3aWtpRW1iZWRzKS5sZW5ndGg7XHJcblxyXG5cdFx0aWYgKGJhZExpbmtzQ291bnQgPiAwKSB7XHJcblx0XHRcdHRleHQgKz0gXCIjIEJhZCBsaW5rcyAoXCIgKyBiYWRMaW5rc0NvdW50ICsgXCIgZmlsZXMpXFxuXCI7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgaW4gYmFkTGlua3MpIHtcclxuXHRcdFx0XHR0ZXh0ICs9IFwiW1wiICsgbm90ZSArIFwiXShcIiArIFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JMaW5rKG5vdGUpICsgXCIpOiBcIiArIFwiXFxuXCJcclxuXHRcdFx0XHRmb3IgKGxldCBsaW5rIG9mIGJhZExpbmtzW25vdGVdKSB7XHJcblx0XHRcdFx0XHR0ZXh0ICs9IFwiLSAobGluZSBcIiArIChsaW5rLnBvc2l0aW9uLnN0YXJ0LmxpbmUgKyAxKSArIFwiKTogYFwiICsgbGluay5saW5rICsgXCJgXFxuXCI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRleHQgKz0gXCJcXG5cXG5cIlxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0ZXh0ICs9IFwiIyBCYWQgbGlua3MgXFxuXCI7XHJcblx0XHRcdHRleHQgKz0gXCJObyBwcm9ibGVtcyBmb3VuZFxcblxcblwiXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGlmIChiYWRTZWN0aW9uTGlua3NDb3VudCA+IDApIHtcclxuXHRcdFx0dGV4dCArPSBcIlxcblxcbiMgQmFkIG5vdGUgbGluayBzZWN0aW9ucyAoXCIgKyBiYWRTZWN0aW9uTGlua3NDb3VudCArIFwiIGZpbGVzKVxcblwiO1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIGluIGJhZFNlY3Rpb25MaW5rcykge1xyXG5cdFx0XHRcdHRleHQgKz0gXCJbXCIgKyBub3RlICsgXCJdKFwiICsgVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsobm90ZSkgKyBcIik6IFwiICsgXCJcXG5cIlxyXG5cdFx0XHRcdGZvciAobGV0IGxpbmsgb2YgYmFkU2VjdGlvbkxpbmtzW25vdGVdKSB7XHJcblx0XHRcdFx0XHRsZXQgbGkgPSB0aGlzLmxoLnNwbGl0TGlua1RvUGF0aEFuZFNlY3Rpb24obGluay5saW5rKTtcclxuXHRcdFx0XHRcdGxldCBzZWN0aW9uID0gVXRpbHMubm9ybWFsaXplTGlua1NlY3Rpb24obGkuc2VjdGlvbik7XHJcblx0XHRcdFx0XHR0ZXh0ICs9IFwiLSAobGluZSBcIiArIChsaW5rLnBvc2l0aW9uLnN0YXJ0LmxpbmUgKyAxKSArIFwiKTogYFwiICsgbGkubGluayArIFwiI1wiICsgc2VjdGlvbiArIFwiYFxcblwiO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0ZXh0ICs9IFwiXFxuXFxuXCJcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGV4dCArPSBcIlxcblxcbiMgQmFkIG5vdGUgbGluayBzZWN0aW9uc1xcblwiXHJcblx0XHRcdHRleHQgKz0gXCJObyBwcm9ibGVtcyBmb3VuZFxcblxcblwiXHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGlmIChiYWRFbWJlZHNDb3VudCA+IDApIHtcclxuXHRcdFx0dGV4dCArPSBcIlxcblxcbiMgQmFkIGVtYmVkcyAoXCIgKyBiYWRFbWJlZHNDb3VudCArIFwiIGZpbGVzKVxcblwiO1xyXG5cdFx0XHRmb3IgKGxldCBub3RlIGluIGJhZEVtYmVkcykge1xyXG5cdFx0XHRcdHRleHQgKz0gXCJbXCIgKyBub3RlICsgXCJdKFwiICsgVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsobm90ZSkgKyBcIik6IFwiICsgXCJcXG5cIlxyXG5cdFx0XHRcdGZvciAobGV0IGxpbmsgb2YgYmFkRW1iZWRzW25vdGVdKSB7XHJcblx0XHRcdFx0XHR0ZXh0ICs9IFwiLSAobGluZSBcIiArIChsaW5rLnBvc2l0aW9uLnN0YXJ0LmxpbmUgKyAxKSArIFwiKTogYFwiICsgbGluay5saW5rICsgXCJgXFxuXCI7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRleHQgKz0gXCJcXG5cXG5cIlxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0ZXh0ICs9IFwiXFxuXFxuIyBCYWQgZW1iZWRzIFxcblwiO1xyXG5cdFx0XHR0ZXh0ICs9IFwiTm8gcHJvYmxlbXMgZm91bmRcXG5cXG5cIlxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRpZiAod2lraUxpbmtzQ291bnQgPiAwKSB7XHJcblx0XHRcdHRleHQgKz0gXCIjIFdpa2kgbGlua3MgKFwiICsgd2lraUxpbmtzQ291bnQgKyBcIiBmaWxlcylcXG5cIjtcclxuXHRcdFx0Zm9yIChsZXQgbm90ZSBpbiB3aWtpTGlua3MpIHtcclxuXHRcdFx0XHR0ZXh0ICs9IFwiW1wiICsgbm90ZSArIFwiXShcIiArIFV0aWxzLm5vcm1hbGl6ZVBhdGhGb3JMaW5rKG5vdGUpICsgXCIpOiBcIiArIFwiXFxuXCJcclxuXHRcdFx0XHRmb3IgKGxldCBsaW5rIG9mIHdpa2lMaW5rc1tub3RlXSkge1xyXG5cdFx0XHRcdFx0dGV4dCArPSBcIi0gKGxpbmUgXCIgKyAobGluay5wb3NpdGlvbi5zdGFydC5saW5lICsgMSkgKyBcIik6IGBcIiArIGxpbmsub3JpZ2luYWwgKyBcImBcXG5cIjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGV4dCArPSBcIlxcblxcblwiXHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRleHQgKz0gXCIjIFdpa2kgbGlua3MgXFxuXCI7XHJcblx0XHRcdHRleHQgKz0gXCJObyBwcm9ibGVtcyBmb3VuZFxcblxcblwiXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHdpa2lFbWJlZHNDb3VudCA+IDApIHtcclxuXHRcdFx0dGV4dCArPSBcIlxcblxcbiMgV2lraSBlbWJlZHMgKFwiICsgd2lraUVtYmVkc0NvdW50ICsgXCIgZmlsZXMpXFxuXCI7XHJcblx0XHRcdGZvciAobGV0IG5vdGUgaW4gd2lraUVtYmVkcykge1xyXG5cdFx0XHRcdHRleHQgKz0gXCJbXCIgKyBub3RlICsgXCJdKFwiICsgVXRpbHMubm9ybWFsaXplUGF0aEZvckxpbmsobm90ZSkgKyBcIik6IFwiICsgXCJcXG5cIlxyXG5cdFx0XHRcdGZvciAobGV0IGxpbmsgb2Ygd2lraUVtYmVkc1tub3RlXSkge1xyXG5cdFx0XHRcdFx0dGV4dCArPSBcIi0gKGxpbmUgXCIgKyAobGluay5wb3NpdGlvbi5zdGFydC5saW5lICsgMSkgKyBcIik6IGBcIiArIGxpbmsub3JpZ2luYWwgKyBcImBcXG5cIjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGV4dCArPSBcIlxcblxcblwiXHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRleHQgKz0gXCJcXG5cXG4jIFdpa2kgZW1iZWRzIFxcblwiO1xyXG5cdFx0XHR0ZXh0ICs9IFwiTm8gcHJvYmxlbXMgZm91bmRcXG5cXG5cIlxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0bGV0IG5vdGVQYXRoID0gdGhpcy5zZXR0aW5ncy5jb25zaXN0ZW5jeVJlcG9ydEZpbGU7XHJcblx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLndyaXRlKG5vdGVQYXRoLCB0ZXh0KTtcclxuXHJcblx0XHRsZXQgZmlsZU9wZW5lZCA9IGZhbHNlO1xyXG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMobGVhZiA9PiB7XHJcblx0XHRcdGlmIChsZWFmLmdldERpc3BsYXlUZXh0KCkgIT0gXCJcIiAmJiBub3RlUGF0aC5zdGFydHNXaXRoKGxlYWYuZ2V0RGlzcGxheVRleHQoKSkpIHtcclxuXHRcdFx0XHRmaWxlT3BlbmVkID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0aWYgKCFmaWxlT3BlbmVkKVxyXG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KG5vdGVQYXRoLCBcIi9cIiwgZmFsc2UpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgcmVvcmdhbml6ZVZhdWx0KCkge1xyXG5cdFx0YXdhaXQgdGhpcy5yZXBsYWNlQWxsV2lraWxpbmtzV2l0aE1hcmtkb3duTGlua3MoKVxyXG5cdFx0YXdhaXQgdGhpcy5jb252ZXJ0QWxsRW1iZWRzUGF0aHNUb1JlbGF0aXZlKClcclxuXHRcdGF3YWl0IHRoaXMuY29udmVydEFsbExpbmtQYXRoc1RvUmVsYXRpdmUoKVxyXG5cdFx0Ly8tIFJlbmFtZSBhbGwgYXR0YWNobWVudHMgKHVzaW5nIFVuaXF1ZSBhdHRhY2htZW50cywgb3B0aW9uYWwpXHJcblx0XHRhd2FpdCB0aGlzLmNvbGxlY3RBbGxBdHRhY2htZW50cygpXHJcblx0XHRhd2FpdCB0aGlzLmRlbGV0ZUVtcHR5Rm9sZGVycygpXHJcblx0XHRuZXcgTm90aWNlKFwiUmVvcmdhbml6YXRpb24gb2YgdGhlIHZhdWx0IGNvbXBsZXRlZFwiKTtcclxuXHR9XHJcblxyXG5cclxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKSB7XHJcblx0XHR0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuXHRcdGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XHJcblxyXG5cdFx0dGhpcy5saCA9IG5ldyBMaW5rc0hhbmRsZXIoXHJcblx0XHRcdHRoaXMuYXBwLFxyXG5cdFx0XHRcIkNvbnNpc3RlbnQgQXR0YWNobWVudHMgYW5kIExpbmtzOiBcIixcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5pZ25vcmVGb2xkZXJzLFxyXG5cdFx0XHR0aGlzLnNldHRpbmdzLmlnbm9yZUZpbGVzUmVnZXhcclxuXHRcdCk7XHJcblxyXG5cdFx0dGhpcy5maCA9IG5ldyBGaWxlc0hhbmRsZXIoXHJcblx0XHRcdHRoaXMuYXBwLFxyXG5cdFx0XHR0aGlzLmxoLFxyXG5cdFx0XHRcIkNvbnNpc3RlbnQgQXR0YWNobWVudHMgYW5kIExpbmtzOiBcIixcclxuXHRcdFx0dGhpcy5zZXR0aW5ncy5pZ25vcmVGb2xkZXJzLFxyXG5cdFx0XHR0aGlzLnNldHRpbmdzLmlnbm9yZUZpbGVzUmVnZXgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblxyXG59XHJcblxyXG5cclxuXHJcblxyXG4iXSwibmFtZXMiOlsiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciLCJub3JtYWxpemVQYXRoIiwiUGx1Z2luIiwiTm90aWNlIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXVEQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDdEcsUUFBUSxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7QUFDdEgsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDOUUsS0FBSyxDQUFDLENBQUM7QUFDUDs7QUMzRE8sTUFBTSxnQkFBZ0IsR0FBbUI7QUFDNUMsSUFBQSx1QkFBdUIsRUFBRSxJQUFJO0FBQzdCLElBQUEseUJBQXlCLEVBQUUsSUFBSTtBQUMvQixJQUFBLFdBQVcsRUFBRSxJQUFJO0FBQ2pCLElBQUEsa0JBQWtCLEVBQUUsSUFBSTtBQUN4QixJQUFBLDRCQUE0QixFQUFFLElBQUk7QUFDbEMsSUFBQSxzQkFBc0IsRUFBRSxLQUFLO0FBQzdCLElBQUEsYUFBYSxFQUFFLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUN0QyxXQUFXLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQztJQUMxQyxnQkFBZ0IsRUFBRSxDQUFDLHlCQUF5QixDQUFDO0FBQzdDLElBQUEsb0JBQW9CLEVBQUUsRUFBRTtBQUN4QixJQUFBLHFCQUFxQixFQUFFLHVCQUF1QjtBQUM5QyxJQUFBLDZCQUE2QixFQUFFLEtBQUs7Q0FDdkMsQ0FBQTtBQUVLLE1BQU8sVUFBVyxTQUFRQSx5QkFBZ0IsQ0FBQTtJQUc1QyxXQUFZLENBQUEsR0FBUSxFQUFFLE1BQXFDLEVBQUE7QUFDdkQsUUFBQSxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ25CLFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7S0FDeEI7SUFFRCxPQUFPLEdBQUE7QUFDSCxRQUFBLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFM0IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXBCLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLDZDQUE2QyxFQUFFLENBQUMsQ0FBQztRQUdwRixJQUFJQyxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsNEJBQTRCLENBQUM7YUFDckMsT0FBTyxDQUFDLHlJQUF5SSxDQUFDO2FBQ2xKLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUc7WUFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0FBQ3JELFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUMvQixTQUFDLENBQ0EsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1FBRzlELElBQUlBLGdCQUFPLENBQUMsV0FBVyxDQUFDO2FBQ25CLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQzthQUM5QyxPQUFPLENBQUMseUdBQXlHLENBQUM7YUFDbEgsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBRztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7QUFDdkQsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQy9CLFNBQUMsQ0FDQSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7UUFHaEUsSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLGNBQWMsQ0FBQzthQUN2QixPQUFPLENBQUMsNkZBQTZGLENBQUM7YUFDdEcsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBRztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUMvQixTQUFDLENBQ0EsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUVsRCxJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsc0JBQXNCLENBQUM7YUFDL0IsT0FBTyxDQUFDLHlFQUF5RSxDQUFDO2FBQ2xGLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUc7WUFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0FBQ2hELFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUMvQixTQUFDLENBQ0EsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBR3pELElBQUlBLGdCQUFPLENBQUMsV0FBVyxDQUFDO2FBQ25CLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQzthQUNwRCxPQUFPLENBQUMscUtBQXFLLENBQUM7YUFDOUssU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBRztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsR0FBRyxLQUFLLENBQUM7QUFDMUQsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQy9CLFNBQUMsQ0FDQSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFHbkUsSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLHFDQUFxQyxDQUFDO2FBQzlDLE9BQU8sQ0FBQywrSkFBK0osQ0FBQzthQUN4SyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFHO1lBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHNCQUFzQixHQUFHLEtBQUssQ0FBQztBQUNwRCxZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDL0IsU0FBQyxDQUNBLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUk3RCxJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7YUFDekIsT0FBTyxDQUFDLHVFQUF1RSxDQUFDO0FBQ2hGLGFBQUEsV0FBVyxDQUFDLEVBQUUsSUFBSSxFQUFFO2FBQ2hCLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQztBQUMxQyxhQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZELGFBQUEsUUFBUSxDQUFDLENBQUMsS0FBSyxLQUFJO1lBQ2hCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMzQyxZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDOUIsQ0FBQyxDQUFDLENBQUM7UUFFWixJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsY0FBYyxDQUFDO2FBQ3ZCLE9BQU8sQ0FBQyxtRUFBbUUsQ0FBQztBQUM1RSxhQUFBLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRTthQUNoQixjQUFjLENBQUMsK0JBQStCLENBQUM7QUFDL0MsYUFBQSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyRCxhQUFBLFFBQVEsQ0FBQyxDQUFDLEtBQUssS0FBSTtZQUNoQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDeEUsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1NBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRVosSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLHNCQUFzQixDQUFDO2FBQy9CLE9BQU8sQ0FBQyxtUUFBbVEsQ0FBQztBQUM1USxhQUFBLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRTthQUNaLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQzthQUN2QyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUM7QUFDbkQsYUFBQSxRQUFRLENBQUMsQ0FBQyxLQUFLLEtBQUk7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0FBQ2xELFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztTQUM5QixDQUFDLENBQUMsQ0FBQztRQUdaLElBQUlBLGdCQUFPLENBQUMsV0FBVyxDQUFDO2FBQ25CLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQzthQUN0QyxPQUFPLENBQUMsMERBQTBELENBQUM7QUFDbkUsYUFBQSxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUU7YUFDWixjQUFjLENBQUMsZ0NBQWdDLENBQUM7YUFDaEQsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDO0FBQ3BELGFBQUEsUUFBUSxDQUFDLENBQUMsS0FBSyxLQUFJO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztBQUNuRCxZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDOUIsQ0FBQyxDQUFDLENBQUM7UUFHWixJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsa0VBQWtFLENBQUM7YUFDM0UsT0FBTyxDQUFDLDZJQUE2SSxDQUFDO2FBQ3RKLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUc7WUFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsNkJBQTZCLEdBQUcsS0FBSyxDQUFDO0FBQzNELFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUMvQixTQUFDLENBQ0EsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFO0FBRUQsSUFBQSxpQkFBaUIsQ0FBQyxJQUFZLEVBQUE7QUFDMUIsUUFBQSxPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLElBQUksR0FBR0Msc0JBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN4RDtBQUNKOztNQzNLWSxLQUFLLENBQUE7SUFFakIsT0FBYSxLQUFLLENBQUMsRUFBVSxFQUFBOztBQUM1QixZQUFBLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN2RCxDQUFBLENBQUE7QUFBQSxLQUFBO0lBR0QsT0FBTyxvQkFBb0IsQ0FBQyxJQUFZLEVBQUE7UUFDdkMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNsQyxRQUFBLE9BQU8sSUFBSSxDQUFDO0tBQ1o7SUFHRCxPQUFPLG9CQUFvQixDQUFDLElBQVksRUFBQTtRQUN2QyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLFFBQUEsT0FBTyxJQUFJLENBQUM7S0FDWjtJQUVELE9BQU8sb0JBQW9CLENBQUMsT0FBZSxFQUFBO0FBQzFDLFFBQUEsT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3QixRQUFBLE9BQU8sT0FBTyxDQUFDO0tBQ2Y7QUFDRDs7TUN4QlksSUFBSSxDQUFBO0FBQ2IsSUFBQSxPQUFPLElBQUksQ0FBQyxHQUFHLEtBQWUsRUFBQTtBQUMxQixRQUFBLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO0FBQ3RCLFlBQUEsT0FBTyxHQUFHLENBQUM7QUFDZixRQUFBLElBQUksTUFBTSxDQUFDO0FBQ1gsUUFBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtBQUN2QyxZQUFBLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixZQUFBLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksTUFBTSxLQUFLLFNBQVM7b0JBQ3BCLE1BQU0sR0FBRyxHQUFHLENBQUM7O0FBRWIsb0JBQUEsTUFBTSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDM0IsYUFBQTtBQUNKLFNBQUE7UUFDRCxJQUFJLE1BQU0sS0FBSyxTQUFTO0FBQ3BCLFlBQUEsT0FBTyxHQUFHLENBQUM7QUFDZixRQUFBLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN0QztJQUVELE9BQU8sT0FBTyxDQUFDLElBQVksRUFBQTtBQUN2QixRQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDO0FBQUUsWUFBQSxPQUFPLEdBQUcsQ0FBQztRQUNsQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLFFBQUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLEVBQUUsT0FBTztBQUNoQyxRQUFBLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFFBQUEsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ3ZDLFlBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsWUFBQSxJQUFJLElBQUksS0FBSyxFQUFFLFFBQVE7Z0JBQ25CLElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQ2YsR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDUixNQUFNO0FBQ1QsaUJBQUE7QUFDSixhQUFBO0FBQU0saUJBQUE7O2dCQUVILFlBQVksR0FBRyxLQUFLLENBQUM7QUFDeEIsYUFBQTtBQUNKLFNBQUE7UUFFRCxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFBRSxPQUFPLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQzNDLFFBQUEsSUFBSSxPQUFPLElBQUksR0FBRyxLQUFLLENBQUM7QUFBRSxZQUFBLE9BQU8sSUFBSSxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDN0I7QUFFRCxJQUFBLE9BQU8sUUFBUSxDQUFDLElBQVksRUFBRSxHQUFZLEVBQUE7QUFDdEMsUUFBQSxJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtBQUFFLFlBQUEsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBRXpHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNkLFFBQUEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDYixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDeEIsUUFBQSxJQUFJLENBQUMsQ0FBQztBQUVOLFFBQUEsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNsRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLEtBQUssSUFBSTtBQUFFLGdCQUFBLE9BQU8sRUFBRSxDQUFDO0FBQzFELFlBQUEsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDNUIsWUFBQSxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzFCLFlBQUEsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDbkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixnQkFBQSxJQUFJLElBQUksS0FBSyxFQUFFLFFBQVE7OztvQkFHbkIsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUNmLHdCQUFBLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNkLE1BQU07QUFDVCxxQkFBQTtBQUNKLGlCQUFBO0FBQU0scUJBQUE7QUFDSCxvQkFBQSxJQUFJLGdCQUFnQixLQUFLLENBQUMsQ0FBQyxFQUFFOzs7d0JBR3pCLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDckIsd0JBQUEsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QixxQkFBQTtvQkFDRCxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUU7O3dCQUViLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMsNEJBQUEsSUFBSSxFQUFFLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRTs7O2dDQUdqQixHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsNkJBQUE7QUFDSix5QkFBQTtBQUFNLDZCQUFBOzs7NEJBR0gsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNaLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQztBQUMxQix5QkFBQTtBQUNKLHFCQUFBO0FBQ0osaUJBQUE7QUFDSixhQUFBO1lBRUQsSUFBSSxLQUFLLEtBQUssR0FBRztnQkFBRSxHQUFHLEdBQUcsZ0JBQWdCLENBQUM7aUJBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQUUsZ0JBQUEsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEYsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNqQyxTQUFBO0FBQU0sYUFBQTtBQUNILFlBQUEsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDbkMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUTs7O29CQUdqQyxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ2Ysd0JBQUEsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2QsTUFBTTtBQUNULHFCQUFBO0FBQ0osaUJBQUE7QUFBTSxxQkFBQSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTs7O29CQUduQixZQUFZLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLG9CQUFBLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsaUJBQUE7QUFDSixhQUFBO1lBRUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQUUsZ0JBQUEsT0FBTyxFQUFFLENBQUM7WUFDMUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNqQyxTQUFBO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQyxJQUFZLEVBQUE7QUFDdkIsUUFBQSxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDbEIsUUFBQSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNiLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQzs7O1FBR3hCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztBQUNwQixRQUFBLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUN2QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLFlBQUEsSUFBSSxJQUFJLEtBQUssRUFBRSxRQUFROzs7Z0JBR25CLElBQUksQ0FBQyxZQUFZLEVBQUU7QUFDZixvQkFBQSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbEIsTUFBTTtBQUNULGlCQUFBO2dCQUNELFNBQVM7QUFDWixhQUFBO0FBQ0QsWUFBQSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTs7O2dCQUdaLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDckIsZ0JBQUEsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZixhQUFBO0FBQ0QsWUFBQSxJQUFJLElBQUksS0FBSyxFQUFFLFFBQVE7O2dCQUVuQixJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUM7b0JBQ2YsUUFBUSxHQUFHLENBQUMsQ0FBQztxQkFDWixJQUFJLFdBQVcsS0FBSyxDQUFDO29CQUN0QixXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLGFBQUE7QUFBTSxpQkFBQSxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUMsRUFBRTs7O2dCQUd4QixXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDcEIsYUFBQTtBQUNKLFNBQUE7UUFFRCxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDOztBQUU3QixZQUFBLFdBQVcsS0FBSyxDQUFDOztBQUVqQixZQUFBLFdBQVcsS0FBSyxDQUFDLElBQUksUUFBUSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksUUFBUSxLQUFLLFNBQVMsR0FBRyxDQUFDLEVBQUU7QUFDekUsWUFBQSxPQUFPLEVBQUUsQ0FBQztBQUNiLFNBQUE7UUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3BDO0lBSUQsT0FBTyxLQUFLLENBQUMsSUFBWSxFQUFBO1FBRXJCLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7QUFDN0QsUUFBQSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQztBQUFFLFlBQUEsT0FBTyxHQUFHLENBQUM7UUFDbEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixRQUFBLElBQUksVUFBVSxHQUFHLElBQUksS0FBSyxFQUFFLE9BQU87QUFDbkMsUUFBQSxJQUFJLEtBQUssQ0FBQztBQUNWLFFBQUEsSUFBSSxVQUFVLEVBQUU7QUFDWixZQUFBLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2YsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNiLFNBQUE7QUFBTSxhQUFBO1lBQ0gsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNiLFNBQUE7QUFDRCxRQUFBLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNsQixRQUFBLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFFBQUEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7OztRQUl4QixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7O0FBR3BCLFFBQUEsT0FBTyxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ3BCLFlBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsWUFBQSxJQUFJLElBQUksS0FBSyxFQUFFLFFBQVE7OztnQkFHbkIsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUNmLG9CQUFBLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNsQixNQUFNO0FBQ1QsaUJBQUE7Z0JBQ0QsU0FBUztBQUNaLGFBQUE7QUFDRCxZQUFBLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFOzs7Z0JBR1osWUFBWSxHQUFHLEtBQUssQ0FBQztBQUNyQixnQkFBQSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLGFBQUE7QUFDRCxZQUFBLElBQUksSUFBSSxLQUFLLEVBQUUsUUFBUTs7Z0JBRW5CLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQztvQkFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDO3FCQUFNLElBQUksV0FBVyxLQUFLLENBQUM7b0JBQUUsV0FBVyxHQUFHLENBQUMsQ0FBQztBQUNsRixhQUFBO0FBQU0saUJBQUEsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUU7OztnQkFHeEIsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLGFBQUE7QUFDSixTQUFBO1FBRUQsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQzs7QUFFN0IsWUFBQSxXQUFXLEtBQUssQ0FBQzs7QUFFakIsWUFBQSxXQUFXLEtBQUssQ0FBQyxJQUFJLFFBQVEsS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEdBQUcsQ0FBQyxFQUFFO0FBQ3pFLFlBQUEsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDWixnQkFBQSxJQUFJLFNBQVMsS0FBSyxDQUFDLElBQUksVUFBVTtBQUFFLG9CQUFBLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQzs7QUFBTSxvQkFBQSxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdEksYUFBQTtBQUNKLFNBQUE7QUFBTSxhQUFBO0FBQ0gsWUFBQSxJQUFJLFNBQVMsS0FBSyxDQUFDLElBQUksVUFBVSxFQUFFO2dCQUMvQixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNuQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLGFBQUE7QUFBTSxpQkFBQTtnQkFDSCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDLGFBQUE7WUFDRCxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLFNBQUE7UUFFRCxJQUFJLFNBQVMsR0FBRyxDQUFDO0FBQUUsWUFBQSxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUFNLGFBQUEsSUFBSSxVQUFVO0FBQUUsWUFBQSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUU5RixRQUFBLE9BQU8sR0FBRyxDQUFDO0tBQ2Q7SUFLRCxPQUFPLGNBQWMsQ0FBQyxJQUFZLEVBQUE7QUFFOUIsUUFBQSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQztBQUFFLFlBQUEsT0FBTyxHQUFHLENBQUM7QUFFbEMsUUFBQSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTztBQUNqRCxRQUFBLElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTzs7UUFHdEUsSUFBSSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVwRCxRQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVO1lBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNqRCxRQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksaUJBQWlCO1lBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUV0RCxRQUFBLElBQUksVUFBVTtZQUFFLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQztBQUNsQyxRQUFBLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7QUFFRCxJQUFBLE9BQU8sb0JBQW9CLENBQUMsSUFBWSxFQUFFLGNBQXVCLEVBQUE7UUFDN0QsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDMUIsUUFBQSxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7QUFDYixRQUFBLElBQUksSUFBSSxDQUFDO0FBQ1QsUUFBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtBQUNuQyxZQUFBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNO0FBQ2YsZ0JBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsaUJBQUEsSUFBSSxJQUFJLEtBQUssRUFBRTtnQkFDaEIsTUFBTTs7QUFFTixnQkFBQSxJQUFJLEdBQUcsRUFBRSxPQUFPO0FBQ3BCLFlBQUEsSUFBSSxJQUFJLEtBQUssRUFBRSxRQUFRO2dCQUNuQixJQUFJLFNBQVMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FFdEM7cUJBQU0sSUFBSSxTQUFTLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO0FBQzFDLG9CQUFBLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksaUJBQWlCLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLFVBQVUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUTtBQUN6SSx3QkFBQSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUNoQixJQUFJLGNBQWMsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLDRCQUFBLElBQUksY0FBYyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ25DLGdDQUFBLElBQUksY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFFO29DQUN2QixHQUFHLEdBQUcsRUFBRSxDQUFDO29DQUNULGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUN6QixpQ0FBQTtBQUFNLHFDQUFBO29DQUNILEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNuQyxvQ0FBQSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdELGlDQUFBO2dDQUNELFNBQVMsR0FBRyxDQUFDLENBQUM7Z0NBQ2QsSUFBSSxHQUFHLENBQUMsQ0FBQztnQ0FDVCxTQUFTO0FBQ1osNkJBQUE7QUFDSix5QkFBQTs2QkFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOzRCQUM3QyxHQUFHLEdBQUcsRUFBRSxDQUFDOzRCQUNULGlCQUFpQixHQUFHLENBQUMsQ0FBQzs0QkFDdEIsU0FBUyxHQUFHLENBQUMsQ0FBQzs0QkFDZCxJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUNULFNBQVM7QUFDWix5QkFBQTtBQUNKLHFCQUFBO0FBQ0Qsb0JBQUEsSUFBSSxjQUFjLEVBQUU7QUFDaEIsd0JBQUEsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUM7NEJBQ2QsR0FBRyxJQUFJLEtBQUssQ0FBQzs7NEJBRWIsR0FBRyxHQUFHLElBQUksQ0FBQzt3QkFDZixpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDekIscUJBQUE7QUFDSixpQkFBQTtBQUFNLHFCQUFBO0FBQ0gsb0JBQUEsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUM7QUFDZCx3QkFBQSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7d0JBRTFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkMsb0JBQUEsaUJBQWlCLEdBQUcsQ0FBQyxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDekMsaUJBQUE7Z0JBQ0QsU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDZCxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ1osYUFBQTtpQkFBTSxJQUFJLElBQUksS0FBSyxFQUFFLFVBQVUsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ3pDLGdCQUFBLEVBQUUsSUFBSSxDQUFDO0FBQ1YsYUFBQTtBQUFNLGlCQUFBO2dCQUNILElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNiLGFBQUE7QUFDSixTQUFBO0FBQ0QsUUFBQSxPQUFPLEdBQUcsQ0FBQztLQUNkO0FBRUQsSUFBQSxPQUFPLFlBQVksQ0FBQyxHQUFHLElBQWMsRUFBQTtRQUNqQyxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDN0IsUUFBQSxJQUFJLEdBQUcsQ0FBQztBQUVSLFFBQUEsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3RCxZQUFBLElBQUksSUFBSSxDQUFDO1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNOLGdCQUFBLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxpQkFBQTtnQkFDRCxJQUFJLEdBQUcsS0FBSyxTQUFTO0FBQ2pCLG9CQUFBLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksR0FBRyxHQUFHLENBQUM7QUFDZCxhQUFBOztBQUlELFlBQUEsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDbkIsU0FBUztBQUNaLGFBQUE7QUFFRCxZQUFBLFlBQVksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFlBQVksQ0FBQztZQUN6QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTztBQUN0RCxTQUFBOzs7O1FBTUQsWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRTFFLFFBQUEsSUFBSSxnQkFBZ0IsRUFBRTtBQUNsQixZQUFBLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUN2QixPQUFPLEdBQUcsR0FBRyxZQUFZLENBQUM7O0FBRTFCLGdCQUFBLE9BQU8sR0FBRyxDQUFDO0FBQ2xCLFNBQUE7QUFBTSxhQUFBLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDaEMsWUFBQSxPQUFPLFlBQVksQ0FBQztBQUN2QixTQUFBO0FBQU0sYUFBQTtBQUNILFlBQUEsT0FBTyxHQUFHLENBQUM7QUFDZCxTQUFBO0tBQ0o7QUFFRCxJQUFBLE9BQU8sUUFBUSxDQUFDLElBQVksRUFBRSxFQUFVLEVBQUE7UUFFcEMsSUFBSSxJQUFJLEtBQUssRUFBRTtBQUFFLFlBQUEsT0FBTyxFQUFFLENBQUM7QUFFM0IsUUFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixRQUFBLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTNCLElBQUksSUFBSSxLQUFLLEVBQUU7QUFBRSxZQUFBLE9BQU8sRUFBRSxDQUFDOztRQUczQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsT0FBTyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRTtZQUN6QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtnQkFDakMsTUFBTTtBQUNiLFNBQUE7QUFDRCxRQUFBLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDMUIsUUFBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLEdBQUcsU0FBUyxDQUFDOztRQUdsQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDaEIsT0FBTyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRTtZQUNuQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDN0IsTUFBTTtBQUNiLFNBQUE7QUFDRCxRQUFBLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDdEIsUUFBQSxJQUFJLEtBQUssR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDOztBQUc1QixRQUFBLElBQUksTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUMvQyxRQUFBLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNWLFFBQUEsT0FBTyxDQUFDLElBQUksTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxLQUFLLE1BQU0sRUFBRTtnQkFDZCxJQUFJLEtBQUssR0FBRyxNQUFNLEVBQUU7QUFDaEIsb0JBQUEsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVE7Ozt3QkFHekMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDcEMscUJBQUE7eUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFOzs7d0JBR2hCLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEMscUJBQUE7QUFDSixpQkFBQTtxQkFBTSxJQUFJLE9BQU8sR0FBRyxNQUFNLEVBQUU7QUFDekIsb0JBQUEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVE7Ozt3QkFHN0MsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUNyQixxQkFBQTt5QkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Ozt3QkFHaEIsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUNyQixxQkFBQTtBQUNKLGlCQUFBO2dCQUNELE1BQU07QUFDVCxhQUFBO1lBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsSUFBSSxRQUFRLEtBQUssTUFBTTtnQkFDbkIsTUFBTTtBQUNMLGlCQUFBLElBQUksUUFBUSxLQUFLLEVBQUU7Z0JBQ3BCLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDekIsU0FBQTtRQUVELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQzs7O0FBR2IsUUFBQSxLQUFLLENBQUMsR0FBRyxTQUFTLEdBQUcsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ3ZELFlBQUEsSUFBSSxDQUFDLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxRQUFRO0FBQ2xELGdCQUFBLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDO29CQUNoQixHQUFHLElBQUksSUFBSSxDQUFDOztvQkFFWixHQUFHLElBQUksS0FBSyxDQUFDO0FBQ3BCLGFBQUE7QUFDSixTQUFBOzs7QUFJRCxRQUFBLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ2QsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUM7QUFDOUMsYUFBQTtZQUNELE9BQU8sSUFBSSxhQUFhLENBQUM7WUFDekIsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDN0IsZ0JBQUEsRUFBRSxPQUFPLENBQUM7QUFDZCxZQUFBLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1QixTQUFBO0tBQ0o7QUFDSjs7QUNyYUQ7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBLE1BQU0seUJBQXlCLEdBQUcsNENBQTRDLENBQUE7QUFDOUUsTUFBTSxrQkFBa0IsR0FBRyw4REFBOEQsQ0FBQztBQUMxRixNQUFNLG1CQUFtQixHQUFHLDhDQUE4QyxDQUFBO0FBRTFFLE1BQU0scUJBQXFCLEdBQUcsZ0NBQWdDLENBQUE7QUFDOUQsTUFBTSxjQUFjLEdBQUcsdUNBQXVDLENBQUM7QUFDL0QsTUFBTSxlQUFlLEdBQUcsa0NBQWtDLENBQUE7QUFFMUQsTUFBTSx3QkFBd0IsR0FBRywyQ0FBMkMsQ0FBQTtBQUM1RSxNQUFNLGlCQUFpQixHQUFHLGtEQUFrRCxDQUFDO01BUWhFLFlBQVksQ0FBQTtJQUV4QixXQUNTLENBQUEsR0FBUSxFQUNSLGdCQUEyQixHQUFBLEVBQUUsRUFDN0IsYUFBMEIsR0FBQSxFQUFFLEVBQzVCLGdCQUFBLEdBQTZCLEVBQUUsRUFBQTtRQUgvQixJQUFHLENBQUEsR0FBQSxHQUFILEdBQUcsQ0FBSztRQUNSLElBQWdCLENBQUEsZ0JBQUEsR0FBaEIsZ0JBQWdCLENBQWE7UUFDN0IsSUFBYSxDQUFBLGFBQUEsR0FBYixhQUFhLENBQWU7UUFDNUIsSUFBZ0IsQ0FBQSxnQkFBQSxHQUFoQixnQkFBZ0IsQ0FBZTtLQUNuQztBQUVMLElBQUEsYUFBYSxDQUFDLElBQVksRUFBQTtBQUN6QixRQUFBLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDeEIsWUFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUUxQixRQUFBLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QyxZQUFBLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUM1QixnQkFBQSxPQUFPLElBQUksQ0FBQztBQUNaLGFBQUE7QUFDRCxTQUFBO0FBRUQsUUFBQSxLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtBQUM1QyxZQUFBLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN6QixnQkFBQSxPQUFPLElBQUksQ0FBQztBQUNaLGFBQUE7QUFDRCxTQUFBO0tBQ0Q7QUFFRCxJQUFBLDJCQUEyQixDQUFDLElBQVksRUFBQTtRQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDL0MsUUFBUSxRQUFRLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0tBQ2hEO0FBRUQsSUFBQSwwQkFBMEIsQ0FBQyxJQUFZLEVBQUE7UUFDdEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzlDLFFBQVEsUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztLQUNoRDtBQUVELElBQUEsaUNBQWlDLENBQUMsSUFBWSxFQUFBO1FBQzdDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUNyRCxRQUFRLFFBQVEsSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUM7S0FDaEQ7QUFFRCxJQUFBLHVCQUF1QixDQUFDLElBQVksRUFBQTtRQUNuQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzNDLFFBQVEsUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztLQUNoRDtBQUVELElBQUEsc0JBQXNCLENBQUMsSUFBWSxFQUFBO1FBQ2xDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDMUMsUUFBUSxRQUFRLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0tBQ2hEO0FBRUQsSUFBQSw2QkFBNkIsQ0FBQyxJQUFZLEVBQUE7UUFDekMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ2pELFFBQVEsUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztLQUNoRDtBQUdELElBQUEsYUFBYSxDQUFDLElBQVksRUFBRSxjQUFzQixFQUFFLG1CQUE0QixJQUFJLEVBQUE7UUFDbkYsSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDakQsUUFBQSxJQUFJLGdCQUFnQixFQUFFO0FBQ3JCLFlBQUEsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDekUsU0FBQTtRQUNELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDN0QsUUFBQSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDcEM7QUFHRCxJQUFBLGFBQWEsQ0FBQyxJQUFZLEVBQUE7QUFDekIsUUFBQSxJQUFJLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQVUsQ0FBQztLQUN0RDtJQUdELGtCQUFrQixDQUFDLElBQVksRUFBRSxjQUFzQixFQUFBO1FBQ3RELElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2pELFFBQUEsSUFBSSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFNUQsUUFBQSxJQUFJLFlBQVksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEYsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFN0MsUUFBQSxRQUFRLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2hELFFBQUEsT0FBTyxRQUFRLENBQUM7S0FDaEI7QUFHRCxJQUFBLHVCQUF1QixDQUFDLFFBQWdCLEVBQUE7O1FBQ3ZDLElBQUksUUFBUSxHQUF5QyxFQUFFLENBQUM7UUFDeEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUU5QyxRQUFBLElBQUksS0FBSyxFQUFFO0FBQ1YsWUFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtBQUN2QixnQkFBQSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksUUFBUTtvQkFDeEIsU0FBUzs7QUFHVixnQkFBQSxJQUFJLEtBQUssR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLEtBQUssQ0FBQztBQUU5RCxnQkFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLG9CQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3ZCLHdCQUFBLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDakUsSUFBSSxZQUFZLElBQUksUUFBUSxFQUFFO0FBQzdCLDRCQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN2QixnQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLE9BQU8sUUFBUSxDQUFDO0tBQ2hCO0FBR0QsSUFBQSx3QkFBd0IsQ0FBQyxRQUFnQixFQUFBOztRQUN4QyxJQUFJLFNBQVMsR0FBMEMsRUFBRSxDQUFDO1FBQzFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFFBQVE7b0JBQ3hCLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFFaEUsZ0JBQUEsSUFBSSxNQUFNLEVBQUU7QUFDWCxvQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUN6Qix3QkFBQSxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2xFLElBQUksWUFBWSxJQUFJLFFBQVEsRUFBRTtBQUM3Qiw0QkFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDeEIsZ0NBQUEsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLHlCQUFBO0FBQ0QscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7QUFDRCxTQUFBO0FBRUQsUUFBQSxPQUFPLFNBQVMsQ0FBQztLQUNqQjtJQUlELGNBQWMsR0FBQTs7UUFDYixJQUFJLFFBQVEsR0FBeUMsRUFBRSxDQUFDO1FBQ3hELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxLQUFLLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxLQUFLLENBQUM7QUFFOUQsZ0JBQUEsSUFBSSxLQUFLLEVBQUU7QUFDVixvQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTt3QkFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7NEJBQzVCLFNBQVM7QUFFVix3QkFBQSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDOzRCQUM3QyxTQUFTO0FBRVYsd0JBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzNELElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDViw0QkFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdkIsZ0NBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzFCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9CLHlCQUFBO0FBQ0QscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7QUFDRCxTQUFBO0FBRUQsUUFBQSxPQUFPLFFBQVEsQ0FBQztLQUNoQjtJQUVELGVBQWUsR0FBQTs7UUFDZCxJQUFJLFNBQVMsR0FBMEMsRUFBRSxDQUFDO1FBQzFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFFaEUsZ0JBQUEsSUFBSSxNQUFNLEVBQUU7QUFDWCxvQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUN6Qix3QkFBQSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDOzRCQUMvQyxTQUFTO0FBRVYsd0JBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzVELElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDViw0QkFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDeEIsZ0NBQUEsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLHlCQUFBO0FBQ0QscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7QUFDRCxTQUFBO0FBRUQsUUFBQSxPQUFPLFNBQVMsQ0FBQztLQUNqQjtJQUdELGVBQWUsR0FBQTs7UUFDZCxJQUFJLFFBQVEsR0FBeUMsRUFBRSxDQUFDO1FBQ3hELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxLQUFLLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxLQUFLLENBQUM7QUFFOUQsZ0JBQUEsSUFBSSxLQUFLLEVBQUU7QUFDVixvQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTt3QkFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7NEJBQzVCLFNBQVM7QUFFVix3QkFBQSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDOzRCQUM3QyxTQUFTO0FBRVYsd0JBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwRCx3QkFBQSxJQUFJLElBQUksRUFBRTtBQUNULDRCQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN2QixnQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLE9BQU8sUUFBUSxDQUFDO0tBQ2hCO0lBRUsscUJBQXFCLEdBQUE7OztZQUMxQixJQUFJLFFBQVEsR0FBeUMsRUFBRSxDQUFDO1lBQ3hELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLGdCQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3ZCLG9CQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNoQyxTQUFTOztBQUdWLG9CQUFBLElBQUksS0FBSyxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsS0FBSyxDQUFDO0FBQzlELG9CQUFBLElBQUksS0FBSyxFQUFFO0FBQ1Ysd0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsNEJBQUEsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQ0FDN0MsU0FBUzs0QkFFVixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNuRCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVU7Z0NBQ2pCLFNBQVM7QUFFViw0QkFBQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMzRCw0QkFBQSxJQUFJLElBQUksRUFBRTtBQUNULGdDQUFBLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUU7b0NBQy9ELFNBQVM7QUFDVCxpQ0FBQTtBQUVELGdDQUFBLElBQUksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUMzQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRXJELGdDQUFBLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7b0NBQzFCLFNBQVM7Z0NBRVYsSUFBSSxLQUFLLEdBQUcsbURBQW1ELENBQUM7Z0NBQ2hFLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztnQ0FDL0IsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dDQUVyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUU7QUFDbEMsb0NBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3ZCLHdDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29DQUMxQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixpQ0FBQTtBQUNELDZCQUFBO0FBQ0QseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUVELFlBQUEsT0FBTyxRQUFRLENBQUM7O0FBQ2hCLEtBQUE7SUFFRCxnQkFBZ0IsR0FBQTs7UUFDZixJQUFJLFNBQVMsR0FBMEMsRUFBRSxDQUFDO1FBQzFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFFaEUsZ0JBQUEsSUFBSSxNQUFNLEVBQUU7QUFDWCxvQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUN6Qix3QkFBQSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDOzRCQUMvQyxTQUFTO0FBRVYsd0JBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyRCx3QkFBQSxJQUFJLElBQUksRUFBRTtBQUNULDRCQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN4QixnQ0FBQSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDM0IsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLE9BQU8sU0FBUyxDQUFDO0tBQ2pCO0lBRUQsZUFBZSxHQUFBOztRQUNkLElBQUksUUFBUSxHQUF5QyxFQUFFLENBQUM7UUFDeEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUU5QyxRQUFBLElBQUksS0FBSyxFQUFFO0FBQ1YsWUFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtBQUN2QixnQkFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDaEMsU0FBUzs7QUFHVixnQkFBQSxJQUFJLEtBQUssR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLEtBQUssQ0FBQztBQUU5RCxnQkFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLG9CQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO3dCQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7NEJBQzlDLFNBQVM7QUFFVix3QkFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdkIsNEJBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQzFCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRS9CLHFCQUFBO0FBQ0QsaUJBQUE7QUFDRCxhQUFBO0FBQ0QsU0FBQTtBQUVELFFBQUEsT0FBTyxRQUFRLENBQUM7S0FDaEI7SUFFRCxnQkFBZ0IsR0FBQTs7UUFDZixJQUFJLFNBQVMsR0FBMEMsRUFBRSxDQUFDO1FBQzFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsUUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLFlBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2hDLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFFaEUsZ0JBQUEsSUFBSSxNQUFNLEVBQUU7QUFDWCxvQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTt3QkFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDOzRCQUNoRCxTQUFTO0FBRVYsd0JBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3hCLDRCQUFBLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUMzQixTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLE9BQU8sU0FBUyxDQUFDO0tBQ2pCO0lBR0ssd0JBQXdCLENBQUMsV0FBbUIsRUFBRSxXQUFtQixFQUFFLGNBQWMsR0FBRyxLQUFLLEVBQUUsNkJBQTZCLEdBQUcsS0FBSyxFQUFBOztBQUNySSxZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztnQkFDckUsT0FBTztZQUVSLElBQUksS0FBSyxHQUFHLDZCQUE2QixHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwSixZQUFBLElBQUksS0FBSyxHQUFxQixDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUUvRSxZQUFBLElBQUksS0FBSyxFQUFFO0FBQ1YsZ0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7b0JBQ3ZCLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDakUsaUJBQUE7QUFDRCxhQUFBO1NBQ0QsQ0FBQSxDQUFBO0FBQUEsS0FBQTtJQUdLLHVCQUF1QixDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLE9BQWUsRUFBRSxjQUFjLEdBQUcsS0FBSyxFQUFBOztBQUN2RyxZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLE9BQU87QUFFUixZQUFBLElBQUksT0FBTyxHQUFxQixDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RSxPQUFPLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDOUUsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUdLLElBQUEsd0JBQXdCLENBQUMsUUFBZ0IsRUFBRSxZQUE4QixFQUFFLGNBQWMsR0FBRyxLQUFLLEVBQUE7O0FBQ3RHLFlBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztnQkFDL0IsT0FBTztZQUVSLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDVixPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyw2Q0FBNkMsR0FBRyxRQUFRLENBQUMsQ0FBQztnQkFDaEcsT0FBTztBQUNQLGFBQUE7QUFFRCxZQUFBLElBQUksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUVsQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDckQsSUFBSSxRQUFRLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzVDLGdCQUFBLEtBQUssSUFBSSxFQUFFLElBQUksUUFBUSxFQUFFO29CQUN4QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakQsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0FBRTlDLG9CQUFBLElBQUksRUFBRSxDQUFDLFVBQVU7QUFDaEIsd0JBQUEsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBRWhCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFFdkQsb0JBQUEsS0FBSyxJQUFJLFdBQVcsSUFBSSxZQUFZLEVBQUU7QUFDckMsd0JBQUEsSUFBSSxRQUFRLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUNwQyw0QkFBQSxJQUFJLFVBQVUsR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEUsNEJBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVwRCw0QkFBQSxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDakMsZ0NBQUEsVUFBVSxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsNkJBQUE7NEJBRUQsSUFBSSxjQUFjLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTs7QUFFakQsZ0NBQUEsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7b0NBQ2xGLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7b0NBQ25DLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLG9DQUFBLEdBQUcsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsaUNBQUE7QUFDRCw2QkFBQTs0QkFFRCxJQUFJLEVBQUUsQ0FBQyxVQUFVO2dDQUNoQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFckYsZ0NBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUM7NEJBRW5FLEtBQUssR0FBRyxJQUFJLENBQUM7QUFFYiw0QkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRywrREFBK0Q7a0NBQ2hHLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUE7QUFDckQseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUVELFlBQUEsSUFBSSxLQUFLO0FBQ1IsZ0JBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3pDLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHSyxJQUFBLDhCQUE4QixDQUFDLFdBQW1CLEVBQUUsV0FBbUIsRUFBRSx1QkFBZ0MsRUFBQTs7QUFDOUcsWUFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7Z0JBQ3JFLE9BQU87WUFFUixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsK0NBQStDLEdBQUcsV0FBVyxDQUFDLENBQUM7Z0JBQ3JHLE9BQU87QUFDUCxhQUFBO0FBRUQsWUFBQSxJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7WUFFbEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3JELElBQUksUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM1QyxnQkFBQSxLQUFLLElBQUksRUFBRSxJQUFJLFFBQVEsRUFBRTtvQkFDeEIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pELElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUU5QyxvQkFBQSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO3dCQUN2QixTQUFTO0FBRVYsb0JBQUEsSUFBSSxFQUFFLENBQUMsVUFBVTtBQUNoQix3QkFBQSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQzs7QUFJaEIsb0JBQUEsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQzt3QkFDOUUsU0FBUztvQkFFVixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLElBQUksRUFBRTt3QkFDVixJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7d0JBQzdDLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDViw0QkFBQSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLEdBQUcsdUNBQXVDLEdBQUcsSUFBSSxDQUFDLENBQUM7NEJBQ3BHLFNBQVM7QUFDVCx5QkFBQTtBQUNELHFCQUFBO0FBR0Qsb0JBQUEsSUFBSSxVQUFVLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9ELG9CQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFcEQsb0JBQUEsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2pDLHdCQUFBLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLHFCQUFBO29CQUVELElBQUksRUFBRSxDQUFDLFVBQVU7d0JBQ2hCLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsVUFBVSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDOztBQUVyRix3QkFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFFbkUsS0FBSyxHQUFHLElBQUksQ0FBQztBQUViLG9CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLDhEQUE4RDswQkFDL0YsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQztBQUN0RCxpQkFBQTtBQUNELGFBQUE7QUFFRCxZQUFBLElBQUksS0FBSztBQUNSLGdCQUFBLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6QyxDQUFBLENBQUE7QUFBQSxLQUFBO0FBR0QsSUFBQSxnQ0FBZ0MsQ0FBQyxRQUFnQixFQUFBOztRQUNoRCxJQUFJLEtBQUssR0FBYSxFQUFFLENBQUM7UUFDekIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUVqRCxRQUFBLElBQUksUUFBUSxFQUFFO0FBQ2IsWUFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFFBQVEsRUFBRTtBQUMxQixnQkFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDaEMsU0FBUztBQUVWLGdCQUFBLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDekIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFFBQVE7b0JBQ3hCLFNBQVM7O0FBR1YsZ0JBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLE1BQU0sQ0FBQztBQUMvRCxnQkFBQSxJQUFJLE1BQU0sRUFBRTtBQUNYLG9CQUFBLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFO0FBQ3pCLHdCQUFBLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDOUQsSUFBSSxRQUFRLElBQUksUUFBUSxFQUFFO0FBQ3pCLDRCQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztBQUM1QixnQ0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RCLHlCQUFBO0FBQ0QscUJBQUE7QUFDRCxpQkFBQTs7QUFHRCxnQkFBQSxJQUFJLEtBQUssR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsS0FBSyxDQUFDO0FBQzdELGdCQUFBLElBQUksS0FBSyxFQUFFO0FBQ1Ysb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDdkIsd0JBQUEsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUM3RCxJQUFJLFFBQVEsSUFBSSxRQUFRLEVBQUU7QUFDekIsNEJBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO0FBQzVCLGdDQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEIseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLE9BQU8sS0FBSyxDQUFDO0tBQ2I7QUFHSyxJQUFBLDBCQUEwQixDQUFDLFFBQWdCLEVBQUE7O1lBQ2hELElBQUksS0FBSyxHQUFhLEVBQUUsQ0FBQztZQUN6QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBRWpELFlBQUEsSUFBSSxRQUFRLEVBQUU7QUFDYixnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFFBQVEsRUFBRTtBQUMxQixvQkFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDaEMsU0FBUztBQUVWLG9CQUFBLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ3pCLElBQUksUUFBUSxJQUFJLFFBQVE7d0JBQ3ZCLFNBQVM7b0JBRVYsSUFBSSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEQsb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7d0JBQ3ZCLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkQsd0JBQUEsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQzlELElBQUksWUFBWSxJQUFJLFFBQVEsRUFBRTtBQUM3Qiw0QkFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7QUFDNUIsZ0NBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0Qix5QkFBQTtBQUNELHFCQUFBO0FBQ0QsaUJBQUE7QUFDRCxhQUFBO0FBRUQsWUFBQSxPQUFPLEtBQUssQ0FBQztTQUNiLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFFRCxJQUFBLHlCQUF5QixDQUFDLElBQVksRUFBQTtBQUNyQyxRQUFBLElBQUksR0FBRyxHQUFvQjtBQUMxQixZQUFBLFVBQVUsRUFBRSxLQUFLO0FBQ2pCLFlBQUEsSUFBSSxFQUFFLElBQUk7QUFDVixZQUFBLE9BQU8sRUFBRSxFQUFFO1NBQ1gsQ0FBQTtBQUVELFFBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO0FBQ3RCLFlBQUEsT0FBTyxHQUFHLENBQUM7UUFHWixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFNUMsUUFBQSxJQUFJLGlCQUFpQixHQUFHLE9BQU8sSUFBSSxFQUFFLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RSxRQUFBLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRGLElBQUksaUJBQWlCLElBQUksZ0JBQWdCLEVBQUU7QUFDMUMsWUFBQSxHQUFHLEdBQUc7QUFDTCxnQkFBQSxVQUFVLEVBQUUsSUFBSTtBQUNoQixnQkFBQSxJQUFJLEVBQUUsY0FBYztBQUNwQixnQkFBQSxPQUFPLEVBQUUsT0FBTzthQUNoQixDQUFBO0FBQ0QsU0FBQTtBQUVELFFBQUEsT0FBTyxHQUFHLENBQUM7S0FDWDtJQUdELDhCQUE4QixDQUFDLFFBQWdCLEVBQUUsV0FBbUIsRUFBQTtRQUNuRSxPQUFPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzNHO0FBR0ssSUFBQSxnQkFBZ0IsQ0FBQyxRQUFnQixFQUFBOztZQUN0QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsb0NBQW9DLEdBQUcsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZGLE9BQU87QUFDUCxhQUFBO0FBRUQsWUFBQSxJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQyxJQUFJLEtBQUssR0FBZ0IsRUFBRSxDQUFDO1lBRTVCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNyRCxJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDNUMsZ0JBQUEsS0FBSyxJQUFJLEVBQUUsSUFBSSxRQUFRLEVBQUU7b0JBQ3hCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRWpELG9CQUFBLElBQUksR0FBRyxHQUFjO0FBQ3BCLHdCQUFBLElBQUksRUFBRSxJQUFJO0FBQ1Ysd0JBQUEsV0FBVyxFQUFFLEdBQUc7QUFDaEIsd0JBQUEsUUFBUSxFQUFFLEVBQUU7QUFDWix3QkFBQSxRQUFRLEVBQUU7QUFDVCw0QkFBQSxLQUFLLEVBQUU7QUFDTixnQ0FBQSxHQUFHLEVBQUUsQ0FBQztBQUNOLGdDQUFBLElBQUksRUFBRSxDQUFDO0FBQ1AsZ0NBQUEsTUFBTSxFQUFFLENBQUM7QUFDVCw2QkFBQTtBQUNELDRCQUFBLEdBQUcsRUFBRTtBQUNKLGdDQUFBLEdBQUcsRUFBRSxDQUFDO0FBQ04sZ0NBQUEsSUFBSSxFQUFFLENBQUM7QUFDUCxnQ0FBQSxNQUFNLEVBQUUsQ0FBQztBQUNULDZCQUFBO0FBQ0QseUJBQUE7cUJBQ0QsQ0FBQztBQUVGLG9CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEIsaUJBQUE7QUFDRCxhQUFBO0FBQ0QsWUFBQSxPQUFPLEtBQUssQ0FBQztTQUNiLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFLSyxJQUFBLG1DQUFtQyxDQUFDLFFBQWdCLEVBQUE7OztBQUN6RCxZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLE9BQU87WUFFUixJQUFJLGFBQWEsR0FBc0IsRUFBRSxDQUFDO0FBRTFDLFlBQUEsSUFBSSxNQUFNLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLE1BQU0sQ0FBQztBQUUvRCxZQUFBLElBQUksTUFBTSxFQUFFO0FBQ1gsZ0JBQUEsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7b0JBQ3pCLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3ZFLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQy9ELElBQUksZUFBZSxJQUFJLFdBQVcsRUFBRTtBQUNuQyx3QkFBQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDcEQsd0JBQUEsSUFBSSxJQUFJOzRCQUNQLFNBQVM7QUFFVix3QkFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN6RSx3QkFBQSxJQUFJLElBQUksRUFBRTtBQUNULDRCQUFBLElBQUksVUFBVSxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDNUQsVUFBVSxHQUFHLGVBQWUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRS9HLDRCQUFBLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQyxnQ0FBQSxVQUFVLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyw2QkFBQTtBQUVELDRCQUFBLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFBO0FBQ3ZELHlCQUFBO0FBQU0sNkJBQUE7QUFDTiw0QkFBQSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLEdBQUcsd0NBQXdDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hHLHlCQUFBO0FBQ0QscUJBQUE7QUFBTSx5QkFBQTtBQUNOLHdCQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsR0FBRyxnRUFBZ0UsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEkscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7WUFFRCxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDN0QsWUFBQSxPQUFPLGFBQWEsQ0FBQzs7QUFDckIsS0FBQTtBQUdLLElBQUEsa0NBQWtDLENBQUMsUUFBZ0IsRUFBQTs7O0FBQ3hELFlBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztnQkFDL0IsT0FBTztZQUVSLElBQUksWUFBWSxHQUFxQixFQUFFLENBQUM7QUFFeEMsWUFBQSxJQUFJLEtBQUssR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsS0FBSyxDQUFDO0FBRTdELFlBQUEsSUFBSSxLQUFLLEVBQUU7QUFDVixnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtvQkFDdkIsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxjQUFjLElBQUksVUFBVSxFQUFFO3dCQUNqQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQzs0QkFDNUIsU0FBUztBQUVWLHdCQUFBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNuRCx3QkFBQSxJQUFJLElBQUk7NEJBQ1AsU0FBUzs7QUFHVix3QkFBQSxJQUFJLGNBQWMsRUFBRTs0QkFDbkIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN0RCw0QkFBQSxJQUFJLFFBQVE7QUFDWCxnQ0FBQSxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyx5QkFBQTtBQUVELHdCQUFBLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3hFLHdCQUFBLElBQUksSUFBSSxFQUFFO0FBQ1QsNEJBQUEsSUFBSSxVQUFVLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUM1RCxVQUFVLEdBQUcsY0FBYyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFOUcsNEJBQUEsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2pDLGdDQUFBLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLDZCQUFBO0FBRUQsNEJBQUEsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7QUFDckQseUJBQUE7QUFBTSw2QkFBQTtBQUNOLDRCQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsR0FBRyx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEcseUJBQUE7QUFDRCxxQkFBQTtBQUFNLHlCQUFBO0FBQ04sd0JBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxHQUFHLCtEQUErRCxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsSSxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtZQUVELE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUMzRCxZQUFBLE9BQU8sWUFBWSxDQUFDOztBQUNwQixLQUFBO0lBR0ssd0JBQXdCLENBQUMsUUFBZ0IsRUFBRSxhQUFnQyxFQUFBOztBQUNoRixZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLE9BQU87WUFFUixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsK0NBQStDLEdBQUcsUUFBUSxDQUFDLENBQUM7Z0JBQ2xHLE9BQU87QUFDUCxhQUFBO0FBRUQsWUFBQSxJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7QUFFbEIsWUFBQSxJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM5QyxnQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLGFBQWEsRUFBRTtvQkFDaEMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTzt3QkFDbEMsU0FBUztvQkFFVixJQUFJLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3pELHdCQUFBLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDeEcscUJBQUE7eUJBQU0sSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM1RCx3QkFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN0RSxxQkFBQTtBQUFNLHlCQUFBO0FBQ04sd0JBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxHQUFHLGdFQUFnRSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3hJLFNBQVM7QUFDVCxxQkFBQTtBQUVELG9CQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLHlEQUF5RDtBQUMxRiwwQkFBQSxRQUFRLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO29CQUV0RSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IsaUJBQUE7QUFDRCxhQUFBO0FBRUQsWUFBQSxJQUFJLEtBQUs7QUFDUixnQkFBQSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDN0MsQ0FBQSxDQUFBO0FBQUEsS0FBQTtJQUdLLHVCQUF1QixDQUFDLFFBQWdCLEVBQUUsWUFBOEIsRUFBQTs7QUFDN0UsWUFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO2dCQUMvQixPQUFPO1lBRVIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLDhDQUE4QyxHQUFHLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRyxPQUFPO0FBQ1AsYUFBQTtBQUVELFlBQUEsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBRWxCLFlBQUEsSUFBSSxZQUFZLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDNUMsZ0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxZQUFZLEVBQUU7b0JBQzlCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU87d0JBQ2hDLFNBQVM7b0JBRVYsSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUN2RCx3QkFBQSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ3BHLHFCQUFBO3lCQUFNLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDMUQsd0JBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDbkUscUJBQUE7QUFBTSx5QkFBQTtBQUNOLHdCQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsR0FBRywrREFBK0QsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUN0SSxTQUFTO0FBQ1QscUJBQUE7QUFFRCxvQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRywrREFBK0Q7QUFDaEcsMEJBQUEsUUFBUSxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtvQkFFcEUsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNiLGlCQUFBO0FBQ0QsYUFBQTtBQUVELFlBQUEsSUFBSSxLQUFLO0FBQ1IsZ0JBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzdDLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHSyxJQUFBLHdDQUF3QyxDQUFDLFFBQWdCLEVBQUE7OztBQUM5RCxZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLE9BQU87QUFFUixZQUFBLElBQUksR0FBRyxHQUE4QjtBQUNwQyxnQkFBQSxLQUFLLEVBQUUsRUFBRTtBQUNULGdCQUFBLE1BQU0sRUFBRSxFQUFFO2FBQ1YsQ0FBQTtZQUVELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxrREFBa0QsR0FBRyxRQUFRLENBQUMsQ0FBQztnQkFDckcsT0FBTztBQUNQLGFBQUE7QUFFRCxZQUFBLElBQUksS0FBSyxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxLQUFLLENBQUM7QUFDN0QsWUFBQSxJQUFJLE1BQU0sR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsTUFBTSxDQUFDO0FBQy9ELFlBQUEsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBRWxCLElBQUksTUFBTSxFQUFFO0FBQ1gsZ0JBQUEsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7b0JBQ3pCLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRTt3QkFFakQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDcEQsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsT0FBTyxHQUFHLEdBQUcsQ0FBQTt3QkFDOUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUU3Qyx3QkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxzRUFBc0U7QUFDdkcsOEJBQUEsUUFBUSxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUE7QUFFaEUsd0JBQUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO3dCQUVqRCxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7QUFFRCxZQUFBLElBQUksS0FBSyxFQUFFO0FBQ1YsZ0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7b0JBQ3ZCLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTt3QkFDL0MsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUVuRCx3QkFBQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzVFLHdCQUFBLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDN0QsNEJBQUEsT0FBTyxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFFM0Isd0JBQUEsSUFBSSxPQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFBO3dCQUNoRSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRTVDLHdCQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLDhEQUE4RDtBQUMvRiw4QkFBQSxRQUFRLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQTtBQUUvRCx3QkFBQSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7d0JBRS9DLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDYixxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUVELFlBQUEsSUFBSSxLQUFLO0FBQ1IsZ0JBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRTdDLFlBQUEsT0FBTyxHQUFHLENBQUM7O0FBQ1gsS0FBQTtBQUNEOztNQ3g4QlksWUFBWSxDQUFBO0lBQ3hCLFdBQ1MsQ0FBQSxHQUFRLEVBQ1IsRUFBZ0IsRUFDaEIsZ0JBQUEsR0FBMkIsRUFBRSxFQUM3QixhQUEwQixHQUFBLEVBQUUsRUFDNUIsZ0JBQUEsR0FBNkIsRUFBRSxFQUFBO1FBSi9CLElBQUcsQ0FBQSxHQUFBLEdBQUgsR0FBRyxDQUFLO1FBQ1IsSUFBRSxDQUFBLEVBQUEsR0FBRixFQUFFLENBQWM7UUFDaEIsSUFBZ0IsQ0FBQSxnQkFBQSxHQUFoQixnQkFBZ0IsQ0FBYTtRQUM3QixJQUFhLENBQUEsYUFBQSxHQUFiLGFBQWEsQ0FBZTtRQUM1QixJQUFnQixDQUFBLGdCQUFBLEdBQWhCLGdCQUFnQixDQUFlO0tBQ25DO0FBRUwsSUFBQSxhQUFhLENBQUMsSUFBWSxFQUFBO0FBQ3pCLFFBQUEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUN4QixZQUFBLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRTFCLFFBQUEsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RDLFlBQUEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzVCLGdCQUFBLE9BQU8sSUFBSSxDQUFDO0FBQ1osYUFBQTtBQUNELFNBQUE7QUFFRCxRQUFBLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQzVDLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7O0FBRXJDLFlBQUEsSUFBRyxVQUFVLEVBQUU7QUFDZCxnQkFBQSxPQUFPLElBQUksQ0FBQztBQUNaLGFBQUE7QUFDRCxTQUFBO0tBQ0Q7SUFFSyxpQ0FBaUMsQ0FBQyxJQUFZLEVBQUUsY0FBc0IsRUFBQTs7QUFDM0UsWUFBQSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNuRSxZQUFBLE9BQU8sTUFBTSxJQUFJLENBQUMsaUNBQWlDLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDakUsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUVLLElBQUEsaUNBQWlDLENBQUMsUUFBZ0IsRUFBQTs7QUFDdkQsWUFBQSxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkUsSUFBSTs7Z0JBRUgsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDbEQsYUFBQTtBQUFDLFlBQUEsT0FBQSxFQUFBLEVBQU0sR0FBRztTQUNYLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFFRCxJQUFBLG9CQUFvQixDQUFDLFlBQW9CLEVBQUE7UUFDeEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNoRCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDaEMsWUFBQSxJQUFJLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNuRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQyxZQUFBLElBQUksQ0FBQyxTQUFTO0FBQ2IsZ0JBQUEsT0FBTyxPQUFPLENBQUM7QUFDaEIsU0FBQTtBQUNELFFBQUEsT0FBTyxFQUFFLENBQUM7S0FDVjtBQUlLLElBQUEseUJBQXlCLENBQUMsV0FBbUIsRUFBRSxXQUFtQixFQUN2RSxnQkFBeUIsRUFBRSxvQkFBNEIsRUFBQTs7O0FBRXZELFlBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO2dCQUNyRSxPQUFPOzs7QUFJUixZQUFBLElBQUksTUFBTSxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFDbEUsWUFBQSxJQUFJLENBQUMsTUFBTTtBQUNWLGdCQUFBLE1BQU0sR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsTUFBTSxDQUFDO0FBRS9ELFlBQUEsSUFBSSxDQUFDLE1BQU07Z0JBQ1YsT0FBTztBQUVSLFlBQUEsSUFBSSxNQUFNLEdBQTBCO0FBQ25DLGdCQUFBLGdCQUFnQixFQUFFLEVBQUU7QUFDcEIsZ0JBQUEsWUFBWSxFQUFFLEVBQUU7YUFDaEIsQ0FBQztBQUVGLFlBQUEsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFDekIsZ0JBQUEsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUN0QixnQkFBQSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUVoRSxnQkFBQSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pFLG9CQUFBLFNBQVM7QUFFVixnQkFBQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1YsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNWLHdCQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFdBQVcsR0FBRyx3Q0FBd0MsR0FBRyxJQUFJLENBQUMsQ0FBQzt3QkFDckcsU0FBUztBQUNULHFCQUFBO0FBQ0QsaUJBQUE7OztnQkFJRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDdkcsU0FBUztBQUVWLGdCQUFBLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBRWhFLGdCQUFBLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQ2pELG9CQUFBLElBQUksb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixDQUFDLENBQUM7b0JBQ25HLElBQUksV0FBVyxJQUFJLG9CQUFvQixFQUFFO0FBQ3hDLHdCQUFBLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUN0RixxQkFBQTtBQUNELGlCQUFBO0FBRUQsZ0JBQUEsSUFBSSxXQUFXLElBQUksSUFBSSxDQUFDLElBQUk7QUFDM0Isb0JBQUEsU0FBUztBQUdWLGdCQUFBLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDckcsZ0JBQUEsTUFBTSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDL0UsZ0JBQUEsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbkUsYUFBQTtBQUVELFlBQUEsT0FBTyxNQUFNLENBQUM7O0FBQ2QsS0FBQTtBQUVELElBQUEsb0JBQW9CLENBQUMsaUJBQXlCLEVBQUUsUUFBZ0IsRUFBRSxhQUFxQixFQUFBO0FBQ3RGLFFBQUEsSUFBSSxxQkFBcUIsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ25HLFFBQUEsSUFBSSxPQUFPLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUNoSSxRQUFBLE9BQU8sR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRixRQUFBLE9BQU8sT0FBTyxDQUFDO0tBQ2Y7QUFHSyxJQUFBLCtCQUErQixDQUFDLFFBQWdCLEVBQUUsYUFBcUIsRUFDNUUsZ0JBQXlCLEVBQUE7OztBQUV6QixZQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQy9CLE9BQU87QUFFUixZQUFBLElBQUksTUFBTSxHQUEwQjtBQUNuQyxnQkFBQSxnQkFBZ0IsRUFBRSxFQUFFO0FBQ3BCLGdCQUFBLFlBQVksRUFBRSxFQUFFO2FBQ2hCLENBQUM7O0FBR0YsWUFBQSxJQUFJLE1BQU0sR0FBRyxDQUFBLEVBQUEsR0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsTUFBTSxDQUFDO0FBQy9ELFlBQUEsSUFBSSxNQUFNLEVBQUU7QUFDWCxnQkFBQSxLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUN6QixvQkFBQSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBRXRCLG9CQUFBLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzlELG9CQUFBLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUUsd0JBQUEsU0FBUztBQUVWLG9CQUFBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQTtvQkFDaEQsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNWLHdCQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsR0FBRyx3Q0FBd0MsR0FBRyxJQUFJLENBQUMsQ0FBQzt3QkFDbEcsU0FBUztBQUNULHFCQUFBO0FBSUQsb0JBQUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRzVFLG9CQUFBLElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJO3dCQUN2QixTQUFTO0FBRVYsb0JBQUEsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRWpGLG9CQUFBLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQy9FLG9CQUFBLE1BQU0sQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ25FLGlCQUFBO0FBQ0QsYUFBQTs7QUFHRCxZQUFBLElBQUksS0FBSyxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxLQUFLLENBQUM7QUFDN0QsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLGdCQUFBLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO0FBQ3BCLG9CQUFBLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztBQUUxRCxvQkFBQSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO3dCQUN2QixTQUFTO0FBRVYsb0JBQUEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO3dCQUNuRCxTQUFTO0FBRVYsb0JBQUEsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDOUQsb0JBQUEsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxRSx3QkFBQSxTQUFTO0FBRVYsb0JBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBO29CQUNoRCxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1Ysd0JBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxHQUFHLHVDQUF1QyxHQUFHLElBQUksQ0FBQyxDQUFDO3dCQUNqRyxTQUFTO0FBQ1QscUJBQUE7QUFFRCxvQkFBQSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksUUFBUTt3QkFDdkQsU0FBUztBQUVWLG9CQUFBLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUU1RSxvQkFBQSxJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSTt3QkFDdkIsU0FBUztBQUVWLG9CQUFBLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUVqRixvQkFBQSxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMvRSxvQkFBQSxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNuRSxpQkFBQTtBQUNELGFBQUE7QUFFRCxZQUFBLE9BQU8sTUFBTSxDQUFDOztBQUNkLEtBQUE7QUFHSyxJQUFBLGNBQWMsQ0FBQyxJQUFXLEVBQUUsV0FBbUIsRUFBRSxlQUF5QixFQUFFLGdCQUF5QixFQUFBOztBQUMxRyxZQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFFdkIsWUFBQSxJQUFJLE1BQU0sR0FBMEI7QUFDbkMsZ0JBQUEsZ0JBQWdCLEVBQUUsRUFBRTtBQUNwQixnQkFBQSxZQUFZLEVBQUUsRUFBRTthQUNoQixDQUFDO0FBRUYsWUFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO0FBQzNCLGdCQUFBLE9BQU8sTUFBTSxDQUFDO1lBR2YsSUFBSSxJQUFJLElBQUksV0FBVyxFQUFFO2dCQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyx3REFBd0QsQ0FBQyxDQUFBO0FBQzlGLGdCQUFBLE9BQU8sTUFBTSxDQUFDO0FBQ2QsYUFBQTtBQUVELFlBQUEsTUFBTSxJQUFJLENBQUMsaUNBQWlDLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFMUQsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRSxZQUFBLElBQUksZUFBZSxFQUFFO0FBQ3BCLGdCQUFBLEtBQUssSUFBSSxRQUFRLElBQUksZUFBZSxFQUFFO0FBQ3JDLG9CQUFBLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsaUJBQUE7QUFDRCxhQUFBO0FBRUQsWUFBQSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQyxDQUFBO0FBQzlELGdCQUFBLE9BQU8sTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdkYsYUFBQTs7O0FBSUQsWUFBQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUM1QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLFNBQVMsRUFBRTs7QUFFZixvQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyw2QkFBNkIsR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFBO0FBQ2pHLG9CQUFBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFBO0FBQ3JFLG9CQUFBLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUMvQyxpQkFBQTtBQUFNLHFCQUFBO0FBQ04sb0JBQUEsSUFBSSxnQkFBZ0IsRUFBRTs7d0JBRXJCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLG9CQUFvQixHQUFHLElBQUksQ0FBQyxDQUFBO0FBQ2hFLHdCQUFBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFBO0FBQ3JFLHdCQUFBLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN2QyxxQkFBQTtBQUFNLHlCQUFBOzt3QkFFTixJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDNUQsd0JBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsMkNBQTJDLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxlQUFlLENBQUMsQ0FBQTtBQUNuSCx3QkFBQSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQTtBQUN6RSx3QkFBQSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDbkQsd0JBQUEsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0FBQzVFLHFCQUFBO0FBQ0QsaUJBQUE7QUFDRCxhQUFBOzs7QUFHSSxpQkFBQTtnQkFDSixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLFNBQVMsRUFBRTs7QUFFZixvQkFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyw2QkFBNkIsR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLFdBQVcsQ0FBQyxDQUFBO0FBQ2pHLG9CQUFBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFBO0FBQ3JFLG9CQUFBLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUM3QyxpQkFBQTtBQUFNLHFCQUFBO0FBQ04sb0JBQUEsSUFBSSxnQkFBZ0IsRUFBRSxDQUVyQjtBQUFNLHlCQUFBOzt3QkFFTixJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDNUQsd0JBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsMkNBQTJDLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxlQUFlLENBQUMsQ0FBQTtBQUNuSCx3QkFBQSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7QUFDOUUsd0JBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ2pELHdCQUFBLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQTtBQUM1RSxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtBQUNELFlBQUEsT0FBTyxNQUFNLENBQUM7U0FDZCxDQUFBLENBQUE7QUFBQSxLQUFBO0FBS0ssSUFBQSxrQkFBa0IsQ0FBQyxPQUFlLEVBQUE7O0FBQ3ZDLFlBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztnQkFDOUIsT0FBTztBQUVSLFlBQUEsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUMzQixnQkFBQSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUdoQyxZQUFBLElBQUksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN0RCxZQUFBLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNoQyxnQkFBQSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNyQyxhQUFBO0FBRUQsWUFBQSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xELFlBQUEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyw0QkFBNEIsR0FBRyxPQUFPLENBQUMsQ0FBQTtBQUMzRSxnQkFBQSxJQUFJLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDL0Msb0JBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwRCxhQUFBO1NBQ0QsQ0FBQSxDQUFBO0FBQUEsS0FBQTtBQUVLLElBQUEsb0NBQW9DLENBQUMsUUFBZ0IsRUFBQTs7O0FBQzFELFlBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztnQkFDL0IsT0FBTzs7QUFHUixZQUFBLElBQUksTUFBTSxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxNQUFNLENBQUM7QUFDL0QsWUFBQSxJQUFJLE1BQU0sRUFBRTtBQUNYLGdCQUFBLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFO0FBQ3pCLG9CQUFBLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFFdEIsb0JBQUEsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzFELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZ0NBQWdDLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckUsb0JBQUEsSUFBSSxXQUFXLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtBQUM1Qix3QkFBQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hELHdCQUFBLElBQUksSUFBSSxFQUFFOzRCQUNULElBQUk7QUFDSCxnQ0FBQSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdkMsNkJBQUE7QUFBQyw0QkFBQSxPQUFBLEVBQUEsRUFBTSxHQUFHO0FBQ1gseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTs7QUFFRCxLQUFBO0FBQ0Q7O0FDblZvQixNQUFBLDZCQUE4QixTQUFRQyxlQUFNLENBQUE7QUFBakUsSUFBQSxXQUFBLEdBQUE7O1FBS0MsSUFBb0IsQ0FBQSxvQkFBQSxHQUFxQixFQUFFLENBQUM7UUFDNUMsSUFBc0IsQ0FBQSxzQkFBQSxHQUFxQixFQUFFLENBQUM7UUFFOUMsSUFBZ0IsQ0FBQSxnQkFBQSxHQUFHLEtBQUssQ0FBQztLQW9mekI7SUFsZk0sTUFBTSxHQUFBOztBQUNYLFlBQUEsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFFMUIsWUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVuRCxJQUFJLENBQUMsYUFBYSxDQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNuRSxDQUFDO0FBRUYsWUFBQSxJQUFJLENBQUMsYUFBYSxDQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sS0FBSyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQ3JGLENBQUM7WUFFRixJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2YsZ0JBQUEsRUFBRSxFQUFFLHlCQUF5QjtBQUM3QixnQkFBQSxJQUFJLEVBQUUseUJBQXlCO0FBQy9CLGdCQUFBLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtBQUM1QyxhQUFBLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7QUFDZixnQkFBQSxFQUFFLEVBQUUsa0NBQWtDO0FBQ3RDLGdCQUFBLElBQUksRUFBRSxxQ0FBcUM7QUFDM0MsZ0JBQUEsY0FBYyxFQUFFLENBQUMsTUFBYyxFQUFFLElBQWtCLEtBQUssSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUM7QUFDeEcsYUFBQSxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2YsZ0JBQUEsRUFBRSxFQUFFLHNCQUFzQjtBQUMxQixnQkFBQSxJQUFJLEVBQUUsc0JBQXNCO0FBQzVCLGdCQUFBLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtBQUN6QyxhQUFBLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7QUFDZixnQkFBQSxFQUFFLEVBQUUsb0NBQW9DO0FBQ3hDLGdCQUFBLElBQUksRUFBRSxvQ0FBb0M7QUFDMUMsZ0JBQUEsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixFQUFFO0FBQ3BELGFBQUEsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUNmLGdCQUFBLEVBQUUsRUFBRSxxQ0FBcUM7QUFDekMsZ0JBQUEsSUFBSSxFQUFFLHFDQUFxQztBQUMzQyxnQkFBQSxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUMsK0JBQStCLEVBQUU7QUFDdEQsYUFBQSxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2YsZ0JBQUEsRUFBRSxFQUFFLDJDQUEyQztBQUMvQyxnQkFBQSxJQUFJLEVBQUUsNENBQTRDO0FBQ2xELGdCQUFBLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxvQ0FBb0MsRUFBRTtBQUMzRCxhQUFBLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7QUFDZixnQkFBQSxFQUFFLEVBQUUsa0JBQWtCO0FBQ3RCLGdCQUFBLElBQUksRUFBRSxrQkFBa0I7QUFDeEIsZ0JBQUEsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUN0QyxhQUFBLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7QUFDZixnQkFBQSxFQUFFLEVBQUUsbUJBQW1CO0FBQ3ZCLGdCQUFBLElBQUksRUFBRSx5QkFBeUI7QUFDL0IsZ0JBQUEsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFO0FBQ3ZDLGFBQUEsQ0FBQyxDQUFDOztZQUdILElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtZQUVoRixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksWUFBWSxDQUN6QixJQUFJLENBQUMsR0FBRyxFQUNSLG9DQUFvQyxFQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FDOUIsQ0FBQztBQUVGLFlBQUEsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLFlBQVksQ0FDekIsSUFBSSxDQUFDLEdBQUcsRUFDUixJQUFJLENBQUMsRUFBRSxFQUNQLG9DQUFvQyxFQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FDOUIsQ0FBQztTQUNGLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFFRCxJQUFBLGFBQWEsQ0FBQyxJQUFZLEVBQUE7QUFDekIsUUFBQSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ3hCLFlBQUEsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFMUIsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRTtBQUMvQyxZQUFBLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUM1QixnQkFBQSxPQUFPLElBQUksQ0FBQztBQUNaLGFBQUE7QUFDRCxTQUFBO1FBRUQsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO0FBQ3JELFlBQUEsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3pCLGdCQUFBLE9BQU8sSUFBSSxDQUFDO0FBQ1osYUFBQTtBQUNELFNBQUE7S0FDRDtBQUdLLElBQUEsaUJBQWlCLENBQUMsSUFBbUIsRUFBQTs7QUFDMUMsWUFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDaEMsT0FBTztBQUVSLFlBQUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5RCxJQUFJLE9BQU8sSUFBSSxLQUFLLEVBQUU7QUFDckIsZ0JBQUEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFO29CQUM1QyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsb0NBQW9DLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlELGlCQUFBOztBQUdELGdCQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtvQkFDckMsSUFBSSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTt3QkFDakUsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEUsd0JBQUEsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFOzRCQUNoQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekMseUJBQUE7QUFDRCxxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtTQUNELENBQUEsQ0FBQTtBQUFBLEtBQUE7SUFFSyxpQkFBaUIsQ0FBQyxJQUFtQixFQUFFLE9BQWUsRUFBQTs7QUFDM0QsWUFBQSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFFekUsWUFBQSxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNCLFlBQUEsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBUSxFQUFBLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFBLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM3RSxDQUFBLENBQUE7QUFBQSxLQUFBO0lBRUssMEJBQTBCLEdBQUE7O0FBQy9CLFlBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3RFLE9BQU87QUFFUixZQUFBLElBQUksSUFBSSxDQUFDLGdCQUFnQjtnQkFDeEIsT0FBTztBQUVSLFlBQUEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUU3QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQ3hELFlBQUEsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztBQUUvQixZQUFBLElBQUlDLGVBQU0sQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3RHLFlBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0REFBNEQsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxDQUFDO1lBRTFJLElBQUk7QUFDSCxnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtBQUM3QyxvQkFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzt3QkFDdkUsT0FBTzs7QUFJUixvQkFBQSxJQUFJLE1BQTZCLENBQUM7QUFFbEMsb0JBQUEsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFFcEUsSUFBSSxPQUFPLElBQUksS0FBSyxFQUFFOztBQUdyQix3QkFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRTtBQUMvSCw0QkFBQSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUU7QUFDMUMsZ0NBQUEsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FDL0MsSUFBSSxDQUFDLE9BQU8sRUFDWixJQUFJLENBQUMsT0FBTyxFQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQzFDLElBQUksQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQ2xDLENBQUE7QUFFRCxnQ0FBQSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLE1BQU0sRUFBRTtBQUN4QyxvQ0FBQSxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN2RSxvQ0FBQSxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzVCLHdDQUFBLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ2xFLHFDQUFBO0FBQ0QsaUNBQUE7QUFDRCw2QkFBQTtBQUVELDRCQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7Z0NBQzlCLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0FBQy9HLDZCQUFBOztBQUdELDRCQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtnQ0FDckMsSUFBSSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtvQ0FDcEUsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDekUsb0NBQUEsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO3dDQUNoQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekMscUNBQUE7QUFDRCxpQ0FBQTtBQUNELDZCQUFBO0FBQ0QseUJBQUE7QUFDRCxxQkFBQTtvQkFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLHNCQUFzQixJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUM7QUFDMUUsb0JBQUEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRTt3QkFDOUIsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQzVILHFCQUFBO0FBRUQsb0JBQUEsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzVFLHdCQUFBLElBQUlBLGVBQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxhQUFhLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDeEgscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7QUFBQyxZQUFBLE9BQU8sQ0FBQyxFQUFFO0FBQ1gsZ0JBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMxRCxhQUFBO0FBRUQsWUFBQSxJQUFJQSxlQUFNLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUMxQyxZQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztBQUU5RSxZQUFBLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFFOUIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDdEUsZ0JBQUEsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMzQixnQkFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFRLEVBQUEsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVFLGFBQUE7U0FDRCxDQUFBLENBQUE7QUFBQSxLQUFBO0lBR0ssNkJBQTZCLENBQUMsTUFBYyxFQUFFLElBQWtCLEVBQUE7O0FBQ3JFLFlBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNyQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xDLGdCQUFBLElBQUlBLGVBQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNuQyxPQUFPO0FBQ1AsYUFBQTtZQUVELElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQywrQkFBK0IsQ0FDekQsSUFBSSxDQUFDLElBQUksRUFDVCxJQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFFN0MsWUFBQSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsZ0JBQWdCLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDNUUsZ0JBQUEsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDMUUsYUFBQTtBQUVELFlBQUEsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxJQUFJLENBQUM7QUFDdEMsZ0JBQUEsSUFBSUEsZUFBTSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7O0FBRW5ELGdCQUFBLElBQUlBLGVBQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxhQUFhLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekgsQ0FBQSxDQUFBO0FBQUEsS0FBQTtJQUdLLHFCQUFxQixHQUFBOztZQUMxQixJQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQztZQUM5QixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQztZQUU1QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBRTlDLFlBQUEsSUFBSSxLQUFLLEVBQUU7QUFDVixnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtBQUN2QixvQkFBQSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDaEMsU0FBUztvQkFFVixJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsK0JBQStCLENBQ3pELElBQUksQ0FBQyxJQUFJLEVBQ1QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRzdDLG9CQUFBLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM1RSx3QkFBQSxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUMxRSx3QkFBQSxxQkFBcUIsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0FBQ3hELHdCQUFBLG1CQUFtQixFQUFFLENBQUM7QUFDdEIscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7WUFFRCxJQUFJLHFCQUFxQixJQUFJLENBQUM7QUFDN0IsZ0JBQUEsSUFBSUEsZUFBTSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7O2dCQUVuRCxJQUFJQSxlQUFNLENBQUMsUUFBUSxHQUFHLHFCQUFxQixHQUFHLGFBQWEsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNqRyxzQkFBQSxRQUFRLEdBQUcsbUJBQW1CLEdBQUcsT0FBTyxJQUFJLG1CQUFtQixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNyRixDQUFBLENBQUE7QUFBQSxLQUFBO0lBR0ssK0JBQStCLEdBQUE7O1lBQ3BDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLGdCQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3ZCLG9CQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNoQyxTQUFTO0FBRVYsb0JBQUEsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUUxRSxvQkFBQSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNoQyx3QkFBQSxpQkFBaUIsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ25DLHdCQUFBLG1CQUFtQixFQUFFLENBQUM7QUFDdEIscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7WUFFRCxJQUFJLGlCQUFpQixJQUFJLENBQUM7QUFDekIsZ0JBQUEsSUFBSUEsZUFBTSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7O2dCQUV4RCxJQUFJQSxlQUFNLENBQUMsWUFBWSxHQUFHLGlCQUFpQixHQUFHLFFBQVEsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUN4RixzQkFBQSxRQUFRLEdBQUcsbUJBQW1CLEdBQUcsT0FBTyxJQUFJLG1CQUFtQixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNyRixDQUFBLENBQUE7QUFBQSxLQUFBO0lBR0ssNkJBQTZCLEdBQUE7O1lBQ2xDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLGdCQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3ZCLG9CQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNoQyxTQUFTO0FBRVYsb0JBQUEsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUV6RSxvQkFBQSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNoQyx3QkFBQSxpQkFBaUIsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ25DLHdCQUFBLG1CQUFtQixFQUFFLENBQUM7QUFDdEIscUJBQUE7QUFDRCxpQkFBQTtBQUNELGFBQUE7WUFFRCxJQUFJLGlCQUFpQixJQUFJLENBQUM7QUFDekIsZ0JBQUEsSUFBSUEsZUFBTSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7O2dCQUV2RCxJQUFJQSxlQUFNLENBQUMsWUFBWSxHQUFHLGlCQUFpQixHQUFHLE9BQU8sSUFBSSxpQkFBaUIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUN2RixzQkFBQSxRQUFRLEdBQUcsbUJBQW1CLEdBQUcsT0FBTyxJQUFJLG1CQUFtQixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNyRixDQUFBLENBQUE7QUFBQSxLQUFBO0lBRUssb0NBQW9DLEdBQUE7O1lBQ3pDLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFFOUMsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNWLGdCQUFBLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3ZCLG9CQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNoQyxTQUFTO0FBRVYsb0JBQUEsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLHdDQUF3QyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUUvRSxvQkFBQSxJQUFJLE1BQU0sS0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDcEUsd0JBQUEsaUJBQWlCLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDekMsd0JBQUEsaUJBQWlCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDMUMsd0JBQUEsbUJBQW1CLEVBQUUsQ0FBQztBQUN0QixxQkFBQTtBQUNELGlCQUFBO0FBQ0QsYUFBQTtZQUVELElBQUksaUJBQWlCLElBQUksQ0FBQztBQUN6QixnQkFBQSxJQUFJQSxlQUFNLENBQUMsOENBQThDLENBQUMsQ0FBQzs7Z0JBRTNELElBQUlBLGVBQU0sQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLEdBQUcsV0FBVyxJQUFJLGlCQUFpQixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQzFGLHNCQUFBLFFBQVEsR0FBRyxtQkFBbUIsR0FBRyxPQUFPLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3JGLENBQUEsQ0FBQTtBQUFBLEtBQUE7SUFFRCxrQkFBa0IsR0FBQTtBQUNqQixRQUFBLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDL0I7SUFFSyxnQkFBZ0IsR0FBQTs7WUFDckIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN4QyxJQUFJLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM1RCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzFDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDMUMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBRTVDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUVkLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2pELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ25ELElBQUksb0JBQW9CLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDL0QsSUFBSSxjQUFjLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDbkQsSUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFFckQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxFQUFFO0FBQ3RCLGdCQUFBLElBQUksSUFBSSxlQUFlLEdBQUcsYUFBYSxHQUFHLFdBQVcsQ0FBQztBQUN0RCxnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFFBQVEsRUFBRTtBQUMxQixvQkFBQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDM0Usb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ2hDLElBQUksSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqRixxQkFBQTtvQkFDRCxJQUFJLElBQUksTUFBTSxDQUFBO0FBQ2QsaUJBQUE7QUFDRCxhQUFBO0FBQU0saUJBQUE7Z0JBQ04sSUFBSSxJQUFJLGdCQUFnQixDQUFDO2dCQUN6QixJQUFJLElBQUksdUJBQXVCLENBQUE7QUFDL0IsYUFBQTtZQUdELElBQUksb0JBQW9CLEdBQUcsQ0FBQyxFQUFFO0FBQzdCLGdCQUFBLElBQUksSUFBSSxnQ0FBZ0MsR0FBRyxvQkFBb0IsR0FBRyxXQUFXLENBQUM7QUFDOUUsZ0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxlQUFlLEVBQUU7QUFDakMsb0JBQUEsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFBO0FBQzNFLG9CQUFBLEtBQUssSUFBSSxJQUFJLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3ZDLHdCQUFBLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN0RCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNyRCxJQUFJLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUMvRixxQkFBQTtvQkFDRCxJQUFJLElBQUksTUFBTSxDQUFBO0FBQ2QsaUJBQUE7QUFDRCxhQUFBO0FBQU0saUJBQUE7Z0JBQ04sSUFBSSxJQUFJLGdDQUFnQyxDQUFBO2dCQUN4QyxJQUFJLElBQUksdUJBQXVCLENBQUE7QUFDL0IsYUFBQTtZQUdELElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtBQUN2QixnQkFBQSxJQUFJLElBQUksb0JBQW9CLEdBQUcsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUM1RCxnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUMzQixvQkFBQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDM0Usb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ2pDLElBQUksSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqRixxQkFBQTtvQkFDRCxJQUFJLElBQUksTUFBTSxDQUFBO0FBQ2QsaUJBQUE7QUFDRCxhQUFBO0FBQU0saUJBQUE7Z0JBQ04sSUFBSSxJQUFJLHFCQUFxQixDQUFDO2dCQUM5QixJQUFJLElBQUksdUJBQXVCLENBQUE7QUFDL0IsYUFBQTtZQUdELElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtBQUN2QixnQkFBQSxJQUFJLElBQUksZ0JBQWdCLEdBQUcsY0FBYyxHQUFHLFdBQVcsQ0FBQztBQUN4RCxnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUMzQixvQkFBQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDM0Usb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ2pDLElBQUksSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUNyRixxQkFBQTtvQkFDRCxJQUFJLElBQUksTUFBTSxDQUFBO0FBQ2QsaUJBQUE7QUFDRCxhQUFBO0FBQU0saUJBQUE7Z0JBQ04sSUFBSSxJQUFJLGlCQUFpQixDQUFDO2dCQUMxQixJQUFJLElBQUksdUJBQXVCLENBQUE7QUFDL0IsYUFBQTtZQUVELElBQUksZUFBZSxHQUFHLENBQUMsRUFBRTtBQUN4QixnQkFBQSxJQUFJLElBQUkscUJBQXFCLEdBQUcsZUFBZSxHQUFHLFdBQVcsQ0FBQztBQUM5RCxnQkFBQSxLQUFLLElBQUksSUFBSSxJQUFJLFVBQVUsRUFBRTtBQUM1QixvQkFBQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDM0Usb0JBQUEsS0FBSyxJQUFJLElBQUksSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ2xDLElBQUksSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUNyRixxQkFBQTtvQkFDRCxJQUFJLElBQUksTUFBTSxDQUFBO0FBQ2QsaUJBQUE7QUFDRCxhQUFBO0FBQU0saUJBQUE7Z0JBQ04sSUFBSSxJQUFJLHNCQUFzQixDQUFDO2dCQUMvQixJQUFJLElBQUksdUJBQXVCLENBQUE7QUFDL0IsYUFBQTtBQUlELFlBQUEsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztBQUNuRCxZQUFBLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbkQsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBRztBQUMxQyxnQkFBQSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRTtvQkFDOUUsVUFBVSxHQUFHLElBQUksQ0FBQztBQUNsQixpQkFBQTtBQUNGLGFBQUMsQ0FBQyxDQUFDO0FBRUgsWUFBQSxJQUFJLENBQUMsVUFBVTtBQUNkLGdCQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3ZELENBQUEsQ0FBQTtBQUFBLEtBQUE7SUFFSyxlQUFlLEdBQUE7O0FBQ3BCLFlBQUEsTUFBTSxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQTtBQUNqRCxZQUFBLE1BQU0sSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUE7QUFDNUMsWUFBQSxNQUFNLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFBOztBQUUxQyxZQUFBLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUE7QUFDbEMsWUFBQSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0FBQy9CLFlBQUEsSUFBSUEsZUFBTSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7U0FDcEQsQ0FBQSxDQUFBO0FBQUEsS0FBQTtJQUdLLFlBQVksR0FBQTs7QUFDakIsWUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDM0UsQ0FBQSxDQUFBO0FBQUEsS0FBQTtJQUVLLFlBQVksR0FBQTs7WUFDakIsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksWUFBWSxDQUN6QixJQUFJLENBQUMsR0FBRyxFQUNSLG9DQUFvQyxFQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FDOUIsQ0FBQztBQUVGLFlBQUEsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLFlBQVksQ0FDekIsSUFBSSxDQUFDLEdBQUcsRUFDUixJQUFJLENBQUMsRUFBRSxFQUNQLG9DQUFvQyxFQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FDOUIsQ0FBQztTQUNGLENBQUEsQ0FBQTtBQUFBLEtBQUE7QUFHRDs7OzsifQ==

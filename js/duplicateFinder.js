import { formatBytes } from './utils.js';

export class JavaScriptDuplicateFinder {
    constructor() {
        this.hashGroups = new Map();
        this.totalFiles = 0;
        this.totalSize = 0;
    }

    addFile(name, path, size, hash) {
        const file = { name, path, size };

        if (!this.hashGroups.has(hash)) {
            this.hashGroups.set(hash, []);
        }

        this.hashGroups.get(hash).push(file);
        this.totalFiles++;
        this.totalSize += size;
    }

    findDuplicates() {
        const groups = [];
        let duplicateSize = 0;
        let groupId = 1;

        for (const [hash, files] of this.hashGroups) {
            if (files.length > 1) {
                const fileSize = files[0].size;
                const wastedSpace = fileSize * (files.length - 1);
                duplicateSize += wastedSpace;

                groups.push({
                    id: groupId++,
                    hash,
                    fileCount: files.length,
                    fileSize: formatBytes(fileSize),
                    wastedSpace: formatBytes(wastedSpace),
                    files: files
                });
            }
        }

        return {
            groups,
            stats: {
                totalFiles: this.totalFiles,
                duplicateGroups: groups.length,
                totalSize: formatBytes(this.totalSize),
                wastedSpace: formatBytes(duplicateSize)
            }
        };
    }
}

async function calculateHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function processFile(file) {
    try {
        const hash = await calculateHash(file);
        return {
            name: file.name,
            path: file.webkitRelativePath || file.name,
            size: file.size,
            hash: hash
        };
    } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return null;
    }
}

export function filterFilesByExtension(files, extensions) {
    if (extensions.length === 0) return files;

    return files.filter(file => {
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        return extensions.includes(fileExt);
    });
}

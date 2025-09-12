// hash-worker.js - Web Worker for parallel hash calculation
// This worker performs the same hash calculation as the main thread but in parallel

// Multi-algorithm hash combination for maximum collision resistance
function calculateCustomHash(data, size) {
    let fnv1a = 0x811c9dc5;
    let djb2 = 5381;
    let sdbm = 0;
    let sum = 0;
    
    // Process every byte + include position for better distribution
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        const pos = i + 1; // Position weight
        
        // FNV-1a
        fnv1a ^= byte;
        fnv1a = Math.imul(fnv1a, 0x1000193);
        
        // djb2
        djb2 = Math.imul(djb2, 33) ^ byte;
        
        // sdbm
        sdbm = Math.imul(sdbm, 65599) + byte;
        
        // Weighted sum including position
        sum += byte * pos;
    }
    
    // Include file size as major component to prevent same-content collisions
    const sizeComponent = size * 0x9e3779b9; // Golden ratio multiplier
    
    // Combine all hashes with size
    const hash1 = (fnv1a ^ sizeComponent) >>> 0;
    const hash2 = (djb2 ^ (size << 8)) >>> 0;
    const hash3 = (sdbm ^ sum) >>> 0;
    const hash4 = size >>> 0;
    
    // Create 32-character hash (128-bit equivalent)
    const finalHash = hash1.toString(16).padStart(8, '0') + 
                     hash2.toString(16).padStart(8, '0') + 
                     hash3.toString(16).padStart(8, '0') + 
                     hash4.toString(16).padStart(8, '0');
    
    return finalHash;
}

// Worker message handler
self.onmessage = function(e) {
    const { fileId, fileName, fileData, fileSize, chunkIndex } = e.data;
    
    try {
        // Convert file data to Uint8Array if needed
        const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
        
        // Calculate hash
        const hash = calculateCustomHash(data, fileSize);
        
        // Send result back to main thread
        self.postMessage({
            success: true,
            fileId,
            fileName,
            hash,
            fileSize,
            chunkIndex
        });
    } catch (error) {
        // Send error back to main thread
        self.postMessage({
            success: false,
            fileId,
            fileName,
            error: error.message,
            chunkIndex
        });
    }
};
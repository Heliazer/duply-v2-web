const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 'http://127.0.0.1:8000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Duply Backend Server Running', version: '2.1.0' });
});

// File deletion endpoint
app.post('/api/delete-files', async (req, res) => {
    try {
        const { files } = req.body;
        
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere un array de archivos' 
            });
        }

        console.log(`🗑️  Solicitud de eliminación para ${files.length} archivos`);
        
        const results = {
            deleted: [],
            failed: [],
            total: files.length
        };

        for (const fileInfo of files) {
            try {
                const filePath = fileInfo.path;
                
                // Validaciones de seguridad
                if (!filePath || typeof filePath !== 'string') {
                    throw new Error('Ruta de archivo inválida');
                }

                // Verificar que el archivo existe
                if (!await fs.pathExists(filePath)) {
                    throw new Error('El archivo no existe');
                }

                // Verificar que es un archivo (no directorio)
                const stats = await fs.stat(filePath);
                if (!stats.isFile()) {
                    throw new Error('No es un archivo válido');
                }

                // Restricción de seguridad: no eliminar archivos del sistema
                const resolved = path.resolve(filePath);
                const systemDirs = ['/bin', '/usr', '/etc', '/var', '/sys', '/proc', '/boot'];
                const isSystemFile = systemDirs.some(sysDir => resolved.startsWith(sysDir));
                
                if (isSystemFile) {
                    throw new Error('No se pueden eliminar archivos del sistema');
                }

                // Eliminar el archivo
                await fs.remove(filePath);
                
                results.deleted.push(filePath);
                console.log(`✅ Eliminado: ${path.basename(filePath)}`);
                
            } catch (error) {
                results.failed.push({ 
                    path: fileInfo.path, 
                    error: error.message 
                });
                console.log(`❌ Error eliminando ${path.basename(fileInfo.path)}: ${error.message}`);
            }
        }

        console.log(`📊 Resumen: ${results.deleted.length} eliminados, ${results.failed.length} errores`);
        
        res.json({
            success: true,
            results: results,
            message: `${results.deleted.length} archivos eliminados, ${results.failed.length} errores`
        });

    } catch (error) {
        console.error('💥 Error en el servidor:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// File existence check endpoint
app.post('/api/check-files', async (req, res) => {
    try {
        const { files } = req.body;
        
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere un array de archivos' 
            });
        }

        const results = {};
        
        for (const filePath of files) {
            try {
                const exists = await fs.pathExists(filePath);
                results[filePath] = exists;
            } catch (error) {
                results[filePath] = false;
            }
        }

        res.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('Error checking files:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Byte-by-byte file comparison endpoint
app.post('/api/compare-files', async (req, res) => {
    try {
        const { file1Path, file2Path } = req.body;
        
        // Input validation
        if (!file1Path || !file2Path) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requieren las rutas de ambos archivos' 
            });
        }

        // Security validations
        if (!await fs.pathExists(file1Path) || !await fs.pathExists(file2Path)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Uno o ambos archivos no existen' 
            });
        }

        // Path traversal prevention
        const resolvedPath1 = path.resolve(file1Path);
        const resolvedPath2 = path.resolve(file2Path);
        const systemDirs = ['/bin', '/usr', '/etc', '/var', '/sys', '/proc', '/boot'];
        
        const isSystemFile1 = systemDirs.some(sysDir => resolvedPath1.startsWith(sysDir));
        const isSystemFile2 = systemDirs.some(sysDir => resolvedPath2.startsWith(sysDir));
        
        if (isSystemFile1 || isSystemFile2) {
            return res.status(403).json({
                success: false,
                error: 'No se pueden comparar archivos del sistema'
            });
        }

        // Verify both are files
        const stats1 = await fs.stat(file1Path);
        const stats2 = await fs.stat(file2Path);
        
        if (!stats1.isFile() || !stats2.isFile()) {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden comparar archivos, no directorios'
            });
        }

        // Quick size check first
        if (stats1.size !== stats2.size) {
            return res.json({
                success: true,
                identical: false,
                reason: 'different_sizes',
                file1Size: stats1.size,
                file2Size: stats2.size,
                comparisonType: 'size_check'
            });
        }

        // If files are empty, they're identical
        if (stats1.size === 0) {
            return res.json({
                success: true,
                identical: true,
                reason: 'both_empty',
                comparisonType: 'size_check'
            });
        }

        console.log(`🔍 Comparing files byte-by-byte: ${path.basename(file1Path)} vs ${path.basename(file2Path)}`);

        // Perform byte-by-byte comparison
        const areIdentical = await compareFilesByteByByte(file1Path, file2Path);

        res.json({
            success: true,
            identical: areIdentical,
            reason: areIdentical ? 'byte_by_byte_match' : 'byte_by_byte_different',
            comparisonType: 'byte_by_byte',
            fileSize: stats1.size
        });

    } catch (error) {
        console.error('💥 Error comparing files:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Byte-by-byte comparison function
async function compareFilesByteByByte(path1, path2) {
    return new Promise((resolve, reject) => {
        const stream1 = fs.createReadStream(path1);
        const stream2 = fs.createReadStream(path2);
        
        let identical = true;
        let bytesRead = 0;
        const chunkSize = 64 * 1024; // 64KB chunks
        
        let buffer1 = Buffer.alloc(0);
        let buffer2 = Buffer.alloc(0);
        let finished1 = false;
        let finished2 = false;

        stream1.on('data', (chunk) => {
            buffer1 = Buffer.concat([buffer1, chunk]);
            checkBuffers();
        });

        stream2.on('data', (chunk) => {
            buffer2 = Buffer.concat([buffer2, chunk]);
            checkBuffers();
        });

        stream1.on('end', () => {
            finished1 = true;
            checkBuffers();
        });

        stream2.on('end', () => {
            finished2 = true;
            checkBuffers();
        });

        stream1.on('error', reject);
        stream2.on('error', reject);

        function checkBuffers() {
            const minLength = Math.min(buffer1.length, buffer2.length);
            
            if (minLength > 0) {
                // Compare available bytes
                for (let i = 0; i < minLength; i++) {
                    if (buffer1[i] !== buffer2[i]) {
                        identical = false;
                        cleanup();
                        resolve(false);
                        return;
                    }
                }
                
                // Remove compared bytes
                buffer1 = buffer1.slice(minLength);
                buffer2 = buffer2.slice(minLength);
                bytesRead += minLength;
            }

            // Check if both streams are finished
            if (finished1 && finished2) {
                // Check if there are remaining bytes in either buffer
                if (buffer1.length !== buffer2.length) {
                    identical = false;
                }
                
                cleanup();
                resolve(identical);
            }
        }

        function cleanup() {
            stream1.destroy();
            stream2.destroy();
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint no encontrado' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Duply Backend Server corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${__dirname}`);
    console.log(`🔗 Frontend disponible en: http://localhost:${PORT}/index.html`);
});

module.exports = app;
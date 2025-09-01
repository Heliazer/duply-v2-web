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
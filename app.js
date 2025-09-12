class DuplicateFinderWeb {
    constructor() {
        this.files = [];
        this.duplicateFinder = null;
        this.hashWorkerManager = null;
        this.hashCache = null;
        this.directoryHandle = null; // Store directory handle for modern API
        this.fileHandles = new Map(); // Map file paths to file handles
        this.initializeElements();
        this.setupEventListeners();
        this.initializeWebAssembly();
        this.initializeWorkers();
        this.initializeCache();
        
        // Cleanup workers on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    cleanup() {
        if (this.hashWorkerManager) {
            this.hashWorkerManager.destroy();
            this.hashWorkerManager = null;
        }
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.selectFilesBtn = document.getElementById('selectFiles');
        this.selectFolderBtn = document.getElementById('selectFolder');
        this.scanButton = document.getElementById('scanButton');
        this.extensionFilter = document.getElementById('extensionFilter');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');
        this.statusBadge = document.getElementById('statusBadge');
        this.currentFileName = document.getElementById('currentFileName');
        this.currentFilePath = document.getElementById('currentFilePath');
        this.processedCount = document.getElementById('processedCount');
        this.totalCount = document.getElementById('totalCount');
        this.processingSpeed = document.getElementById('processingSpeed');
        this.estimatedTime = document.getElementById('estimatedTime');
        this.logContent = document.getElementById('logContent');
        this.clearLogBtn = document.getElementById('clearLogBtn');
        
        this.statsSection = document.getElementById('statsSection');
        this.directorySummarySection = document.getElementById('directorySummarySection');
        this.directoryList = document.getElementById('directoryList');
        this.sortByNameBtn = document.getElementById('sortByNameBtn');
        this.sortByCountBtn = document.getElementById('sortByCountBtn');
        this.sortBySizeBtn = document.getElementById('sortBySizeBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.treeExplorer = document.getElementById('treeExplorer');
        this.suspiciousTreeExplorer = document.getElementById('suspiciousTreeExplorer');
        this.suspiciousInfo = document.getElementById('suspiciousInfo');
        this.exactDuplicatesTab = document.getElementById('exactDuplicatesTab');
        this.suspiciousDuplicatesTab = document.getElementById('suspiciousDuplicatesTab');
        this.exactCount = document.getElementById('exactCount');
        this.suspiciousCount = document.getElementById('suspiciousCount');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        
        this.exportBtn = document.getElementById('exportBtn');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        
        this.toastContainer = document.getElementById('toastContainer');
        
        // Progress tracking variables
        this.startTime = null;
        this.processedFiles = 0;
        this.totalFiles = 0;
        
        // Directory data for sorting
        this.directoryData = [];
    }

    setupEventListeners() {
        // File selection
        this.selectFilesBtn.addEventListener('click', () => {
            this.fileInput.removeAttribute('webkitdirectory');
            this.fileInput.click();
        });

        this.selectFolderBtn.addEventListener('click', () => {
            this.fileInput.setAttribute('webkitdirectory', '');
            this.fileInput.click();
        });

        // Modern File System Access API button (if supported)
        if ('showDirectoryPicker' in window) {
            this.addModernFileSystemButton();
        }

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });

        // Scan button
        this.scanButton.addEventListener('click', () => {
            this.scanForDuplicates();
        });

        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportResults();
        });

        // Select all button
        this.selectAllBtn.addEventListener('click', () => {
            this.toggleSelectAll();
        });

        // Delete selected button
        this.deleteSelectedBtn.addEventListener('click', () => {
            this.deleteSelectedFiles();
        });

        // Clear log button
        this.clearLogBtn.addEventListener('click', () => {
            this.clearLog();
        });

        // Sort buttons
        this.sortByNameBtn.addEventListener('click', () => {
            this.sortDirectories('name');
        });

        this.sortByCountBtn.addEventListener('click', () => {
            this.sortDirectories('count');
        });

        this.sortBySizeBtn.addEventListener('click', () => {
            this.sortDirectories('size');
        });

        // Tree expansion buttons
        this.expandAllBtn.addEventListener('click', () => {
            this.expandAllDirectories();
        });

        this.collapseAllBtn.addEventListener('click', () => {
            this.collapseAllDirectories();
        });

        // Tab buttons
        this.exactDuplicatesTab.addEventListener('click', () => {
            this.showExactDuplicates();
        });

        this.suspiciousDuplicatesTab.addEventListener('click', () => {
            this.showSuspiciousDuplicates();
        });
    }

    async initializeWebAssembly() {
        // For now, we'll use a JavaScript implementation
        // In a real scenario, you would load the WebAssembly module here
        this.showToast('Aplicación lista para usar', 'success');
    }

    initializeWorkers() {
        // Initialize hash worker manager for parallel processing
        try {
            // Temporarily disable workers due to CSP issues
            // this.hashWorkerManager = new HashWorkerManager();
            this.hashWorkerManager = null;
            console.log('⚠️ Web Workers disabled due to CSP restrictions - using main thread');
        } catch (error) {
            console.warn('Failed to initialize workers, falling back to main thread:', error);
            this.hashWorkerManager = null;
        }
    }

    initializeCache() {
        // Initialize hash cache for intelligent caching
        try {
            this.hashCache = new HashCache();
            console.log('💾 Hash cache initialized for faster repeated scans');
        } catch (error) {
            console.warn('Failed to initialize hash cache:', error);
            this.hashCache = null;
        }
    }

    addModernFileSystemButton() {
        // Create a new modern button for File System Access API
        const modernBtn = document.createElement('button');
        modernBtn.className = 'btn modern-folder-btn';
        modernBtn.innerHTML = '<i class="fas fa-folder-plus"></i> Seleccionar Carpeta (Moderno)';
        modernBtn.title = 'Usar File System Access API para obtener rutas absolutas';
        
        // Insert it after the regular folder button
        this.selectFolderBtn.parentNode.insertBefore(modernBtn, this.selectFolderBtn.nextSibling);
        
        modernBtn.addEventListener('click', () => {
            this.selectDirectoryModern();
        });
    }

    async selectDirectoryModern() {
        try {
            if (!('showDirectoryPicker' in window)) {
                this.showToast('File System Access API no está soportado en este navegador', 'error');
                return;
            }

            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite' // Need write permission for deletion
            });

            this.showToast('Procesando archivos de la carpeta...', 'info');
            
            const fileHandles = [];
            this.fileHandles.clear();
            await this.processDirectoryHandle(this.directoryHandle, fileHandles);
            
            // Convert to File objects and store handles
            const processedFiles = await Promise.all(
                fileHandles.map(async (handleInfo) => {
                    const file = await handleInfo.handle.getFile();
                    // Create a unique identifier for modern API files
                    const modernPath = `[MODERN]${handleInfo.relativePath}`;
                    file.fullPath = modernPath;
                    file.isModernAPI = true; // Flag to identify modern API files
                    
                    // Store the handle for later deletion using the modern path identifier
                    this.fileHandles.set(modernPath, handleInfo.handle);
                    
                    return file;
                })
            );

            this.handleModernFileSelection(processedFiles);

        } catch (error) {
            if (error.name === 'AbortError') {
                this.showToast('Selección cancelada', 'warning');
            } else {
                console.error('Error accessing directory:', error);
                this.showToast('Error al acceder a la carpeta: ' + error.message, 'error');
            }
        }
    }

    async processDirectoryHandle(directoryHandle, files, path = '') {
        for await (const entry of directoryHandle.values()) {
            const currentPath = path ? `${path}/${entry.name}` : entry.name;
            
            if (entry.kind === 'file') {
                files.push({
                    handle: entry,
                    relativePath: currentPath
                });
            } else if (entry.kind === 'directory') {
                await this.processDirectoryHandle(entry, files, currentPath);
            }
        }
    }

    async getFullPath(fileHandle) {
        // Try to get the full path - this is experimental and may not work in all browsers
        if ('resolve' in fileHandle) {
            try {
                const path = await fileHandle.resolve();
                return path.join('/');
            } catch (error) {
                console.warn('Could not resolve full path:', error);
            }
        }
        
        // Fallback: use the file name (still better than webkitRelativePath)
        const file = await fileHandle.getFile();
        return file.name;
    }

    handleModernFileSelection(files) {
        const allFiles = Array.from(files);
        let validFiles = 0;
        let blockedFiles = 0;
        
        this.files = allFiles.filter(file => {
            // Basic file validation
            if (!file || file.size === 0 || file.name === '.') {
                return false;
            }
            
            if (!InputValidator.validateFileSize(file)) {
                console.warn('Blocked oversized file:', file.name, file.size);
                blockedFiles++;
                return false;
            }
            
            if (!InputValidator.validateFileType(file)) {
                console.warn('Blocked file with dangerous type:', file.name, file.type);
                blockedFiles++;
                return false;
            }
            
            validFiles++;
            return true;
        });
        
        if (this.files.length > 0) {
            this.scanButton.disabled = false;
            let message = `${this.files.length} archivos seleccionados (con rutas absolutas)`;
            if (blockedFiles > 0) {
                message += ` (${blockedFiles} archivos bloqueados por seguridad)`;
            }
            this.showToast(message, 'success');
        } else {
            this.scanButton.disabled = true;
            const message = blockedFiles > 0 
                ? `${blockedFiles} archivos bloqueados por razones de seguridad`
                : 'No se seleccionaron archivos válidos';
            this.showToast(message, 'warning');
        }
    }

    handleFileSelection(files) {
        const allFiles = Array.from(files);
        let validFiles = 0;
        let blockedFiles = 0;
        
        this.files = allFiles.filter(file => {
            // Basic file validation
            if (!file || file.size === 0 || file.name === '.') {
                return false;
            }
            
            // Apply security validations
            if (!InputValidator.validateFileName(file.name)) {
                console.warn('Blocked file with invalid name:', file.name);
                blockedFiles++;
                return false;
            }
            
            if (!InputValidator.validateFileSize(file.size)) {
                console.warn('Blocked file with invalid size:', file.name, file.size);
                blockedFiles++;
                return false;
            }
            
            if (!InputValidator.validateFileType(file)) {
                console.warn('Blocked file with dangerous type:', file.name, file.type);
                blockedFiles++;
                return false;
            }
            
            validFiles++;
            return true;
        });
        
        if (this.files.length > 0) {
            this.scanButton.disabled = false;
            let message = `${this.files.length} archivos seleccionados`;
            if (blockedFiles > 0) {
                message += ` (${blockedFiles} archivos bloqueados por seguridad)`;
            }
            this.showToast(message, 'success');
        } else {
            this.scanButton.disabled = true;
            const message = blockedFiles > 0 
                ? `${blockedFiles} archivos bloqueados por razones de seguridad`
                : 'No se seleccionaron archivos válidos';
            this.showToast(message, 'warning');
        }
    }

    async scanForDuplicates() {
        if (this.files.length === 0) return;

        this.showProgress();
        const extensions = this.getExtensionFilter();
        const filteredFiles = this.filterFilesByExtension(this.files, extensions);
        
        if (filteredFiles.length === 0) {
            this.hideProgress();
            this.showToast('Ningún archivo coincide con los filtros', 'warning');
            return;
        }

        const duplicateFinder = new JavaScriptDuplicateFinder(this.hashWorkerManager, this.hashCache);
        this.startTime = Date.now();
        this.processedFiles = 0;
        this.totalFiles = filteredFiles.length;
        
        this.totalCount.textContent = this.totalFiles;
        this.addLogEntry('Iniciando escaneo de duplicados...', 'info');

        // Process files in parallel batches for better performance
        const rawBatchSize = this.hashWorkerManager && this.hashWorkerManager.workers.length > 0 
            ? this.hashWorkerManager.maxWorkers * 2 
            : 1;
        const batchSize = InputValidator.validateBatchSize(rawBatchSize);
            
        for (let i = 0; i < filteredFiles.length; i += batchSize) {
            const batch = filteredFiles.slice(i, i + batchSize);
            const promises = batch.map(async (file) => {
                try {
                    this.updateCurrentFile(file);
                    this.addLogEntry(`Procesando: ${file.name}`, 'processing');
                    
                    const content = await this.readFileContent(file);
                    const filePath = file.fullPath || file.webkitRelativePath || file.name;
                    await duplicateFinder.addFileAsync(file.name, filePath, content, file);
                    
                    this.processedFiles++;
                    this.updateProgress();
                } catch (error) {
                    console.error('Error reading file:', file.name, error);
                    this.addLogEntry(`Error procesando: ${file.name}`, 'error');
                }
            });
            
            await Promise.all(promises);
            
            // Small delay to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.addLogEntry('Analizando duplicados...', 'info');
        this.updateStatus('Analizando resultados...', 'processing');
        
        // Simulate analysis time
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const results = duplicateFinder.findDuplicates();
        
        // Show cache statistics
        if (this.hashCache && (duplicateFinder.cacheHits + duplicateFinder.cacheMisses) > 0) {
            const hitRate = ((duplicateFinder.cacheHits / (duplicateFinder.cacheHits + duplicateFinder.cacheMisses)) * 100).toFixed(1);
            this.addLogEntry(`Cache stats: ${duplicateFinder.cacheHits} hits, ${duplicateFinder.cacheMisses} misses (${hitRate}% hit rate)`, 'info');
        }
        
        this.addLogEntry(`Escaneo completado. ${results.groups.length} grupos encontrados.`, 'completed');
        this.hideProgress();
        this.displayResults(results);
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    getExtensionFilter() {
        const filterText = this.extensionFilter.value.trim();
        if (!filterText) return [];
        
        // Use InputValidator for secure extension filtering
        const validExtensions = InputValidator.validateExtensionFilter(filterText);
        
        // Show warning if input was sanitized
        if (validExtensions.length === 0 && filterText) {
            this.showToast('Filtro de extensiones inválido. Use formato: .jpg, .png, .txt', 'warning');
        }
        
        return validExtensions;
    }

    filterFilesByExtension(files, extensions) {
        if (extensions.length === 0) return files;
        
        return files.filter(file => {
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            return extensions.includes(fileExt);
        });
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.statsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.clearLog();
        this.updateStatus('Preparando...', 'preparing');
        this.updateProgress();
    }

    updateProgress() {
        const percentage = this.totalFiles > 0 ? (this.processedFiles / this.totalFiles) * 100 : 0;
        
        this.progressFill.style.width = percentage + '%';
        this.progressPercentage.textContent = Math.round(percentage) + '%';
        this.processedCount.textContent = this.processedFiles;
        
        // Update processing speed
        if (this.startTime && this.processedFiles > 0) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const speed = this.processedFiles / elapsed;
            this.processingSpeed.textContent = speed.toFixed(1) + ' archivos/seg';
            
            // Update estimated time
            const remaining = this.totalFiles - this.processedFiles;
            if (remaining > 0 && speed > 0) {
                const estimatedSeconds = remaining / speed;
                this.estimatedTime.textContent = this.formatTime(estimatedSeconds);
            } else {
                this.estimatedTime.textContent = 'Finalizando...';
            }
        }
        
        // Update status
        if (this.processedFiles === this.totalFiles) {
            this.updateStatus('Completado', 'completed');
        } else if (this.processedFiles > 0) {
            this.updateStatus('Procesando', 'processing');
        }
    }

    updateCurrentFile(file) {
        this.currentFileName.textContent = file.name;
        this.currentFilePath.textContent = file.fullPath || file.webkitRelativePath || file.name;
    }

    updateStatus(text, type) {
        this.statusBadge.textContent = text;
        this.statusBadge.className = `status-badge ${type}`;
    }

    addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
        
        // Keep only last 100 entries
        while (this.logContent.children.length > 100) {
            this.logContent.removeChild(this.logContent.firstChild);
        }
    }

    clearLog() {
        this.logContent.innerHTML = '';
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return Math.round(seconds) + 's';
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return `${minutes}m ${secs}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    displayResults(results) {
        this.displayStats(results.stats);
        
        if (results.groups.length === 0) {
            this.showToast('No se encontraron archivos duplicados', 'success');
            return;
        }

        this.displayDirectorySummary(results.groups);
        this.classifyAndDisplayDuplicates(results.groups);
        this.directorySummarySection.style.display = 'block';
        this.resultsSection.style.display = 'block';
        this.showToast(`Se encontraron ${results.groups.length} grupos de duplicados`, 'success');
    }

    displayStats(stats) {
        document.getElementById('totalFiles').textContent = stats.totalFiles;
        document.getElementById('duplicateGroups').textContent = stats.duplicateGroups;
        document.getElementById('totalSize').textContent = stats.totalSize;
        document.getElementById('wastedSpace').textContent = stats.wastedSpace;
        
        this.statsSection.style.display = 'block';
    }

    displayDirectorySummary(groups) {
        const directoryMap = new Map();
        
        // Analizar todos los archivos por directorio
        groups.forEach(group => {
            group.files.forEach(file => {
                const dirPath = this.getDirectoryPath(file.path);
                if (!directoryMap.has(dirPath)) {
                    directoryMap.set(dirPath, {
                        path: dirPath,
                        duplicateFiles: [],
                        duplicateGroups: new Set(),
                        totalWastedSpace: 0
                    });
                }
                
                const dirData = directoryMap.get(dirPath);
                dirData.duplicateFiles.push(file);
                dirData.duplicateGroups.add(group.id);
                dirData.totalWastedSpace += file.size;
            });
        });

        this.directoryData = Array.from(directoryMap.values());
        this.sortDirectories('count'); // Ordenar por cantidad por defecto
    }

    getDirectoryPath(filePath) {
        const parts = filePath.split(/[\/\\]/);
        return parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
    }

    sortDirectories(sortBy) {
        // Actualizar botones activos
        document.querySelectorAll('.view-actions .btn').forEach(btn => btn.classList.remove('active'));
        
        switch(sortBy) {
            case 'name':
                this.sortByNameBtn.classList.add('active');
                this.directoryData.sort((a, b) => a.path.localeCompare(b.path));
                break;
            case 'count':
                this.sortByCountBtn.classList.add('active');
                this.directoryData.sort((a, b) => b.duplicateFiles.length - a.duplicateFiles.length);
                break;
            case 'size':
                this.sortBySizeBtn.classList.add('active');
                this.directoryData.sort((a, b) => b.totalWastedSpace - a.totalWastedSpace);
                break;
        }
        
        this.renderDirectoryList();
    }

    renderDirectoryList() {
        this.directoryList.innerHTML = '';
        
        this.directoryData.forEach(dir => {
            const row = this.createDirectoryRow(dir);
            this.directoryList.appendChild(row);
        });
    }

    createDirectoryRow(dir) {
        const row = document.createElement('div');
        row.className = 'directory-row';
        row.setAttribute('data-directory', dir.path);
        
        const displayPath = dir.path === '/' ? 'Raíz' : dir.path;
        const folderName = dir.path === '/' ? 'Raíz' : dir.path.split('/').pop() || dir.path;
        const percentage = Math.round((dir.duplicateFiles.length / this.totalFiles) * 100);
        
        row.innerHTML = `
            <div class="dir-icon">
                <i class="fas fa-folder"></i>
            </div>
            <div class="dir-name">
                <div>${folderName}</div>
                <div class="dir-path-full">${displayPath}</div>
            </div>
            <div class="dir-files-count">${dir.duplicateFiles.length}</div>
            <div class="dir-groups-count">${dir.duplicateGroups.size}</div>
            <div class="dir-size">${this.formatBytes(dir.totalWastedSpace)}</div>
            <div class="dir-percentage">
                ${percentage}%
                <div class="dir-percentage-bar">
                    <div class="dir-percentage-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        
        row.addEventListener('click', () => {
            this.highlightDirectoryFiles(dir.path);
        });
        
        return row;
    }


    highlightDirectoryFiles(dirPath) {
        // Resaltar fila de directorio seleccionada
        document.querySelectorAll('.directory-row').forEach(row => {
            row.classList.remove('selected');
        });
        document.querySelector(`[data-directory="${dirPath}"]`)?.classList.add('selected');
        
        // Scrollar a la sección de resultados y resaltar archivos de ese directorio
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            document.querySelectorAll('.file-item').forEach(fileItem => {
                const filePath = fileItem.querySelector('.file-path').textContent;
                const fileDir = this.getDirectoryPath(filePath);
                
                if (fileDir === dirPath) {
                    fileItem.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    fileItem.style.borderLeft = '4px solid var(--primary)';
                } else {
                    fileItem.style.backgroundColor = '';
                    fileItem.style.borderLeft = '';
                }
            });
        }, 500);
    }

    classifyAndDisplayDuplicates(groups) {
        const exactGroups = [];
        const suspiciousGroups = [];
        
        // Clasificar grupos en exactos y sospechosos
        groups.forEach(group => {
            if (this.hasExactDuplicates(group)) {
                exactGroups.push({
                    ...group,
                    files: this.getExactDuplicates(group)
                });
                
                // Si hay archivos sospechosos en el mismo grupo, crear grupo separado
                const suspiciousFiles = this.getSuspiciousDuplicates(group);
                if (suspiciousFiles.length > 0) {
                    suspiciousGroups.push({
                        ...group,
                        id: group.id + '_suspicious',
                        files: suspiciousFiles
                    });
                }
            } else {
                // Todo el grupo es sospechoso
                suspiciousGroups.push(group);
            }
        });
        
        // Guardar para las pestañas
        this.exactDuplicateGroups = exactGroups;
        this.suspiciousDuplicateGroups = suspiciousGroups;
        
        // Actualizar contadores
        this.exactCount.textContent = exactGroups.length;
        this.suspiciousCount.textContent = suspiciousGroups.length;
        
        // Mostrar la pestaña correcta
        if (exactGroups.length > 0) {
            this.displayDirectoryTree(exactGroups, this.treeExplorer);
            this.showExactDuplicates();
        } else if (suspiciousGroups.length > 0) {
            this.showSuspiciousDuplicates();
        }
        
        // Renderizar duplicados sospechosos
        if (suspiciousGroups.length > 0) {
            this.displayDirectoryTree(suspiciousGroups, this.suspiciousTreeExplorer, true);
        }
    }

    hasExactDuplicates(group) {
        const sizes = group.files.map(f => f.size);
        const uniqueSizes = [...new Set(sizes)];
        return uniqueSizes.length < group.files.length; // Hay archivos del mismo tamaño
    }

    getExactDuplicates(group) {
        const sizeGroups = new Map();
        
        group.files.forEach(file => {
            if (!sizeGroups.has(file.size)) {
                sizeGroups.set(file.size, []);
            }
            sizeGroups.get(file.size).push(file);
        });
        
        // Retornar solo archivos que tienen duplicados exactos
        const exactFiles = [];
        for (const [size, files] of sizeGroups) {
            if (files.length > 1) {
                exactFiles.push(...files);
            }
        }
        return exactFiles;
    }

    getSuspiciousDuplicates(group) {
        const sizeGroups = new Map();
        
        group.files.forEach(file => {
            if (!sizeGroups.has(file.size)) {
                sizeGroups.set(file.size, []);
            }
            sizeGroups.get(file.size).push(file);
        });
        
        // Retornar archivos que no tienen duplicados exactos (tamaño único)
        const suspiciousFiles = [];
        for (const [size, files] of sizeGroups) {
            if (files.length === 1) {
                suspiciousFiles.push(...files);
            }
        }
        return suspiciousFiles;
    }

    displayDirectoryTree(groups, container, isSuspicious = false) {
        // Crear estructura de directorios con archivos duplicados
        const directoryTree = new Map();
        
        // Organizar archivos por directorio y mantener información de grupo
        groups.forEach(group => {
            group.files.forEach(file => {
                const dirPath = this.getDirectoryPath(file.path);
                
                if (!directoryTree.has(dirPath)) {
                    directoryTree.set(dirPath, {
                        path: dirPath,
                        files: [],
                        duplicateCount: 0,
                        totalSize: 0
                    });
                }
                
                const dir = directoryTree.get(dirPath);
                dir.files.push({
                    ...file,
                    groupId: group.id,
                    isDuplicate: true,
                    isSuspicious: isSuspicious
                });
                dir.duplicateCount++;
                dir.totalSize += file.size;
            });
        });
        
        this.renderDirectoryTree(directoryTree, container, isSuspicious);
    }

    renderDirectoryTree(directoryTree, container, isSuspicious = false) {
        container.innerHTML = '';
        
        if (directoryTree.size === 0) {
            const emptyMessage = isSuspicious ? 
                'No se encontraron duplicados sospechosos' : 
                'No se encontraron duplicados exactos';
                
            container.innerHTML = `
                <div class="tree-empty">
                    <i class="fas fa-folder-open"></i>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }
        
        // Agregar clase para duplicados sospechosos
        if (isSuspicious) {
            container.classList.add('suspicious');
        } else {
            container.classList.remove('suspicious');
        }
        
        // Ordenar directorios alfabéticamente
        const sortedDirs = Array.from(directoryTree.entries()).sort(([a], [b]) => a.localeCompare(b));
        
        sortedDirs.forEach(([dirPath, dirData]) => {
            const directoryNode = this.createDirectoryNode(dirPath, dirData, isSuspicious);
            container.appendChild(directoryNode);
        });

        // Agregar event listeners para checkboxes después de crear el DOM
        this.addCheckboxEventListeners(container);
    }

    addCheckboxEventListeners(container) {
        const checkboxes = container.querySelectorAll('.tree-file-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDeleteButtonState();
            });
        });
    }

    showExactDuplicates() {
        this.exactDuplicatesTab.classList.add('active');
        this.suspiciousDuplicatesTab.classList.remove('active');
        
        this.treeExplorer.style.display = 'block';
        this.suspiciousTreeExplorer.style.display = 'none';
        this.suspiciousInfo.style.display = 'none';
    }

    showSuspiciousDuplicates() {
        this.suspiciousDuplicatesTab.classList.add('active');
        this.exactDuplicatesTab.classList.remove('active');
        
        this.treeExplorer.style.display = 'none';
        this.suspiciousTreeExplorer.style.display = 'block';
        this.suspiciousInfo.style.display = 'block';
    }

    createDirectoryNode(dirPath, dirData, isSuspicious = false) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        
        const displayPath = dirPath === '/' ? 'Raíz' : dirPath;
        const folderName = dirPath === '/' ? 'Raíz' : dirPath.split('/').pop() || dirPath;
        
        node.innerHTML = `
            <div class="tree-directory">
                <div class="tree-dir-header" data-path="${dirPath}">
                    <i class="fas fa-chevron-right tree-expand-icon"></i>
                    <i class="fas fa-folder tree-folder-icon"></i>
                    <div class="tree-dir-info">
                        <span class="tree-dir-path">${folderName}</span>
                        <div class="tree-dir-stats">
                            <span class="tree-stat-badge">${dirData.duplicateCount} duplicados</span>
                            <span>${this.formatBytes(dirData.totalSize)}</span>
                        </div>
                    </div>
                </div>
                <div class="tree-files">
                    ${dirData.files.map(file => this.createTreeFileElement(file, dirPath, isSuspicious)).join('')}
                </div>
            </div>
        `;
        
        // Agregar event listener para expandir/contraer
        const header = node.querySelector('.tree-dir-header');
        header.addEventListener('click', () => {
            this.toggleDirectory(node);
        });
        
        return node;
    }

    createTreeFileElement(file, dirPath, isSuspicious = false) {
        const fileIcon = this.getFileIcon(file.name);
        
        return `
            <div class="tree-file" data-file-path="${file.path}" data-group="${file.groupId}">
                <input type="checkbox" class="tree-file-checkbox" data-group="${file.groupId}" data-file="${file.name}">
                <i class="${fileIcon} tree-file-icon"></i>
                <div class="tree-file-info">
                    <span class="tree-file-name">${file.name}</span>
                    <div class="tree-file-duplicate">
                        <span class="duplicate-indicator">${isSuspicious ? 'SOSPECHOSO' : 'DUPLICADO'}</span>
                        <span class="duplicate-group-id">G${file.groupId}</span>
                        <span class="tree-file-size">${this.formatBytes(file.size)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel', 'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint', 'pptx': 'fas fa-file-powerpoint',
            'jpg': 'fas fa-file-image', 'jpeg': 'fas fa-file-image', 'png': 'fas fa-file-image', 'gif': 'fas fa-file-image',
            'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video', 'mov': 'fas fa-file-video',
            'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio',
            'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
            'txt': 'fas fa-file-alt', 'md': 'fas fa-file-alt',
            'js': 'fas fa-file-code', 'css': 'fas fa-file-code', 'html': 'fas fa-file-code', 'py': 'fas fa-file-code'
        };
        
        return iconMap[ext] || 'fas fa-file';
    }

    toggleDirectory(node) {
        const directory = node.querySelector('.tree-directory');
        const header = node.querySelector('.tree-dir-header');
        const expandIcon = node.querySelector('.tree-expand-icon');
        
        directory.classList.toggle('expanded');
        header.classList.toggle('expanded');
        expandIcon.classList.toggle('expanded');
    }

    expandAllDirectories() {
        const currentExplorer = this.treeExplorer.style.display === 'none' ? 
            this.suspiciousTreeExplorer : this.treeExplorer;
        
        const allDirectories = currentExplorer.querySelectorAll('.tree-directory');
        allDirectories.forEach(dir => {
            dir.classList.add('expanded');
            dir.querySelector('.tree-dir-header').classList.add('expanded');
            dir.querySelector('.tree-expand-icon').classList.add('expanded');
        });
    }

    collapseAllDirectories() {
        const currentExplorer = this.treeExplorer.style.display === 'none' ? 
            this.suspiciousTreeExplorer : this.treeExplorer;
        
        const allDirectories = currentExplorer.querySelectorAll('.tree-directory');
        allDirectories.forEach(dir => {
            dir.classList.remove('expanded');
            dir.querySelector('.tree-dir-header').classList.remove('expanded');
            dir.querySelector('.tree-expand-icon').classList.remove('expanded');
        });
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.tree-file-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });
        
        this.selectAllBtn.innerHTML = allChecked ? 
            '<i class="fas fa-check-square"></i> Seleccionar Todo' :
            '<i class="fas fa-square"></i> Deseleccionar Todo';
        
        this.updateDeleteButtonState();
    }

    updateDeleteButtonState() {
        const checkedBoxes = document.querySelectorAll('.tree-file-checkbox:checked');
        this.deleteSelectedBtn.disabled = checkedBoxes.length === 0;
        
        if (checkedBoxes.length > 0) {
            this.deleteSelectedBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Eliminar ${checkedBoxes.length} archivo${checkedBoxes.length > 1 ? 's' : ''}`;
        } else {
            this.deleteSelectedBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Eliminar Seleccionados';
        }
    }

    async deleteSelectedFiles() {
        const checkedBoxes = document.querySelectorAll('.tree-file-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            this.showToast('No hay archivos seleccionados para eliminar', 'error');
            return;
        }

        // Verificar si el backend está disponible
        const backendAvailable = await this.checkBackendAvailability();
        console.log('Backend disponible para eliminación:', backendAvailable);
        
        if (!backendAvailable) {
            const useSimulation = confirm(
                '⚠️ Backend no disponible\n\n' +
                'El servidor backend no está ejecutándose. Las opciones son:\n\n' +
                '1. ✅ Continuar con simulación (solo actualiza la interfaz)\n' +
                '2. ❌ Cancelar y iniciar el servidor primero\n\n' +
                '¿Continuar con simulación?'
            );
            
            if (!useSimulation) {
                this.showToast('Para eliminación real, ejecuta: npm install && npm start', 'info');
                return;
            }
        }

        // Recopilar información de los archivos seleccionados
        const filesToDelete = [];
        const suspiciousFiles = [];
        
        checkedBoxes.forEach(checkbox => {
            const fileElement = checkbox.closest('.tree-file');
            const filePath = fileElement.dataset.filePath;
            const groupId = fileElement.dataset.group;
            const isSuspicious = fileElement.closest('.tree-explorer').id === 'suspiciousTreeExplorer';
            
            if (isSuspicious) {
                suspiciousFiles.push(filePath);
            }
            filesToDelete.push({ path: filePath, groupId, isSuspicious });
        });

        // Mostrar advertencias para archivos sospechosos
        if (suspiciousFiles.length > 0) {
            const confirmSuspicious = confirm(
                `⚠️ ADVERTENCIA: Has seleccionado ${suspiciousFiles.length} archivo(s) sospechoso(s).\n\n` +
                `Los duplicados sospechosos pueden ser archivos importantes con ligeras diferencias.\n` +
                `¿Estás seguro de que deseas eliminarlos?\n\n` +
                `Archivos sospechosos:\n${suspiciousFiles.slice(0, 5).join('\n')}${suspiciousFiles.length > 5 ? '\n... y ' + (suspiciousFiles.length - 5) + ' más' : ''}`
            );
            
            if (!confirmSuspicious) {
                return;
            }
        }

        // Confirmación final
        const totalSize = this.calculateSelectedFilesSize(checkedBoxes);
        const confirmDelete = confirm(
            `🗑️ ¿Confirmar eliminación?\n\n` +
            `Archivos a eliminar: ${filesToDelete.length}\n` +
            `Espacio a liberar: ${totalSize}\n` +
            `Archivos sospechosos: ${suspiciousFiles.length}\n\n` +
            `⚠️ Esta acción NO se puede deshacer.\n\n` +
            `¿Continuar con la eliminación?`
        );

        if (!confirmDelete) {
            return;
        }

        // Proceder con la eliminación
        await this.performFileDeletion(filesToDelete, backendAvailable);
    }

    calculateSelectedFilesSize(checkboxes) {
        let totalSize = 0;
        checkboxes.forEach(checkbox => {
            const fileElement = checkbox.closest('.tree-file');
            const filePath = fileElement.dataset.filePath;
            
            // Buscar el archivo en la lista de archivos procesados
            this.files.forEach(file => {
                if (file.path === filePath) {
                    totalSize += file.size;
                }
            });
        });
        
        return this.formatBytes(totalSize);
    }

    async performFileDeletion(filesToDelete, useRealDeletion = false) {
        const results = {
            deleted: [],
            failed: [],
            total: filesToDelete.length
        };

        this.showDeletionProgress(0, results.total);

        for (let i = 0; i < filesToDelete.length; i++) {
            const file = filesToDelete[i];
            
            try {
                if (useRealDeletion) {
                    // Check if this file was selected using modern API
                    if (file.isModernAPI) {
                        await this.modernFileDeletion(file.path);
                    } else {
                        // Eliminación real a través de la API backend
                        await this.realFileDeletion(file.path);
                    }
                } else {
                    // Simulación cuando el backend no está disponible
                    await this.simulateFileDeletion(file.path);
                }
                
                results.deleted.push(file.path);
                const mode = useRealDeletion ? 'Eliminado' : 'Simulado';
                this.showToast(`${mode}: ${this.getFileName(file.path)}`, 'success');
                
                // Actualizar UI: remover el archivo del árbol
                this.removeFileFromUI(file.path);
                
            } catch (error) {
                results.failed.push({ path: file.path, error: error.message });
                this.showToast(`Error al eliminar: ${this.getFileName(file.path)} - ${error.message}`, 'error');
            }

            // Actualizar progreso
            this.showDeletionProgress(i + 1, results.total);
        }

        // Mostrar resumen final
        this.showDeletionSummary(results);
        
        // Actualizar estado de botones
        this.updateDeleteButtonState();
    }

    async modernFileDeletion(filePath) {
        // Eliminación usando File System Access API
        console.log('Eliminando archivo usando File System Access API:', filePath);
        
        if (!this.fileHandles.has(filePath)) {
            throw new Error('Handle de archivo no encontrado para: ' + filePath);
        }
        
        const fileHandle = this.fileHandles.get(filePath);
        
        try {
            // Remove the file using the File System Access API
            await fileHandle.remove();
            
            // Remove from our handle map
            this.fileHandles.delete(filePath);
            
            console.log('✅ Archivo eliminado exitosamente usando File System API:', filePath);
            
        } catch (error) {
            console.error('❌ Error eliminando archivo con File System API:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Permisos insuficientes para eliminar el archivo');
            } else if (error.name === 'NotFoundError') {
                throw new Error('El archivo no existe o fue movido');
            } else {
                throw new Error('Error al eliminar archivo: ' + error.message);
            }
        }
    }

    async realFileDeletion(filePath) {
        // Realizar eliminación real a través de la API backend
        console.log('Intentando eliminar archivo:', filePath);
        const response = await fetch('/api/delete-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: [{ path: filePath }]
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido del servidor');
        }

        // Verificar si el archivo específico fue eliminado exitosamente
        if (data.results.failed.length > 0) {
            const failed = data.results.failed.find(f => f.path === filePath);
            if (failed) {
                throw new Error(failed.error);
            }
        }

        return data.results;
    }

    async checkBackendAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('/api/health', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('Backend health check:', response.status, response.ok);
            return response.ok;
        } catch (error) {
            console.log('Backend not available:', error.message);
            return false;
        }
    }

    async simulateFileDeletion(filePath) {
        // Método de fallback para cuando el backend no está disponible
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`Simulando eliminación de: ${filePath}`);
        
        // Simular algunos errores ocasionales
        if (Math.random() < 0.05) {
            throw new Error('Error simulado: Archivo en uso');
        }
    }

    removeFileFromUI(filePath) {
        const fileElement = document.querySelector(`[data-file-path="${CSS.escape(filePath)}"]`);
        if (fileElement) {
            fileElement.remove();
            
            // Si el directorio queda vacío, removerlo también
            const directory = fileElement.closest('.tree-directory');
            if (directory && directory.querySelectorAll('.tree-file').length === 0) {
                directory.remove();
            }
        }
    }

    showDeletionProgress(current, total) {
        const percentage = (current / total * 100).toFixed(1);
        this.showToast(`Eliminando archivos: ${current}/${total} (${percentage}%)`, 'info', false);
    }

    showDeletionSummary(results) {
        const message = `✅ Eliminación completada\n\n` +
                       `Archivos eliminados: ${results.deleted.length}\n` +
                       `Errores: ${results.failed.length}\n` +
                       `Total procesados: ${results.total}`;
        
        if (results.failed.length > 0) {
            const failedList = results.failed.map(f => `- ${this.getFileName(f.path)}: ${f.error}`).join('\n');
            alert(message + `\n\nArchivos con errores:\n${failedList}`);
        } else {
            this.showToast(`✅ ${results.deleted.length} archivos eliminados exitosamente`, 'success');
        }
    }

    getFileName(filePath) {
        return filePath.split(/[/\\]/).pop();
    }

    exportResults() {
        const groups = this.getResultsAsText();
        const blob = new Blob([groups], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `duplicate_files_report_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Reporte exportado exitosamente', 'success');
    }

    getResultsAsText() {
        const stats = {
            totalFiles: document.getElementById('totalFiles').textContent,
            duplicateGroups: document.getElementById('duplicateGroups').textContent,
            totalSize: document.getElementById('totalSize').textContent,
            wastedSpace: document.getElementById('wastedSpace').textContent
        };
        
        let text = `=== REPORTE DE ARCHIVOS DUPLICADOS ===\n`;
        text += `Fecha: ${new Date().toLocaleString()}\n\n`;
        text += `=== ESTADÍSTICAS ===\n`;
        text += `Archivos totales: ${stats.totalFiles}\n`;
        text += `Grupos de duplicados: ${stats.duplicateGroups}\n`;
        text += `Tamaño total: ${stats.totalSize}\n`;
        text += `Espacio desperdiciado: ${stats.wastedSpace}\n\n`;
        
        text += `=== ARCHIVOS DUPLICADOS POR DIRECTORIO ===\n`;
        const directories = document.querySelectorAll('.tree-directory');
        directories.forEach((directory) => {
            const dirPath = directory.querySelector('.tree-dir-path').textContent;
            const duplicateCount = directory.querySelector('.tree-stat-badge').textContent;
            
            text += `\n📁 ${dirPath} (${duplicateCount})\n`;
            text += `${'='.repeat(50)}\n`;
            
            const files = directory.querySelectorAll('.tree-file');
            files.forEach(file => {
                const name = file.querySelector('.tree-file-name').textContent;
                const size = file.querySelector('.tree-file-size').textContent;
                const groupId = file.querySelector('.duplicate-group-id').textContent;
                const filePath = file.dataset.filePath;
                
                text += `  ${name} (${size}) - ${groupId}\n`;
                text += `    ${filePath}\n`;
            });
        });
        
        return text;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Input Validator for security and robustness
class InputValidator {
    static validateExtensionFilter(input) {
        if (!input || typeof input !== 'string') {
            return [];
        }
        
        // Sanitize input - only allow letters, numbers, dots, commas, hyphens, and spaces
        const sanitized = input.replace(/[^\w\.,\-\s]/g, '');
        
        if (sanitized !== input) {
            console.warn('Extension filter was sanitized:', input, '->', sanitized);
        }
        
        // Split by comma and process each extension
        const extensions = sanitized.split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => {
                // Must start with dot and be 1-10 characters long
                return ext.match(/^\.[a-z0-9]{1,10}$/);
            })
            .slice(0, 20); // Limit to 20 extensions maximum
        
        return extensions;
    }
    
    static validateFilePath(path) {
        if (!path || typeof path !== 'string') {
            return false;
        }
        
        // Prevent path traversal attacks
        const dangerousPatterns = [
            '../',
            '..\\',
            '..',
            '~/',
            '~\\',
            '/etc/',
            '/bin/',
            '/usr/',
            '/var/',
            '/sys/',
            '/proc/',
            'C:\\Windows\\',
            'C:\\Program Files\\',
            'C:\\System32\\'
        ];
        
        const lowerPath = path.toLowerCase();
        return !dangerousPatterns.some(pattern => lowerPath.includes(pattern.toLowerCase()));
    }
    
    static validateFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }
        
        // Check for reasonable length
        if (fileName.length > 255) {
            return false;
        }
        
        // Prevent dangerous file names
        const dangerousNames = [
            'con', 'prn', 'aux', 'nul',
            'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
            'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
        ];
        
        const nameOnly = fileName.split('.')[0].toLowerCase();
        return !dangerousNames.includes(nameOnly);
    }
    
    static validateFileSize(size) {
        if (typeof size !== 'number' || size < 0) {
            return false;
        }
        
        // Limit to 10GB per file for sanity
        const maxSize = 10 * 1024 * 1024 * 1024;
        return size <= maxSize;
    }
    
    static validateFileType(file) {
        if (!file || !file.type) {
            return true; // Allow files without MIME type
        }
        
        // Block potentially dangerous file types
        const blockedTypes = [
            'application/x-msdownload',
            'application/x-executable',
            'application/x-msdos-program',
            'application/x-winexe',
            'application/x-ms-dos-executable'
        ];
        
        return !blockedTypes.includes(file.type.toLowerCase());
    }
    
    static sanitizeInput(input, maxLength = 1000) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        
        // Remove potentially dangerous characters and limit length
        return input
            .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
            .trim()
            .substring(0, maxLength);
    }
    
    static validateBatchSize(size) {
        if (typeof size !== 'number' || size < 1) {
            return 1;
        }
        
        // Limit batch size to prevent memory issues
        return Math.min(size, 100);
    }
}

// Hash Cache for intelligent caching of file hashes
class HashCache {
    constructor() {
        this.memoryCache = new Map();
        this.storageKey = 'duply_hash_cache_v2';
        this.maxCacheSize = 1000; // Limit cache to 1000 entries
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.loadFromStorage();
    }
    
    getCacheKey(file) {
        // Create unique key based on file properties that change when content changes
        return `${file.name}_${file.size}_${file.lastModified}_${file.type}`;
    }
    
    getCachedHash(file) {
        const key = this.getCacheKey(file);
        const cached = this.memoryCache.get(key);
        
        if (cached && this.isCacheValid(cached)) {
            this.cacheHits++;
            return cached.hash;
        }
        
        // Remove invalid cache entry
        if (cached) {
            this.memoryCache.delete(key);
        }
        
        this.cacheMisses++;
        return null;
    }
    
    setCachedHash(file, hash) {
        const key = this.getCacheKey(file);
        const cacheEntry = {
            hash: hash,
            timestamp: Date.now(),
            fileSize: file.size,
            lastModified: file.lastModified
        };
        
        // Implement LRU-style cache management
        if (this.memoryCache.size >= this.maxCacheSize) {
            this.evictOldestEntries();
        }
        
        this.memoryCache.set(key, cacheEntry);
        this.saveToStorage();
    }
    
    isCacheValid(cacheEntry) {
        // Cache is valid for 7 days
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const age = Date.now() - cacheEntry.timestamp;
        return age < maxAge;
    }
    
    evictOldestEntries() {
        // Remove 20% of oldest entries when cache is full
        const entriesToRemove = Math.floor(this.maxCacheSize * 0.2);
        const sortedEntries = Array.from(this.memoryCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
        for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
            this.memoryCache.delete(sortedEntries[i][0]);
        }
        
        console.log(`🧹 Cache cleanup: removed ${entriesToRemove} old entries`);
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Convert stored array back to Map and validate entries
                let loadedCount = 0;
                for (const [key, value] of data) {
                    if (this.isCacheValid(value)) {
                        this.memoryCache.set(key, value);
                        loadedCount++;
                    }
                }
                
                console.log(`📂 Loaded ${loadedCount} valid hash cache entries from storage`);
            }
        } catch (error) {
            console.warn('Failed to load hash cache from storage:', error);
            this.clearCache();
        }
    }
    
    saveToStorage() {
        try {
            // Convert Map to array for JSON serialization
            const dataToStore = Array.from(this.memoryCache.entries());
            localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
        } catch (error) {
            console.warn('Failed to save hash cache to storage:', error);
            // If storage is full, try clearing some space
            if (error.name === 'QuotaExceededError') {
                this.evictOldestEntries();
                try {
                    const dataToStore = Array.from(this.memoryCache.entries());
                    localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
                } catch (retryError) {
                    console.error('Failed to save cache even after cleanup:', retryError);
                }
            }
        }
    }
    
    clearCache() {
        this.memoryCache.clear();
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Hash cache cleared');
    }
    
    getCacheStats() {
        const validEntries = Array.from(this.memoryCache.values())
            .filter(entry => this.isCacheValid(entry));
            
        return {
            totalEntries: this.memoryCache.size,
            validEntries: validEntries.length,
            invalidEntries: this.memoryCache.size - validEntries.length,
            cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
        };
    }
}

// Hash Worker Manager for parallel processing
class HashWorkerManager {
    constructor() {
        this.workers = [];
        this.maxWorkers = Math.min(navigator.hardwareConcurrency || 4, 8); // Limit to 8 workers max
        this.currentWorkerIndex = 0;
        this.pendingTasks = new Map(); // Track pending hash calculations
        this.initWorkers();
    }
    
    initWorkers() {
        // Create worker pool
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = new Worker('hash-worker.js');
                worker.onmessage = this.handleWorkerMessage.bind(this);
                worker.onerror = this.handleWorkerError.bind(this);
                this.workers.push(worker);
            } catch (error) {
                console.warn('Web Worker not supported, falling back to main thread', error);
                break;
            }
        }
        console.log(`🔧 Initialized ${this.workers.length} hash workers`);
    }
    
    handleWorkerMessage(e) {
        const { success, fileId, fileName, hash, fileSize, error, chunkIndex } = e.data;
        const pendingTask = this.pendingTasks.get(fileId);
        
        if (!pendingTask) {
            console.warn('Received result for unknown task:', fileId);
            return;
        }
        
        if (success) {
            pendingTask.resolve({ hash, size: fileSize });
        } else {
            pendingTask.reject(new Error(error));
        }
        
        this.pendingTasks.delete(fileId);
    }
    
    handleWorkerError(error) {
        console.error('Worker error:', error);
    }
    
    async calculateHashParallel(fileName, fileData, fileSize) {
        // If no workers available, fall back to main thread
        if (this.workers.length === 0) {
            return this.calculateHashMainThread(fileData, fileSize);
        }
        
        return new Promise((resolve, reject) => {
            const fileId = `${fileName}_${Date.now()}_${Math.random()}`;
            const worker = this.workers[this.currentWorkerIndex];
            
            // Store the promise resolvers
            this.pendingTasks.set(fileId, { resolve, reject });
            
            // Send task to worker
            worker.postMessage({
                fileId,
                fileName,
                fileData,
                fileSize,
                chunkIndex: this.currentWorkerIndex
            });
            
            // Round-robin worker selection
            this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
        });
    }
    
    // Fallback hash calculation on main thread
    calculateHashMainThread(data, size) {
        let fnv1a = 0x811c9dc5;
        let djb2 = 5381;
        let sdbm = 0;
        let sum = 0;
        
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            const pos = i + 1;
            
            fnv1a ^= byte;
            fnv1a = Math.imul(fnv1a, 0x1000193);
            
            djb2 = Math.imul(djb2, 33) ^ byte;
            sdbm = Math.imul(sdbm, 65599) + byte;
            sum += byte * pos;
        }
        
        const sizeComponent = size * 0x9e3779b9;
        const hash1 = (fnv1a ^ sizeComponent) >>> 0;
        const hash2 = (djb2 ^ (size << 8)) >>> 0;
        const hash3 = (sdbm ^ sum) >>> 0;
        const hash4 = size >>> 0;
        
        const finalHash = hash1.toString(16).padStart(8, '0') + 
                         hash2.toString(16).padStart(8, '0') + 
                         hash3.toString(16).padStart(8, '0') + 
                         hash4.toString(16).padStart(8, '0');
        
        return Promise.resolve({ hash: finalHash, size });
    }
    
    destroy() {
        // Clean up workers
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.pendingTasks.clear();
    }
}

// JavaScript implementation of the duplicate finder (fallback)
class JavaScriptDuplicateFinder {
    constructor(hashWorkerManager = null, hashCache = null) {
        this.hashGroups = new Map();
        this.totalFiles = 0;
        this.totalSize = 0;
        this.hashWorkerManager = hashWorkerManager;
        this.hashCache = hashCache;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    addFile(name, path, content) {
        const hash = this.calculateHash(content);
        const size = content.byteLength || content.length;
        
        this.addFileWithHash(name, path, hash, size);
    }

    async addFileAsync(name, path, content, fileObject = null) {
        const data = content instanceof Uint8Array ? content : new Uint8Array(content);
        const size = data.byteLength || data.length;
        
        let hash;
        
        // Try to get hash from cache first
        if (this.hashCache && fileObject) {
            const cachedHash = this.hashCache.getCachedHash(fileObject);
            if (cachedHash) {
                hash = cachedHash;
                this.cacheHits++;
                console.log(`💾 Cache hit for: ${name}`);
                this.addFileWithHash(name, path, hash, size);
                return;
            }
            this.cacheMisses++;
        }
        
        // Calculate hash (using workers if available)
        if (this.hashWorkerManager && this.hashWorkerManager.workers.length > 0) {
            try {
                const result = await this.hashWorkerManager.calculateHashParallel(name, data, size);
                hash = result.hash;
            } catch (error) {
                console.warn('Worker failed, falling back to main thread:', error);
                hash = this.calculateHash(content);
            }
        } else {
            hash = this.calculateHash(content);
        }
        
        // Cache the hash for future use
        if (this.hashCache && fileObject) {
            this.hashCache.setCachedHash(fileObject, hash);
        }
        
        this.addFileWithHash(name, path, hash, size);
    }

    addFileWithHash(name, path, hash, size) {
        
        const file = { name, path, size };
        
        if (!this.hashGroups.has(hash)) {
            this.hashGroups.set(hash, []);
        }
        
        this.hashGroups.get(hash).push(file);
        this.totalFiles++;
        this.totalSize += size;
    }

    calculateHash(content) {
        // Improved hash using SHA-256-like approach for maximum reliability
        const data = new Uint8Array(content);
        const size = data.length;
        
        // Use crypto.subtle for better hash if available, fallback to custom
        if (window.crypto && window.crypto.subtle) {
            // For now, use synchronous custom hash but with better algorithm
            return this.calculateCustomHash(data, size);
        } else {
            return this.calculateCustomHash(data, size);
        }
    }
    
    calculateCustomHash(data, size) {
        // Multi-algorithm hash combination for maximum collision resistance
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
        
        // Debug logging for JPG files
        if (data.length > 7000000 && data.length < 8000000) { // Likely our JPG files
            console.log(`HASH DEBUG: Size=${size}, Hash=${finalHash}, First10bytes=[${Array.from(data.slice(0,10)).join(',')}]`);
        }
        
        return finalHash;
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
                    fileSize: this.formatBytes(fileSize),
                    wastedSpace: this.formatBytes(wastedSpace),
                    files: files
                });
            }
        }

        return {
            groups,
            stats: {
                totalFiles: this.totalFiles,
                duplicateGroups: groups.length,
                totalSize: this.formatBytes(this.totalSize),
                wastedSpace: this.formatBytes(duplicateSize)
            }
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application
const app = new DuplicateFinderWeb();
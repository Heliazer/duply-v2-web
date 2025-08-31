class DuplicateFinderWeb {
    constructor() {
        this.files = [];
        this.duplicateFinder = null;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeWebAssembly();
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

    handleFileSelection(files) {
        this.files = Array.from(files).filter(file => file.type !== '');
        
        if (this.files.length > 0) {
            this.scanButton.disabled = false;
            this.showToast(`${this.files.length} archivos seleccionados`, 'success');
        } else {
            this.scanButton.disabled = true;
            this.showToast('No se seleccionaron archivos válidos', 'warning');
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

        const duplicateFinder = new JavaScriptDuplicateFinder();
        this.startTime = Date.now();
        this.processedFiles = 0;
        this.totalFiles = filteredFiles.length;
        
        this.totalCount.textContent = this.totalFiles;
        this.addLogEntry('Iniciando escaneo de duplicados...', 'info');

        for (const file of filteredFiles) {
            try {
                // Update current file display
                this.updateCurrentFile(file);
                this.addLogEntry(`Procesando: ${file.name}`, 'processing');
                
                const content = await this.readFileContent(file);
                duplicateFinder.addFile(file.name, file.webkitRelativePath || file.name, content);
                
                this.processedFiles++;
                this.updateProgress();
                
                // Small delay to allow UI updates and show processing
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25));
            } catch (error) {
                console.error('Error reading file:', file.name, error);
                this.addLogEntry(`Error procesando: ${file.name}`, 'error');
            }
        }

        this.addLogEntry('Analizando duplicados...', 'info');
        this.updateStatus('Analizando resultados...', 'processing');
        
        // Simulate analysis time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const results = duplicateFinder.findDuplicates();
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
        
        return filterText.split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => ext)
            .map(ext => ext.startsWith('.') ? ext : '.' + ext);
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
        this.currentFilePath.textContent = file.webkitRelativePath || file.name;
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

// JavaScript implementation of the duplicate finder (fallback)
class JavaScriptDuplicateFinder {
    constructor() {
        this.hashGroups = new Map();
        this.totalFiles = 0;
        this.totalSize = 0;
    }

    addFile(name, path, content) {
        const hash = this.calculateHash(content);
        const size = content.byteLength || content.length;
        
        const file = { name, path, size };
        
        if (!this.hashGroups.has(hash)) {
            this.hashGroups.set(hash, []);
        }
        
        this.hashGroups.get(hash).push(file);
        this.totalFiles++;
        this.totalSize += size;
    }

    calculateHash(content) {
        // Simple hash implementation for JavaScript
        let hash1 = 0x811c9dc5;
        let hash2 = 0x1000193;
        const data = new Uint8Array(content);
        
        for (let i = 0; i < data.length; i++) {
            hash1 ^= data[i];
            hash1 = Math.imul(hash1, 0x1000193);
            hash2 = ((hash2 << 5) + hash2) + data[i];
        }
        
        return (hash1 >>> 0).toString(16) + (hash2 >>> 0).toString(16);
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
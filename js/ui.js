import { formatBytes, getFileIcon, getToastIcon, getDirectoryPath, formatTime } from './utils.js';

export class UI {
    constructor() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            uploadArea: document.getElementById('uploadArea'),
            selectFilesBtn: document.getElementById('selectFiles'),
            selectFolderBtn: document.getElementById('selectFolder'),
            scanButton: document.getElementById('scanButton'),
            extensionFilter: document.getElementById('extensionFilter'),
            progressSection: document.getElementById('progressSection'),
            progressFill: document.getElementById('progressFill'),
            progressPercentage: document.getElementById('progressPercentage'),
            statusBadge: document.getElementById('statusBadge'),
            currentFileName: document.getElementById('currentFileName'),
            currentFilePath: document.getElementById('currentFilePath'),
            processedCount: document.getElementById('processedCount'),
            totalCount: document.getElementById('totalCount'),
            processingSpeed: document.getElementById('processingSpeed'),
            estimatedTime: document.getElementById('estimatedTime'),
            logContent: document.getElementById('logContent'),
            clearLogBtn: document.getElementById('clearLogBtn'),
            statsSection: document.getElementById('statsSection'),
            directorySummarySection: document.getElementById('directorySummarySection'),
            directoryList: document.getElementById('directoryList'),
            sortByNameBtn: document.getElementById('sortByNameBtn'),
            sortByCountBtn: document.getElementById('sortByCountBtn'),
            sortBySizeBtn: document.getElementById('sortBySizeBtn'),
            resultsSection: document.getElementById('resultsSection'),
            treeExplorer: document.getElementById('treeExplorer'),
            suspiciousTreeExplorer: document.getElementById('suspiciousTreeExplorer'),
            suspiciousInfo: document.getElementById('suspiciousInfo'),
            exactDuplicatesTab: document.getElementById('exactDuplicatesTab'),
            suspiciousDuplicatesTab: document.getElementById('suspiciousDuplicatesTab'),
            exactCount: document.getElementById('exactCount'),
            suspiciousCount: document.getElementById('suspiciousCount'),
            expandAllBtn: document.getElementById('expandAllBtn'),
            collapseAllBtn: document.getElementById('collapseAllBtn'),
            exportBtn: document.getElementById('exportBtn'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            toastContainer: document.getElementById('toastContainer')
        };
        this.directoryData = [];
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showProgress() {
        this.elements.progressSection.style.display = 'block';
        this.elements.statsSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
        this.clearLog();
        this.updateStatus('Preparando...', 'preparing');
        this.updateProgress(0, 0, 0, 0);
    }

    hideProgress() {
        this.elements.progressSection.style.display = 'none';
    }

    updateProgress(processedFiles, totalFiles, startTime) {
        const percentage = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

        this.elements.progressFill.style.width = percentage + '%';
        this.elements.progressPercentage.textContent = Math.round(percentage) + '%';
        this.elements.processedCount.textContent = processedFiles;
        this.elements.totalCount.textContent = totalFiles;

        if (startTime && processedFiles > 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = processedFiles / elapsed;
            this.elements.processingSpeed.textContent = speed.toFixed(1) + ' archivos/seg';

            const remaining = totalFiles - processedFiles;
            if (remaining > 0 && speed > 0) {
                const estimatedSeconds = remaining / speed;
                this.elements.estimatedTime.textContent = formatTime(estimatedSeconds);
            } else {
                this.elements.estimatedTime.textContent = 'Finalizando...';
            }
        }

        if (processedFiles === totalFiles && totalFiles > 0) {
            this.updateStatus('Completado', 'completed');
        } else if (processedFiles > 0) {
            this.updateStatus('Procesando', 'processing');
        }
    }

    updateCurrentFile(file) {
        this.elements.currentFileName.textContent = file.name;
        this.elements.currentFilePath.textContent = file.webkitRelativePath || file.name;
    }

    updateStatus(text, type) {
        this.elements.statusBadge.textContent = text;
        this.elements.statusBadge.className = `status-badge ${type}`;
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

        this.elements.logContent.appendChild(entry);
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;

        while (this.elements.logContent.children.length > 100) {
            this.elements.logContent.removeChild(this.elements.logContent.firstChild);
        }
    }

    clearLog() {
        this.elements.logContent.innerHTML = '';
    }

    displayResults(results) {
        this.displayStats(results.stats);

        if (results.groups.length === 0) {
            this.showToast('No se encontraron archivos duplicados', 'success');
            return;
        }

        this.displayDirectorySummary(results.groups);
        this.displayDirectoryTree(results.groups, this.elements.treeExplorer);
        this.elements.directorySummarySection.style.display = 'block';
        this.elements.resultsSection.style.display = 'block';
        this.showToast(`Se encontraron ${results.groups.length} grupos de duplicados`, 'success');
    }

    displayStats(stats) {
        document.getElementById('totalFiles').textContent = stats.totalFiles;
        document.getElementById('duplicateGroups').textContent = stats.duplicateGroups;
        document.getElementById('totalSize').textContent = stats.totalSize;
        document.getElementById('wastedSpace').textContent = stats.wastedSpace;

        this.elements.statsSection.style.display = 'block';
    }

    displayDirectorySummary(groups) {
        const directoryMap = new Map();

        groups.forEach(group => {
            group.files.forEach(file => {
                const dirPath = getDirectoryPath(file.path);
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
        this.sortDirectories('count');
    }

    sortDirectories(sortBy) {
        document.querySelectorAll('.view-actions .btn').forEach(btn => btn.classList.remove('active'));

        switch(sortBy) {
            case 'name':
                this.elements.sortByNameBtn.classList.add('active');
                this.directoryData.sort((a, b) => a.path.localeCompare(b.path));
                break;
            case 'count':
                this.elements.sortByCountBtn.classList.add('active');
                this.directoryData.sort((a, b) => b.duplicateFiles.length - a.duplicateFiles.length);
                break;
            case 'size':
                this.elements.sortBySizeBtn.classList.add('active');
                this.directoryData.sort((a, b) => b.totalWastedSpace - a.totalWastedSpace);
                break;
        }

        this.renderDirectoryList();
    }

    renderDirectoryList() {
        this.elements.directoryList.innerHTML = '';
        const totalFiles = this.directoryData.reduce((sum, dir) => sum + dir.duplicateFiles.length, 0);

        this.directoryData.forEach(dir => {
            const row = this.createDirectoryRow(dir, totalFiles);
            this.elements.directoryList.appendChild(row);
        });
    }

    createDirectoryRow(dir, totalFiles) {
        const row = document.createElement('div');
        row.className = 'directory-row';
        row.setAttribute('data-directory', dir.path);

        const displayPath = dir.path === '/' ? 'Raíz' : dir.path;
        const folderName = dir.path === '/' ? 'Raíz' : dir.path.split('/').pop() || dir.path;
        const percentage = totalFiles > 0 ? Math.round((dir.duplicateFiles.length / totalFiles) * 100) : 0;

        row.innerHTML = `
            <div class="dir-icon"><i class="fas fa-folder"></i></div>
            <div class="dir-name">
                <div>${folderName}</div>
                <div class="dir-path-full">${displayPath}</div>
            </div>
            <div class="dir-files-count">${dir.duplicateFiles.length}</div>
            <div class="dir-groups-count">${dir.duplicateGroups.size}</div>
            <div class="dir-size">${formatBytes(dir.totalWastedSpace)}</div>
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
        document.querySelectorAll('.directory-row').forEach(row => row.classList.remove('selected'));
        document.querySelector(`[data-directory="${dirPath}"]`)?.classList.add('selected');

        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            document.querySelectorAll('.tree-file').forEach(fileItem => {
                const filePath = fileItem.dataset.filePath;
                const fileDir = getDirectoryPath(filePath);

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

    displayDirectoryTree(groups, container) {
        const directoryTree = new Map();

        groups.forEach(group => {
            group.files.forEach(file => {
                const dirPath = getDirectoryPath(file.path);

                if (!directoryTree.has(dirPath)) {
                    directoryTree.set(dirPath, {
                        path: dirPath,
                        files: [],
                        duplicateCount: 0,
                        totalSize: 0
                    });
                }

                const dir = directoryTree.get(dirPath);
                dir.files.push({ ...file, groupId: group.id });
                dir.duplicateCount++;
                dir.totalSize += file.size;
            });
        });

        this.renderDirectoryTree(directoryTree, container);
    }

    renderDirectoryTree(directoryTree, container) {
        container.innerHTML = '';

        if (directoryTree.size === 0) {
            container.innerHTML = `<div class="tree-empty"><i class="fas fa-folder-open"></i><p>No se encontraron duplicados</p></div>`;
            return;
        }

        const sortedDirs = Array.from(directoryTree.entries()).sort(([a], [b]) => a.localeCompare(b));

        sortedDirs.forEach(([dirPath, dirData]) => {
            const directoryNode = this.createDirectoryNode(dirPath, dirData);
            container.appendChild(directoryNode);
        });
    }

    createDirectoryNode(dirPath, dirData) {
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
                            <span>${formatBytes(dirData.totalSize)}</span>
                        </div>
                    </div>
                </div>
                <div class="tree-files">
                    ${dirData.files.map(file => this.createTreeFileElement(file)).join('')}
                </div>
            </div>
        `;

        const header = node.querySelector('.tree-dir-header');
        header.addEventListener('click', () => {
            this.toggleDirectory(node);
        });

        return node;
    }

    createTreeFileElement(file) {
        const fileIcon = getFileIcon(file.name);

        return `
            <div class="tree-file" data-file-path="${file.path}" data-group="${file.groupId}">
                <input type="checkbox" class="tree-file-checkbox" data-group="${file.groupId}" data-file="${file.name}">
                <i class="${fileIcon} tree-file-icon"></i>
                <div class="tree-file-info">
                    <span class="tree-file-name">${file.name}</span>
                    <div class="tree-file-duplicate">
                        <span class="duplicate-indicator">DUPLICADO</span>
                        <span class="duplicate-group-id">G${file.groupId}</span>
                        <span class="tree-file-size">${formatBytes(file.size)}</span>
                    </div>
                </div>
            </div>
        `;
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
        const allDirectories = this.elements.treeExplorer.querySelectorAll('.tree-directory');
        allDirectories.forEach(dir => {
            dir.classList.add('expanded');
            dir.querySelector('.tree-dir-header').classList.add('expanded');
            dir.querySelector('.tree-expand-icon').classList.add('expanded');
        });
    }

    collapseAllDirectories() {
        const allDirectories = this.elements.treeExplorer.querySelectorAll('.tree-directory');
        allDirectories.forEach(dir => {
            dir.classList.remove('expanded');
            dir.querySelector('.tree-dir-header').classList.remove('expanded');
            dir.querySelector('.tree-expand-icon').classList.remove('expanded');
        });
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.tree-file-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(checkbox => checkbox.checked = !allChecked);

        this.elements.selectAllBtn.innerHTML = allChecked ?
            '<i class="fas fa-check-square"></i> Seleccionar Todo' :
            '<i class="fas fa-square"></i> Deseleccionar Todo';
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
}

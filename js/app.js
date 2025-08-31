import { UI } from './ui.js';
import { filterFilesByExtension, processFile } from './fileProcessor.js';
import { JavaScriptDuplicateFinder } from './duplicateFinder.js';

class DuplicateFinderWeb {
    constructor() {
        this.ui = new UI();
        this.files = [];
        this.setupEventListeners();
        this.ui.showToast('Aplicación lista para usar', 'success');
    }

    setupEventListeners() {
        this.ui.elements.selectFilesBtn.addEventListener('click', () => {
            this.ui.elements.fileInput.removeAttribute('webkitdirectory');
            this.ui.elements.fileInput.click();
        });

        this.ui.elements.selectFolderBtn.addEventListener('click', () => {
            this.ui.elements.fileInput.setAttribute('webkitdirectory', '');
            this.ui.elements.fileInput.click();
        });

        this.ui.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        this.ui.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.ui.elements.uploadArea.classList.add('dragover');
        });

        this.ui.elements.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.ui.elements.uploadArea.classList.remove('dragover');
        });

        this.ui.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.ui.elements.uploadArea.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });

        this.ui.elements.scanButton.addEventListener('click', () => this.scanForDuplicates());
        this.ui.elements.exportBtn.addEventListener('click', () => this.exportResults());
        this.ui.elements.selectAllBtn.addEventListener('click', () => this.ui.toggleSelectAll());
        this.ui.elements.clearLogBtn.addEventListener('click', () => this.ui.clearLog());
        this.ui.elements.sortByNameBtn.addEventListener('click', () => this.ui.sortDirectories('name'));
        this.ui.elements.sortByCountBtn.addEventListener('click', () => this.ui.sortDirectories('count'));
        this.ui.elements.sortBySizeBtn.addEventListener('click', () => this.ui.sortDirectories('size'));
        this.ui.elements.expandAllBtn.addEventListener('click', () => this.ui.expandAllDirectories());
        this.ui.elements.collapseAllBtn.addEventListener('click', () => this.ui.collapseAllDirectories());

        // Remove suspicious tabs logic as it's no longer needed
        this.ui.elements.suspiciousDuplicatesTab.style.display = 'none';
        this.ui.elements.exactDuplicatesTab.style.width = '100%';
    }

    handleFileSelection(files) {
        this.files = Array.from(files).filter(file => file.size > 0);

        if (this.files.length > 0) {
            this.ui.elements.scanButton.disabled = false;
            this.ui.showToast(`${this.files.length} archivos seleccionados`, 'success');
        } else {
            this.ui.elements.scanButton.disabled = true;
            this.ui.showToast('No se seleccionaron archivos válidos', 'warning');
        }
    }

    async scanForDuplicates() {
        if (this.files.length === 0) return;

        this.ui.showProgress();
        const extensions = this.getExtensionFilter();
        const filteredFiles = filterFilesByExtension(this.files, extensions);

        if (filteredFiles.length === 0) {
            this.ui.hideProgress();
            this.ui.showToast('Ningún archivo coincide con los filtros', 'warning');
            return;
        }

        const duplicateFinder = new JavaScriptDuplicateFinder();
        const startTime = Date.now();
        let processedFiles = 0;
        const totalFiles = filteredFiles.length;

        this.ui.addLogEntry('Iniciando escaneo de duplicados...', 'info');

        for (const file of filteredFiles) {
            this.ui.updateCurrentFile(file);
            this.ui.addLogEntry(`Procesando: ${file.name}`, 'processing');

            const fileData = await processFile(file);
            if (fileData) {
                duplicateFinder.addFile(fileData.name, fileData.path, fileData.size, fileData.hash);
            } else {
                this.ui.addLogEntry(`Error procesando: ${file.name}`, 'error');
            }

            processedFiles++;
            this.ui.updateProgress(processedFiles, totalFiles, startTime);
            await new Promise(resolve => setTimeout(resolve, 5)); // Small delay for UI updates
        }

        this.ui.addLogEntry('Analizando duplicados...', 'info');
        this.ui.updateStatus('Analizando resultados...', 'processing');

        await new Promise(resolve => setTimeout(resolve, 200));

        const results = duplicateFinder.findDuplicates();
        this.ui.addLogEntry(`Escaneo completado. ${results.groups.length} grupos encontrados.`, 'completed');
        this.ui.hideProgress();
        this.ui.displayResults(results);
    }

    getExtensionFilter() {
        const filterText = this.ui.elements.extensionFilter.value.trim();
        if (!filterText) return [];

        return filterText.split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => ext)
            .map(ext => ext.startsWith('.') ? ext : '.' + ext);
    }

    exportResults() {
        const text = this.ui.getResultsAsText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `duplicate_files_report_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.ui.showToast('Reporte exportado exitosamente', 'success');
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    new DuplicateFinderWeb();
});

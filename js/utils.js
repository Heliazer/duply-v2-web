export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileName) {
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

export function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

export function getDirectoryPath(filePath) {
    const parts = filePath.split(/[\/\\]/);
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '/';
}

export function formatTime(seconds) {
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

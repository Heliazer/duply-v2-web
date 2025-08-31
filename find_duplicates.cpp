#include <iostream>
#include <filesystem>
#include <ostream>
#include <unordered_map>
#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <set>
#include <algorithm>
using namespace std;

namespace fs = std::filesystem;

struct Config {
    string directory;
    set<string> extensions;
    string outputFile;
    string csvOutputFile;
    bool showStats = true;
};

void showUsage(const string& programName) {
    cout << "Uso: " << programName << " <directorio> [opciones]" << endl;
    cout << "Opciones:" << endl;
    cout << "  --ext <ext1,ext2,...>  Filtrar por extensiones (ej: --ext .jpg,.png,.txt)" << endl;
    cout << "  --output <archivo>     Guardar reporte en archivo" << endl;
    cout << "  --help                 Mostrar esta ayuda" << endl;
    cout << endl;
    cout << "Ejemplos:" << endl;
    cout << "  " << programName << " /home/usuario" << endl;
    cout << "  " << programName << " /home/usuario --ext .jpg,.png" << endl;
    cout << "  " << programName << " /home/usuario --output reporte.txt" << endl;
}

Config parseArguments(int argc, char* argv[]) {
    Config config;
    
    if (argc < 2) {
        showUsage(argv[0]);
        exit(1);
    }
    
    config.directory = argv[1];
    
    for (int i = 2; i < argc; i++) {
        string arg = argv[i];
        
        if (arg == "--help") {
            showUsage(argv[0]);
            exit(0);
        } else if (arg == "--ext" && i + 1 < argc) {
            string extensions = argv[++i];
            stringstream ss(extensions);
            string ext;
            while (getline(ss, ext, ',')) {
                if (!ext.empty()) {
                    if (ext[0] != '.') ext = "." + ext;
                    transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
                    config.extensions.insert(ext);
                }
            }
        } else if (arg == "--output" && i + 1 < argc) {
            config.outputFile = argv[++i];
        }
    }
    
    return config;
}

bool matchesExtension(const string& filepath, const set<string>& extensions) {
    if (extensions.empty()) return true;
    
    fs::path path(filepath);
    string ext = path.extension().string();
    transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    
    return extensions.find(ext) != extensions.end();
}

string formatSize(uintmax_t bytes) {
    double mb = static_cast<double>(bytes) / (1024.0 * 1024.0);
    
    stringstream ss;
    if (mb < 0.01) {
        ss << fixed << setprecision(4) << mb << " MB";
    } else if (mb < 0.1) {
        ss << fixed << setprecision(3) << mb << " MB";
    } else if (mb < 1.0) {
        ss << fixed << setprecision(2) << mb << " MB";
    } else {
        ss << fixed << setprecision(2) << mb << " MB";
    }
    
    return ss.str();
}

string calculateImprovedHash(const string& filepath) {
    ifstream file(filepath, ios::binary);
    if (!file) {
        return "";
    }
    
    uint64_t hash1 = 14695981039346656037ULL;
    uint64_t hash2 = 1125899906842597ULL;
    const uint64_t fnv_prime = 1099511628211ULL;
    
    char buffer[8192];
    while (file.read(buffer, sizeof(buffer)) || file.gcount() > 0) {
        for (streamsize i = 0; i < file.gcount(); i++) {
            hash1 ^= static_cast<unsigned char>(buffer[i]);
            hash1 *= fnv_prime;
            hash2 = ((hash2 << 5) + hash2) + static_cast<unsigned char>(buffer[i]);
        }
    }
    
    stringstream ss;
    ss << hex << hash1 << hash2;
    return ss.str();
}

int main(int argc, char* argv[]) {
    Config config = parseArguments(argc, argv);
    
    if (!fs::exists(config.directory) || !fs::is_directory(config.directory)) {
        cout << "Error: El directorio no existe o no es válido." << endl;
        return 1;
    }
    
    unordered_map<string, vector<string>> hashGroups;
    uintmax_t totalFiles = 0;
    uintmax_t processedFiles = 0;
    uintmax_t totalSize = 0;
    uintmax_t duplicateSize = 0;
    
    try {
        for (const auto& entry : fs::recursive_directory_iterator(config.directory)) {
            if (entry.is_regular_file()) {
                totalFiles++;
                string filepath = entry.path().string();
                
                if (matchesExtension(filepath, config.extensions)) {
                    processedFiles++;
                    uintmax_t fileSize = fs::file_size(entry);
                    totalSize += fileSize;
                    
                    string hash = calculateImprovedHash(filepath);
                    
                    if (!hash.empty()) {
                        hashGroups[hash].push_back(filepath);
                    }
                }
            }
        }
    } catch (const exception& e) {
        cout << "Error al recorrer el directorio: " << e.what() << endl;
        return 1;
    }
    
    bool foundDuplicates = false;
    int duplicateGroups = 0;
    
    for (const auto& [hash, files] : hashGroups) {
        if (files.size() > 1) {
            foundDuplicates = true;
            duplicateGroups++;
            
            uintmax_t fileSize = 0;
            try {
                fileSize = fs::file_size(files[0]);
                duplicateSize += fileSize * (files.size() - 1);
            } catch (const exception& e) {
                // Si no se puede obtener el tamaño, continuar
            }
        }
    }
    
    ostream* output = &cout;
    ofstream fileOutput;
    
    if (!config.outputFile.empty()) {
        fileOutput.open(config.outputFile);
        if (fileOutput.is_open()) {
            output = &fileOutput;
            cout << "Guardando reporte en: " << config.outputFile << endl;
        } else {
            cout << "Error: No se pudo crear el archivo de salida. Mostrando en pantalla." << endl;
        }
    }
    
    if (config.showStats) {
        *output << "=== ESTADÍSTICAS ===" << endl;
        *output << "Archivos totales encontrados: " << totalFiles << endl;
        *output << "Archivos procesados (filtrados): " << processedFiles << endl;
        *output << "Grupos de duplicados: " << duplicateGroups << endl;
        *output << "Espacio total procesado: " << formatSize(totalSize) << endl;
        *output << "Espacio ocupado por duplicados: " << formatSize(duplicateSize) << endl;
        *output << "Espacio que se podría liberar: " << formatSize(duplicateSize) << endl;
        *output << endl;
    }
    
    if (foundDuplicates) {
        *output << left << setw(10) << "GRUPO" << setw(20) << "TAMAÑO" << setw(35) << "HASH" << "ARCHIVO" << endl;
        *output << string(150, '-') << endl;
        
        int groupNumber = 1;
        for (const auto& [hash, files] : hashGroups) {
            if (files.size() > 1) {
                for (size_t i = 0; i < files.size(); i++) {
                    uintmax_t fileSize = 0;
                    try {
                        fileSize = fs::file_size(files[i]);
                    } catch (const exception& e) {
                        fileSize = 0;
                    }
                    
                    if (i == 0) {
                        *output << left << setw(10) << groupNumber;
                    } else {
                        *output << left << setw(10) << "";
                    }
                    *output << setw(20) << formatSize(fileSize);
                    
                    if (i == 0) {
                        *output << setw(35) << hash;
                    } else {
                        *output << setw(35) << "";
                    }
                    *output << files[i] << endl;
                }
                *output << endl;
                groupNumber++;
            }
        }
    } else {
        *output << "No se encontraron archivos duplicados." << endl;
    }
    
    if (fileOutput.is_open()) {
        fileOutput.close();
        cout << "Reporte guardado exitosamente." << endl;
    }
    
    return 0;
}
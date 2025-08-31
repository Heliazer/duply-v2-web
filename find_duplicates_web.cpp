#include <iostream>
#include <unordered_map>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <set>
#include <algorithm>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace std;
using namespace emscripten;

struct FileData {
    string name;
    string path;
    size_t size;
    string hash;
};

struct DuplicateGroup {
    vector<FileData> files;
    size_t totalSize;
    size_t wastedSpace;
};

class DuplicateFinder {
private:
    unordered_map<string, vector<FileData>> hashGroups;
    size_t totalFiles = 0;
    size_t totalSize = 0;
    
    string calculateImprovedHash(const string& content) {
        uint64_t hash1 = 14695981039346656037ULL;
        uint64_t hash2 = 1125899906842597ULL;
        const uint64_t fnv_prime = 1099511628211ULL;
        
        for (char c : content) {
            hash1 ^= static_cast<unsigned char>(c);
            hash1 *= fnv_prime;
            hash2 = ((hash2 << 5) + hash2) + static_cast<unsigned char>(c);
        }
        
        stringstream ss;
        ss << hex << hash1 << hash2;
        return ss.str();
    }
    
    string formatSize(size_t bytes) {
        double mb = static_cast<double>(bytes) / (1024.0 * 1024.0);
        stringstream ss;
        ss << fixed << setprecision(2) << mb << " MB";
        return ss.str();
    }

public:
    void addFile(const string& name, const string& path, const string& content) {
        FileData file;
        file.name = name;
        file.path = path;
        file.size = content.length();
        file.hash = calculateImprovedHash(content);
        
        totalFiles++;
        totalSize += file.size;
        
        hashGroups[file.hash].push_back(file);
    }
    
    val findDuplicates() {
        val result = val::object();
        val groups = val::array();
        
        size_t duplicateSize = 0;
        int groupNumber = 1;
        
        for (const auto& [hash, files] : hashGroups) {
            if (files.size() > 1) {
                val group = val::object();
                group.set("id", groupNumber++);
                group.set("hash", hash);
                group.set("fileCount", (int)files.size());
                group.set("fileSize", formatSize(files[0].size));
                group.set("wastedSpace", formatSize(files[0].size * (files.size() - 1)));
                
                val fileArray = val::array();
                for (size_t i = 0; i < files.size(); i++) {
                    val fileObj = val::object();
                    fileObj.set("name", files[i].name);
                    fileObj.set("path", files[i].path);
                    fileObj.set("size", (int)files[i].size);
                    fileArray.set(i, fileObj);
                }
                group.set("files", fileArray);
                
                groups.set(groups["length"].as<int>(), group);
                duplicateSize += files[0].size * (files.size() - 1);
            }
        }
        
        result.set("groups", groups);
        result.set("stats", val::object());
        result["stats"].set("totalFiles", (int)totalFiles);
        result["stats"].set("totalSize", formatSize(totalSize));
        result["stats"].set("duplicateGroups", groups["length"].as<int>());
        result["stats"].set("wastedSpace", formatSize(duplicateSize));
        
        return result;
    }
    
    void reset() {
        hashGroups.clear();
        totalFiles = 0;
        totalSize = 0;
    }
};

EMSCRIPTEN_BINDINGS(duplicate_finder) {
    class_<DuplicateFinder>("DuplicateFinder")
        .constructor<>()
        .function("addFile", &DuplicateFinder::addFile)
        .function("findDuplicates", &DuplicateFinder::findDuplicates)
        .function("reset", &DuplicateFinder::reset);
}
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Duply v2.1 is a web-based duplicate file detection application that finds and manages duplicate files with intelligent classification. It consists of a frontend web application and a Node.js backend server for file operations.

## Architecture

### Frontend (Web Application)
- **index.html**: Main web interface with modern responsive design
- **app.js**: Core JavaScript application with `DuplicateFinderWeb` class and `JavaScriptDuplicateFinder` algorithm
- **style.css**: Comprehensive styling for modern UI with progress indicators, tree views, and responsive design

### Backend (Node.js Server)
- **server.js**: Express.js server providing file deletion API and static file serving
- **package.json**: Dependencies include express, cors, fs-extra, and nodemon for development

### C++ Components (Original Implementation)
- **find_duplicates.cpp**: Command-line duplicate finder with filesystem traversal
- **find_duplicates_web.cpp**: WebAssembly-ready version for web integration
- **Makefile**: Build configuration for C++ components
- **fd.exe**: Compiled executable for Windows

## Development Commands

### Start Backend Server
```bash
npm start          # Production server on port 3002
npm run dev        # Development server with auto-restart
```

### Build C++ Components
```bash
make               # Build find_duplicates executable
make clean         # Clean build artifacts
```

### Install Dependencies
```bash
npm install        # Install Node.js dependencies
```

## Key Features & Architecture

### Duplicate Detection Algorithm
The application uses a sophisticated multi-algorithm hash approach:
- **FNV-1a + djb2** hash combination for collision resistance
- **Size integration** in hash calculation to prevent false positives
- **128-bit equivalent** security against collisions
- Located in `app.js` within `JavaScriptDuplicateFinder.calculateCustomHash()`

### File Classification System
Duplicates are intelligently categorized:
- **Exact Duplicates**: Same hash + same size (safe to delete)
- **Suspicious Duplicates**: Same hash + different size (requires review)

### API Endpoints (server.js)
- `GET /api/health` - Health check endpoint
- `POST /api/delete-files` - File deletion with security validations
- `POST /api/check-files` - File existence verification
- `POST /api/compare-files` - Byte-by-byte file comparison for suspicious duplicates
- Static file serving for frontend assets

### Frontend Architecture (app.js)
Main class: `DuplicateFinderWeb`
- File selection and drag-drop handling with security validation
- Progress tracking with real-time updates
- Tree-view directory navigation
- Export functionality for reports
- Integration with backend API for file operations
- `HashWorkerManager` - Parallel hash calculation using Web Workers
- `HashCache` - Intelligent caching with localStorage persistence
- `InputValidator` - Security validations and input sanitization

## Development Patterns

### File Structure Organization
- Frontend files in root directory
- Backend logic in server.js with Express.js patterns
- C++ implementations as performance alternatives
- Modular CSS with BEM-like naming conventions

### Security Measures
- Path validation in file operations
- System directory protection
- CORS configuration for development
- File type and existence validation

### UI/UX Patterns
- Progressive enhancement approach
- Real-time progress indicators
- Responsive design for mobile/desktop
- Icon-based file type identification
- Expandable tree navigation

## Important File Relationships

- `index.html` loads `app.js` and `style.css`
- `app.js` communicates with backend via `/api/` endpoints
- `server.js` serves static files and handles file operations
- C++ components provide alternative implementation paths
- Package dependencies managed through npm/package.json

## Testing and Quality Assurance

When making changes, ensure:
1. Frontend functionality works without backend (simulation mode)
2. Backend API endpoints maintain security validations
3. File hash algorithm maintains collision resistance
4. UI remains responsive across different screen sizes
5. Error handling provides meaningful user feedback

## Performance Considerations

- Hash calculation is CPU intensive for large files
- Progress updates use throttling to prevent UI blocking
- Tree view uses lazy loading for large directory structures
- File operations are batched to optimize network requests

## 🚀 Future Enhancements Roadmap

### ✅ Recently Implemented (v2.1)
- **Web Workers**: Parallel hash calculation using `hash-worker.js` and `HashWorkerManager`
- **Hash Cache**: Intelligent localStorage caching with LRU eviction and 7-day expiry  
- **Byte-by-byte comparison API**: `/api/compare-files` endpoint for resolving suspicious duplicates
- **Input validation**: `InputValidator` class with security sanitization and file validations

### High Priority Features (Next)

### Medium Priority Features  
- **File preview modal**: Side-by-side comparison of duplicate files
- **Advanced filters**: Size, date, file type, and pattern-based filtering
- **Analytics dashboard**: Visual charts and statistics about duplicates
- **Analysis vs Cleanup modes**: Separate safe analysis from destructive operations

### Lower Priority Features
- **Streaming for large files**: Handle files >100MB efficiently
- **IndexedDB persistence**: Resume interrupted scans
- **PWA capabilities**: Offline functionality and app-like experience
- **Smart deletion recommendations**: AI-based suggestions for which files to delete

## Implementation Guidelines

When implementing roadmap features:
1. Maintain backward compatibility with existing functionality
2. Ensure frontend works without backend (fallback mode)
3. Follow existing code patterns and security practices
4. Update version numbers and documentation
5. Test across multiple browsers
# 🔍 Duply v2.0 - Detector de Archivos Duplicados Web

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/prisbia/duply_v2_web)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Web App](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://prisbia.github.io/duply_v2_web)

Una aplicación web moderna y eficiente para encontrar y gestionar archivos duplicados con **inteligencia artificial** para distinguir entre duplicados exactos y sospechosos.

---

## 🚀 **Novedades de la v2.0**

### 🎯 **Clasificación Inteligente de Duplicados (¡NUEVO!)**
- **🟢 Duplicados Exactos**: Mismo hash + mismo tamaño (seguros para eliminar)
- **🟡 Duplicados Sospechosos**: Mismo contenido, tamaño diferente (requieren revisión)
- **⚠️ Casos detectados**: Videos fragmentados, imágenes con metadatos, documentos con versiones

### 🌳 **Vista de Árbol Mejorada**
- **Pestañas separadas** para duplicados exactos vs sospechosos
- **Panel informativo** explicando qué son los duplicados sospechosos
- **Colores diferenciados** y badges identificadores

## 🌟 Características

### 🔍 **Detección Inteligente**
- Algoritmo de hash mejorado (FNV-1a + djb2) para detección confiable
- Procesamiento en tiempo real con progreso visual
- Filtrado por extensiones de archivo
- Soporte para archivos y carpetas completas

### 📊 **Interfaz Moderna**
- Diseño responsivo y atractivo
- Progreso detallado con velocidad de procesamiento
- Vista de directorios estilo explorador
- Estadísticas completas de duplicados

### 📁 **Gestión de Directorios**
- Lista de carpetas con duplicados
- Ordenamiento por nombre, cantidad o tamaño
- Navegación rápida a archivos específicos
- Resaltado visual de archivos por carpeta

### 🌳 **Árbol de Directorios (¡NUEVO!)**
- Vista jerárquica estilo Explorador de Windows
- Carpetas expandibles/contraíbles con un click
- Archivos agrupados por directorio
- Iconos específicos por tipo de archivo
- Indicadores de duplicados con números de grupo

### 📈 **Monitoreo en Tiempo Real**
- Barra de progreso con porcentaje
- Archivo actual siendo procesado
- Velocidad de procesamiento
- Tiempo estimado restante
- Registro de actividad detallado

## 🚀 Uso

1. **Abrir la aplicación**: Abre `index.html` en tu navegador
2. **Seleccionar archivos**: Arrastra archivos/carpetas o usa los botones de selección
3. **Filtrar (opcional)**: Especifica extensiones como `.jpg, .png, .txt`
4. **Escanear**: Haz clic en "Escanear Duplicados"
5. **Revisar resultados**: 
   - Ve las estadísticas generales
   - Revisa directorios con duplicados (vista de lista)
   - Explora el árbol de directorios expandible
   - Examina archivos duplicados por carpeta
6. **Exportar**: Descarga un reporte completo

## 🛠️ Tecnologías

- **HTML5** - Estructura y drag & drop
- **CSS3** - Diseño moderno y responsive
- **JavaScript ES6+** - Lógica de aplicación
- **WebAssembly Ready** - Preparado para integración C++

## 📂 Estructura del Proyecto

```
duply/
├── index.html          # Interfaz principal
├── style.css          # Estilos y diseño
├── app.js             # Lógica de aplicación
├── find_duplicates.cpp # Versión original C++
├── find_duplicates_web.cpp # Versión WebAssembly
└── README.md          # Documentación
```

## 🔧 Algoritmo de Hash

La aplicación utiliza una combinación de dos algoritmos de hash para mayor confiabilidad:

- **FNV-1a (64-bit)**: Hash rápido con buena distribución
- **djb2**: Hash secundario para reducir colisiones
- **Total: 128-bit** de seguridad contra colisiones

**Probabilidad de colisión**: ~1 en 18 quintillones

## ✨ Características Avanzadas

### 🎯 **Progreso Detallado**
- Indicador visual del archivo siendo procesado
- Estadísticas de velocidad en tiempo real
- Log de actividad con timestamps
- Estimación de tiempo restante

### 📋 **Vista de Directorios**
- Lista estilo explorador de Windows
- Ordenamiento múltiple (nombre, cantidad, tamaño)
- Información detallada por carpeta:
  - Cantidad de archivos duplicados
  - Número de grupos duplicados
  - Espacio desperdiciado
  - Porcentaje del total

### 🌲 **Árbol Expandible de Archivos**
- Organización jerárquica como Windows Explorer
- Carpetas con contadores de duplicados
- Expansión/contracción con animaciones
- Iconos por tipo de archivo (PDF, Word, Excel, imágenes, etc.)
- Controles "Expandir/Contraer Todo"
- Selección individual por archivo
- Indicadores visuales de grupos duplicados

### 📊 **Estadísticas Completas**
- Archivos totales procesados
- Grupos de duplicados encontrados
- Espacio total analizado
- Espacio que se puede liberar

## 🌐 Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 Responsive para móviles y tablets

## 🚧 Futuras Mejoras

- [ ] Integración completa con WebAssembly
- [ ] Eliminación automática de duplicados
- [ ] Más algoritmos de hash
- [ ] Comparación byte a byte opcional
- [ ] Integración con servicios en la nube
- [ ] Búsqueda y filtrado en el árbol de archivos
- [ ] Vista previa de archivos duplicados
- [ ] Arrastrar y soltar para reorganizar archivos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la branch (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollado por

**prisbia** - *Desarrollo inicial* - [GitHub](https://github.com/prisbia)

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐
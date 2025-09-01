#!/bin/bash

echo "🚀 Configurando Duply v2.1 con eliminación real de archivos..."
echo

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado."
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    echo "   npm debería venir con Node.js"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"
echo "✅ npm $(npm --version) detectado"
echo

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas exitosamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo
echo "🎉 ¡Configuración completada!"
echo
echo "📋 Comandos disponibles:"
echo "   npm start     - Iniciar servidor backend (puerto 3001)"
echo "   npm run dev   - Iniciar servidor en modo desarrollo"
echo
echo "🌐 Para usar la aplicación:"
echo "   1. Ejecuta: npm start"
echo "   2. Abre: http://localhost:3001/index.html"
echo "   3. ¡Ahora podrás eliminar archivos realmente!"
echo
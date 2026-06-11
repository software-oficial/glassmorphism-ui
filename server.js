const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Proxy para resolver problemas de CORS con el backend de Railway
app.use('/api', createProxyMiddleware({ 
  target: 'https://ecosistema-core-production.up.railway.app', 
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' 
  }
}));

// Servir archivos estáticos desde la carpeta 'dist' (generada por vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Cualquier otra ruta devuelve el index.html (Single Page Application)
app.get(/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Production Server running on port ${PORT}`);
});

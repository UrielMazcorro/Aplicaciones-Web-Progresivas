# 1. Usamos una imagen base de Node.js ligera (Alpine Linux)
FROM node:18-alpine

# 2. Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos primero los archivos de dependencias (para aprovechar la caché)
COPY package*.json ./

# 4. Instalamos las dependencias dentro del contenedor
RUN npm install

# 5. Copiamos el resto del código (server.js, carpeta frontend, credenciales)
# OJO: Esto copiará tu .env y serviceAccountKey.json al contenedor
COPY . .

# 6. Le decimos a Docker que nuestra app usa el puerto 3000
EXPOSE 3000

# 7. Comando para iniciar la aplicación
CMD ["node", "server.js"]
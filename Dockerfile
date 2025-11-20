# Imagen base
FROM node:18-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiar solo dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar SOLO lo necesario para producción
COPY server.js ./server.js
COPY frontend ./frontend

# NO copiamos .env
# NO copiamos serviceAccountKey.json
# NO copiamos otros archivos sensibles

EXPOSE 3000

CMD ["node", "server.js"]

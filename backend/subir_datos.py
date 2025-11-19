import serial
import time
import re # Para "descifrar" el texto
import firebase_admin
from firebase_admin import credentials, db

# ---------------------------------------------------------------
# CONFIGURACIÓN DE FIREBASE (¡DEBES CAMBIAR ESTO!)
# ---------------------------------------------------------------
# 1. Asegúrate de que tu archivo 'clave-firebase.json' esté en la misma carpeta
cred = credentials.Certificate('clave-firebase.json')

# 2. Ve a Realtime Database y copia la URL (ej: https://mi-proyecto-default-rtdb.firebaseio.com/)
DATABASE_URL = 'https://prisn3d-int-default-rtdb.firebaseio.com/' 

firebase_admin.initialize_app(cred, {
    'databaseURL': DATABASE_URL
})

# ---------------------------------------------------------------
# CONFIGURACIÓN DEL ARDUINO (¡DEBES CAMBIAR ESTO!)
# ---------------------------------------------------------------
# 3. Revisa en tu Arduino IDE qué puerto estás usando (ej. COM3, COM5, etc.)
ARDUINO_PORT = 'COM3' 
BAUD_RATE = 9600

# Rutas de Firebase
ref_latest = db.reference('sensores/dht11/latest')
ref_logs = db.reference('sensores/dht11/logs')

print(f"Conectando a {ARDUINO_PORT}...")

try:
    # Intenta conectar al puerto
    arduino = serial.Serial(port=ARDUINO_PORT, baudrate=BAUD_RATE, timeout=1)
    print("¡Conectado! Escuchando datos del Arduino...")

    while True:
        # Lee una línea completa desde el Arduino
        linea_bytes = arduino.readline()
        
        # Si la línea no está vacía, la procesamos
        if linea_bytes:
            # Decodifica de bytes a string (texto)
            linea = linea_bytes.decode('utf-8').strip()
            
            # ---------------------------------------------------------------
            # ¡¡AQUÍ ESTÁ LA CORRECCIÓN!!
            # Ahora buscamos "H:" y "T:"
            # ---------------------------------------------------------------
            if "H:" in linea and "T:" in linea:
                
                try:
                    # Usamos regex para extraer los números
                    hum_match = re.search(r'H:([0-9.]+)', linea) # <-- CAMBIO
                    temp_match = re.search(r'T:([0-9.]+)', linea) # <-- CAMBIO

                    if hum_match and temp_match:
                        # Convertimos el texto extraído a números
                        humedad = float(hum_match.group(1))
                        temperatura = float(temp_match.group(1))
                        
                        # Obtenemos el tiempo actual en milisegundos
                        timestamp = int(time.time() * 1000)

                        # Creamos el objeto de datos
                        data = {
                            'humedad': humedad,
                            'temperatura': temperatura,
                            'timestamp': timestamp
                        }

                        # 1. Actualizamos el valor 'latest'
                        ref_latest.set(data)
                        
                        # 2. Añadimos un nuevo registro a 'logs'
                        ref_logs.push(data)

                        print(f"DATO SUBIDO: Temp={temperatura}°C, Hum={humedad}%")
                    
                except Exception as e:
                    print(f"Error parseando la línea: {e}")
            
            # Imprime cualquier otra línea que no sea de datos
            else:
                if linea: # Evita imprimir líneas vacías
                    print(f"Arduino dice: {linea}")

        # Pequeña pausa
        time.sleep(0.1)

except serial.SerialException as e:
    print(f"\n--- ERROR ---")
    print(f"No se pudo conectar al puerto '{ARDUINO_PORT}'.")
    print("Verifica lo siguiente:")
    print(f"1. ¿Está el Arduino conectado a ese puerto?")
    print(f"2. ¿Escribiste bien el nombre del puerto en el script?")
    print(f"3. ¿No tienes el 'Monitor Serial' del Arduino IDE abierto? (Solo un programa puede usar el puerto a la vez)")
    print(f"Error original: {e}")
except Exception as e:
    print(f"Ha ocurrido un error inesperado: {e}")
import serial
import time
import re
import requests
import firebase_admin
from firebase_admin import credentials, db

# ---------------------------------------------------------------
# CONFIGURACIÓN FIREBASE (Opcional)
# ---------------------------------------------------------------
cred = credentials.Certificate('clave-firebase.json')

# URL de tu Realtime Database de Firebase
DATABASE_URL = 'https://prisn3d-int-default-rtdb.firebaseio.com/' 

firebase_admin.initialize_app(cred, {
    'databaseURL': DATABASE_URL
})

ref_latest = db.reference('sensores/dht11/latest')
ref_logs = db.reference('sensores/dht11/logs')

# ---------------------------------------------------------------
# CONFIGURACIÓN DEL ARDUINO
# ---------------------------------------------------------------
ARDUINO_PORT = 'COM3'  # Cambia al puerto donde está tu Arduino
BAUD_RATE = 9600

# ---------------------------------------------------------------
# CONFIGURACIÓN DEL SERVIDOR EN RENDER
# ---------------------------------------------------------------
SERVER_URL = 'https://aplicaciones-web-progresivas-as15.onrender.com/api/sensores'

# ---------------------------------------------------------------
# INICIO CONEXIÓN
# ---------------------------------------------------------------
print(f"Conectando a {ARDUINO_PORT}...")

try:
    arduino = serial.Serial(port=ARDUINO_PORT, baudrate=BAUD_RATE, timeout=1)
    print("¡Conectado al Arduino! Escuchando datos...")

    while True:
        linea_bytes = arduino.readline()
        if linea_bytes:
            linea = linea_bytes.decode('utf-8').strip()

            if "H:" in linea and "T:" in linea:
                try:
                    hum_match = re.search(r'H:([0-9.]+)', linea)
                    temp_match = re.search(r'T:([0-9.]+)', linea)

                    if hum_match and temp_match:
                        humedad = float(hum_match.group(1))
                        temperatura = float(temp_match.group(1))
                        timestamp = int(time.time() * 1000)

                        data = {
                            'humedad': humedad,
                            'temperatura': temperatura,
                            'timestamp': timestamp
                        }

                        # 1️⃣ Firebase (opcional)
                        ref_latest.set(data)
                        ref_logs.push(data)

                        # 2️⃣ Enviar al servidor Render
                        try:
                            response = requests.post(SERVER_URL, json=data)
                            if response.status_code == 200:
                                print(f"✅ Dato enviado a Render: T={temperatura}°C, H={humedad}%")
                            else:
                                print(f"❌ Error Render {response.status_code}: {response.text}")
                        except Exception as e:
                            print(f"❌ Fallo al enviar a Render: {e}")

                except Exception as e:
                    print(f"Error parseando la línea: {e}")
            else:
                if linea:
                    print(f"Arduino dice: {linea}")

        time.sleep(0.1)

except serial.SerialException as e:
    print("\n--- ERROR DE CONEXIÓN AL ARDUINO ---")
    print(f"No se pudo conectar al puerto '{ARDUINO_PORT}'.")
    print("Verifica:")
    print("1. El Arduino está conectado al puerto correcto.")
    print("2. Ningún otro programa (Monitor Serial IDE) está usando el puerto.")
    print(f"Error original: {e}")
except Exception as e:
    print(f"Ha ocurrido un error inesperado: {e}")
#!/usr/bin/env bash
# Pi kurulum scripti — tek seferlik
set -e

echo "=== PISI dock kurulumu ==="

# Sistem paketleri
sudo apt update
sudo apt install -y python3-pip python3-lgpio

# Python paketleri
pip3 install paho-mqtt python-dotenv --break-system-packages

# Dosyaları ~/pisi konumuna kopyala
DEST="$HOME"
cp unlock.py        "$DEST/unlock.py"
cp mqtt_listener.py "$DEST/mqtt_listener.py"
if [ ! -f "$DEST/.env" ]; then
  cp .env.example "$DEST/.env"
  echo ">>> .env oluşturuldu — credentials'ları doldurmayı unutma!"
fi

# .env'i koru
chmod 600 "$DEST/.env"

# systemd servis
sudo tee /etc/systemd/system/pisi-dock.service > /dev/null <<'EOF'
[Unit]
Description=PISI Dock MQTT Listener
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pisi
WorkingDirectory=/home/pisi
ExecStart=/usr/bin/python3 /home/pisi/mqtt_listener.py
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pisi-dock

echo ""
echo "=== Kurulum tamamlandı ==="
echo "Durum:  sudo systemctl status pisi-dock"
echo "Log:    sudo journalctl -u pisi-dock -f"

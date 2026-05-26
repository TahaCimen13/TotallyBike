"""
PISI dock MQTT listener.

Topics:
  pisi/dock/{DOCK_ID}/unlock   <- subscribe (backend publishes)
  pisi/dock/{DOCK_ID}/status   -> publish   (online/unlocked/error/offline)
"""
import os
import ssl
import json
import logging
import signal
from collections import deque
from pathlib import Path

from dotenv import load_dotenv
import paho.mqtt.client as mqtt

from unlock import unlock_bike

# ──────────────────────────────────────────────────────────────
load_dotenv(Path.home() / ".env")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("listener")

DOCK_ID       = os.getenv("DOCK_ID", "01")
MQTT_HOST     = os.environ["MQTT_HOST"]
MQTT_PORT     = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USER     = os.environ["MQTT_USER"]
MQTT_PASS     = os.environ["MQTT_PASS"]

UNLOCK_TOPIC  = f"pisi/dock/{DOCK_ID}/unlock"
STATUS_TOPIC  = f"pisi/dock/{DOCK_ID}/status"

# ──────────────────────────────────────────────────────────────
# Idempotency — backend retry yaparsa aynı ride iki kez tetiklenmesin
RECENT_RIDES: "deque[str]" = deque(maxlen=50)


def already_processed(ride_id: str) -> bool:
    if ride_id in RECENT_RIDES:
        return True
    RECENT_RIDES.append(ride_id)
    return False


# ──────────────────────────────────────────────────────────────
def publish_status(client: mqtt.Client, state: str, **extra) -> None:
    payload = {"dock_id": DOCK_ID, "state": state, **extra}
    client.publish(STATUS_TOPIC, json.dumps(payload), qos=1, retain=False)


def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        log.info("Connected to %s — subscribing to %s", MQTT_HOST, UNLOCK_TOPIC)
        client.subscribe(UNLOCK_TOPIC, qos=1)
        publish_status(client, "online")
    else:
        log.error("Connection failed: rc=%s", reason_code)


def on_disconnect(client, userdata, flags, reason_code, properties=None):
    log.warning("Disconnected: rc=%s — paho will auto-reconnect", reason_code)


def on_message(client, userdata, msg):
    log.info("Message on %s: %s", msg.topic, msg.payload[:200])
    try:
        payload = json.loads(msg.payload.decode())
    except (ValueError, UnicodeDecodeError) as e:
        log.error("Invalid payload: %s", e)
        publish_status(client, "error", reason="invalid_payload")
        return

    ride_id = str(payload.get("ride_id", "unknown"))

    if already_processed(ride_id):
        log.warning("Duplicate ride_id=%s, skipping", ride_id)
        return

    log.info("Triggering unlock for ride_id=%s", ride_id)
    success = unlock_bike()

    publish_status(
        client,
        "unlocked" if success else "error",
        ride_id=ride_id,
    )


# ──────────────────────────────────────────────────────────────
def main() -> None:
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"pisi-dock-{DOCK_ID}",
        clean_session=True,
    )
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)

    client.will_set(
        STATUS_TOPIC,
        json.dumps({"dock_id": DOCK_ID, "state": "offline"}),
        qos=1,
        retain=False,
    )

    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message

    # Otomatik reconnect aralığı
    client.reconnect_delay_set(min_delay=1, max_delay=30)

    # Graceful shutdown
    def shutdown(signum, frame):
        log.info("Signal %s — shutting down", signum)
        publish_status(client, "offline")
        client.disconnect()
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT,  shutdown)

    log.info("Connecting to %s:%s as %s ...", MQTT_HOST, MQTT_PORT, MQTT_USER)
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_forever()


if __name__ == "__main__":
    main()

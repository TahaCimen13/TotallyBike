"""PISI dock — solenoid kilit kontrol modülü."""
import threading
import logging
from gpiozero import OutputDevice, TonalBuzzer
from gpiozero.tones import Tone
from time import sleep

RELAY_PIN       = 18
BUZZER_PIN      = 13    # GPIO13, BOARD pin 33 — TonalBuzzer
UNLOCK_DURATION = 3.0   # saniye — kullanıcı bisikleti çeksin diye yeterli süre
MAX_DURATION    = 5.0   # güvenlik sınırı

log = logging.getLogger("unlock")

# Singleton — pin her çağrıda yeniden oluşturulmuyor
_relay:  OutputDevice | None = None
_buzzer: TonalBuzzer | None = None
_lock = threading.Lock()


def _get_devices() -> tuple[OutputDevice, TonalBuzzer]:
    global _relay, _buzzer
    if _relay is None:
        _relay = OutputDevice(RELAY_PIN, active_high=False, initial_value=False)
    if _buzzer is None:
        _buzzer = TonalBuzzer(BUZZER_PIN)
    return _relay, _buzzer


def _beep(buzzer: TonalBuzzer, freq: str, duration: float, pause: float = 0.0):
    buzzer.play(Tone(freq))
    sleep(duration)
    buzzer.stop()
    if pause:
        sleep(pause)


def unlock_bike(duration: float = UNLOCK_DURATION) -> bool:
    """
    Kilidi açar:
      1. 3 yükselen bip  (hazır ol)
      2. solenoid ON     (bisikleti çek)
      3. solenoid OFF
      4. 2 onay bipi

    Eş zamanlı çağrı gelirse bekler (kilit mekanizması).
    """
    duration = min(duration, MAX_DURATION)

    if not _lock.acquire(blocking=True, timeout=10):
        log.warning("unlock_bike: lock alınamadı, zaten açık olabilir")
        return False

    try:
        relay, buzzer = _get_devices()

        # Hazır ol — 3 yükselen nota
        _beep(buzzer, "A4", 0.08, 0.06)
        _beep(buzzer, "C5", 0.08, 0.06)
        _beep(buzzer, "E5", 0.12, 0.05)

        # Solenoid aç
        log.info("Solenoid ON for %.1fs — bisikleti çekin", duration)
        relay.on()
        sleep(duration)
        relay.off()
        log.info("Solenoid OFF")

        # Onay — 2 nota
        sleep(0.1)
        _beep(buzzer, "G5", 0.2, 0.08)
        _beep(buzzer, "E5", 0.3)

        return True

    except Exception as e:
        log.error("unlock_bike failed: %s", e)
        # Hata durumunda GPIO'yu temizle ve sıfırla
        global _relay, _buzzer  # noqa: PLW0603
        try:
            if _relay: _relay.off(); _relay.close()
        except Exception:
            pass
        try:
            if _buzzer: _buzzer.stop(); _buzzer.close()
        except Exception:
            pass
        _relay = None
        _buzzer = None
        return False

    finally:
        _lock.release()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ok = unlock_bike()
    print("OK" if ok else "FAIL")

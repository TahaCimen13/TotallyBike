# PISI BikeApp — Donanım Prototipi Devir Notu

## Tamamlanan adımlar

- [x] **Adım 1:** Pi 4 headless kurulum (Trixie/Debian 13, Python 3.13, gpiozero)
  - hostname: `pisi-dock-01`
  - kullanıcı: `pisi`
  - SSH: `ssh pisi@pisi-dock-01.local`

- [x] **Adım 2:** LED blink — GPIO17 + 220Ω + yeşil LED + GND

- [x] **Adım 3:** Röle modülü (Tongling JQC-3FF-S-Z, active-low)
  - Pin 2 (5V) → VCC
  - Pin 9 (GND) → GND
  - Pin 12 (GPIO18) → IN

- [x] **Adım 4:** Solenoid + flyback diyot
  - 12V adaptör → röle COM
  - Röle NO → solenoid +
  - Solenoid − → 12V −
  - 1N4007 paralel: bantlı uç NO tarafında
  - Test sonucu: çalışıyor, pim hareket ediyor
  - NOT: solenoid pim "yatık" pozisyonda bazen takılıyor, dik konumda sorunsuz

- [x] **Adım 5:** Buzzer onay sesi (aktif buzzer 12mm, GPIO22 → Pin 15)

## Kod

`~/unlock.py` mevcut, çalışıyor:
- 2 kısa bip → solenoid 1.5s açık → 1 uzun bip
- `try/finally` ile GPIO temizliği

## Sırada

**Adım 7: MQTT bağlantısı** (HiveMQ Cloud free tier)
- Pi MQTT client → unlock script tetikleyici
- Backend (Next.js, Vercel) → MQTT publish

## Donanım envanteri

- Pi 4B 2GB ✅
- 5V 3A USB-C adaptör ✅
- 12V adaptör + yeşil terminal blok ✅
- Röle modülü ✅
- Solenoid 12V ✅
- 1N4007 diyot (yedekler var) ✅
- Aktif buzzer ✅
- Breadboard + jumper + direnç + LED ✅
- GPS Neo-6M: HENÜZ ALINMADI

## Önemli notlar / öğrendiklerimiz

- REPL multi-line takılıyor — `python3 << 'EOF'` veya `python3 -c` kullan
- Solenoid 1-2 saniyeden uzun açık kalmasın, bobin yanar
- Manuel tel testi yapma, kıvılcım riski
- Diyot doğru yönlü: bantlı uç + tarafı (NO)

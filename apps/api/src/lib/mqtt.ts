import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | null = null;

function getClient(): MqttClient {
  if (client?.connected) return client;

  const host = process.env.MQTT_HOST;
  const port = process.env.MQTT_PORT || '8883';
  const username = process.env.MQTT_USER;
  const password = process.env.MQTT_PASS;

  if (!host || !username || !password) {
    throw new Error('MQTT_HOST, MQTT_USER, MQTT_PASS env vars are required');
  }

  client = mqtt.connect(`mqtts://${host}:${port}`, {
    username,
    password,
    clientId: `pisi-backend-${process.pid}-${Date.now()}`,
    reconnectPeriod: 2000,
    connectTimeout: 10_000,
  });

  client.on('connect', () => console.log('[MQTT] Connected to', host));
  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('close', () => console.warn('[MQTT] Connection closed'));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));

  return client;
}

export async function publishUnlock(dockId: string, rideId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const c = getClient();
    const topic = `pisi/dock/${dockId}/unlock`;
    const payload = JSON.stringify({ ride_id: rideId, ts: Date.now() });

    c.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT] Publish failed:', err.message);
        reject(err);
      } else {
        console.log(`[MQTT] Published unlock to ${topic}`);
        resolve();
      }
    });
  });
}

export function initMqtt(): void {
  try {
    getClient();
  } catch (err) {
    console.warn('[MQTT] Init skipped:', (err as Error).message);
  }
}

/*
  gateway.ino — QuizMaster Pro ESP32 Gateway
  ───────────────────────────────────────────
  Hardware:
    - ESP32 DevKit v1 (with WiFi)
    - No OLED needed (optional status LED on GPIO 2)

  Role:
    - Receives student answers via ESP-NOW
    - Posts answers to Firebase Realtime Database via HTTP
    - Receives question broadcast from Firebase and re-broadcasts via ESP-NOW

  Firebase REST API:
    POST https://<your-db>.firebaseio.com/responses/{qId}/{deviceId}.json
    GET  https://<your-db>.firebaseio.com/quizSession.json

  Libraries needed:
    - ESP-NOW (built-in)
    - WiFi (built-in)
    - ArduinoJSON (v6)
    - HTTPClient (built-in)
*/

#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Configuration — FILL THESE IN ─────────────────────────
const char* SSID         = "YOUR_WIFI_SSID";
const char* WIFI_PASS    = "YOUR_WIFI_PASSWORD";
const char* FIREBASE_URL = "https://YOUR_PROJECT-default-rtdb.firebaseio.com";
const char* FIREBASE_SECRET = "YOUR_DATABASE_SECRET"; // legacy secret for simple auth

// ── Packet matching student_device.ino ────────────────────
typedef struct {
  char deviceId[20];
  int  questionNumber;
  char answer;
  float responseTime;
  long  timestamp;
} QuizPacket;

typedef struct {
  int  questionNumber;
  long startTime;
  int  timer;
  bool active;
} GatewayBroadcast;

GatewayBroadcast broadcastMsg;

// All registered student MAC addresses (replace with actual MACs)
uint8_t STUDENT_MACS[][6] = {
  {0xXX, 0xXX, 0xXX, 0xXX, 0xXX, 0x01},
  {0xXX, 0xXX, 0xXX, 0xXX, 0xXX, 0x02},
  // … add more
};
int STUDENT_COUNT = sizeof(STUDENT_MACS) / sizeof(STUDENT_MACS[0]);

String currentQId = "";
int currentQNum = 0;

// ── HTTP POST response to Firebase ────────────────────────
void postToFirebase(QuizPacket &pkt) {
  if (!WiFi.isConnected()) return;
  HTTPClient http;

  // Build path: /responses/{currentQId}/{deviceId}.json
  String url = String(FIREBASE_URL) + "/responses/" + currentQId + "/" + String(pkt.deviceId) + ".json?auth=" + FIREBASE_SECRET;

  StaticJsonDocument<200> doc;
  doc["answer"]       = String(pkt.answer);
  doc["responseTime"] = pkt.responseTime;
  doc["timestamp"]    = pkt.timestamp;

  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(body);
  Serial.printf("Firebase POST %s: %d\n", pkt.deviceId, code);
  http.end();
}

// ── Heartbeat to Firebase ─────────────────────────────────
void postHeartbeat(const char* deviceId) {
  if (!WiFi.isConnected()) return;
  HTTPClient http;
  String url = String(FIREBASE_URL) + "/devices/" + String(deviceId) + ".json?auth=" + FIREBASE_SECRET;
  StaticJsonDocument<100> doc;
  doc["lastSeen"] = millis();
  doc["online"] = true;
  String body; serializeJson(doc, body);
  http.begin(url); http.addHeader("Content-Type", "application/json");
  http.PUT(body); http.end();
}

// ── Poll Firebase for session changes ─────────────────────
void pollSession() {
  if (!WiFi.isConnected()) return;
  HTTPClient http;
  String url = String(FIREBASE_URL) + "/quizSession.json?auth=" + FIREBASE_SECRET;
  http.begin(url);
  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    if (deserializeJson(doc, payload) == DeserializationError::Ok) {
      const char* qId = doc["currentQ"];
      int qNum = doc["currentQNum"] | 0;
      long st   = doc["startTime"] | 0;
      int  tmr  = doc["timer"] | 30;

      if (qId && String(qId) != currentQId) {
        currentQId  = String(qId);
        currentQNum = qNum;
        // Broadcast to all student devices
        broadcastMsg.questionNumber = currentQNum;
        broadcastMsg.startTime = st;
        broadcastMsg.timer = tmr;
        broadcastMsg.active = true;
        for (int i = 0; i < STUDENT_COUNT; i++) {
          esp_now_send(STUDENT_MACS[i], (uint8_t*)&broadcastMsg, sizeof(broadcastMsg));
        }
        Serial.printf("Broadcast Q%d to %d devices\n", currentQNum, STUDENT_COUNT);
      }
    }
  }
  http.end();
}

// ── ESP-NOW receive handler ────────────────────────────────
void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len != sizeof(QuizPacket)) return;
  QuizPacket pkt;
  memcpy(&pkt, data, sizeof(pkt));
  Serial.printf("Received: %s Q%d Ans=%c Time=%.2fs\n",
    pkt.deviceId, pkt.questionNumber, pkt.answer, pkt.responseTime);
  postToFirebase(pkt);
  postHeartbeat(pkt.deviceId);
}

// ── Setup ─────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT); // Status LED

  // Connect WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nConnected: " + WiFi.localIP().toString());
  digitalWrite(2, HIGH);

  // ESP-NOW
  if (esp_now_init() != ESP_OK) { Serial.println("ESP-NOW init failed"); return; }
  esp_now_register_recv_cb(onReceive);

  // Register student peers for broadcasting
  for (int i = 0; i < STUDENT_COUNT; i++) {
    esp_now_peer_info_t p;
    memcpy(p.peer_addr, STUDENT_MACS[i], 6);
    p.channel = 0; p.encrypt = false;
    esp_now_add_peer(&p);
  }
}

// ── Loop — poll Firebase every 2 seconds ─────────────────
void loop() {
  pollSession();
  delay(2000);
}

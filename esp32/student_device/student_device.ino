/*
  student_device.ino — QuizMaster Pro ESP32 Student Device
  ─────────────────────────────────────────────────────────
  Hardware:
    - ESP32 DevKit v1
    - SSD1306 OLED 128×64 (I2C, SDA=21, SCL=22)
    - 4x Momentary push buttons (GPIO 12=A, 13=B, 14=C, 15=D)
    - 10kΩ pull-up resistors on each button

  Features:
    - Unique device ID from ESP32 MAC
    - Shows question number on OLED
    - One answer per question (lock-in)
    - Sends answer via ESP-NOW to gateway
*/

#include <WiFi.h>
#include <esp_now.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ── Configuration ─────────────────────────────────────────
#define SCREEN_W 128
#define SCREEN_H 64
#define BTN_A 12
#define BTN_B 13
#define BTN_C 14
#define BTN_D 15

// Replace with your gateway MAC address
uint8_t GATEWAY_MAC[] = {0xXX, 0xXX, 0xXX, 0xXX, 0xXX, 0xXX};

// ── Globals ────────────────────────────────────────────────
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

String deviceId = "";
int currentQuestion = 0;
bool answered = false;
char selectedAnswer = 0;
unsigned long questionStartTime = 0;

// ── ESP-NOW packet structure ───────────────────────────────
typedef struct {
  char deviceId[20];
  int  questionNumber;
  char answer;
  float responseTime;   // seconds
  long  timestamp;      // millis since boot
} QuizPacket;

QuizPacket packet;

// ── OLED helpers ───────────────────────────────────────────
void showWaiting() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("QuizMaster Pro");
  display.drawLine(0, 10, 128, 10, WHITE);
  display.setCursor(10, 24);
  display.setTextSize(1);
  display.println("Waiting for quiz...");
  display.setCursor(20, 42);
  display.print("ID: ");
  display.println(deviceId);
  display.display();
}

void showQuestion(int qNum) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(30, 0);
  display.print("Q");
  display.print(qNum);
  display.drawLine(0, 20, 128, 20, WHITE);
  display.setTextSize(1);
  display.setCursor(0, 28);
  display.println("A=btn12  B=btn13");
  display.setCursor(0, 40);
  display.println("C=btn14  D=btn15");
  display.display();
}

void showAnswered(char ans, float rt) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(40, 4);
  display.println(ans);
  display.setTextSize(1);
  display.setCursor(5, 34);
  display.print("Ans: "); display.println(ans);
  display.setCursor(5, 46);
  display.print("Time: "); display.print(rt, 2); display.println("s");
  display.display();
}

// ── ESP-NOW send callback ──────────────────────────────────
void onSend(const uint8_t *mac, esp_now_send_status_t status) {
  // Status LED feedback could go here
}

// ── Receive broadcast (question updates from gateway) ──────
typedef struct {
  int questionNumber;
  long startTime;
  int timer;
  bool active;
} GatewayBroadcast;

void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len == sizeof(GatewayBroadcast)) {
    GatewayBroadcast *msg = (GatewayBroadcast*)data;
    if (msg->questionNumber != currentQuestion) {
      currentQuestion = msg->questionNumber;
      questionStartTime = millis() - (millis() - msg->startTime); // sync
      answered = false;
      selectedAnswer = 0;
      showQuestion(currentQuestion);
    }
  }
}

// ── Setup ──────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // OLED init
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
    while (true);
  }
  display.setTextColor(WHITE);

  // Device ID from MAC
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  char buf[20];
  snprintf(buf, sizeof(buf), "ESP%02X%02X%02X", mac[3], mac[4], mac[5]);
  deviceId = String(buf);

  // Buttons
  pinMode(BTN_A, INPUT_PULLUP);
  pinMode(BTN_B, INPUT_PULLUP);
  pinMode(BTN_C, INPUT_PULLUP);
  pinMode(BTN_D, INPUT_PULLUP);

  // WiFi + ESP-NOW
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }
  esp_now_register_send_cb(onSend);
  esp_now_register_recv_cb(onReceive);

  // Register gateway as peer
  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, GATEWAY_MAC, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  showWaiting();
}

// ── Send answer ────────────────────────────────────────────
void sendAnswer(char ans) {
  if (answered || currentQuestion == 0) return;

  float rt = (millis() - questionStartTime) / 1000.0f;
  deviceId.toCharArray(packet.deviceId, 20);
  packet.questionNumber = currentQuestion;
  packet.answer = ans;
  packet.responseTime = rt;
  packet.timestamp = millis();

  esp_now_send(GATEWAY_MAC, (uint8_t*)&packet, sizeof(packet));

  answered = true;
  selectedAnswer = ans;
  showAnswered(ans, rt);
  Serial.printf("Sent: Q%d Ans=%c Time=%.2fs\n", currentQuestion, ans, rt);
}

// ── Main loop ──────────────────────────────────────────────
void loop() {
  if (!answered) {
    if (digitalRead(BTN_A) == LOW) { sendAnswer('A'); delay(200); }
    if (digitalRead(BTN_B) == LOW) { sendAnswer('B'); delay(200); }
    if (digitalRead(BTN_C) == LOW) { sendAnswer('C'); delay(200); }
    if (digitalRead(BTN_D) == LOW) { sendAnswer('D'); delay(200); }
  }
  delay(20);
}

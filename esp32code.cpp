/*
 * ESP32-S3 摇杆检验台 —— MVP 最小系统
 *
 * 硬件接线：
 *   HW504 摇杆 VRx  -> GPIO1  (X 轴, ADC)
 *   HW504 摇杆 VRy  -> GPIO2  (Y 轴, ADC)
 *   HW504 摇杆 SW   -> GPIO3  (按键, 内部上拉, 按下为 LOW)
 *   VCC -> 3V3, GND -> GND
 *
 * 功能：
 *   周期读取 X/Y 模拟值、SW 按键状态，
 *   以 JSON 行格式输出到串口(115200)，
 *   协议匹配前端网页 parseLine：
 *     {"x":2048,"y":2048,"sw":1,"direction":"NE"}
 *   direction 取 8 方向之一：E/NE/N/NW/W/SW/S/SE (居中为空串)
 */

#include <Arduino.h>

#define PIN_X     1    // VRx
#define PIN_Y     2    // VRy
#define PIN_SW    3    // SW

static const char* DIRS[8] = {"E", "NE", "N", "NW", "W", "SW", "S", "SE"};
static const int CENTER = 2048;
static const int DEAD   = 330;   // 中心死区

long filterX = CENTER;   // 简单平滑缓存
long filterY = CENTER;

// 从 X/Y 得到 8 方向字符串（居中则空）
String directionFromAxes(int x, int y) {
  int dx = x - CENTER;
  int dy = y - CENTER;
  if (sqrt((long)dx * dx + (long)dy * dy) < DEAD) return "";
  double angle = atan2(-(double)dy, (double)dx) * 180.0 / PI;
  if (angle < 0) angle += 360.0;
  int idx = (int)(round(angle / 45.0)) % 8;
  return DIRS[idx];
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SW, INPUT_PULLUP);
  analogReadResolution(12);     // 0~4095
  analogSetPinAttenuation(PIN_X, ADC_11db);
  analogSetPinAttenuation(PIN_Y, ADC_11db);

  Serial.println("\n=== ESP32-S3 Joystick Test (HW504) ===");
  Serial.println("VRx=GPIO1 VRy=GPIO2 SW=GPIO3");
  delay(300);
}

void loop() {
  // 简单滑动平均，抑制噪声
  filterX = (filterX * 7 + (long)analogRead(PIN_X)) / 8;
  filterY = (filterY * 7 + (long)analogRead(PIN_Y)) / 8;

  int x = (int)filterX;
  int y = (int)filterY;
  int sw = (digitalRead(PIN_SW) == LOW) ? 1 : 0;   // 按下=1
  String dir = directionFromAxes(x, y);

  // 输出 JSON 行供前端解析
  Serial.print("{\"x\":");
  Serial.print(x);
  Serial.print(",\"y\":");
  Serial.print(y);
  Serial.print(",\"sw\":");
  Serial.print(sw);
  if (dir.length()) {
    Serial.print(",\"direction\":\"");
    Serial.print(dir);
    Serial.print("\"");
  }
  Serial.println("}");

  delay(30);   // ~33Hz 更新
}
# 밀당 API 연동 및 배포 가이드

프론트엔드는 `api 명세서.md`의 **§1 화면 API 매핑**을 기준으로 연결되어 있습니다. Base URL은 기본적으로 `https://api.mildang.app/v1`이며, 화면은 응답의 원문 필드를 사용하고 예산·AI 결과를 다시 계산하지 않습니다.

## 화면별 연결

| 화면 | 호출 |
| --- | --- |
| Onboarding1 | `POST /auth/social` |
| Onboarding2 | `GET /plans`, `POST /challenges` |
| Onboarding2_1·2_2 | `POST /payments/checkout` → `POST /challenges` |
| Onboarding3·Budget | `POST /challenges/{id}/budget/estimate` → `POST /challenges/{id}/budget` |
| MainBoard | `GET /challenges/current` |
| 3a | `GET /items?kind=PROMISE`, `POST /items`, `POST /items/{id}/prepay` |
| 3b | `GET /items?kind=MEAL&status=PENDING,HAGGLED`, `GET /presets`, `POST /items`, `POST /items/{id}/record`, `DELETE /items/{id}` |
| 3c | `GET /analyses/recent`, `POST /analyses/text` |
| 4a·4b | `POST /scans`, `GET /scans/{id}`, `PATCH /scans/{id}/menus/{menuId}`, `POST /items` |
| 5 | `POST /haggles`, `POST /haggles/{id}/messages`, `POST /haggles/{id}/close`, `DELETE /haggles/{id}` |
| 6 | `GET /checkins/today`, `PUT /checkins/today` |
| 7 | `GET /challenges/{id}/report`, `POST /challenges/{id}/report/share-card` |
| 초대 | `GET /invites/{code}` API 함수 제공 |

공통 처리는 다음 파일에 모여 있습니다.

- `src/api/config.js`: 환경, Base URL, 타임아웃, 결제 provider
- `src/api/session.js`: access token 메모리 보관과 refresh token 보관
- `src/api/httpClient.js`: Bearer 헤더, JSON/FormData, 표준 오류, 204, 타임아웃, `TOKEN_EXPIRED` 1회 재시도
- `src/api/mildangApi.js`: 명세의 전체 공개 API 함수
- `src/api/itemView.js`: `effective.points`를 단일 표시값으로 사용하는 항목 뷰 모델

## 공모전 제출 빌드

```powershell
npm.cmd run build:demo
```

`.env.demo`의 설정을 사용합니다.

```dotenv
VITE_APP_ENV=demo
VITE_API_BASE_URL=https://mildang-server-production.up.railway.app/v1
VITE_DEMO_ID_TOKEN=demo-judge-02
```

`VITE_DEMO_ID_TOKEN`은 `demo-judge-01`부터 `demo-judge-05`까지 바꿀 수 있습니다. 기본값 `demo-judge-02`는 1주 4일차 핵심 루프용입니다. 로그인·결제 응답에서 `mocked: true`가 오면 우상단 데모 도구가 열리고, 아래 API를 직접 실행할 수 있습니다.

- `POST /demo/seed`: 7개 시나리오 적용
- `POST /demo/reset`: 현재 계정 초기화
- `POST /demo/advance-day`: 하루 진행
- `POST /demo/run-batch`: `PREPAID_CONVERT`, `ITEM_EXPIRY` 즉시 실행

중요: 이 저장소는 프론트엔드입니다. 데모 빌드도 `/analyses`, `/haggles`, `/report`를 로컬 하드코딩하지 않고 `VITE_API_BASE_URL`의 백엔드로 보냅니다. 따라서 공모전 백엔드는 `APP_ENV=demo`로 실행하되, 명세 §14대로 **로그인·결제·푸시·공유 렌더·배치 트리거·실측 로그만 목 처리**하고 AI 분석·흥정·리포트 집계는 실제 구현을 사용해야 합니다.

## 운영 빌드

```powershell
npm.cmd run build:prod
```

`.env.production`은 다음 값을 사용합니다.

```dotenv
VITE_APP_ENV=prod
VITE_API_BASE_URL=https://api.mildang.app/v1
VITE_PAYMENT_PROVIDER=IAP_GOOGLE
```

iOS는 `VITE_PAYMENT_PROVIDER=IAP_APPLE`로 빌드합니다. 운영 앱 셸은 로그인 전에 `window.MildangAuth.signInWithKakao()`, 결제 전에 `window.MildangPayments.checkout(period)`, 푸시 사용 시 `window.MildangNotifications.getPushToken()`을 주입해야 합니다. 각각 실제 ID Token, 영수증, 기기 토큰을 반환해야 합니다.

## 실제 런칭 시 변경할 코드

프론트엔드 변경은 아래 네 곳입니다.

1. `.env.production`의 API URL과 `VITE_PAYMENT_PROVIDER`를 실제 플랫폼 값으로 확정합니다.
2. `src/App.jsx`의 `window.MildangAuth`, `window.MildangPayments`, `window.MildangNotifications` 브리지를 실제 카카오 SDK·스토어 SDK·FCM/APNs 래퍼로 연결합니다. 화면/API 호출 코드는 바꾸지 않습니다.
3. `src/api/session.js`의 브라우저 `localStorage` refresh token 저장을 네이티브 Keychain/Keystore 같은 Secure Storage 어댑터로 교체합니다. 웹 서비스라면 백엔드와 계약을 조정해 `HttpOnly; Secure; SameSite` 쿠키를 권장합니다. access token은 현재처럼 메모리에만 둡니다.
4. 데모 공유 카드 대신 서버 `share/CardRenderer`가 반환한 CDN `imageUrl`을 공유 대상으로 사용합니다.

백엔드는 명세 §14.7의 여덟 지점을 변경합니다.

1. `auth/KakaoVerifier`: 문자열 통과 → Kakao JWKS의 서명·`aud`·`exp` 검증
2. `payment/ReceiptVerifier`: 항상 `PAID` → App Store/Play 영수증 검증
3. `payment/Provider`: `MOCK` 제거
4. `notification/Sender`: no-op → FCM/APNs 발송
5. `share/CardRenderer`: 클라이언트 캡처 → 서버 렌더·CDN 업로드
6. `batch/PrepaidConverter`: 수동 호출 → KST 05:00 스케줄러
7. `analytics/MeasuredPriceCollector`: 로그 → 분석 파이프라인
8. 서버 라우터: `/demo/*` 제거

운영 전에는 `mocked` 미노출, `/demo/*` 404, `MOCK` 400, 위조 토큰 401, 유료 기간의 결제 누락 402, 무료 체험 재사용 403을 통합 테스트로 고정합니다.

## 구현상 보장하는 명세 규칙

- 화면은 항목 점수로 `effective.points`만 사용합니다.
- 잔액은 서버의 `budget.balance`, 게이지는 `gaugePercent`를 그대로 씁니다.
- 잔액은 `record`와 `prepay` 응답으로만 갱신하며, 두 동작 뒤 대시보드를 재호출하지 않습니다.
- 음수 잔액에서도 기록·흥정 버튼을 막지 않습니다.
- 흥정 종료는 항목만 갱신하고 예산을 바꾸지 않습니다.
- `ANALYSIS_FAILED`의 후보 3개를 칩으로 노출합니다.
- 프리셋은 3c를 거치지 않고 `presetId`로 바로 항목을 만듭니다.
- 스캔 업로드는 FormData를 사용하고 10MB를 사전 검증합니다.
- 만료 확인 항목은 메인 진입 시 확인 UI로 노출합니다.
- 체크인은 `BLOAT`, `SKIN`, `DROWSY` 세 값을 한 번에 저장합니다.

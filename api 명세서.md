# 밀당 API 명세서 v1.3

# 밀당 API 명세서 v1.3

> 대상: 프론트엔드 · 백엔드 · AI
기준 문서: `아이디어 초안 v2.md` (기능 정의) · `밀당_와이어프레임_v2.html` (화면 · 흐름)
이 문서는 **입출력 규격**만 다룹니다. 기능의 의도·설계 근거는 아이디어 초안을 보세요.
> 
> 
> **예산은 기간별 총액 하나입니다.** `W1` `W2` `W4` 모두 잔액은 `budget.balance` 하나, 기간 차이는 곱수(`×1` `×2` `×4`)뿐입니다.
> **AI 함수 계약은 15장에 모여 있습니다.** 본문(5·7·10장)은 공개 API만 다루고 계약은 15장을 참조합니다.
> 

---

## 0. 공통 규격

### 0.1 기본

| 항목 | 값 |
| --- | --- |
| Base URL | `https://api.mildang.app/v1` |
| 프로토콜 | HTTPS only |
| 인코딩 | `UTF-8` |
| Content-Type | `application/json` (파일 업로드만 `multipart/form-data`) |
| 시각 | ISO 8601 UTC — `2026-08-10T13:24:11Z` |
| 날짜 | `YYYY-MM-DD` (사용자 로컬 기준, KST) |
| 타임존 | 서버 저장은 UTC, 일자 경계 판정은 `Asia/Seoul` |

### 0.2 인증

```
Authorization: Bearer <accessToken>
```

| 토큰 | 수명 | 저장 |
| --- | --- | --- |
| `accessToken` | 30분 | 메모리 |
| `refreshToken` | 60일 | Secure Storage |
- 인증 불필요: `POST /auth/social`, `POST /auth/refresh`, `GET /plans`
- 그 외 전 엔드포인트 필수

### 0.3 공통 응답 봉투

**성공** — 데이터를 그대로 반환합니다 (봉투 없음).

**실패**

```json
{
  "error": {
    "code": "BUDGET_ALREADY_SET",
    "message": "이미 예산이 확정된 챌린지입니다.",
    "field": "budget",
    "detail": { "challengeId": "chl_01H..." }
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `error.code` | string | ✓ | 화면 분기용 상수. 아래 표 참조 |
| `error.message` | string | ✓ | 사용자 노출 가능 한국어 문구 |
| `error.field` | string |  | 검증 실패한 요청 필드명 |
| `error.detail` | object |  | 디버깅용 부가 정보 |
- **demo 환경**에서는 목 처리된 응답의 최상위에 `"mocked": true`가 추가됩니다 (§14.2). `prod`에는 이 필드가 없습니다

### 0.4 에러 코드

| HTTP | code | 발생 지점 |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | 필드 타입·범위 위반 |
| 401 | `TOKEN_EXPIRED` | accessToken 만료 → refresh |
| 401 | `TOKEN_INVALID` | 위변조·폐기된 토큰 |
| 402 | `PAYMENT_REQUIRED` | 2·4주 챌린지를 결제 없이 시작 |
| 403 | `FREE_TRIAL_USED` | 1주 무료를 이미 소진 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CHALLENGE_IN_PROGRESS` | 진행 중 챌린지가 있는데 새로 시작 |
| 409 | `BUDGET_ALREADY_SET` | 예산이 확정된 챌린지에 재확정 |
| 409 | `CHALLENGE_NOT_COMPLETED` | 완주 전 리포트 요청 |
| 409 | `ITEM_ALREADY_RECORDED` | 기록된 항목을 수정·삭제하거나 다른 종착 상태로 전이 시도 (§6.9) |
| 409 | `HAGGLE_TURN_EXCEEDED` | 10턴 초과 메시지 전송 |
| 409 | `HAGGLE_SESSION_CLOSED` | 종료된 세션에 메시지 전송 |
| 402 | `PAYMENT_VERIFICATION_FAILED` | 영수증 검증 실패 (§4.1) |
| 409 | `PAYMENT_ALREADY_USED` | 이미 사용된 `paymentId` 재사용 (§4.1) |
| 409 | `ITEM_EXPIRED` | 만료된 항목으로 흥정 세션 시작 |
| 413 | `IMAGE_TOO_LARGE` | 업로드 10MB 초과 |
| 422 | `ANALYSIS_FAILED` | AI가 메뉴를 식별하지 못함 (후보 반환) |
| 429 | `RATE_LIMITED` | 아래 0.6 참조 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |
| 503 | `AI_UNAVAILABLE` | AI 게이트웨이 장애 |

### 0.5 공통 열거형

| 이름 | 값 | 설명 |
| --- | --- | --- |
| `Provider` | `KAKAO` | 소셜 로그인. **카카오 단일** |
| `Period` | `W1` `W2` `W4` | 챌린지 기간 (1·2·4주) |
| `Confidence` | `CERTAIN` `HIGH` `MEDIUM` | 추정 신뢰도. UI 표기 `확실`/`높음`/`보통` |
| `ItemStatus` | `PENDING` `HAGGLED` `EXPIRED` `RECORDED` `PREPAID` `CANCELED` | 항목 상태 (§11.2) |
| `ItemKind` | `MEAL` `PROMISE` | 식사(3b) / 약속 사전결재(3a) |
| `EntryPoint` | `PROMISE` `SCAN` `FREE` | 흥정 진입점 ①②③ |
| `Lever` | `AMOUNT` `COMPOSITION` | 흥정 레버. **조리법 레버는 제외** (부록 A #4) |
| `HaggleFrame` | `SAVE` `REDUCE_OVERFLOW` | 흥정 프레임. 잔액 양수/음수에 따라 전환 |
| `SourceType` | `TEXT` `IMAGE` `PRESET` | 항목 생성 경로 (3c / 4b / 자주 먹는 것) |
| `ConditionKey` | `BLOAT` `SKIN` `DROWSY` | 체크인 항목 (더부룩함·피부·낮 졸림) |
| `ConditionValue` | `GOOD` `MID` `BAD` | 좋음·보통·나쁨 |
| `Weekday` | `MON`…`SUN` | 요일 |
| `ChallengeStatus` | `ONBOARDING` `ACTIVE` `COMPLETED` `ABANDONED` | 챌린지 상태 |
| `OptionKey` | `HARD` `AS_IS` `EASY` | 난이도 옵션. **전 기간 공통** (§3.3) |
| `HaggleStatus` | `OPEN` `CLOSED` `ABANDONED` | 흥정 세션 상태 (§7.1) |
| `PaceState` | `AHEAD` `ON_TRACK` `BEHIND` | 페이스 상태 (§3.5) |
| `TipBasis` | `OVERSPEND_PATTERN` `RECENT_WIN` `PACE_AHEAD` `PACE_BEHIND` `CHECKIN_CORRELATION` `GENERIC` | 팁 근거 (§3.5 · §15.5) |
| `StatKey` | `TOTAL_SPENT` `VS_BUDGET` `PEAK_SLOT` | 리포트 지표 (§9.1) |
| `PayProvider` | `IAP_APPLE` `IAP_GOOGLE` `MOCK` | 결제 수단. `MOCK`은 demo 전용 (§4.1 · §14.4) |
| `Cuisine` | `KOREAN` `KOREAN_BUNSIK` `CHINESE` `JAPANESE` `WESTERN` `CAFE` `ETC` | 스캔 업종 판정 (§15.3.2) |
| `PresetSource` | `DEFAULT` `HISTORY` | 프리셋 출처 (§6.7) |

### 0.6 Rate limit

| 그룹 | 제한 | 초과 시 |
| --- | --- | --- |
| AI 이미지 분석 (`POST /scans`) | 20 req / 시간 / 사용자 | 429 `RATE_LIMITED` |
| AI 텍스트 추정 (`POST /analyses/text`) | 60 req / 시간 / 사용자 | 429 |
| 흥정 세션 (`POST /haggles`) | 30 세션 / 일 / 사용자 | 429 |
| 그 외 | 600 req / 분 / 사용자 | 429 |

> **10턴 제한은 rate limit이 아닙니다.** 세션당 턴 수는 비즈니스 규칙이라 429가 아니라 409 `HAGGLE_TURN_EXCEEDED`로 반환합니다 (§7.2).
> 

응답 헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### 0.7 ID 규칙

`{prefix}_{ULID}` — 예: `chl_01HZX3...`

| prefix | 리소스 |
| --- | --- |
| `usr` | 사용자 |
| `chl` | 챌린지 |
| `itm` | 항목 |
| `anl` | 분석 결과 |
| `hgl` | 흥정 세션 |
| `chk` | 체크인 |
| `scn` | 스캔 |
| `mnu` | 스캔 내 메뉴 행 (§5.3) — **스캔 범위에서만 유일**, 전역 ULID 아님 |
| `pst` | 자주 먹는 것 프리셋 (§6.7) — 메뉴명 기반 고정 키 (`pst_ramen`) |
| `tip` | 대시보드 팁 (§3.5) |
| `pay` | 결제 |

### 0.8 일자 경계

> **부록 A #1 결정.** 모든 “하루” 판정은 아래 경계를 씁니다.
> 

| 항목 | 기준 |
| --- | --- |
| 일자 경계 | **매일 05:00 KST** (자정 아님) |
| 적용 대상 | 항목 만료(§6.8) · **선차감 전환**(§6.5) · `dayIndex` 증가 · 체크인 `date` · 리포트 집계 |
| 미적용 | 결제·토큰 만료 등 시스템 시각은 실제 UTC 사용 |

예) `2026-08-11 03:00 KST`에 생성한 항목의 논리적 날짜는 `2026-08-10`입니다.

### 0.9 포인트 단위

- **모든 밀가루 값은 정수 포인트.** 소수 금지
- 범위: `0 ~ 999`
- 오차범위 `pm`은 정수, `0`이면 오차 없음(= 신뢰도 `CERTAIN`)
- 잔액은 **음수 허용** (초과 상태). UI는 `−18 초과`로 표기

### 0.10 예산 산술 (`budget` 객체)

> **모든 `budget` 객체는 이 항등식을 만족합니다.** 응답을 만들 때 검증하세요.
> 

```
balance = total − spent − prepaid
```

| 필드 | 정의 | 집계 대상 |
| --- | --- | --- |
| `total` | 확정 예산 (§3.4) | — |
| `spent` | **실제 기록분** | `status = RECORDED` 항목의 `effective.points` 합 |
| `prepaid` | **예약분(선차감)** | `status = PREPAID` 항목의 `effective.points` 합 |
| `balance` | 남은 예산. **음수 허용** | 위 항등식 |
| `gaugePercent` | `round(balance / total × 100)`, 음수는 `0`, 상한 `100` | — |

**기간별 `total` 산식**

| 기간 | 일수 | `budget.total` | 산식 | 주간 페이스 |
| --- | --- | --- | --- | --- |
| `W1` | 7 | **85** | `options[key].budget × 1` | 85 |
| `W2` | 14 | **170** | `options[key].budget × 2` | 85 |
| `W4` | 28 | **340** | `options[key].budget × 4` | 85 |
- **`options[].budget`은 주간 값입니다.** 기간 총액이 아닙니다
- `W1`·`W2`는 주간 페이스가 같고 기간만 다릅니다. `W2`가 `85`면 14일에 85가 되어 `W1`의 절반 페이스가 되므로 **`×2`가 맞습니다**
- **산식이 기간별로 다르지 않습니다.** 곱수(`×1` `×2` `×4`)만 바뀌고 컷률·옵션·주간 페이스는 3개 기간이 동일합니다
- 위 표의 값은 모두 **`AS_IS`(컷률 15%) 기준**입니다. `HARD`면 `W4`가 300, `EASY`면 380 (§3.3)
- **`spent`와 `prepaid`는 겹치지 않습니다.** 항목 하나는 둘 중 한쪽에만 계산됩니다
- `PREPAID` → `RECORDED` 전환 시 금액이 `prepaid`에서 `spent`로 **이동**할 뿐 `balance`는 변하지 않습니다
- `PENDING` · `HAGGLED` · `EXPIRED` 항목은 **어느 쪽에도 포함되지 않습니다** (아직 미확정). 이 값들의 합은 `GET /items`의 `summary.totalPoints`로 따로 제공합니다

> **와이어프레임과의 차이.** `밀당_와이어프레임_v2.html` 화면 3은 `잔액 52 / 85`와 `선차감 70`을 함께 표시하는데, `85 − 70 = 15 < 52`라 위 항등식을 만족하지 않습니다. **와이어프레임은 레이아웃 참고용이고 수치는 이 명세서를 따릅니다.**
> 

### 0.11 잔액의 단일 기준 · 초과(`overflow`) ★

> **잔액은 `budget.balance` 하나뿐입니다.** 기간(`W1`·`W2`·`W4`)에 따라 달라지지 않고, 모든 화면·모든 계산이 같은 값을 씁니다.
> 

```
balance = budget.balance   // 전 기간 공통. 별도의 구간 잔액은 없습니다
budget  = budget.total     // 전 기간 공통 (기간 총액)
```

**적용 지점 — 전부 `budget.balance` 기준입니다**

| 위치 | 대상 |
| --- | --- |
| §3.5 | `pace.expectedBalance` · `pace.diff` |
| §5.3 | 추천 메뉴 선정 (`budget.balance ÷ 남은 끼수`) |
| §6.1 | `effective.balanceAfter` · `effective.balanceIfOriginal` |
| §6.2 | `summary.balanceAfterAll` |
| §6.4 · §6.5 | `overflow` 판정 |
| §7.1 | 흥정 헤더 `balance` |
| §7.2 | `simulation.*.balanceAfter` · `overflow` |
| §15.4.1 | AI input `budget.balance` |
| §7.6 | `frame`(`SAVE`/`REDUCE_OVERFLOW`) 판정 |
| §9.1 | 리포트 `stats` 분모 |

**초과 (`overflow`)** — `budget.balance`가 음수가 될 때만 실립니다. 층위는 하나입니다.

```json
"overflow": {
  "balance": -20,
  "originalWouldBe": -75,
  "reducedBy": 55,
  "note": "−20 초과입니다. 흥정으로 55만큼 덜 깊어졌어요."
}
```

| 필드 | 설명 |
| --- | --- |
| `balance` | `budget.balance` (음수) |
| `originalWouldBe` | `original.points` 그대로 기록했을 때의 잔액 |
| `reducedBy` | `originalWouldBe`와 실제 잔액의 차. 흥정 안 했으면 `0` |
| `note` | 사용자 노출 문구. **판정·질책 금지** |
- **초과여도 기록은 항상 허용됩니다** (부록 A #2). 잔액 부족을 이유로 거절하지 않습니다
- 예산 상한이 기간 전체 하나뿐이라 **초과는 남은 기간 내내 음수로 남습니다.** 중간 리셋이 없습니다

---

## 1. 화면 ↔︎ API 매핑

| 화면 | 진입 시 호출 | 사용자 액션 시 호출 |
| --- | --- | --- |
| **Onboarding1** 로그인 | — | `POST /auth/social` |
| **Onboarding2** 온보딩 기간 선택 | `GET /plans` | `POST /challenges` |
| **Onboarding2_1,Onboarding2_2** 결제 (`W2`·`W4`) | — | `POST /payments/checkout` → `POST /challenges` |
| **Onboarding3, Budget** 4문항 + 예산 제시 | — | `POST /challenges/{id}/budget/estimate` → `POST /challenges/{id}/budget` |
| **MainBoard** 메인 대시보드 | `GET /challenges/current` | — |
| **기록 보기** 날짜·식사 내역 | `GET /items?kind=MEAL&status=RECORDED&limit=50` | — |
| **3a** 약속 사전 결재 | `GET /items?kind=PROMISE` | `POST /items` · `POST /items/{id}/prepay` |
| **3b** 식사하기 | `GET /items?kind=MEAL&status=PENDING,HAGGLED` `GET /presets` | `POST /items` · `POST /items/{id}/record` · `DELETE /items/{id}` |
| **3c** 미니 입력창 | `GET /analyses/recent` | `POST /analyses/text` |
| **4a** 스캔 카메라 | — | `POST /scans` (이미지 업로드) |
| **4b** 스캔 결과 | `GET /scans/{id}` | `PATCH /scans/{id}/menus/{menuId}` · `POST /items` |
| **5** 밀당 대화 | `POST /haggles` | `POST /haggles/{id}/messages` · `POST /haggles/{id}/close` · `DELETE /haggles/{id}` |
| **6** 컨디션 체크인 | `GET /checkins/today` | `PUT /checkins/today` |
| **7** 완주 리포트 | `GET /challenges/{id}/report` | `POST /challenges/{id}/report/share-card` |
| **7+** 스토리 공유 카드 | (share-card 응답의 imageUrl) | — |
| **초대 링크 진입** | `GET /invites/{code}` | `POST /auth/social` → 화면 1 |
- `POST /auth/refresh`는 화면과 무관합니다. 401 `TOKEN_EXPIRED` 발생 시 전역 인터셉터에서 호출합니다 (§0.2)

---

## 2. 인증

### 2.1 `POST /auth/social`

소셜 로그인 — **카카오 단일**. 최초 호출 시 회원 자동 생성. demo 환경 동작은 §14.3.

**Request**

```json
{
  "provider": "KAKAO",
  "idToken": "eyJhbGciOi...",
  "deviceId": "8f3c1a20-...",
  "pushToken": "fcm:dR9x..."
}
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `provider` | enum | ✓ | **`KAKAO`** (§0.5 `Provider`) |
| `idToken` | string | ✓ | OIDC ID Token |
| `deviceId` | string(uuid) | ✓ | 기기 고유값 |
| `pushToken` | string |  | FCM/APNs 토큰. 없으면 알림 미발송 |

**Response 200**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "rt_...",
  "expiresIn": 1800,
  "user": {
    "id": "usr_01HZX...",
    "nickname": "재창",
    "isNew": true,
    "freeTrialUsed": false
  }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `expiresIn` | int | accessToken 잔여 초 |
| `user.isNew` | boolean | `true`면 온보딩(화면 1)으로 |
| `user.freeTrialUsed` | boolean | `true`면 화면 1에서 1주 카드가 유료 안내로 전환 |

**에러** — 401 `TOKEN_INVALID`

### 2.2 `POST /auth/refresh`

**Request** `{ "refreshToken": "rt_..." }`**Response 200** — 2.1과 동일 구조 (`user` 포함)
**에러** — 401 `TOKEN_INVALID` → 재로그인 유도

---

## 3. 챌린지 · 예산

### 3.1 `GET /plans`

화면 1의 기간 카드 3장. **인증 불필요**(로그인 후 호출 시 `freeTrialUsed` 반영).

**Response 200**

```json
{
  "plans": [
    {
      "period": "W1",
      "title": "맛보기 한 판",
      "subtitle": "최초 1회 무료 · 처음이라면 추천",
      "priceKrw": 0,
      "recommended": true,
      "available": true,
      "unavailableReason": null
    },
    {
      "period": "W2",
      "title": "제대로 한 판",
      "subtitle": "리포트가 뚜렷해지는 최소 기간",
      "priceKrw": 2000,
      "recommended": false,
      "available": true,
      "unavailableReason": null
    },
    {
      "period": "W4",
      "title": "장기전",
      "subtitle": "28일 한 판 · 리포트가 가장 뚜렷해요",
      "priceKrw": 3500,
      "recommended": false,
      "available": true,
      "unavailableReason": null
    }
  ],
  "notice": "결제는 프리미엄이 아니라, 진짜 할 건지 확인하는 문턱이에요."
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `priceKrw` | int | 원. `0`이면 무료 |
| `available` | boolean | `false`면 카드 비활성 |
| `unavailableReason` | string|null | `"무료 체험을 이미 쓰셨어요"` 등 |

### 3.2 `POST /challenges`

챌린지 생성. 상태는 `ONBOARDING`으로 시작하고, 예산 확정(3.4) 시 `ACTIVE`가 됩니다.

**Request**

```json
{ "period": "W1", "paymentId": null }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `period` | enum | ✓ | `W1` `W2` `W4` |
| `paymentId` | string|null | 조건부 | `W2` `W4`는 필수. `W1`은 `null` |

**Response 201**

```json
{
  "id": "chl_01HZX...",
  "period": "W1",
  "status": "ONBOARDING",
  "totalDays": 7,
  "needsSurvey": true,
  "startedAt": null
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `needsSurvey` | boolean | 첫 챌린지면 `true` → 화면 2의 4문항 노출. `false`면 직전 응답 재사용 |
| `startedAt` | string|null | 예산 확정 전에는 `null` |

**에러** — 402 `PAYMENT_REQUIRED` · 403 `FREE_TRIAL_USED` · 409 `CHALLENGE_IN_PROGRESS`

### 3.3 `POST /challenges/{id}/budget/estimate`

4문항 → 예산 제안. **저장하지 않습니다** (미리보기).

**Request**

```json
{
  "survey": { "noodle": "2-3", "bread": "0-1", "snack": "4+" }
}
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `survey.noodle` | enum | ✓ | `0-1` `2-3` `4+` (주당 횟수) |
| `survey.bread` | enum | ✓ | 동일 |
| `survey.snack` | enum | ✓ | 동일 |

**Response 200**

```json
{
  "estimatedWeekly": 100,
  "recommended": 85,
  "cutRatePercent": 15,
  "rationale": "평소 주 100 정도로 추정, 여기서 15%만 줄인 값이에요.",
  "anchors": [
    { "label": "라면 한 번", "points": 80 },
    { "label": "김밥 한 줄", "points": 20 },
    { "label": "삼겹살", "points": 0 }
  ],
  "options": [
    { "key": "HARD",   "label": "더 빡세게", "budget": 75, "totalBudget": 75, "note": "빡세게 가고 싶으면 75까지 내려드릴 수 있어요." },
    { "key": "AS_IS",  "label": "이대로 85", "budget": 85, "totalBudget": 85, "note": null },
    { "key": "EASY",   "label": "여유있게",  "budget": 95, "totalBudget": 95, "note": null }
  ],
  "totalBudget": 85
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `estimatedWeekly` | int | 설문 기반 평소 주간 소비 추정치 |
| `recommended` | int | **전 기간 공통.** 기본 선택값 = `AS_IS`의 `budget`(주간값) |
| `anchors` | array | 감을 잡게 하는 환산 예시. **3개 고정** |
| `options` | array | **전 기간 공통. 항상 3장**입니다 (`W4` 포함) |
| `options[].key` | enum | `HARD` `AS_IS` `EASY` |
| `options[].budget` | int | **주간 예산.** 기간 총액이 아닙니다 (§0.10) |
| `options[].totalBudget` | int | **기간 총액.** `W1`은 `budget × 1`, `W2`는 `× 2`, `W4`는 `× 4`. 화면 2에 크게 표시할 값 |
| `options[].note` | string|null | 카드 보조 문구. **`totalBudget` 기준으로 서버가 생성**합니다 — 카드가 총액을 보여주므로 주간값을 쓰지 않습니다 |
| `totalBudget` | int | **전 기간 공통.** 현재 선택(`recommended`) 기준 총액 — 확정 시 `budget.total`이 되는 값. **화면 2가 크게 쓰는 유일한 숫자** |
| `cutRatePercent` | int | **전 기간 공통.** `AS_IS` 기준 컷률 (`15`) |

**`W4` 응답 — `W1`·`W2`와 구조가 완전히 같습니다. 곱수만 `× 4`입니다**

```json
{
  "estimatedWeekly": 100,
  "recommended": 85,
  "cutRatePercent": 15,
  "rationale": "평소 주 100 정도로 추정, 여기서 15%만 줄인 값이에요. 4주면 총 340입니다.",
  "anchors": [
    { "label": "라면 한 번", "points": 80 },
    { "label": "김밥 한 줄", "points": 20 },
    { "label": "삼겹살", "points": 0 }
  ],
  "options": [
    { "key": "HARD",   "label": "더 빡세게", "budget": 75, "totalBudget": 300, "note": "빡세게 가고 싶으면 총 300까지 내려드릴 수 있어요." },
    { "key": "AS_IS",  "label": "이대로 85", "budget": 85, "totalBudget": 340, "note": null },
    { "key": "EASY",   "label": "여유있게",  "budget": 95, "totalBudget": 380, "note": null }
  ],
  "totalBudget": 340
}
```

`options[].totalBudget = options[].budget × 기간 주수` — `W1` `×1` · `W2` `×2` · `W4` `×4`

**난이도 옵션 — 전 기간 공통**

| 옵션 | 컷률 | 주간 예산 | `W1` `×1` | `W2` `×2` | `W4` `×4` |
| --- | --- | --- | --- | --- | --- |
| `HARD` 더 빡세게 | 25% | 75 | 75 | 150 | **300** |
| `AS_IS` 이대로 | 15% | 85 | 85 | 170 | **340** |
| `EASY` 여유있게 | 5% | 95 | 95 | 190 | **380** |
- 컷률은 `estimatedWeekly` 대비 **감축률**입니다. 세 옵션 모두 줄이는 방향이고, 늘리는 선택지는 없습니다

**`W4` 화면 2 표시 (FE 계약)**

> `W1`·`W2`와 **완전히 같은 화면**입니다 — 큰 숫자 하나 + 근거 + 옵션 카드 3장. 표도 커브도 예외도 없습니다.
> 

```
4주 챌린지
총 340 포인트                      ← totalBudget (크게)

28일 동안 쓸 전부예요 · 하루 12쯤이 페이스   ← rationale (한 줄, 작게)

[더 빡세게 300]  [이대로 340]  [여유있게 380]   ← options[].totalBudget (카드 3장)
```

**기간별 화면 2 표시** — 모두 `totalBudget`을 크게 씁니다. FE는 곱셈을 하지 않습니다.

| 기간 | 큰 숫자 | 보조 |
| --- | --- | --- |
| `W1` | `1주 예산 85` | 근거 + 앵커 3개 + 옵션 카드 3장 |
| `W2` | **`2주 예산 170`** | 근거 + 앵커 3개 + 옵션 카드 3장 (`주 85씩` 부기) |
| `W4` | **`총 340 포인트`** | 근거 + 앵커 3개 + 옵션 카드 3장 (`주 85씩` 부기) |
- **3개 기간의 레이아웃이 동일합니다.** 화면 2에 기간별 분기 렌더링이 없습니다
- 카드에 찍는 숫자는 **`options[].totalBudget`**입니다 (`budget` 아님). `W4`에서 75/85/95를 찍으면 총액과 어긋납니다
- `W2`·`W4`는 보조 문구에 **일일 페이스**(`totalBudget ÷ 총일수`)를 함께 적으세요. 총액만 크게 두면 앞 구간에 몰아 쓰기 쉽습니다

### 3.4 `POST /challenges/{id}/budget`

예산 확정 → 챌린지 시작(`ACTIVE`).

**Request**

```json
{
  "survey": { "noodle": "2-3", "bread": "0-1", "snack": "4+" },
  "optionKey": "AS_IS",
  "budget": 85
}
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `survey` | object | 조건부 | `needsSurvey=true`면 필수 |
| `optionKey` | enum | ✓ | **전 기간 필수** — `HARD` `AS_IS` `EASY` |
| `budget` | int | ✓ | **전 기간 필수** — `options[optionKey].budget`(**주간값**)과 정확히 일치 |

**검증 대상과 저장 대상은 다릅니다**

| 기간 | 요청 `budget` (검증 대상) | 저장 `budget.total` |
| --- | --- | --- |
| `W1` | `options[key].budget` = 85 (주간) | `85 × 1` = **85** |
| `W2` | `options[key].budget` = 85 (주간) | `85 × 2` = **170** |
| `W4` | `options[key].budget` = 85 (주간) | `85 × 4` = **340** |
- 요청의 `budget`은 **주간 값**이고, 저장되는 `budget.total`은 **기간 총액**입니다 (§0.10)
- **기간별 예외가 없습니다.** 서버는 `period`에 따라 곱수(`1` `2` `4`)만 바꿉니다

> **직접 입력(`CUSTOM`)은 없습니다.** 화면 2에 입력 수단이 없어 API에서도 받지 않습니다 (부록 B #3).
> 

**Response 200**

```json
{
  "id": "chl_01HZX...",
  "status": "ACTIVE",
  "period": "W1",
  "budget": 85,
  "balance": 85,
  "startedAt": "2026-08-10T15:00:00Z",
  "endsAt": "2026-08-17T14:59:59Z",
  "startTip": {
    "text": "주 3회 면류라고 하셨네요. 한 번을 0으로 만들기보다, 가장 만만한 한 번을 정해두는 게 완주율이 높습니다."
  }
}
```

**Response 200 — `W2`**

```json
{
  "id": "chl_01HZZ...",
  "status": "ACTIVE",
  "period": "W2",
  "budget": 170,
  "balance": 170,
  "startedAt": "2026-08-10T15:00:00Z",
  "endsAt": "2026-08-24T14:59:59Z",
  "startTip": { "text": "2주는 리포트가 뚜렷해지는 최소 기간이에요. 14일에 170, 하루 12쯤이 페이스입니다." }
}
```

> 요청은 `budget: 85`(주간)였지만 **저장·응답은 `170`(기간 총액)**입니다. 잔액·페이스 모두 14일 전체 기준입니다 (§0.11).
> 

**Response 200 — `W4`**

```json
{
  "id": "chl_01HZY...",
  "status": "ACTIVE",
  "period": "W4",
  "budget": 340,
  "balance": 340,
  "startedAt": "2026-08-10T15:00:00Z",
  "endsAt": "2026-09-07T14:59:59Z",
  "startTip": { "text": "4주는 총 340입니다. 28일이니 하루 12쯤이 페이스예요 — 앞 주에 몰아 쓰면 남은 기간이 빡빡해집니다." }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `budget` | int | **기간 총액** (`W4`·`AS_IS` = 340). 주간값이 아닙니다 |
- **응답 구조는 3개 기간이 완전히 동일합니다.** 기간별로만 존재하는 필드가 없습니다
- FE는 이 응답만으로 **화면 2의 총액 표시**와 **화면 3 첫 진입**을 모두 그릴 수 있습니다 (§3.3 · §3.5)

**에러** — 400 `VALIDATION_FAILED`(`budget`이 `options[optionKey].budget`과 불일치) · 409 `BUDGET_ALREADY_SET`

### 3.5 `GET /challenges/current`

**화면 3 대시보드 전체를 한 번에** 반환합니다. 별도 호출 없이 이 응답만으로 렌더 가능해야 합니다.

**Response 200**

```json
{
  "challenge": {
    "id": "chl_01HZX...",
    "period": "W1",
    "status": "ACTIVE",
    "dayIndex": 4,
    "totalDays": 7,
    "label": "1주 챌린지 · 4일차"
  },
  "budget": {
    "total": 85,
    "balance": 52,
    "spent": 13,
    "prepaid": 20,
    "gaugePercent": 61
  },
  "pace": {
    "expectedBalance": 36,
    "diff": 16,
    "note": "페이스보다 +16 앞서 있어요",
    "state": "AHEAD"
  },
  "tip": {
    "id": "tip_01HZX...",
    "text": "어제 제육볶음 15를 8로 깎으셨죠. 그 페이스면 남은 3일은 넉넉합니다.",
    "basis": "RECENT_WIN"
  },
  "prepaidItems": [
    {
      "id": "itm_01HZY...",
      "name": "수요일 점심 약속",
      "points": 20,
      "weekday": "WED",
      "note": "사전 결재 · 예산에서 미리 빼뒀어요"
    }
  ],
  "expiredConfirm": [],
  "checkin": { "doneToday": false, "dueAt": "2026-08-10T13:00:00Z" }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `budget.*` | — | **항등식 `balance = total − spent − prepaid` 성립** (§0.10). FE는 `balance`를 그대로 쓰고 다시 빼지 말 것 |
| `budget.gaugePercent` | int | `0~100`. `round(balance/total×100)`, 음수는 `0` |
| `prepaidItems[]` | array | `status = PREPAID` 항목. 합계가 `budget.prepaid`와 일치해야 함 |
| `pace.state` | enum | `AHEAD` `ON_TRACK` `BEHIND` |
| `pace.note` | string | 사용자 노출 문구. **서버가 생성하고 FE는 그대로 표시** |
| `tip.basis` | enum | `OVERSPEND_PATTERN` `RECENT_WIN` `PACE_AHEAD` `PACE_BEHIND` `CHECKIN_CORRELATION` `GENERIC` — §15.5와 동일 |
| `tip` | object|null | AI 생성 실패 시 `null`. 화면에서 영역을 숨깁니다 (§15.8.2) |
| `checkin.doneToday` | boolean | `false`면 하단 버튼에 뱃지 노출 |
| `checkin.dueAt` | string | 오늘 체크인 리마인더 시각 — **당일 22:00 KST 고정**. 이 시각이 지나도 체크인은 계속 가능합니다 (§8.2) |
| `expiredConfirm` | array | 만료 확인 대기 항목. **구조·처리는 §6.8.** 빈 배열이면 시트 미노출 |

**`pace` 계산 기준 — 전 기간 동일**

| 기간 | 분모 | `expectedBalance` |
| --- | --- | --- |
| `W1` `W2` `W4` | 챌린지 전체 일수 | `round(budget.total × (남은 일수 / 전체 일수))` |
- `diff` = `budget.balance − expectedBalance`
- `state` — `diff > 0`이면 `AHEAD`, `0`이면 `ON_TRACK`, 음수면 `BEHIND`
- **기간별 분기가 없습니다.** `W4`도 28일 전체로 잽니다

> **FE는 `state = BEHIND`일 때 `pace.note`를 눈에 띄게 표시하세요.** 예산 상한이 기간 전체 하나뿐이라, 앞 구간 과소비를 알려주는 장치가 `pace`밖에 없습니다.
> 

**화면별 표시 (FE 계약)** — 3개 기간이 모두 같습니다.

| 화면 | 표시 |
| --- | --- |
| **2** 예산 제시 | `총 {totalBudget} 포인트` (§3.3) |
| **3** 대시보드 | `budget.balance / budget.total` + `gaugePercent` + `pace` |
| **7** 리포트 | `budget` 전체 기준 (§9.1) |

```
4주 챌린지 · 12일차

    남은 예산  280 / 340              ← budget.balance / budget.total
    ▓▓▓▓▓▓▓▓░░                        ← budget.gaugePercent
    페이스보다 +86 앞서 있어요          ← pace.note
```

> 게이지는 **`budget.gaugePercent`를 그대로 씁니다.** 서버가 계산해 내려주므로 FE는 산술을 하지 않습니다 (§15.1 — 계산은 백엔드).
> 

**에러** — 404 `NOT_FOUND` (진행 중 챌린지 없음 → 화면 1로)

---

## 4. 결제

### 4.1 `POST /payments/checkout`

**Request**

```json
{ "period": "W2", "provider": "IAP_APPLE", "receipt": "MIIT..." }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `provider` | enum | ✓ | `IAP_APPLE` `IAP_GOOGLE` · `MOCK`(demo 전용, §14.4) |
| `receipt` | string | ✓ | 스토어 영수증 |

**Response 201**

```json
{ "id": "pay_01HZX...", "period": "W2", "amountKrw": 2000, "status": "PAID", "paidAt": "2026-08-10T14:58:00Z" }
```

| 필드 | 설명 |
| --- | --- |
| `status` | **성공 응답은 항상 `PAID`**입니다. 검증 실패는 402 에러로 반환합니다 |

**검증 실패 · 재사용**

| 상황 | 응답 |
| --- | --- |
| 영수증 서명·상품ID 불일치, 스토어 거절 | 402 `PAYMENT_VERIFICATION_FAILED` |
| 이미 챌린지에 사용된 `paymentId`를 재사용 | 409 `PAYMENT_ALREADY_USED` |
| 같은 `receipt`로 재요청 (더블탭) | **200 멱등** — 기존 `pay_*`를 그대로 반환 |
- `paymentId`는 **챌린지 1개에만** 쓸 수 있습니다. `POST /challenges`가 소비 처리합니다
- 환불은 스토어 웹훅으로 처리하며 클라이언트 호출이 없습니다. 환불 시 진행 중 챌린지는 `ABANDONED`로 전환합니다

---

## 5. AI 분석 (메뉴 → 포인트)

> **AI 담당 핵심 구간.** 5.1은 텍스트 1건, 5.3은 이미지 다건. AI 담당 범위는 **§15.0**을 보세요.
> 

### 5.1 `POST /analyses/text` — 3c 미니 입력창

**Request**

```json
{
  "query": "라면",
  "context": { "challengeId": "chl_01HZX...", "kind": "MEAL" }
}
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `query` | string | ✓ | 1~40자. 예: `라면` `치킨 프라이드` `편의점 샌드위치` |
| `context.challengeId` | string | ✓ | 진행 중 챌린지 |
| `context.kind` | enum | ✓ | `MEAL`(3b) / `PROMISE`(3a) — 대사 톤이 달라짐 |

> **잔액·남은 끼수는 클라이언트가 보내지 않습니다.** 서버가 `challengeId`로 조회합니다 — 예산 계산의 단일 진실 원천은 서버입니다 (§15.1).
> 

**Response 200 — 성공**

```json
{
  "id": "anl_01HZX...",
  "resolved": true,
  "menu": {
    "name": "라면",
    "unit": "1봉지",
    "points": 80,
    "pm": 10,
    "confidence": "CERTAIN",
    "basis": "면 전체가 밀 — 봉지라면 1인분 기준"
  },
  "candidates": null,
  "expiresAt": "2026-08-10T14:30:00Z"
}
```

| 필드 | 타입 | 제약 |
| --- | --- | --- |
| `menu.name` | string | 정규화된 메뉴명 |
| `menu.unit` | string | **기준 수량.** 흥정의 출발점이 되므로 반드시 채울 것 (`1봉지` `1개` `1인분` `1마리`) |
| `menu.points` | int | `0~999` |
| `menu.pm` | int | 오차범위. `confidence=CERTAIN`이면 `0` 허용 |
| `menu.basis` | string | **1문장, 40자 이내.** 왜 이 점수인지 |
| `expiresAt` | string | 분석 캐시 만료. 지나면 항목 생성 시 재분석 |

**Response 422 — 식별 실패**

```json
{
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "잘 모르겠어요 — 비슷한 걸 골라주세요",
    "detail": {
      "candidates": [
        { "name": "칼국수", "points": 80, "pm": 0,  "confidence": "CERTAIN" },
        { "name": "수제비", "points": 75, "pm": 10, "confidence": "HIGH" },
        { "name": "우동",   "points": 70, "pm": 10, "confidence": "HIGH" }
      ]
    }
  }
}
```

- 후보는 **정확히 3개**. FE는 이를 칩으로 노출하고, 선택 시 `query`를 해당 이름으로 재요청

### 5.2 `GET /analyses/recent`

3c의 `최근` 칩.

**Response 200**

```json
{ "recent": [ { "name": "떡볶이" }, { "name": "샌드위치" }, { "name": "우동" } ] }
```

- 최대 3개, 최신순. 이력 없으면 빈 배열

### 5.3 `POST /scans` — 4a 메뉴판 촬영

**Request** — `multipart/form-data`

| 파트 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `image` | file | ✓ | JPEG/PNG/HEIC, **10MB 이하**, 장변 4096px 이하 |
| `challengeId` | string | ✓ | 잔액·남은 끼수는 **서버가 조회**합니다 (클라이언트 전달 ✕) |

**Response 201**

```json
{
  "id": "scn_01HZX...",
  "place": "김밥천국 성수점",
  "placeConfidence": "HIGH",
  "scannedAt": "2026-08-10T14:22:00Z",
  "menus": [
    { "id": "mnu_1", "name": "삼겹살",   "points": 0,  "pm": 0,  "confidence": "CERTAIN", "basis": "소금장만 사용 — 밀가루 없음",        "edited": false },
    { "id": "mnu_2", "name": "된장찌개", "points": 5,  "pm": 3,  "confidence": "HIGH",    "basis": "된장에 미량 — 시판 된장 기준",      "edited": false },
    { "id": "mnu_3", "name": "제육볶음", "points": 15, "pm": 5,  "confidence": "MEDIUM",  "basis": "시판 고추장 베이스로 추정",         "edited": false },
    { "id": "mnu_4", "name": "냉면",     "points": 40, "pm": 10, "confidence": "MEDIUM",  "basis": "면에 밀가루 혼합 — 비율은 가게마다", "edited": false },
    { "id": "mnu_5", "name": "칼국수",   "points": 80, "pm": 0,  "confidence": "CERTAIN", "basis": "면 전체가 밀 — 기준 앵커 메뉴",     "edited": false }
  ],
  "recommendation": {
    "menuId": "mnu_3",
    "points": 15,
    "comment": "\"냉면(40)을 고르면 내일 점심은 0짜리만 가능해요. 15면 남는 장사죠.\""
  }
}
```

| 필드 | 타입 | 제약 |
| --- | --- | --- |
| `menus` | array | **`points` 오름차순 정렬 필수** (화면이 “싼 순”) |
| `menus[].edited` | boolean | 사용자가 값을 고쳤는지 |
| `recommendation.menuId` | string | **`budget.balance` ÷ 남은 끼수** 이하 중 가장 비싼 메뉴 (§0.11) |
| `recommendation.comment` | string | 밀당이 대사. **비교 대상 메뉴를 반드시 1개 언급** |

> **위 예시의 전제** — `budget.balance = 52`, 남은 끼수 `3` → 상한 `52 ÷ 3 = 17`. 17 이하 중 가장 비싼 **제육볶음 15**가 추천됩니다. 상한을 넘는 **냉면 40**은 비교 대상으로만 언급합니다.
잔액·남은 끼수가 달라지면 추천도 달라집니다. **이 값들은 응답에 실리지 않고 서버가 조회합니다** (§5.3 Request).
> 

**제약** — `menus`는 최대 40개. 인식 0건이면 422 `ANALYSIS_FAILED`

**에러** — 413 `IMAGE_TOO_LARGE` · 422 `ANALYSIS_FAILED` · 503 `AI_UNAVAILABLE`

### 5.4 `GET /scans/{id}`

**Response 200** — 5.3과 동일 구조 (재진입·새로고침용)

### 5.5 `PATCH /scans/{id}/menus/{menuId}` — 가격 탭 수정

**Request** `{ "points": 25 }`

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `points` | int | ✓ | `0~999` |

**Response 200**

```json
{ "id": "mnu_3", "name": "제육볶음", "points": 25, "pm": 0, "confidence": "CERTAIN", "basis": "직접 입력한 값", "edited": true }
```

- 수정 시 `pm=0`, `confidence=CERTAIN`, `edited=true`로 고정
- 수정값은 **가게+메뉴 단위 실측 데이터**로 수집 (5.6)
- **이미 생성된 항목에는 소급되지 않습니다.** `POST /items`가 생성 시점의 값을 항목의 `original`로 복사하므로, 수정 후 **새로 만드는 항목부터** 반영됩니다
- 스캔 결과(`scn_*`)는 수정값으로 갱신되어 `GET /scans/{id}` 재조회 시 유지됩니다

### 5.6 (내부) 실측 수집

`PATCH`가 발생하면 백엔드는 `{ placeId, menuName, userPoints, aiPoints }`를 분석 파이프라인에 적재합니다. 클라이언트 호출 없음.

---

## 6. 항목 (3a · 3b 공용)

> 3a(약속)와 3b(식사)는 **같은 리소스**를 `kind`로 구분합니다.
> 

### 6.1 항목 객체

```json
{
  "id": "itm_01HZY...",
  "kind": "MEAL",
  "status": "HAGGLED",
  "source": { "type": "TEXT", "refId": "anl_01HZX..." },
  "original": { "name": "라면", "unit": "1봉지", "points": 80, "pm": 10, "confidence": "CERTAIN", "basis": "면 전체가 밀 — 봉지라면 1인분" },
  "adjusted": { "label": "반봉지 + 계란", "points": 40, "basis": "면 절반 + 계란 1", "haggleId": "hgl_01HZZ...", "turns": 4 },
  "effective": { "points": 40, "balanceAfter": 12, "balanceIfOriginal": -28 },
  "weekday": null,
  "logicalDate": "2026-08-10",
  "createdAt": "2026-08-10T14:25:00Z",
  "expiresAt": "2026-08-10T20:00:00Z",
  "recordedAt": null
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `status` | enum | `PENDING` → `HAGGLED` → `RECORDED`/`PREPAID`. 05:00 만료 시 `HAGGLED` → `EXPIRED`(§6.8). `CANCELED`는 삭제·폐기 |
| `source.type` | enum | `TEXT`(3c) `IMAGE`(4b) `PRESET`(자주 먹는 것) |
| `source.refId` | string | `anl_*` 또는 `scn_*`, PRESET이면 `null` |
| `original` | object | **불변.** 흥정해도 바뀌지 않음 (취소선 표시용) |
| `adjusted` | object|null | 흥정 결과. `status=PENDING`이면 `null` |
| `effective.points` | int | `adjusted?.points ?? original.points` — **FE는 이 값만 쓸 것** |
| `effective.balanceAfter` | int | 기록 시 **`budget.balance`**. 음수 가능 (§0.11) |
| `effective.balanceIfOriginal` | int | “원래대로였다면” 비교값 |
| `weekday` | enum|null | `kind=PROMISE`만 |
| `logicalDate` | string | §0.8 경계 기준 날짜. 기록 시 이 날짜로 집계 |
| `expiresAt` | string|null | 만료 시각 = `logicalDate` **다음날 05:00 KST** (= UTC 기준 `logicalDate` 당일 20:00Z). `kind=PROMISE`는 `null` |

### 6.2 `GET /items`

**Query**

| 파라미터 | 타입 | 기본 | 설명 |
| --- | --- | --- | --- |
| `kind` | enum | (전체) | `MEAL` `PROMISE` |
| `status` | csv | `PENDING,HAGGLED` | 예: `PENDING,HAGGLED` |
| `limit` | int | 20 | 최대 50 |

**Response 200**

```json
{
  "items": [ /* 6.1 객체 배열, createdAt 내림차순 */ ],
  "summary": { "count": 2, "totalPoints": 60, "balanceAfterAll": -8 }
}
```

| 필드 | 설명 |
| --- | --- |
| `summary.totalPoints` | 미기록 항목의 `effective.points` 합 |
| `summary.balanceAfterAll` | 전부 기록했을 때 **`budget.balance`** (§0.11). **3b 하단 합계 행**에 표시 (§15.7.3) |
| `summary` | **`status` 쿼리와 무관하게** 미기록 항목(`PENDING` `HAGGLED` `EXPIRED`) 전체를 집계합니다 — `items`가 필터돼도 `summary`는 고정입니다. `budget.spent`·`prepaid`와 겹치지 않습니다 (§0.10) |

### 6.3 `POST /items` — 항목 생성

**Request (A) 분석 결과로**

```json
{ "kind": "MEAL", "analysisId": "anl_01HZX..." }
```

**Request (B) 스캔 메뉴로**

```json
{ "kind": "MEAL", "scanId": "scn_01HZX...", "menuId": "mnu_3" }
```

**Request (C) 자주 먹는 것 프리셋으로**

```json
{ "kind": "MEAL", "presetId": "pst_ramen" }
```

**Request (D) 약속 (3a)**

```json
{ "kind": "PROMISE", "analysisId": "anl_01HZW...", "weekday": "FRI" }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `kind` | enum | ✓ | `MEAL` `PROMISE` |
| `analysisId` / `scanId`+`menuId` / `presetId` | string | ✓ | **셋 중 정확히 하나** |
| `weekday` | enum | 조건부 | `kind=PROMISE`면 필수 |

**Response 201** — 6.1 객체 (`status=PENDING`, `adjusted=null`)

**에러** — 400 `VALIDATION_FAILED`(소스 중복/누락) · 404 `NOT_FOUND`(분석 만료)

### 6.4 `POST /items/{id}/record` — 기록하기 (3b)

잔액에서 **즉시 차감**합니다.

**Request** — 본문 없음

**Response 200**

```json
{
  "item": { /* 6.1 객체, status=RECORDED, recordedAt 채워짐 */ },
  "budget": { "total": 85, "balance": 12, "spent": 53, "prepaid": 20, "gaugePercent": 14 },
  "overflow": null,
  "alreadyProcessed": false
}
```

> 위 예시는 §3.5 상태(`spent 13 · prepaid 20 · balance 52`)에서 **40짜리 항목을 기록**한 결과입니다 — `spent`가 `13 → 53`, `balance`가 `52 → 12`.
> 

**초과 상태로 기록된 경우** (부록 A #2) — *아래는 선차감이 없는 별개 시나리오입니다*

```json
{
  "item": { /* status=RECORDED */ },
  "budget": { "total": 85, "balance": -20, "spent": 105, "prepaid": 0, "gaugePercent": 0 },
  "overflow": {
    "balance": -20,
    "originalWouldBe": -75,
    "reducedBy": 55,
    "note": "흥정으로 55만큼 덜 깊어졌어요."
  }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `overflow` | object|null | 기록 후 **`budget.balance`**가 음수일 때만. 구조는 §0.11 |
| `overflow.originalWouldBe` | int | `original.points` 그대로 기록했을 때의 잔액 |
| `overflow.reducedBy` | int | `originalWouldBe`와 실제 잔액의 차. 흥정 안 했으면 `0` |
| `overflow.note` | string | 사용자 노출 문구. **판정·질책 금지** |

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `alreadyProcessed` | boolean | **중복 호출 여부.** `true`면 **같은 상태로의 재요청**이라 아무 일도 일어나지 않았습니다. `PREPAID → RECORDED` 같은 정상 전이는 `false`입니다 (§6.9) |
- 응답의 `budget`은 `GET /challenges/current`의 `budget`과 동일 구조 → **FE는 대시보드 재호출 없이 갱신**
- **초과 기록은 항상 허용됩니다.** 잔액 부족을 이유로 거절하지 않습니다 (부록 A #2)
- **이미 `RECORDED`인 항목에 재호출하면 멱등 200**입니다 (§6.9). 더블탭으로 이중 차감되지 않습니다

**에러** — 409 `ITEM_ALREADY_RECORDED` (다른 종착 상태에서 전이 시도 시. §6.9 표 참조)

### 6.5 `POST /items/{id}/prepay` — 선차감하기 (3a)

**Request** — 본문 없음

**Response 200**

```json
{
  "item": { "id": "itm_01HZY...", "status": "PREPAID", "weekday": "FRI" },
  "budget": { "total": 85, "balance": -18, "spent": 13, "prepaid": 90, "gaugePercent": 0 },
  "overflow": {
    "balance": -18,
    "originalWouldBe": -18,
    "reducedBy": 0,
    "note": "선차감하면 −18입니다. 흥정으로 줄여볼까요?"
  },
  "alreadyProcessed": false
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `alreadyProcessed` | boolean | **중복 호출 여부.** `true`면 이번 요청으로 차감이 일어나지 않았습니다 (§6.9) |

> 위 예시는 §3.5 상태(`spent 13 · prepaid 20 · balance 52`)에서 **금요일 치킨 70을 선차감**한 결과입니다 — `prepaid`가 `20 → 90`, `balance`가 `52 → −18`.
> 
- 선차감은 `budget.prepaid`에 합산되고 `balance`에서 즉시 빠집니다 (§0.10)
- **초과 선차감도 허용됩니다.** 결과가 음수면 §6.4와 동일한 `overflow` 객체가 실립니다 (부록 A #2)
- **이미 `PREPAID`인 항목에 재호출하면 멱등 200**입니다 (§6.9). 더블탭으로 이중 차감되지 않습니다
- **선차감은 기간과 무관하게 총 예산에서 즉시 빠집니다.** 귀속 구간 개념이 없습니다
- 약속 요일이 지나면 배치가 `PREPAID` → `RECORDED`로 전환합니다 (클라이언트 호출 없음). 판정 시각은 **05:00 KST** — 만료 배치와 같은 경계입니다 (§0.8 · §6.8)

### 6.6 `DELETE /items/{id}`

**Response 204** — 본문 없음

- `PENDING` `HAGGLED` `EXPIRED` → `CANCELED`로 전이
- **이미 `CANCELED`인 항목에 재호출하면 204 멱등**입니다 (§6.9)

**에러** — 409 `ITEM_ALREADY_RECORDED` (`RECORDED`·`PREPAID` 항목은 삭제 불가. §6.9 표 참조)

### 6.7 `GET /presets` — 자주 먹는 것

> **AI 미사용 · 백엔드 전용.** 목록은 사용자 본인의 입력 이력을 SQL로 집계한 결과입니다. 판단이 필요 없으므로 AI 함수를 호출하지 않습니다 (§15.7.5).
> 

**Response 200**

```json
{
  "presets": [
    { "id": "pst_ramen",     "name": "라면",   "unit": "1봉지", "points": 80, "pm": 10 },
    { "id": "pst_bread",     "name": "빵",     "unit": "1개",   "points": 45, "pm": 10 },
    { "id": "pst_tteok",     "name": "떡볶이", "unit": "1인분", "points": 55, "pm": 10 },
    { "id": "pst_chicken",   "name": "치킨",   "unit": "1마리", "points": 70, "pm": 10 }
  ],
  "source": "DEFAULT"
}
```

| 필드 | 설명 |
| --- | --- |
| `source` | `DEFAULT`(이력 없음) / `HISTORY`(최근 4주 상위 4개) |
| `presets` | **정확히 4개** |
| `presets[].points` | **`original` 기준값.** 과거 합의값(조정값)을 쓰지 않습니다 |

**집계 규칙 (부록 A #3 결정)**

| 항목 | 규칙 |
| --- | --- |
| 처리 주체 | **백엔드 단독.** AI 호출 없음 |
| 집계 대상 | 최근 4주 `original.name` **입력 빈도** (기록 여부 무관) |
| 정렬 | 빈도 내림차순 → 동률이면 최근 입력순 |
| 표시 가격 | **항상 `original.points`** — 캐시된 분석 결과 재사용 |

**칩을 탭했을 때** — `POST /items` Request (C) `presetId`로 항목을 즉시 생성합니다 (§6.3). 3c를 거치지 않습니다.

| 캐시 상태 | AI 호출 |
| --- | --- |
| `(메뉴명, cuisine)` 캐시 히트 (30일 이내) | **없음** — 저장된 값 그대로 |
| 캐시 만료 | `estimate_menus()` 1회 (§15.2.2) |

> **과거 합의값은 칩에 쓰지 않습니다.** 앵커가 계속 내려가 실제 섭취량은 그대로인데 기록만 줄어드는 왜곡이 생깁니다. 이력은 **흥정 오프닝에서** 씁니다 — “라면 80이네요. 지난번엔 40으로 합의하셨는데, 같은 조건으로 갈까요?” (§7.1 `opening` · §15.4.1 `lastAgreement`)
> 

### 6.8 항목 만료 (부록 A #1 결정)

> 입력만 해두고 기록하지 않은 항목을 **매일 05:00 KST 배치**로 정리합니다.
> 

| 만료 시점 상태 | 전이 | 이유 |
| --- | --- | --- |
| `PENDING` | → `CANCELED` (조용히 폐기) | 흥정도 안 한 항목이라 사용자가 잃는 게 없음 |
| `HAGGLED` | → **`EXPIRED`** (확인 대기) | 흥정에 턴을 쓴 결과를 말없이 버리면 손해감이 큼 |
| `PREPAID` | 만료 없음 | 약속 요일까지 유지 |

**`EXPIRED` 항목 처리**

- `GET /challenges/current`의 `expiredConfirm` 배열로 내려갑니다 → FE가 대시보드 진입 시 확인 시트 노출
- 사용자 응답
    - **“드셨어요”** → `POST /items/{id}/record` — `logicalDate` 기준으로 소급 기록
    - **“안 먹었어요”** → `DELETE /items/{id}` → `CANCELED`
- **48시간 무응답 시** 자동 `CANCELED` (재확인하지 않음)
- `EXPIRED` 항목으로는 흥정 세션을 열 수 없습니다 → 409 `ITEM_EXPIRED`

**`GET /challenges/current` 추가 필드**

```json
"expiredConfirm": [
  {
    "id": "itm_01HZY...",
    "logicalDate": "2026-08-10",
    "menuLabel": "라면 반봉지 + 계란",
    "points": 40,
    "question": "어제 40으로 합의한 라면, 드셨어요?"
  }
]
```

- 빈 배열이면 시트 미노출
- 최대 3건. 초과분은 오래된 것부터 자동 `CANCELED`

**이월 규칙은 없습니다** (부록 A #5) — 05:00 만료가 있어 **하루를 넘기는 미기록 항목이 존재하지 않습니다.**

### 6.9 중복 호출 · 멱등 규칙

> **원칙 — 같은 종착 상태로의 재요청은 멱등, 다른 종착 상태로의 전이 시도는 409.** 더블탭·네트워크 재시도가 흔하므로 **차감은 막되 에러는 내지 않습니다.**
> 

| 요청 | 현재 상태 | 결과 | `alreadyProcessed` | 잔액 변동 |
| --- | --- | --- | --- | --- |
| `record` | `PENDING` `HAGGLED` `EXPIRED` | 200 → `RECORDED` | `false` | ✓ 차감 |
| `record` | **`RECORDED`** | **200 멱등** | `true` | ✕ |
| `record` | `PREPAID` | 200 → `RECORDED` | **`false`** | ✕ `prepaid`→`spent` 이동만 (§0.10) |
| `record` | `CANCELED` | 404 `NOT_FOUND` | — | ✕ |
| `prepay` | `PENDING` `HAGGLED` | 200 → `PREPAID` | `false` | ✓ 차감 |
| `prepay` | **`PREPAID`** | **200 멱등** | `true` | ✕ |
| `prepay` | `RECORDED` | 409 `ITEM_ALREADY_RECORDED` | — | ✕ |
| `prepay` | `EXPIRED` `CANCELED` | 409 `ITEM_ALREADY_RECORDED` | — | ✕ |
| `DELETE` | `RECORDED` `PREPAID` | 409 `ITEM_ALREADY_RECORDED` | — | ✕ |
| `DELETE` | **`CANCELED`** | **204 멱등** | — | ✕ |

**클라이언트 처리**

- `alreadyProcessed: true`면 **성공 토스트를 띄우지 않습니다.** 화면 상태만 동기화하세요
- 응답의 `budget`은 어느 경우든 **현재 값**입니다. 그대로 반영하면 됩니다

---

## 7. 밀당 대화 (화면 5)

> **철칙 — 메뉴를 바꾸지 않습니다.** 응답의 조정안은 `original.name`과 **같은 메뉴**여야 하며, **양·구성만** 달라집니다 (조리법 레버는 부록 A #4로 제외). 다른 메뉴명을 반환하면 계약 위반입니다.
> 

### 7.1 `POST /haggles` — 세션 시작

**Request**

```json
{ "itemId": "itm_01HZY...", "entryPoint": "FREE" }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `itemId` | string | ✓ | `status`가 `PENDING` 또는 `HAGGLED`인 항목. `EXPIRED`는 409 |
| `entryPoint` | enum | ✓ | `PROMISE`(3a) `SCAN`(4b) `FREE`(3b) — 오프닝 대사와 칩이 달라짐 |

**Response 201**

```json
{
  "id": "hgl_01HZZ...",
  "itemId": "itm_01HZY...",
  "entryPoint": "FREE",
  "maxTurns": 10,
  "turn": 0,
  "target": { "name": "라면", "unit": "1봉지", "points": 80, "pm": 10, "place": "집" },
  "agreed": null,
  "balance": 52,
  "frame": "SAVE",
  "opening": "라면 1봉지 80이요. 잔액 52니까 그대로면 −28입니다. 라면을 버리라는 얘기는 안 해요 — 얼마나 먹을지만 정합시다.",
  "chips": ["반만 먹을게", "너무 적어", "더 깎아줘", "그대로 먹을래"],
  "status": "OPEN"
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `maxTurns` | int | **10 고정** |
| `agreed` | object|null | 현재 합의값. 시작 시 `null` → 헤더 칩은 “아직 그대로” |
| `balance` | int | **`budget.balance`** (§0.11). 전 기간 동일 |
| `target.place` | string|null | `집` / 가게명 / `null` |
| `opening` | string | 같은 메뉴의 **직전 합의 이력이 있으면 반드시 언급** — “지난번엔 40으로 합의하셨는데, 같은 조건으로 갈까요?” (부록 A #3) |
| `chips` | array | **4개**, `entryPoint`별로 다름 |
| `frame` | enum | `SAVE`(잔액 ≥ 0) / `REDUCE_OVERFLOW`(잔액 < 0). §7.6 |
| `status` | enum | `OPEN` `CLOSED` `ABANDONED` |

**`entryPoint`별 chips**

| entryPoint | chips |
| --- | --- |
| `FREE` | `반만 먹을게` `너무 적어` `더 깎아줘` `그대로 먹을래` |
| `PROMISE` | `반만 먹을게` `메뉴를 내가 못 정해` `그날만 봐줘` `그대로 먹을래` |
| `SCAN` | `반만 먹을게` `양은 그대로` `더 깎아줘` `그대로 먹을래` |

### 7.2 `POST /haggles/{id}/messages` — 한 턴 진행

**단건 JSON 응답.** 스트리밍 아님.

**Request**

```json
{ "text": "너무 적어" }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `text` | string | ✓ | 1~200자 |

**Response 200**

```json
{
  "turn": 2,
  "maxTurns": 10,
  "turnsLeft": 8,
  "reply": {
    "text": "그럼 3/4봉지 60. 대신 국물은 좀 남기시죠 — 스프에도 밀이 조금 있습니다.",
    "hasProposal": true
  },
  "proposal": {
    "key": "three",
    "label": "3/4봉지",
    "points": 60,
    "lever": "AMOUNT",
    "basis": "면 3/4 · 국물 절반"
  },
  "frame": "SAVE",
  "simulation": {
    "adjusted": { "row": "3/4봉지 60", "balanceAfter": -8,  "overflow": true },
    "original": { "row": "라면 1봉지 80", "balanceAfter": -28, "overflow": true }
  },
  "agreed": { "key": "three", "label": "3/4봉지", "points": 60 },
  "closeButtonLabel": "대화 종료 · 60으로 반영",
  "status": "OPEN"
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `reply.hasProposal` | boolean | `false`면 `proposal`·`simulation`이 `null` (설명만 한 턴) |
| `proposal.lever` | enum | **`AMOUNT`(양) `COMPOSITION`(구성 비율) 2종만.** 조리법 레버 제외 (부록 A #4) |
| `proposal.points` | int | **`original.points` 이하**. 초과 제안 금지 |
| `frame` | enum | **세션 내내 고정.** 세션 시작 시점의 **`budget.balance`** 부호로 결정 (§0.11 · §7.6) |
| `simulation.*.overflow` | boolean | **그 값으로 기록했을 때 `budget.balance`**가 음수인지 → 빗금 막대 (§0.11). `frame`과 별개입니다 |
| `agreed` | object | **직전 합의값이 유지**됨. `hasProposal=false`면 이전 값 그대로 |
| `closeButtonLabel` | string | 하단 CTA 문구. 서버가 생성해 FE는 그대로 표시 |

**턴 10 도달 시** — `turnsLeft: 0`, `reply.text` 끝에 정리 유도 문구 추가, 이후 요청은 409

**에러** — 409 `HAGGLE_TURN_EXCEEDED` · 409 `HAGGLE_SESSION_CLOSED` · 503 `AI_UNAVAILABLE`

### 7.3 `POST /haggles/{id}/close` — 대화 종료

**합의값을 항목에 반영합니다. 차감하지 않습니다.**

**Request** — 본문 없음

**Response 200**

```json
{
  "haggle": { "id": "hgl_01HZZ...", "status": "CLOSED", "turns": 4, "closedAt": "2026-08-10T14:31:00Z" },
  "item": { /* 6.1 객체, status=HAGGLED, adjusted 채워짐 */ },
  "farewell": "거래 종료. 라면 반봉지 + 계란 40으로 항목을 고쳐뒀습니다. 기록은 목록에서 «기록하기»를 눌러주세요 — 아직 예산은 안 건드렸어요."
}
```

- `agreed`가 `null`인 채로 종료하면 → `item.adjusted = null`, `status`는 `PENDING` 유지
- **잔액은 변하지 않습니다.** 차감은 6.4 / 6.5에서만

### 7.4 `DELETE /haggles/{id}` — 변경 없이 나가기 (`✕`)

**Response 204**

- 세션 `status=ABANDONED`, 항목은 **원래값 그대로**
- 같은 항목으로 새 세션을 다시 열 수 있음 (턴 초기화)

### 7.5 AI 계약 → §15.4

흥정 대사를 만드는 함수 `reply_haggle()`의 계약은 **15장에만** 둡니다. 백엔드는 그 스키마로 AI 게이트웨이를 호출합니다.

| 항목 | 위치 |
| --- | --- |
| Input / Output 스키마 | §15.4.1 |
| 제약 12개 (0~11) | §15.4.2 |
| `REDUCE_OVERFLOW` 어법 | §15.4.3 |
| 조정 단계 참조표 | §15.4.4 |
| 금지 어휘 사전 | §15.8.3 |
| 검증 실패 시 폴백 (`AMOUNT` 50% → 75% → 33%) | §15.8.2 |

### 7.6 초과 상태의 흥정 (부록 A #2 결정)

> **초과는 언제나 허용됩니다.** 잔액이 모자라다는 이유로 흥정을 거절하거나 기록을 막지 않습니다.
> 

**프레임 전환**

| `frame` | 조건 | 흥정의 목표 | 시뮬레이션 라벨 |
| --- | --- | --- | --- |
| `SAVE` | **세션 시작 시** `budget.balance` ≥ 0 | 얼마나 **남길까** | `기록하면 잔액 12` |
| `REDUCE_OVERFLOW` | **세션 시작 시** `budget.balance` < 0 | 얼마나 **덜 깊어질까** | `−20 초과 (원래대로면 −75)` |

`REDUCE_OVERFLOW`일 때 밀당이가 쓰는 어법(권장·금지 예시)은 **§15.4.3**.

**서버 처리**

- **`frame`은 세션 시작 시 한 번 정해지고 끝까지 바뀌지 않습니다.** 흥정 중에는 차감이 일어나지 않아 `balance`가 변하지 않기 때문입니다
- `frame`(세션 잔액 부호)과 `simulation.*.overflow`(기록 후 잔액 부호)는 **다른 값**입니다. 잔액 52에서 60을 제안하면 `frame: SAVE`이지만 `overflow: true`입니다 — §7.2 예시가 그 경우입니다
- 기록 결과가 음수면 `POST /items/{id}/record` 응답의 `overflow` 객체로 절감폭을 반환합니다 (§6.4)
- 리포트의 `stats[].VS_BUDGET`은 음수를 그대로 표기합니다 (§9.1)

---

## 8. 컨디션 체크인 (화면 6)

### 8.1 `GET /checkins/today`

**Response 200**

```json
{
  "date": "2026-08-10",
  "dayIndex": 4,
  "done": false,
  "answers": { "BLOAT": null, "SKIN": null, "DROWSY": null },
  "questions": [
    { "key": "BLOAT",  "label": "더부룩함", "desc": "식후 속 상태" },
    { "key": "SKIN",   "label": "피부",     "desc": "트러블·건조" },
    { "key": "DROWSY", "label": "낮 졸림",  "desc": "식곤증 정도" }
  ],
  "checkinDays": { "answered": 3, "elapsed": 4, "total": 7 }
}
```

| 필드 | 설명 |
| --- | --- |
| `questions` | **3개 고정.** 질문 수는 응답률과 무관합니다 — 하루치 안에서 셉니다 |
| `checkinDays.answered` | 체크인을 마친 **날 수** |
| `checkinDays.elapsed` | 오늘까지 경과한 일수 (= `dayIndex`) |
| `checkinDays.total` | 챌린지 총 일수 |

> **비율이 아니라 원시 수치만 줍니다.** 표기는 FE가 정합니다 (예: `3/4일 기록`). 리포트 생성에 **최소 응답률 제약은 없습니다** — 기록한 날만으로 만듭니다 (§9.1).
> 

### 8.2 `PUT /checkins/today`

**멱등.** 같은 날 재호출 시 덮어씁니다.

**Request**

```json
{ "answers": { "BLOAT": "BAD", "SKIN": "MID", "DROWSY": "GOOD" } }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `answers.BLOAT` | enum | ✓ | `GOOD` `MID` `BAD` |
| `answers.SKIN` | enum | ✓ | 동일 |
| `answers.DROWSY` | enum | ✓ | 동일 |
- **3개 모두 필수.** 부분 제출 불가 (400)

**Response 200**

```json
{
  "id": "chk_01HZX...",
  "date": "2026-08-10",
  "done": true,
  "answers": { "BLOAT": "BAD", "SKIN": "MID", "DROWSY": "GOOD" },
  "message": "접수 완료. 오늘 장부는 닫습니다 — 내일 봬요.",
  "checkinDays": { "answered": 4, "elapsed": 4, "total": 7 }
}
```

---

## 9. 리포트 · 공유 (화면 7 · 7+)

### 9.1 `GET /challenges/{id}/report`

**Response 200**

```json
{
  "challenge": { "id": "chl_01HZX...", "period": "W1", "label": "1주 챌린지 · 완주", "completedAt": "2026-08-17T15:00:00Z" },
  "title": "당신의 몸이 쓴 리포트",
  "stats": [
    { "key": "TOTAL_SPENT",   "label": "총 소비",   "value": "78", "sub": "/85" },
    { "key": "VS_BUDGET",     "label": "예산 대비", "value": "−7", "sub": null },
    { "key": "PEAK_SLOT",     "label": "최다 소비", "value": "금 저녁", "sub": null }
  ],
  "finding": {
    "available": true,
    "headline": "밀가루 40+ 섭취한 다음날, 더부룩함 보고율 2.4배",
    "metric": { "conditionKey": "BLOAT", "thresholdPoints": 40, "ratio": 2.4 },
    "sampleNote": "응답 6/7일 · 표본이 작아\"경향\"으로 읽어주세요",
    "sample": { "answeredDays": 6, "totalDays": 7 }
  },
  "haggleHighlight": {
    "totalSaved": 132,
    "best": { "menu": "라면", "originalLabel": "1봉지 80", "adjustedLabel": "반봉지 + 계란 40", "savedPoints": 40, "when": "수요일 저녁" },
    "avgTurns": 4.2,
    "longestTurns": 9
  },
  "disclaimer": "이 리포트는 의학적 진단이 아닌 본인 기록 기반 관찰입니다.",
  "nextChallenge": { "period": "W1", "optionKey": "HARD", "suggestedBudget": 75, "ctaLabel": "재대결 받기 · 이번엔 75" }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `finding.available` | boolean | **계산 가능성 기준.** 아래 조건을 못 채우면 `false`, 이하 필드 `null` |
| `finding.sample` | object | 응답 일수 / 총 일수. 표본 크기를 사용자에게 그대로 노출 |
| `finding.metric` | object | `{ conditionKey, thresholdPoints, ratio }` — 백엔드가 계산한 원값 |
| `finding.metric.ratio` | number | 소수 1자리 |
| `stats[].value` | string | 표시용 문자열. **부호 규칙은 아래 표** |
| `haggleHighlight.totalSaved` | int | `Σ(original − adjusted)` |
| `nextChallenge.optionKey` | enum | 이번보다 한 단계 센 `OptionKey`. FE가 재시작 시 그대로 전달 |
| `nextChallenge.suggestedBudget` | int | **주간값**입니다 — `POST /challenges/{id}/budget`의 `budget`에 그대로 넣는 값 (§3.4) |
- **재대결은 새 챌린지입니다.** `POST /challenges` → `POST /challenges/{id}/budget`을 그대로 다시 탑니다. 별도 재도전 엔드포인트는 없습니다
- `W1` 무료는 **최초 1회뿐**이므로, `freeTrialUsed=true`인 사용자는 재대결에도 결제가 필요합니다 (§3.1 `unavailableReason`)

**리포트는 전 기간 모두 `budget` 전체 기준입니다**

| 기간 | `stats` 분모 |
| --- | --- |
| `W1` | `budget.total` = 85 |
| `W2` | `budget.total` = **170** |
| `W4` | `budget.total` = **340** (`AS_IS` 기준) |
- 리포트가 답하는 질문은 *“이번 챌린지 전체가 어땠나”*입니다
- `finding`(컨디션 상관)은 원래부터 전체 기간 데이터를 씁니다 — 변경 없음

**`stats` 부호 규칙**

| key | 계산 | `W1` 예시 | `W4` 예시 |
| --- | --- | --- | --- |
| `TOTAL_SPENT` | `spent` | `78` (`sub: "/85"`) | `265` (`sub: "/340"`) |
| `VS_BUDGET` | **`spent − budget.total`** | `−7` | `−75` |
| `PEAK_SLOT` | 최다 소비 요일·시간대 | `금 저녁` | `금 저녁` |
- `VS_BUDGET`은 **가계부와 같은 방향**입니다 — 예산을 덜 쓰면 음수, 넘기면 양수. 양수에는 `+`를 붙여 표기합니다

**`finding.available` 판정 조건**

> **최소 응답률 제약은 없습니다.** 며칠을 건너뛰든 리포트는 나옵니다. 다만 **상관을 계산할 수 없으면** 발견 영역만 비웁니다.
> 

| 조건 | 설명 |
| --- | --- |
| 고섭취군 ≥ 1일 | `thresholdPoints`(40) 이상 먹은 다음날 체크인 응답이 1일 이상 |
| 저섭취군 ≥ 1일 | 임계 미만 먹은 다음날 체크인 응답이 1일 이상 |
- 둘 중 하나라도 0이면 비율이 정의되지 않으므로 `available: false`
- `available: false`여도 `stats`·`haggleHighlight`는 정상 반환합니다. **리포트 자체는 항상 생성됩니다**
- 표본이 작을수록 `sampleNote`가 더 강하게 경고합니다 (2~3일이면 “참고 수준”)

**에러** — 404 `NOT_FOUND` · 409 `CHALLENGE_NOT_COMPLETED`

### 9.2 `POST /challenges/{id}/report/share-card`

9:16 스토리 카드 이미지를 서버에서 렌더링합니다.

**Request**

```json
{ "mentions": ["@친구1", "@친구2", "@친구3"], "format": "PNG" }
```

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| `mentions` | array<string> |  | 최대 3개. 빈 배열이면 지목 영역 미노출 |
| `format` | enum |  | `PNG`(기본) `JPEG` |

**Response 201**

```json
{
  "imageUrl": "https://cdn.mildang.app/cards/chl_01HZX_9x16.png",
  "width": 1080,
  "height": 1920,
  "deepLink": "https://mildang.app/c/AB12CD",
  "hashtag": "#밀가루흥정챌린지",
  "expiresAt": "2026-09-16T15:00:00Z"
}
```

### 9.3 `GET /invites/{code}`

공유 카드의 `deepLink` 진입점.

**Response 200**

```json
{ "inviterNickname": "재창", "period": "W1", "finding": "밀가루 40+ 먹은 다음날, 더부룩함 2.4배", "ctaLabel": "도전 받기" }
```

---

## 10. AI 팁

밀당이가 대화 밖에서 말하는 곳은 두 군데입니다. **생성 함수의 계약은 15장**에 있습니다.

| 팁 | 실리는 응답 | 생성 방식 | 계약 |
| --- | --- | --- | --- |
| `startTip` | `POST /challenges/{id}/budget` (§3.4) | **템플릿** — AI 호출 없음 | §15.7.1 |
| `tip` | `GET /challenges/current` (§3.5) | `write_dashboard_tip()` — 매일 05:00 배치 | §15.5 |
- `startTip`은 온보딩 3문항 조합이 27가지뿐이라 문구 뱅크로 처리합니다. **온보딩 AI 호출 0회**
- `tip`은 생성·검증 실패 시 `null`로 내려가고 FE가 영역을 숨깁니다 (§15.8.2)
- `tip.basis` 열거값은 §3.5 · §15.5와 동일

---

## 11. 상태 전이

### 11.1 챌린지

```
(없음) ──POST /challenges──▶ ONBOARDING ──POST /budget──▶ ACTIVE
                                                            │
                                        기간 종료 ───────────┼──▶ COMPLETED ──▶ GET /report
                                        7일 미접속 ──────────┴──▶ ABANDONED
```

### 11.2 항목

```
                    POST /items
                         │
                         ▼
                     PENDING ──────POST /items/{id}/record─────▶ RECORDED
                      │   ▲                                        ▲
      POST /haggles   │   │ DELETE /haggles (✕, 원복)               │
                      ▼   │                                        │
                    (흥정 중)                                       │
                      │                                            │
       POST /haggles/{id}/close (합의값 반영)                        │
                      │                                            │
                      ▼                                            │
                   HAGGLED ────POST /items/{id}/record─────────────┤
                      │                                            │
                      ├────POST /items/{id}/prepay────▶ PREPAID ───┤ (요일 경과, 배치)
                      │                                            │
                      │  05:00 만료 배치                            │
                      ▼                                            │
                   EXPIRED ─────"드셨어요" record (소급)────────────┘
                      │
                      └──"안 먹었어요" DELETE · 48h 무응답──▶ CANCELED

     PENDING ──05:00 만료 배치──▶ CANCELED
     PENDING · HAGGLED ──DELETE /items/{id}──▶ CANCELED
```

**불변 조건**

- `RECORDED` · `PREPAID` 항목은 수정·삭제 불가 (409)
- 흥정은 `original`을 절대 바꾸지 않는다. 항상 `adjusted`에만 기록
- 잔액 변경은 `record` · `prepay` **두 곳에서만** 발생
- `EXPIRED`로는 흥정 세션을 열 수 없다 (409 `ITEM_EXPIRED`)
- **잔액 부족은 어떤 전이도 막지 않는다** (§7.6)

---

## 12. 대표 시퀀스

### 12.1 자유 흥정 (대시보드 → 3b → 3c → 5 → 3b)

```
FE                          BE                        AI
│  GET /challenges/current  │                          │
│──────────────────────────▶│                          │
│◀── 잔액 52, 팁, 선차감 ────│                          │
│                           │                          │
│ [식사하기] → 3b           │                          │
│  GET /items?kind=MEAL     │                          │
│  GET /presets             │                          │
│──────────────────────────▶│                          │
│◀── 항목 0건, 프리셋 4개 ───│                          │
│                           │                          │
│ [메뉴 직접 입력] → 3c     │                          │
│  POST /analyses/text      │                          │
│   {"query":"라면"}        │   메뉴 추정 요청          │
│──────────────────────────▶│─────────────────────────▶│
│                           │◀── 80 ±10, CERTAIN ──────│
│◀── anl_x, 라면 1봉지 80 ──│                          │
│                           │                          │
│  POST /items              │                          │
│   {"analysisId":"anl_x"}  │                          │
│──────────────────────────▶│                          │
│◀── itm_y (PENDING) ───────│      3b로 복귀, 항목 생성 │
│                           │                          │
│ [밀당하기] → 5            │                          │
│  POST /haggles            │                          │
│   {"itemId":"itm_y",      │   오프닝 생성             │
│    "entryPoint":"FREE"}   │─────────────────────────▶│
│──────────────────────────▶│◀── opening + chips ──────│
│◀── hgl_z, turn 0 ─────────│                          │
│                           │                          │
│  POST /haggles/z/messages │                          │
│   {"text":"반만 먹을게"}  │   턴 1 생성               │
│──────────────────────────▶│─────────────────────────▶│
│                           │◀── 40 제안 (AMOUNT) ─────│
│◀── proposal 40, agreed 40 │                          │
│    closeButtonLabel       │                          │
│         ⋮ (턴 2~4 반복)   │                          │
│                           │                          │
│  POST /haggles/z/close    │                          │
│──────────────────────────▶│  item.adjusted = 40      │
│◀── item(HAGGLED), 잔액 유지│  ★ 차감 없음             │
│                           │                          │
│ 3b 복귀 — 항목이 40으로 표시│                         │
│  POST /items/itm_y/record │                          │
│──────────────────────────▶│  balance 52 → 12         │
│◀── item(RECORDED) + budget│                          │
```

### 12.2 스캔 흥정 (3b → 4a → 4b → 5 → 4b)

```
[메뉴판 찍기] → POST /scans (multipart)
             → 4b 렌더 (menus 싼 순 + recommendation)
   ├─ 가격 탭 수정 → PATCH /scans/{id}/menus/{menuId}
   ├─ 탭해서 차감  → POST /items {scanId, menuId} → POST /items/{id}/record
   └─ 밀당하기     → POST /items {scanId, menuId}
                   → POST /haggles {itemId, entryPoint:"SCAN"}
                   → ⋯ → POST /haggles/{id}/close
                   → 4b 복귀, 해당 행이 조정값으로 갱신
                   → POST /items/{id}/record
```

### 12.3 약속 사전 결재 (3 → 3a → 3c → 5 → 3a)

```
[미리 사전 결재하기] → 3a
   요일 선택 (FE 상태)
   [메뉴 입력하기] → 3c → POST /analyses/text {kind:"PROMISE"}
                        → POST /items {kind:"PROMISE", analysisId, weekday:"FRI"}
   ├─ 선차감하기 → POST /items/{id}/prepay      (balance 즉시 차감, prepaid 합산)
   └─ 밀당하기   → POST /haggles {entryPoint:"PROMISE"} → close → prepay
```

---

## 13. 구현 체크리스트

### 프론트엔드

- [ ]  `effective.points`만 사용. `original`/`adjusted`는 표시용
- [ ]  `budget`은 `record`/`prepay` 응답으로 갱신 — 대시보드 재호출 금지
- [ ]  흥정 후 3a/3b 복귀 시 **차감되지 않았음**을 전제로 렌더 (항목이 리스트에 남아 있음)
- [ ]  `closeButtonLabel`은 서버 문구를 그대로 표시
- [ ]  422 `ANALYSIS_FAILED`의 `detail.candidates` 3개를 칩으로 노출
- [ ]  `gaugePercent`는 서버값 사용 (음수 잔액 클램프 이미 반영됨)
- [ ]  대시보드 진입 시 `expiredConfirm`이 비어있지 않으면 확인 시트 노출 (§6.8)
- [ ]  `frame == REDUCE_OVERFLOW`면 시뮬레이션 라벨을 “덜 깊어짐” 어법으로 전환 (§7.6)
- [ ]  `record` 응답의 `overflow.note`를 그대로 표시 — 자체 문구 생성 금지
- [ ]  화면 2는 `totalBudget` 하나만 크게 (§3.3) · 화면 3은 `budget.balance / budget.total` (§3.5)
- [ ]  옵션 카드에 찍는 값이 `options[].totalBudget`인지 (`budget` 아님, §3.3)
- [ ]  `pace.state == BEHIND`면 `pace.note`를 눈에 띄게 (§3.5)

### 백엔드

- [ ]  `POST /haggles/{id}/close`가 **잔액을 건드리지 않는지** 테스트로 고정
- [ ]  AI 응답 검증: 메뉴명 동일성, `points ≤ original`, 금지 어휘 → 위반 시 재시도 1회 → 규칙 폴백
- [ ]  턴 카운트는 서버가 단일 진실. 클라이언트 값 신뢰 금지
- [ ]  `PREPAID` → `RECORDED` 전환 배치 (일 1회, **KST 05:00** — 만료 배치와 동시 실행, §0.8)
- [ ]  `PATCH /scans/{id}/menus/{menuId}` 수정값을 실측 파이프라인에 적재 (5.6)
- [ ]  `finding.available`은 **응답률이 아니라 계산 가능성**으로 판정 (고섭취군·저섭취군 각 1일 이상, §9.1)
- [ ]  `record`·`prepay`·`DELETE` 중복 호출이 멱등인지 회귀 테스트 (§6.9)
- [ ]  **05:00 KST 만료 배치** — `PENDING`→`CANCELED`, `HAGGLED`→`EXPIRED`, `EXPIRED` 48h 후 `CANCELED` (§6.8)
- [ ]  일자 경계 계산을 유틸 하나로 통일 (§0.8). 자정 기준 코드가 남아있지 않은지 확인
- [ ]  **모든 잔액 계산이 `budget.balance` 하나를 쓰는지** (§0.11)
- [ ]  `budget.gaugePercent`를 서버가 계산해 내려주는지 (음수 클램프 포함)
- [ ]  `pace`가 **전 기간 동일 산식**인지 (§3.5)
- [ ]  `budget.total`이 **전 기간 `options[key].budget × 곱수`**인지 (§3.4)
- [ ]  `options`가 **전 기간 3장** 내려가는지 · `options[].totalBudget`에 곱수가 반영됐는지 (§3.3)
- [ ]  잔액 음수를 이유로 `record`·`haggle`을 거절하지 않는지 회귀 테스트 (§7.6)
- [ ]  demo 환경 분기와 `/demo/*` 라우트가 prod 빌드에 포함되지 않는지 CI로 검증 (§14.7)

### AI

> **작업 범위 전체는 §15(AI 개발 파트)를 보세요.** 아래는 요약입니다.
> 
- [ ]  `menu.unit`을 반드시 채울 것 — 흥정의 출발점
- [ ]  `basis`는 1문장 40자 이내
- [ ]  흥정 제안은 **같은 메뉴의 양·구성**만 (§15.4.2 제약 12개)
- [ ]  스캔 결과는 `points` 오름차순 정렬 + 추천 1개 + 비교 메뉴 1개 언급
- [ ]  대시보드 팁은 본인 기록 근거가 없으면 `basis: "GENERIC"`
- [ ]  이진 판정 금지 — “밀가루 있음/없음”이 아니라 정량 추정 + 신뢰도
- [ ]  `lever`는 `AMOUNT` `COMPOSITION` 2종만 — 조리법 제안 금지 (부록 A #4)
- [ ]  `frame == REDUCE_OVERFLOW`일 때 §15.4.3 금지 어법을 쓰지 않는지
- [ ]  `lastAgreement`가 있으면 오프닝에서 언급 (부록 A #3)

---

## 14. 데모 모드 (공모전 제출 빌드)

> 제출 빌드는 **핵심 루프**(메뉴 입력 → AI 추정 → 흥정 → 기록 → 리포트)에 자원을 집중하고, 외부 연동은 목(mock)으로 대체합니다.
**API 계약은 실제와 100% 동일합니다.** 서버 내부 구현만 다릅니다 — 실연동 시 이 장에 표시된 지점만 교체하면 됩니다.
> 

### 14.1 목 처리 범위

| 영역 | 실서비스 | 데모 빌드 | 목으로 돌리는 이유 |
| --- | --- | --- | --- |
| 소셜 로그인 | 카카오 OIDC `idToken` 검증 | 검증 스킵, 고정 계정 발급 | 카카오 개발자 앱 심사·리다이렉트 도메인 등록에 리드타임 |
| 결제 | 스토어 IAP 영수증 검증 | 항상 `PAID` 반환 | 스토어 등록·샌드박스 계정·실기기 필요 |
| 푸시 알림 | FCM / APNs | 클라이언트 로컬 알림 | 인증서 발급·기기 토큰 관리 |
| 공유 카드 렌더 | 서버 사이드 이미지 생성 + CDN | 클라이언트 뷰 캡처 | 렌더 서버·CDN 구성 비용 |
| 배치 잡 | 스케줄러 (`PREPAID` → `RECORDED`) | 데모 전용 엔드포인트로 수동 트리거 | 심사 중 즉시 상태 전이를 보여줘야 함 |
| 실측 수집 (5.6) | 분석 파이프라인 적재 | 로그만 남김 | 파이프라인 미구축 |

**목으로 돌리지 않는 것** — AI 분석(5장), 흥정 대화(7장), 리포트 집계(9장)는 **실제로 동작해야 합니다.** 이게 제품의 핵심 주장이라 목으로 대체하면 심사에서 검증할 게 남지 않습니다.

### 14.2 환경 구분

| 환경 | `APP_ENV` | 목 활성 | 데모 엔드포인트 |
| --- | --- | --- | --- |
| 로컬 개발 | `local` | ✓ | ✓ |
| **공모전 제출** | `demo` | ✓ | ✓ |
| 운영 | `prod` | ✕ | ✕ (404) |
- 목이 활성인 응답에는 **최상위에 `"mocked": true`를 추가**합니다. FE가 이 값으로 “데모 모드” 배지를 띄웁니다
- `prod`에서는 이 필드가 아예 없습니다 (`undefined`)
- 데모 전용 엔드포인트(14.6)는 `prod`에서 404 `NOT_FOUND`

### 14.3 로그인 목 사양

**계약은 §2.1과 동일합니다.** `POST /auth/social`

**demo 환경에서의 동작 차이**

| 항목 | 실서비스 | demo |
| --- | --- | --- |
| `provider` | `KAKAO` | `KAKAO` (동일) |
| `idToken` 검증 | 카카오 공개키로 서명 검증 | **스킵** — 어떤 문자열이든 통과 |
| 계정 매칭 | `sub` 클레임으로 조회·생성 | `idToken` 문자열을 그대로 키로 사용 |
| 신규 가입 | 카카오 프로필 조회 | 닉네임 `게스트{4자리}` 자동 부여 |

**Request** (실제와 동일)

```json
{
  "provider": "KAKAO",
  "idToken": "demo-judge-01",
  "deviceId": "8f3c1a20-0000-0000-0000-000000000001",
  "pushToken": null
}
```

**Response 200**

```json
{
  "mocked": true,
  "accessToken": "eyJ...",
  "refreshToken": "rt_...",
  "expiresIn": 1800,
  "user": {
    "id": "usr_demo_judge01",
    "nickname": "심사위원1",
    "isNew": true,
    "freeTrialUsed": false
  }
}
```

**클라이언트 처리**

- 화면 1 진입 전 로그인 화면에 **`카카오로 시작하기`** 버튼을 그대로 노출합니다 (실제와 같은 UI)
- demo 빌드에서는 이 버튼이 카카오 SDK를 호출하지 않고, `idToken`에 아래 14.5의 시드 키를 넣어 바로 호출합니다
- 버튼 하단에 작게 `데모 모드 — 실제 카카오 인증은 생략됩니다` 표기

### 14.4 결제 목 사양

**계약은 §4.1과 동일합니다.** `POST /payments/checkout`

**demo 환경에서의 동작 차이**

| 항목 | 실서비스 | demo |
| --- | --- | --- |
| `provider` | `IAP_APPLE` `IAP_GOOGLE` | `MOCK` 추가 |
| `receipt` | 스토어 검증 API 호출 | **스킵** — 빈 문자열 허용 |
| 결과 | 검증 성공 시 `PAID` | **항상 `PAID`** |
| 소요 | 1~3초 | 인위적 지연 800ms (결제 중 스피너를 보여주기 위함) |

**Request**

```json
{ "period": "W2", "provider": "MOCK", "receipt": "" }
```

**Response 201**

```json
{
  "mocked": true,
  "id": "pay_demo_01HZX...",
  "period": "W2",
  "amountKrw": 2000,
  "status": "PAID",
  "paidAt": "2026-08-10T14:58:00Z"
}
```

**심사 동선 설계**

- **결제 화면은 건너뛰지 않습니다.** 2주·4주 선택 → 결제 화면 → 성공까지 전부 보여줍니다. 커밋먼트 장치라는 제품 논리를 화면으로 설명하는 구간이라 스킵하면 손해입니다
- 다만 `FREE_TRIAL_USED`(403)는 demo에서 **발생시키지 않습니다.** 심사위원이 1주를 몇 번이든 다시 시작할 수 있어야 합니다
- 결제 화면 하단에 `데모 모드 — 실제 결제가 발생하지 않습니다` 표기

### 14.5 심사용 시드 계정

> **가장 중요한 부분입니다.** 리포트(화면 7)를 보려면 7일치 기록이 필요한데 심사위원은 기다릴 수 없습니다. 상태별 계정을 미리 만들어두세요.
> 

| `idToken` | 계정 | 상태 | 볼 수 있는 화면 |
| --- | --- | --- | --- |
| `demo-judge-01` | 심사위원1 | 신규 (챌린지 없음) | 1 · 2 (온보딩 전체) |
| `demo-judge-02` | 심사위원2 | 1주 챌린지 4일차 · 잔액 52 (`spent 13 · prepaid 20`) | 3 · 3a · 3b · 3c · 4a · 4b · 5 · 6 |
| `demo-judge-03` | 심사위원3 | 1주 챌린지 완주 · 총소비 78 · 체크인 6/7일 | 7 · 7+ (리포트·공유 카드) |
| `demo-judge-04` | 심사위원4 | 4주 챌린지 12일차 · 잔액 280 / 340 | 3 (`W4` 표시 · 장기 챌린지) |
| `demo-judge-05` | 심사위원5 | **2주 챌린지 8일차** · 잔액 90 / 170 | 3 (`W2` 표시) · **결제 플로우** |

**`demo-judge-02` 시드 데이터 상세** — **§3.5 응답 예시와 정확히 같은 상태**를 만듭니다.

```json
{
  "challenge": { "period": "W1", "budget": 85, "dayIndex": 4, "status": "ACTIVE" },
  "records": [
    { "date": "D-2", "menu": "된장찌개", "points": 5,  "adjustedPoints": null, "haggleTurns": 0, "overflow": false },
    { "date": "D-1", "menu": "제육볶음", "points": 15, "adjustedPoints": 8,    "haggleTurns": 3, "overflow": false }
  ],
  "prepaidItems": [
    { "name": "수요일 점심 약속", "points": 20, "weekday": "WED" }
  ],
  "checkins": [
    { "date": "D-3", "BLOAT": "BAD",  "SKIN": "MID",  "DROWSY": "BAD"  },
    { "date": "D-2", "BLOAT": "MID",  "SKIN": "GOOD", "DROWSY": "MID"  },
    { "date": "D-1", "BLOAT": "GOOD", "SKIN": "GOOD", "DROWSY": "GOOD" }
  ]
}
```

**검산 (§0.10 항등식)**

| 항목 | 계산 | 값 |
| --- | --- | --- |
| `spent` | 된장찌개 `5` + 제육볶음 흥정 후 `8` | **13** |
| `prepaid` | 수요일 점심 약속 | **20** |
| `balance` | `85 − 13 − 20` | **52** ✓ |
| `gaugePercent` | `round(52/85×100)` | **61** |

> **`balance`는 시드에 직접 쓰지 않습니다.** `/demo/seed`는 `records`·`prepaidItems`를 적재하고 잔액은 **항등식으로 계산**합니다. 하드코딩하면 §0.10을 위반한 상태가 만들어질 수 있습니다.
> 
> 
> D-3에는 기록이 없습니다 (0짜리만 먹은 날). 체크인은 3일치 그대로라 리포트 표본에 영향이 없습니다.
> 

**`demo-judge-05` 시드 데이터 상세** — `W2`

> **결제 화면(2,000원)을 보여주려면 이 계정이 필요합니다.** `W1`은 무료, `W4`는 3,500원이라 2주 플로우가 심사에서 빠집니다 (§14.4).
> 

```json
{
  "challenge": { "period": "W2", "budget": 170, "dayIndex": 8, "status": "ACTIVE" },
  "records": [
    { "date": "D-5", "menu": "칼국수",   "points": 80, "adjustedPoints": 40, "haggleTurns": 4 },
    { "date": "D-3", "menu": "김밥",     "points": 20, "adjustedPoints": null, "haggleTurns": 0 },
    { "date": "D-1", "menu": "제육볶음", "points": 15, "adjustedPoints": null, "haggleTurns": 0 }
  ],
  "prepaidItems": [ { "name": "토요일 저녁 약속", "points": 5, "weekday": "SAT" } ]
}
```

| 항목 | 계산 | 값 |
| --- | --- | --- |
| `spent` | `40 + 20 + 15` | **75** |
| `prepaid` | 토요일 약속 | **5** |
| `balance` | `170 − 75 − 5` | **90** ✓ |
| `gaugePercent` | `round(90/170×100)` | **53** |
| `pace.expectedBalance` | `round(170 × 6/14)` | **73** |
| `pace.diff` | `90 − 73` | **+17** (`AHEAD`) |

**`demo-judge-04` 시드 데이터 상세** — `W4` 12일차

```json
{
  "challenge": { "period": "W4", "optionKey": "AS_IS", "budget": 340, "dayIndex": 12, "status": "ACTIVE" },
  "records": [
    { "date": "D-9", "menu": "칼국수",   "points": 80, "adjustedPoints": 40, "haggleTurns": 5 },
    { "date": "D-4", "menu": "제육볶음", "points": 15, "adjustedPoints": null, "haggleTurns": 0 },
    { "date": "D-1", "menu": "된장찌개", "points": 5,  "adjustedPoints": null, "haggleTurns": 0 }
  ],
  "prepaidItems": []
}
```

| 항목 | 계산 | 값 |
| --- | --- | --- |
| `budget.total` | `AS_IS` `85 × 4` | **340** |
| `budget.spent` | `40 + 15 + 5` | **60** |
| `budget.prepaid` | 없음 | **0** |
| `budget.balance` | `340 − 60 − 0` | **280** ✓ |
| `gaugePercent` | `round(280/340×100)` | **82** |
| `pace.expectedBalance` | `round(340 × 16/28)` | **194** |
| `pace.diff` | `280 − 194` | **+86** (`AHEAD`) |
| 화면 3 표시 | `budget` | **280 / 340** |

**`demo-judge-03` 시드 조건** — 리포트의 발견 문장이 나오려면 아래를 만족해야 합니다.

| 조건 | 값 | 근거 |
| --- | --- | --- |
| 체크인 응답 일수 | 6/7일 | 표본 크기 확보 (임계 제약은 없음) |
| 40+ 섭취 다음날 `BLOAT=BAD` | 3일 중 2일 | 비율 2.4배가 나오도록 |
| 40 미만 다음날 `BLOAT=BAD` | 4일 중 1일 | 동일 |
| 총 소비 | 78 / 85 | 화면 7 수치 |
| 흥정 절감 합계 | 132 | 화면 7 수치 |
| 최고 합의 | 라면 1봉지 80 → 반봉지 + 계란 40 (수요일 저녁) | 화면 7 수치 |

### 14.6 데모 전용 엔드포인트

> `APP_ENV != demo|local`이면 전부 404. 인증은 필요합니다.
> 

#### `POST /demo/seed`

계정 상태를 특정 시나리오로 강제 세팅합니다. **발표 중 사고 복구용**으로도 씁니다.

**Request**

```json
{ "scenario": "DAY4_ACTIVE" }
```

| `scenario` | 결과 |
| --- | --- |
| `FRESH` | 챌린지 삭제, 신규 상태로 |
| `DAY4_ACTIVE` | 14.5의 `demo-judge-02` 상태 |
| `COMPLETED` | 14.5의 `demo-judge-03` 상태 |
| `W2_DAY8` | 14.5의 `demo-judge-05` 상태 |
| `W4_DAY12` | 14.5의 `demo-judge-04` 상태 |
| `LOW_BALANCE` | 잔액 5 — 양 조절로도 초과를 못 피하는 케이스. `frame=REDUCE_OVERFLOW` 시연용 (§7.6) |
| `EXPIRED_CONFIRM` | 어제 흥정한 미기록 항목 1건 보유. 만료 확인 시트 시연용 (§6.8) |

**Response 200**

```json
{ "mocked": true, "scenario": "DAY4_ACTIVE", "challengeId": "chl_demo_...", "balance": 52 }
```

#### `POST /demo/reset`

해당 계정의 모든 데이터 삭제. **Response 204**

#### `POST /demo/advance-day`

하루를 앞당깁니다. 체크인 누적·리포트 생성을 라이브로 보여줄 때.

**Request** `{ "days": 1 }`**Response 200** `{ "mocked": true, "dayIndex": 5, "status": "ACTIVE" }`

#### `POST /demo/run-batch`

`PREPAID` → `RECORDED` 전환(§6.5)과 **05:00 만료 배치**(§6.8)를 즉시 실행합니다.

**Request** `{ "jobs": ["PREPAID_CONVERT", "ITEM_EXPIRY"] }`

**Response 200** `{ "mocked": true, "converted": 1, "expired": 2, "canceled": 1 }`

### 14.7 실연동 시 교체 지점

목을 걷어낼 때 **손대야 할 곳 전부**입니다. 그 외 코드는 건드리지 않습니다.

| # | 모듈 | 현재 | 교체 후 |
| --- | --- | --- | --- |
| 1 | `auth/KakaoVerifier` | `idToken`을 그대로 통과 | 카카오 공개키(JWKS)로 서명·`aud`·`exp` 검증 |
| 2 | `payment/ReceiptVerifier` | 항상 `PAID` | App Store / Play Billing 영수증 검증 API |
| 3 | `payment/Provider` enum | `MOCK` 포함 | `MOCK` 제거 |
| 4 | `notification/Sender` | no-op | FCM / APNs 발송 |
| 5 | `share/CardRenderer` | 클라이언트 캡처 업로드 | 서버 렌더 + CDN 업로드 |
| 6 | `batch/PrepaidConverter` | 수동 트리거 | 스케줄러 등록 (KST 05:00 — 만료 배치와 동시) |
| 7 | `analytics/MeasuredPriceCollector` | 로그 출력 | 파이프라인 적재 |
| 8 | 라우터 | `/demo/*` 등록 | 라우트 제거 |

**교체 후 검증 체크리스트**

- [ ]  `mocked` 필드가 어떤 응답에도 나타나지 않는다
- [ ]  `/demo/*` 전부 404
- [ ]  `provider: "MOCK"`이 400 `VALIDATION_FAILED`
- [ ]  위조 `idToken`으로 401 `TOKEN_INVALID`
- [ ]  2주 챌린지를 `paymentId` 없이 시작하면 402 `PAYMENT_REQUIRED`
- [ ]  무료 체험 소진 계정이 1주를 다시 시작하면 403 `FREE_TRIAL_USED`

### 14.8 심사 대응 문구

기획안·발표에 그대로 쓸 수 있는 표현입니다. **숨기지 말고 먼저 밝히는 쪽이 유리합니다.**

> **구현 범위에 대하여**
> 
> 
> 이번 제출 빌드는 소셜 로그인과 결제를 목 처리했습니다. 두 기능은 외부 심사·인증서 발급에 리드타임이 필요한 반면 제품의 핵심 주장과는 무관해서, 한정된 기간을 **AI 메뉴 추정과 흥정 대화의 완성도**에 쓰기로 했습니다.
> 
> API 계약은 실서비스와 동일하게 설계했고, 목을 걷어낼 때 교체할 지점을 8곳으로 특정해두었습니다.
> 
> 특히 결제는 **수익 모델이 아니라 커밋먼트 장치**로 설계했습니다. 2,000원은 앱스토어 수수료를 떼면 1,400원이라 매출로는 의미가 없고, 이 가격의 역할은 “진짜 할 건지 확인하는 문턱”입니다. 그래서 결제 화면의 카피도 “프리미엄 잠금 해제”가 아니라 문턱으로 씁니다. 이 논리는 목 여부와 무관하게 성립합니다.
> 

**예상 질문과 답변**

| 질문 | 답변 |
| --- | --- |
| “로그인이 실제로 되나요?” | 계약은 동일하고 검증만 스킵합니다. 카카오 앱 등록 후 검증기 한 클래스만 교체하면 됩니다 |
| “결제는 왜 안 붙였나요?” | IAP는 스토어 등록·샌드박스 계정·실기기가 필요합니다. 대신 결제가 제품에서 하는 역할(커밋먼트)은 화면과 카피에 그대로 구현돼 있습니다 |
| “그럼 뭘 만든 건가요?” | 메뉴판을 찍으면 밀가루를 정량 추정하고, 그 숫자로 AI와 양을 흥정하고, 7일치 기록에서 본인만의 상관을 찾아주는 부분 — 전부 실제로 동작합니다 |

---

## 15. AI 개발 파트

> **AI 담당자 작업 범위.** 동일 내용을 `밀당 AI 개발 파트.md`로 따로 배포합니다.
AI는 **백엔드 안의 모듈**이며, 이 장은 **공개 API 기준**으로 정리했습니다.
> 

### 15.0 한눈에

| 공개 API | 화면 | AI가 할 일 | 함수 |
| --- | --- | --- | --- |
| `POST /analyses/text` | **3c** 미니 입력창 | 메뉴 비용 책정 | `estimate_menus()` |
| `POST /scans` | **4b** 스캔 결과 | ① 메뉴 추출 ② 비용 책정 ③ 추천 코멘트 | `extract_menus()` `estimate_menus()` `write_scan_comment()` |
| `POST /hagglesPOST /haggles/{id}/messages` | **5** 밀당 대화 | 흥정 대사 + 조정안 | `reply_haggle()` |
| `GET /challenges/current` | **3** 대시보드 | 한 줄 코멘트 | `write_dashboard_tip()` |
| `GET /challenges/{id}/report` | **7** 완주 리포트 | 발견 보고서 | `write_finding()` |

**AI 미사용** — 화면 2(템플릿) · 3a(삭제) · 3b(삭제) → §7

> `estimate_menus()`는 **3c와 4b가 공유**합니다. 여기부터 만드세요.
> 

---

### 15.1 원칙 — AI는 판단, 나머지는 백엔드

| 구분 | 담당 | 예시 |
| --- | --- | --- |
| **판단** | AI 함수 | 이게 무슨 메뉴인가 · 밀가루가 얼마인가 · 뭐라고 말할까 |
| **계산** | 백엔드 | 잔액, 차감, 시뮬레이션, 게이지, 상관 통계 |
| **상태** | 백엔드 | 턴 수, 항목 상태, 합의값 보관 |
| **검증** | 백엔드 | AI 반환값이 계약을 지켰는가 (§15.8.2) |
- 흥정의 `balanceAfter: -8`을 **AI가 계산하지 않습니다.** `points: 60`만 주면 백엔드가 `52 − 60`을 합니다
- 리포트의 `2.4배`를 **AI가 세지 않습니다.** 백엔드가 통계를 내고 AI는 문장으로 옮깁니다
- `menus[]` 정렬은 **백엔드가 합니다.** AI는 순서 없이 반환해도 됩니다
- 10턴 제한은 **백엔드가 셉니다.** AI에게는 참고용 `turn`만 넘어옵니다

---

### 15.2 `POST /analyses/text` — 3c 미니 입력창

사용자가 메뉴 이름을 직접 입력 → 비용 책정 → 3a/3b에 항목 생성.

#### 15.2.1 처리 순서

```
사용자 입력 "라면"
   → BE: 캐시 조회 (메뉴명, cuisine=null)
   → [AI] estimate_menus(["라면"], mode="FREETEXT")
   → BE: 검증 → 캐시 적재 → anl_* 저장 → 응답
```

#### 15.2.2 `estimate_menus()` ★ 3c·4b 공유

```python
def estimate_menus(
    queries: list[str],          # 1~40건. 3c는 1건, 4b는 다건
    cuisine: str | None,         # 4b만. extract 결과 전달
    mode: str,                   # "FREETEXT"(3c) | "MENUBOARD"(4b)
) -> list[Estimate]
```

**반환 — `resolved=True`**

```json
{
  "query": "라면",
  "resolved": true,
  "name": "라면",
  "unit": "1봉지",
  "points": 80,
  "pm": 10,
  "confidence": "CERTAIN",
  "basis": "면 전체가 밀 — 봉지라면 1인분 기준",
  "candidates": null
}
```

**반환 — `resolved=False` (식별 실패)**

```json
{
  "query": "그거",
  "resolved": false,
  "name": null, "unit": null, "points": null, "pm": null, "confidence": null, "basis": null,
  "candidates": [
    { "name": "칼국수", "points": 80, "pm": 0,  "confidence": "CERTAIN" },
    { "name": "수제비", "points": 75, "pm": 10, "confidence": "HIGH" },
    { "name": "우동",   "points": 70, "pm": 10, "confidence": "HIGH" }
  ]
}
```

| 필드 | 제약 |
| --- | --- |
| `points` | 정수 `0~999` |
| `pm` | 정수 오차범위. `confidence=CERTAIN`이면 `0` 허용 |
| `confidence` | `CERTAIN`(확실) `HIGH`(높음) `MEDIUM`(보통) |
| `basis` | **1문장 40자 이내.** 왜 이 점수인지 |
| `unit` | **`mode="FREETEXT"`면 필수** — `1봉지` `1개` `1인분` `1마리`. **흥정의 출발점** |
| `candidates` | `resolved=False`일 때 **정확히 3개** |

#### 15.2.3 책정 규칙 3가지

1. **이진 판정 금지.** “밀가루 있음/없음”이 아니라 정량 추정 + 신뢰도. 한식은 장류에 밀이 흔해서 있음/없음으로 나누면 거의 전 메뉴가 탈락합니다
2. **사진에 안 보이는 걸 추론.** 제육볶음의 밀가루는 눈에 안 보이지만 시판 고추장 조성으로 역산합니다
3. **앵커 고정** — **칼국수 80 · 삼겹살 0.** 이 두 값으로 스케일을 잡고 나머지를 배치합니다

#### 15.2.4 참조 스케일 (와이어프레임 4b 기준)

| 메뉴 | points | pm | confidence | basis |
| --- | --- | --- | --- | --- |
| 삼겹살 | 0 | 0 | CERTAIN | 소금장만 사용 — 밀가루 없음 |
| 된장찌개 | 5 | 3 | HIGH | 된장에 미량 — 시판 된장 기준 |
| 제육볶음 | 15 | 5 | MEDIUM | 시판 고추장 베이스로 추정 |
| 냉면 | 40 | 10 | MEDIUM | 면에 밀가루 혼합 — 비율은 가게마다 |
| 칼국수 | 80 | 0 | CERTAIN | 면 전체가 밀 — 기준 앵커 메뉴 |

---

### 15.3 `POST /scans` — 4b 스캔 결과

메뉴판 촬영 → 메뉴 추출 → 메뉴당 비용 책정 → 추천 코멘트. **AI를 3번 호출합니다.**

#### 15.3.1 처리 순서

```
이미지 업로드
   → BE: 리사이즈 · EXIF 제거
   → [AI ①] extract_menus(image)            → 메뉴명 + cuisine
   → BE: 캐시 조회 (메뉴명별)
   → [AI ②] estimate_menus(menus, cuisine, mode="MENUBOARD")
   → BE: points 오름차순 정렬 · 추천 메뉴 선정
   → [AI ③] write_scan_comment(target, compare_with, ...)
   → BE: 검증 → scn_* 저장 → 응답
```

> **3초 안에 끝나야 합니다.** 화면 4a 카피가 “촬영하면 3초 안에 가격표가 나와요”입니다. ①+②+③ 합계 기준입니다.
> 

#### 15.3.2 `extract_menus()` — ① 메뉴 추출

```python
def extract_menus(image: bytes) -> ExtractResult
```

```json
{
  "place": "김밥천국 성수점",
  "placeConfidence": "HIGH",
  "cuisine": "KOREAN_BUNSIK",
  "menus": ["삼겹살", "된장찌개", "제육볶음", "냉면", "칼국수"],
  "unreadableCount": 2
}
```

| 필드 | 설명 |
| --- | --- |
| `place` | 간판·헤더에서 읽은 상호. 없으면 `null` |
| `cuisine` | `KOREAN` `KOREAN_BUNSIK` `CHINESE` `JAPANESE` `WESTERN` `CAFE` `ETC` — **②의 힌트로 전달** |
| `menus` | **정렬 불필요.** 최대 40건. 빈 배열이면 백엔드가 422 `ANALYSIS_FAILED` |
| `unreadableCount` | 흐림·잘림으로 못 읽은 항목 수 |
- 이미지는 백엔드가 리사이즈·EXIF 제거를 마친 상태로 넘어옵니다

#### 15.3.3 `estimate_menus()` — ② 비용 책정

**§15.2.2와 같은 함수입니다.** `mode="MENUBOARD"`, `cuisine`을 채워 배치로 호출합니다.

- `mode="MENUBOARD"`에서는 `unit`이 선택입니다 (메뉴판 항목은 대개 1인분 기준)
- 최대 40건을 **한 번에** 처리하세요. 건당 호출하면 3초를 넘깁니다

#### 15.3.4 `write_scan_comment()` — ③ 추천 코멘트

> **추천 메뉴 자체는 백엔드가 고릅니다.** 규칙은 “`잔액 ÷ 남은 끼수` 이하인 메뉴 중 가장 비싼 것”. AI는 정해진 메뉴의 **대사만** 씁니다. 추천을 AI에 맡기면 잔액 계산이 다시 모델로 들어갑니다.
> 

```python
def write_scan_comment(
    target: Menu,          # BE가 고른 추천 메뉴 {name, points}
    compare_with: Menu,    # 비교 대상 {name, points}
    budget: Budget,        # {balance, meals_left}
    place: str | None,
) -> str
```

**반환**

```json
"\"냉면(40)을 고르면 내일 점심은 0짜리만 가능해요. 15면 남는 장사죠.\""
```

| # | 제약 |
| --- | --- |
| 1 | **`compare_with` 메뉴를 반드시 1개 언급.** 비교 없이 추천만 하면 근거가 없어 보입니다 |
| 2 | 2문장 이내, 90자 이내 |
| 3 | 금지 어휘 (§15.8.3) 미포함 |
| 4 | 잔액 산술을 직접 하지 않고 전달된 값만 인용 |

---

### 15.4 `POST /haggles` · `POST /haggles/{id}/messages` — 5 밀당 대화

세션 시작(오프닝) 1회 + 매 턴 최대 10회. **같은 함수**로 처리합니다.

#### 15.4.1 `reply_haggle()`

```python
def reply_haggle(ctx: HaggleContext) -> HaggleReply
```

**입력 `ctx`**

```json
{
  "target": { "name": "라면", "unit": "1봉지", "points": 80, "pm": 10, "basis": "면 전체가 밀 — 봉지라면 1인분" },
  "budget": { "balance": 52, "total": 85, "mealsLeft": 4, "daysLeft": 3 },
  "entryPoint": "FREE",
  "frame": "SAVE",
  "turn": 2,
  "maxTurns": 10,
  "currentAgreed": { "key": "half", "label": "반봉지 + 계란", "points": 40 },
  "lastAgreement": { "label": "반봉지 + 계란", "points": 40, "daysAgo": 6 },
  "history": [
    { "role": "user", "text": "반만 먹을게" },
    { "role": "assistant", "text": "반봉지에 계란 하나 풀면 40입니다...", "proposalPoints": 40 },
    { "role": "user", "text": "너무 적어" }
  ]
}
```

| 필드 | 설명 |
| --- | --- |
| `entryPoint` | `PROMISE`(3a) `SCAN`(4b) `FREE`(3b) — 오프닝 톤과 칩이 달라짐 |
| `frame` | `SAVE`(잔액 ≥ 0) / `REDUCE_OVERFLOW`(잔액 < 0) — §15.4.3 |
| `currentAgreed` | 직전까지의 합의값. 없으면 `null` |
| `lastAgreement` | 같은 메뉴의 과거 합의 이력. 있으면 오프닝에서 언급 |
| `turn` | **`0`이면 오프닝 생성 모드** (`POST /haggles`에서 호출) |

**반환 — 일반 턴**

```json
{
  "text": "그럼 3/4봉지 60. 대신 국물은 좀 남기시죠 — 스프에도 밀이 조금 있습니다.",
  "proposal": { "key": "three", "label": "3/4봉지", "points": 60, "lever": "AMOUNT", "basis": "면 3/4 · 국물 절반" }
}
```

**반환 — 오프닝 (`turn: 0`)**

```json
{
  "text": "라면 1봉지 80이요. 잔액 52니까 그대로면 −28입니다. 라면을 버리라는 얘기는 안 해요 — 얼마나 먹을지만 정합시다.",
  "proposal": null,
  "chips": ["반만 먹을게", "너무 적어", "더 깎아줘", "그대로 먹을래"]
}
```

**반환 — 설명만 하는 턴** (잔액 질문 등)

```json
{ "text": "지금 합의값이면 남는 걸로 금요일 저녁 한 번은 됩니다. 더 줄이면 그만큼 여유가 생기고요.", "proposal": null }
```

#### 15.4.2 제약 12개

| # | 규칙 |
| --- | --- |
| 0 | `budget.balance`는 **챌린지 전체의 남은 예산**이다 (명세서 §0.11). “이번 주” 같은 주 단위 표현을 쓰지 않는다 |
| 1 | `proposal.label`은 **`target.name`과 같은 메뉴**의 양·구성 표현. 다른 메뉴명 금지 (`쌀국수`, `샐러드로 대체` ✕) |
| 2 | `proposal.points` ≤ `target.points` |
| 3 | `text`는 2문장 이내, 90자 이내 |
| 4 | 금지 어휘 (§15.8.3) 미포함 |
| 5 | 사용자가 “그대로”를 택하면 `points = target.points`로 제안하고 판정하지 않는다 |
| 6 | `turn == maxTurns`면 `text` 말미에 정리 유도 1문장을 붙인다 |
| 7 | 사용자가 숫자를 말하면(`40으로 하자`) 가장 가까운 조정안으로 합의 확정 |
| 8 | 설명만 필요한 턴은 `proposal: null` |
| 9 | **`lever`는 `AMOUNT`(양) `COMPOSITION`(구성 비율) 2종만.** 조리법·부위 조정 금지 |
| 10 | `frame`이 `REDUCE_OVERFLOW`면 §15.4.3 어법을 따른다 |
| 11 | `lastAgreement`가 있으면 오프닝에서 반드시 언급한다 |

> **1번이 가장 자주 깨집니다.** 모델은 “라면 대신 쌀국수”를 자연스럽게 제안하려 합니다. 이 제품에서 그건 **완곡한 금지**라 금지어와 같은 취급입니다. 검증 테스트를 먼저 작성하세요.
> 

#### 15.4.3 초과 상태 어법 (`frame: REDUCE_OVERFLOW`)

| `frame` | 흥정의 목표 |
| --- | --- |
| `SAVE` | 얼마나 **남길까** |
| `REDUCE_OVERFLOW` | 얼마나 **덜 깊어질까** |

| 구분 | 예시 |
| --- | --- |
| ✅ | “그대로면 −75입니다. 면 1/3이면 −20 — 55만큼 덜 깊어져요.” |
| ✅ | “오늘은 여기까지가 최선이에요. 내일 아침은 0짜리로 시작하시죠.” |
| ❌ | “예산이 없어요. 오늘은 접으시죠.” |
| ❌ | “이미 초과예요. 지금이라도 참으시면…” |

#### 15.4.4 조정 단계 참조

| 메뉴 | 원래 | 1차 제안 | 2차 절충 | lever |
| --- | --- | --- | --- | --- |
| 라면 | 1봉지 80 | 반봉지 + 계란 40 | 3/4봉지 60 | `AMOUNT` |
| 라면 | 1봉지 80 | 면 1/3 + 야채 25 | — | `COMPOSITION` |
| 빵 | 1개 45 | 반쪽 + 아메리카노 22 | 3/4쪽 34 | `AMOUNT` |
| 떡볶이 | 1인분 55 | 반인분 + 어묵 30 | 2/3인분 37 | `AMOUNT` |
| 치킨 | 1마리 70 | 반마리 + 무 35 | 3조각 50 | `AMOUNT` |

---

### 15.5 `GET /challenges/current` — 3 대시보드 한 줄 코멘트

> **렌더 차단 금지.** 대시보드 진입마다 호출하면 1초가 붙습니다. **매일 05:00 배치**로 생성해 DB에 저장하고, 조회 시에는 읽기만 합니다.
> 

#### 15.5.1 `write_dashboard_tip()`

```python
def write_dashboard_tip(
    challenge: dict,           # {period, dayIndex, budget, balance}
    signals: list[Signal],     # BE가 집계해서 전달
    recent_tip_bases: list[str],
) -> Tip
```

**입력 예시**

```json
{
  "challenge": { "period": "W1", "dayIndex": 4, "budget": 85, "balance": 52 },
  "signals": [
    { "type": "OVERSPEND_PATTERN", "detail": "초과 3건이 모두 FRI DINNER" },
    { "type": "RECENT_WIN", "detail": "라면 80→40 합의 (D-1)" }
  ],
  "recentTipBases": ["RECENT_WIN", "GENERIC"]
}
```

| 필드 | 설명 |
| --- | --- |
| `signals` | **백엔드가 SQL로 집계해 넘깁니다.** AI가 원본 기록을 뒤지지 않습니다 |
| `signals[].type` | `OVERSPEND_PATTERN` `RECENT_WIN` `PACE_AHEAD` `PACE_BEHIND` `CHECKIN_CORRELATION` |
| `recentTipBases` | 최근 3일간 쓴 `basis`. **중복 회피용** |

**반환**

```json
{ "text": "초과 3번이 전부 금요일 저녁이었어요. 이번 금요일만 제가 이기면 됩니다.", "basis": "OVERSPEND_PATTERN" }
```

| # | 제약 |
| --- | --- |
| 1 | **본인 기록에서 읽은 것만** 말한다. `signals`에 없는 사실을 지어내지 않는다 |
| 2 | `signals`가 비면 `basis: "GENERIC"`으로 짧게 |
| 3 | `basis`는 전달받은 `signals[].type` 중 하나 (또는 `GENERIC`) |
| 4 | `recent_tip_bases`에 있는 `basis`는 피한다 |
| 5 | 2문장 이내, 90자 이내 · 금지 어휘 미포함 |

---

### 15.6 `GET /challenges/{id}/report` — 7 완주 리포트

챌린지 완주 시 **1회 사전 생성**. 조회 시 재생성하지 않습니다.

#### 15.6.1 `write_finding()`

```python
def write_finding(stats: dict, challenge: dict, haggle: dict) -> Finding
```

**입력**

```json
{
  "stats": {
    "conditionKey": "BLOAT",
    "thresholdPoints": 40,
    "ratio": 2.4,
    "highGroup": { "days": 3, "badCount": 2 },
    "lowGroup":  { "days": 4, "badCount": 1 },
    "answeredDays": 6,
    "totalDays": 7
  },
  "challenge": { "period": "W1", "totalSpent": 78, "budget": 85 },
  "haggle": { "totalSaved": 132, "avgTurns": 4.2 }
}
```

**반환**

```json
{
  "headline": "밀가루 40+ 섭취한 다음날, 더부룩함 보고율 2.4배",
  "sampleNote": "응답 6/7일 · 표본이 작아\"경향\"으로 읽어주세요"
}
```

| # | 제약 |
| --- | --- |
| 1 | **통계는 이미 계산되어 들어옵니다.** `ratio`를 다시 세지 않고 문장으로만 옮깁니다 |
| 2 | `headline`에 `ratio` 값이 그대로 등장해야 한다 |
| 3 | **인과 단정 금지** — “때문에” “원인은” “유발” ✕ / “다음날” “경향” ○ |
| 4 | **의학 표현 금지** — 진단명·질환명 사용 ✕ |
| 5 | 고섭취군·저섭취군 중 한쪽이 0일이면 호출되지 않습니다 (백엔드가 차단, §9.1) |
| 6 | `sampleNote`는 표본이 작을수록(2~3일) 더 강하게 경고한다 |
| 7 | `challenge.budget`은 **기간 총액**이다 (`AS_IS` 기준 `W1` 85 · `W2` 170 · `W4` 340). 주간 예산이 아니다 (§9.1) |

---

### 15.7 AI 미사용 구간

#### 15.7.1 화면 2 — 조정 안내는 템플릿

```
빡세게 가고 싶으면 총 {hardTotalBudget}까지 내려드릴 수 있어요.
```

| 변수 | 출처 |
| --- | --- |
| `hardTotalBudget` | `POST /challenges/{id}/budget/estimate` → `options[key=HARD].totalBudget` (**기간 총액**) |

**`startTip`도 템플릿**입니다 — 3문항 조합이 27가지뿐이라 문구 뱅크로 충분합니다. 제약은 2문장 이내·90자 이내. **온보딩 전체 AI 호출 0회.**

#### 15.7.2 화면 3a — 코멘트 삭제

항목 카드(`52 → −18 초과`)와 `밀당하기` 버튼이 같은 말을 이미 하고 있습니다. **대체 없음, API 변경 없음.**

#### 15.7.3 화면 3b — 코멘트 삭제 → 합계 행

```
총 2건 · 60  ·  기록하면 잔액 −8
```

| 표시 | 출처 |
| --- | --- |
| 건수 · 합계 · 기록 후 잔액 | `GET /items` → `summary.count` `summary.totalPoints` `summary.balanceAfterAll` |

**API 변경 없습니다.** `summary`가 이미 값을 줍니다.

#### 15.7.4 화면 3b — `자주 먹는 것` 칩은 백엔드 전용

목록은 **최근 4주 입력 빈도 상위 4개**를 SQL로 집계한 결과입니다. 판단이 아니라 카운트라 AI가 관여하지 않습니다.

칩을 탭하면 3c를 건너뛰고 항목이 바로 생성되며, 가격은 `(메뉴명, cuisine)` **캐시에 저장된 분석 결과**를 재사용합니다. 캐시가 만료된 경우에만 `estimate_menus()`가 1회 호출됩니다. 공개 API는 `GET /presets` (§6.7).

#### 15.7.5 밀당이가 말하는 곳 — 4군데로 확정

| 화면 | 성격 |
| --- | --- |
| 3 대시보드 | 본인 기록에서 읽은 관찰 |
| 4b 스캔 결과 | 메뉴 비교 판단 |
| 5 밀당 대화 | 협상 (주 무대) |
| 7 리포트 | 발견 보고 |

**이 4곳 외에는 밀당이가 말하지 않습니다.** 모든 화면에서 한 마디씩 하면 톤 규칙(**잔소리 없음**)에 어긋납니다.

---

### 15.8 백엔드 경계 · 검증

#### 15.8.1 AI에 위임하지 않는 것

| # | 항목 | 위임 시 문제 |
| --- | --- | --- |
| 1 | 모든 산술 — 잔액, 차감, 시뮬레이션, 게이지 % | 숫자가 틀리면 예산제가 무너짐 |
| 2 | 턴 카운트와 10턴 제한 | 클라이언트·AI 모두 신뢰 불가 |
| 3 | 항목 상태 전이 | 데이터 정합성 |
| 4 | `points` 오름차순 정렬 | 화면 계약이라 결정적이어야 함 |
| 5 | 추천 메뉴 선정 | 잔액 계산이 모델로 새어 들어감 |
| 6 | 팁의 패턴 집계 (`signals`) | 집계는 SQL이 정확하고 저렴함 |
| 7 | 리포트 상관 통계 (`ratio`) | 재현 가능해야 함 |
| 8 | AI 반환값 검증·재시도·폴백 | AI가 스스로를 검증할 수 없음 |
| 9 | 캐시·Rate limit | 비용 통제 |

#### 15.8.2 검증 게이트

> 백엔드는 AI 반환값을 **그대로 내보내지 않습니다.** 아래를 통과한 것만 공개 API 응답에 실립니다.
> 

| 함수 | 검증 항목 | 실패 시 |
| --- | --- | --- |
| `extract_menus()` | `menus` 40건 이하 · `cuisine` 열거값 | 재시도 1회 → 422 `ANALYSIS_FAILED` |
| `estimate_menus()` | `points` 정수 `0~999` · `basis` 40자 이내 · `candidates` 정확히 3개 · `FREETEXT`면 `unit` 존재 | 재시도 1회 → 422 `ANALYSIS_FAILED` |
| `write_scan_comment()` | `compare_with` 메뉴명 포함 · 90자 이내 · 금지 어휘 | 재시도 1회 → 코멘트 영역 숨김 |
| `reply_haggle()` | **`proposal.label`이 `target.name`과 같은 메뉴** · `points ≤ target.points` · `lever ∈ {AMOUNT, COMPOSITION}` · 90자 이내 · 금지 어휘 | 재시도 1회 → **규칙 폴백** (`AMOUNT` 50% → 75% → 33%) |
| `write_dashboard_tip()` | 90자 이내 · `basis`가 전달한 `signals`에 존재 · 금지 어휘 | 재시도 1회 → `tip: null` (영역 숨김) |
| `write_finding()` | 인과 단정 어휘 미포함 · `headline`에 `ratio` 등장 | 재시도 1회 → 템플릿 문장 |

#### 15.8.3 금지 어휘 사전

```
[흥정 · 팁 · 코멘트 공통]
먹지 마 · 참으세요 · 실패 · 대신 ~를 드세요 · 포기 · 오늘은 접

[리포트 추가]
때문에 · 원인은 · 유발 · 질환 · 진단
```

---

### 15.9 성능 · 호출량

#### 15.9.1 지연 목표

| 함수 | p95 | 캐시 | 렌더 차단 |
| --- | --- | --- | --- |
| `extract_menus()` | 2.0s | 이미지 해시 24h | ✓ (스캔 대기 화면) |
| `estimate_menus()` | 0.8s (배치 40건) | **`(메뉴명, cuisine)` 전역 30일** | ✓ |
| `write_scan_comment()` | 0.7s | 없음 | ✓ |
| `reply_haggle()` | 1.2s | 없음 | ✓ (타이핑 인디케이터) |
| `write_dashboard_tip()` | 1.0s | **배치 생성 · DB 저장** | ✕ |
| `write_finding()` | 1.5s | `challengeId` 영구 | ✕ (사전 생성) |

#### 15.9.2 사용자당 호출량 (1주 챌린지 추정)

| 함수 | 호출 수 | 비고 |
| --- | --- | --- |
| `extract_menus()` | 3 | 스캔 3회 가정 |
| `estimate_menus()` | 3 + 10 | 스캔 배치 3 + 수기 입력 10 (**캐시 히트 시 대부분 0**) |
| `write_scan_comment()` | 3 |  |
| `reply_haggle()` | 26 | 5세션 × (오프닝 1 + 평균 4.2턴) |
| `write_dashboard_tip()` | 7 | 일 1회 배치 |
| `write_finding()` | 1 |  |
| **합계** | **약 53회** | 캐시 적용 시 40회 내외 |

전역 캐시는 개인정보를 담지 않습니다 — 키는 메뉴명과 `cuisine`뿐입니다.

---

### 15.10 착수 순서

1. **`estimate_menus()`** — 3c·4b가 공유하는 핵심. 앵커 2개(칼국수 80 · 삼겹살 0)로 스케일부터 고정
2. **`reply_haggle()`** — 제약 12개를 프롬프트에 넣고 **검증 테스트를 먼저** 작성. 메뉴명 동일성(제약 #1)이 가장 자주 깨짐
3. **`extract_menus()`** — 메뉴판 OCR + `cuisine` 판정
4. **`write_scan_comment()`** · **`write_dashboard_tip()`** — 프롬프트 구조가 유사해 함께 작업 가능
5. **`write_finding()`** — 입력이 이미 계산된 통계라 가장 단순

**주의**

- 어떤 함수도 `balanceAfter`·`ratio`를 계산하지 않습니다. 산술이 필요하다고 느끼면 백엔드에 입력값을 요청하세요
- `mode="FREETEXT"`에서 `unit`을 빠뜨리면 흥정이 시작점을 잃습니다
- 데모 빌드에서도 **AI는 목이 아닙니다.** 실제로 동작해야 합니다

---

## 부록 A. 결정 기록

v1의 미확정 5건을 모두 결정했습니다.

| # | 항목 | 결정 | 반영 위치 |
| --- | --- | --- | --- |
| 1 | `PENDING` 항목 유효기간 | **일자 경계 05:00 KST 자동 만료.** `PENDING`은 조용히 폐기, `HAGGLED`는 `EXPIRED`로 두고 다음 접속에 1회 확인 | §0.8 · §6.8 · §11.2 |
| 2 | 초과 기록 허용 여부 | **항상 허용.** 대신 흥정 프레임을 `SAVE` → `REDUCE_OVERFLOW`로 전환해 “덜 깊어지는” 것을 목표로 삼음 | §6.4 · §7.6 |
| 3 | `자주 먹는 것` 집계 기준 | **`original.name` 입력 빈도, 표시 가격도 `original`.** 과거 합의값은 칩이 아니라 흥정 오프닝에서 언급 | §6.7 · §7.1 · §15.4 |
| 4 | 조리법 레버 신뢰도 | **레버 자체를 제외.** `AMOUNT` `COMPOSITION` 2종만 유지 | §0.5 · §7.2 · §15.4 |
| 5 | 미기록 항목 이월 | **이월 규칙 불필요** (#1이 해결) — 하루를 넘기는 미기록 항목이 없음 | §6.8 |

---

## 부록 B. 남은 미확정

| # | 항목 | 영향 범위 | 결정 시점 |
| --- | --- | --- | --- |
| 1 | `EXPIRED` 확인 시트를 푸시로도 보낼지 | 알림 정책 | 실연동 시 |
| 2 | 조리법 레버 재도입 여부 (부록 A #4 재검토) | `Lever` enum · §15.4.2 | v2 |
| 3 | 예산 직접 입력(`CUSTOM`) 허용 여부 | §3.3 · §3.4 | v2 |
| 4 | 같은 항목 재흥정 횟수 상한 (현재 무제한, 턴만 초기화) | §7.1 | 사용 데이터 확인 후 |
| 5 | 스캔 실측값(§5.6)의 타 사용자 반영 기준 | 분석 파이프라인 | 데이터 축적 후 |
| 6 | **구간별 예산 분할 도입 여부** (현재 기간 총액 단일) | §0.10 · §3.3 · §3.5 | `W4` 완주율 확인 후 |

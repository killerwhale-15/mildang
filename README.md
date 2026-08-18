# 밀당 PWA

`api 명세서.md`의 화면 API 매핑을 기준으로 연동되어 있습니다. 공모전 데모는 `npm.cmd run build:demo`, 운영 빌드는 `npm.cmd run build:prod`를 사용합니다. 환경 설정과 실서비스 전환 지점은 [API 연동 및 배포 가이드](docs/API_INTEGRATION.md)에 정리되어 있습니다.

React와 Vite로 만든 모바일 우선 웹앱입니다. 메뉴판 촬영은 브라우저의 카메라
권한을 사용하므로 배포 환경에서는 HTTPS가 필요합니다. 로컬 개발에서는
`localhost` 또는 `127.0.0.1`로 접속하면 됩니다.

프로덕션 빌드에서 서비스 워커가 등록되며, 앱 매니페스트와 오프라인 앱 셸,
세로 화면 설정이 포함되어 있습니다.

## Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## 1. Workflow Fix

- [x] 1.1 Move Collab Server Render deployment status verification before public health verification and verify workflow YAML remains valid
- [x] 1.2 Increase deploy-hook health retry window and verify the configured `/health` endpoint is checked only after the readiness gate

## 2. Verification

- [x] 2.1 Run repository validation and inspect the generated workflow diff
- [ ] 2.2 Trigger a Collab Server semver tag deployment and verify Render reaches `live` followed by a successful health check

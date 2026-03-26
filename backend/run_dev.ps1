# 로컬 API 서버 (FastAPI)
# 사용: backend 폴더에서 .\run_dev.ps1
# 선행: .venv 활성화, backend/.env 설정, DB 마이그레이션

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .venv\Scripts\python.exe)) {
  Write-Host "가상환경이 없습니다. python -m venv .venv 후 pip install -r requirements.txt"
  exit 1
}
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

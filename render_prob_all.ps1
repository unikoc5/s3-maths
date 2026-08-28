# Render every Probability worked-solution deck (L10 Q1–25, L11 Q1–16, L12 Q1–20).
# Run from dashboard/ :  .\render_prob_all.ps1
$ErrorActionPreference = "Continue"
$scripts = @("render_prob_worked.ps1", "render_prob_l11.ps1", "render_prob_l12.ps1")
foreach ($s in $scripts) {
  Write-Host ""
  Write-Host "=== $s ===" -ForegroundColor Cyan
  & ".\$s"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

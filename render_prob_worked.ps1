# Render all L10 Probability worked-solution decks (Q1–25).
# Run from dashboard/ :  .\render_prob_worked.ps1
$ErrorActionPreference = "Continue"
$F = "manim\probability\prob_solutions.py"
$ok = 0; $fail = @()
foreach ($n in 1..25) {
  $scene = "L10Q$n"; $deck = "probability\l10q$n-solution"
  & .\render.ps1 -SceneFile $F -SceneName $scene -Deck $deck -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $scene"; $ok++ } else { "FAIL $scene (exit $LASTEXITCODE)"; $fail += $scene }
}
"=== Prob L10: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }

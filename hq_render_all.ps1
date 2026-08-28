# High-quality re-render of every worked-solution deck used in the Factorization tab.
$ErrorActionPreference = "Continue"

$jobs = @(
  @("manim\factorization\quiz_solutions.py",   "Qz1Solution",  "factorization\qz1-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz2Solution",  "factorization\qz2-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz3Solution",  "factorization\qz3-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz4Solution",  "factorization\qz4-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz5Solution",  "factorization\qz5-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz6Solution",  "factorization\qz6-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz7Solution",  "factorization\qz7-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz8Solution",  "factorization\qz8-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz10Solution", "factorization\qz10-solution"),
  @("manim\factorization\quiz_solutions.py",   "Qz11Solution", "factorization\qz11-solution"),
  @("manim\factorization\q9_solution.py",      "Q9Solution",   "factorization\q9-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa1Solution",  "factorization\qa1-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa4Solution",  "factorization\qa4-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa10Solution", "factorization\qa10-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa12Solution", "factorization\qa12-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa13Solution", "factorization\qa13-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa19Solution", "factorization\qa19-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa22Solution", "factorization\qa22-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa23Solution", "factorization\qa23-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa30Solution", "factorization\qa30-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa40Solution", "factorization\qa40-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa46Solution", "factorization\qa46-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa61Solution", "factorization\qa61-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa66Solution", "factorization\qa66-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa69Solution", "factorization\qa69-solution"),
  @("manim\factorization\main_a_solutions.py", "Qa70Solution", "factorization\qa70-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb6Solution",  "factorization\qb6-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb10Solution", "factorization\qb10-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb22Solution", "factorization\qb22-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb36Solution", "factorization\qb36-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb45Solution", "factorization\qb45-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb47Solution", "factorization\qb47-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb52Solution", "factorization\qb52-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb53Solution", "factorization\qb53-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb56Solution", "factorization\qb56-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb59Solution", "factorization\qb59-solution"),
  @("manim\factorization\main_b_solutions.py", "Qb62Solution", "factorization\qb62-solution")
)

$ok = 0; $fail = @()
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[1])"; $ok++ } else { "FAIL $($j[1]) (exit $LASTEXITCODE)"; $fail += $j[1] }
}
"=== HQ DONE: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }

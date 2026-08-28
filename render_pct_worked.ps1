# Auto-generated batch render for Percentage worked solutions.
# Run from dashboard/:  .\render_pct_worked.ps1
# Optional: .\render_pct_worked.ps1 -Quality m   (faster preview)
param(
  [string]$Quality = 'h',
  [switch]$Force
)
$ErrorActionPreference = 'Continue'
$Here = $PSScriptRoot
$jobs = @(
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q1aSolution'; Deck = 'percentage/l04q1a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q1bSolution'; Deck = 'percentage/l04q1b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q1cSolution'; Deck = 'percentage/l04q1c-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q10Solution'; Deck = 'percentage/l04q10-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q11Solution'; Deck = 'percentage/l04q11-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q12Solution'; Deck = 'percentage/l04q12-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q13Solution'; Deck = 'percentage/l04q13-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q14Solution'; Deck = 'percentage/l04q14-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q15aSolution'; Deck = 'percentage/l04q15a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q15bSolution'; Deck = 'percentage/l04q15b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q15cSolution'; Deck = 'percentage/l04q15c-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q16aSolution'; Deck = 'percentage/l04q16a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q16bSolution'; Deck = 'percentage/l04q16b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q17Solution'; Deck = 'percentage/l04q17-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q18aSolution'; Deck = 'percentage/l04q18a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q18bSolution'; Deck = 'percentage/l04q18b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q19Solution'; Deck = 'percentage/l04q19-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q2Solution'; Deck = 'percentage/l04q2-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q20aSolution'; Deck = 'percentage/l04q20a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q20biSolution'; Deck = 'percentage/l04q20bi-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q20biiSolution'; Deck = 'percentage/l04q20bii-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q21Solution'; Deck = 'percentage/l04q21-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q22Solution'; Deck = 'percentage/l04q22-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q23Solution'; Deck = 'percentage/l04q23-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q24Solution'; Deck = 'percentage/l04q24-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q25Solution'; Deck = 'percentage/l04q25-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q26Solution'; Deck = 'percentage/l04q26-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q3aSolution'; Deck = 'percentage/l04q3a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q3bSolution'; Deck = 'percentage/l04q3b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q3cSolution'; Deck = 'percentage/l04q3c-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q4Solution'; Deck = 'percentage/l04q4-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q5Solution'; Deck = 'percentage/l04q5-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q6Solution'; Deck = 'percentage/l04q6-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q7Solution'; Deck = 'percentage/l04q7-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q8aSolution'; Deck = 'percentage/l04q8a-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q8bSolution'; Deck = 'percentage/l04q8b-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q8cSolution'; Deck = 'percentage/l04q8c-solution' },
  @{ File = 'manim\percentage\worked_l04.py'; Name = 'L04Q9Solution'; Deck = 'percentage/l04q9-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q1Solution'; Deck = 'percentage/l05q1-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q10aSolution'; Deck = 'percentage/l05q10a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q10bSolution'; Deck = 'percentage/l05q10b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q11aSolution'; Deck = 'percentage/l05q11a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q11bSolution'; Deck = 'percentage/l05q11b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q12aSolution'; Deck = 'percentage/l05q12a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q12bSolution'; Deck = 'percentage/l05q12b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q13aSolution'; Deck = 'percentage/l05q13a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q13bSolution'; Deck = 'percentage/l05q13b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q14aSolution'; Deck = 'percentage/l05q14a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q14bSolution'; Deck = 'percentage/l05q14b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q15aSolution'; Deck = 'percentage/l05q15a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q15bSolution'; Deck = 'percentage/l05q15b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q16aSolution'; Deck = 'percentage/l05q16a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q16bSolution'; Deck = 'percentage/l05q16b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q17Solution'; Deck = 'percentage/l05q17-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q18Solution'; Deck = 'percentage/l05q18-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q19aSolution'; Deck = 'percentage/l05q19a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q19bSolution'; Deck = 'percentage/l05q19b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q2Solution'; Deck = 'percentage/l05q2-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q20Solution'; Deck = 'percentage/l05q20-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q21Solution'; Deck = 'percentage/l05q21-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q22Solution'; Deck = 'percentage/l05q22-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q23Solution'; Deck = 'percentage/l05q23-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q24aSolution'; Deck = 'percentage/l05q24a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q24bSolution'; Deck = 'percentage/l05q24b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q25aSolution'; Deck = 'percentage/l05q25a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q25bSolution'; Deck = 'percentage/l05q25b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q26aSolution'; Deck = 'percentage/l05q26a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q26bSolution'; Deck = 'percentage/l05q26b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q27aSolution'; Deck = 'percentage/l05q27a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q27bSolution'; Deck = 'percentage/l05q27b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q3aSolution'; Deck = 'percentage/l05q3a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q3bSolution'; Deck = 'percentage/l05q3b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q4Solution'; Deck = 'percentage/l05q4-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q5Solution'; Deck = 'percentage/l05q5-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q6aSolution'; Deck = 'percentage/l05q6a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q6bSolution'; Deck = 'percentage/l05q6b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q7aSolution'; Deck = 'percentage/l05q7a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q7bSolution'; Deck = 'percentage/l05q7b-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q8Solution'; Deck = 'percentage/l05q8-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q9aSolution'; Deck = 'percentage/l05q9a-solution' },
  @{ File = 'manim\percentage\worked_l05.py'; Name = 'L05Q9bSolution'; Deck = 'percentage/l05q9b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q1aSolution'; Deck = 'percentage/l06q1a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q1bSolution'; Deck = 'percentage/l06q1b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q1cSolution'; Deck = 'percentage/l06q1c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q10aSolution'; Deck = 'percentage/l06q10a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q10bSolution'; Deck = 'percentage/l06q10b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q11Solution'; Deck = 'percentage/l06q11-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q12aSolution'; Deck = 'percentage/l06q12a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q12bSolution'; Deck = 'percentage/l06q12b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q12cSolution'; Deck = 'percentage/l06q12c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q13aSolution'; Deck = 'percentage/l06q13a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q13bSolution'; Deck = 'percentage/l06q13b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q14Solution'; Deck = 'percentage/l06q14-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q15aSolution'; Deck = 'percentage/l06q15a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q15bSolution'; Deck = 'percentage/l06q15b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q15cSolution'; Deck = 'percentage/l06q15c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q16aSolution'; Deck = 'percentage/l06q16a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q16bSolution'; Deck = 'percentage/l06q16b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q17aSolution'; Deck = 'percentage/l06q17a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q17bSolution'; Deck = 'percentage/l06q17b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q18aSolution'; Deck = 'percentage/l06q18a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q18bSolution'; Deck = 'percentage/l06q18b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q18cSolution'; Deck = 'percentage/l06q18c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q19aSolution'; Deck = 'percentage/l06q19a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q19bSolution'; Deck = 'percentage/l06q19b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q19cSolution'; Deck = 'percentage/l06q19c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q19dSolution'; Deck = 'percentage/l06q19d-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q2aSolution'; Deck = 'percentage/l06q2a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q2bSolution'; Deck = 'percentage/l06q2b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q2cSolution'; Deck = 'percentage/l06q2c-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q20Solution'; Deck = 'percentage/l06q20-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q21aSolution'; Deck = 'percentage/l06q21a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q21bSolution'; Deck = 'percentage/l06q21b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q22Solution'; Deck = 'percentage/l06q22-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q23Solution'; Deck = 'percentage/l06q23-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q24Solution'; Deck = 'percentage/l06q24-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q25aSolution'; Deck = 'percentage/l06q25a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q25bSolution'; Deck = 'percentage/l06q25b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q26Solution'; Deck = 'percentage/l06q26-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q27aSolution'; Deck = 'percentage/l06q27a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q27bSolution'; Deck = 'percentage/l06q27b-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q28Solution'; Deck = 'percentage/l06q28-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q3Solution'; Deck = 'percentage/l06q3-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q4Solution'; Deck = 'percentage/l06q4-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q5Solution'; Deck = 'percentage/l06q5-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q6Solution'; Deck = 'percentage/l06q6-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q7Solution'; Deck = 'percentage/l06q7-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q8Solution'; Deck = 'percentage/l06q8-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q9aSolution'; Deck = 'percentage/l06q9a-solution' },
  @{ File = 'manim\percentage\worked_l06.py'; Name = 'L06Q9bSolution'; Deck = 'percentage/l06q9b-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ1Solution'; Deck = 'percentage/qzq1-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ2Solution'; Deck = 'percentage/qzq2-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ3Solution'; Deck = 'percentage/qzq3-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ4Solution'; Deck = 'percentage/qzq4-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ5Solution'; Deck = 'percentage/qzq5-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ6aSolution'; Deck = 'percentage/qzq6a-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ6bSolution'; Deck = 'percentage/qzq6b-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ7Solution'; Deck = 'percentage/qzq7-solution' },
  @{ File = 'manim\percentage\worked_quiz.py'; Name = 'QzQ8Solution'; Deck = 'percentage/qzq8-solution' }
)
$i = 0
$skipped = 0
$failed = 0
$failList = @()
foreach ($j in $jobs) {
  $i++
  $out = Join-Path $Here "slides\$($j.Deck)\index.html"
  if ((Test-Path $out) -and -not $Force) {
    $skipped++
    Write-Host "[$i/$($jobs.Count)] SKIP $($j.Name) (already rendered)" -ForegroundColor DarkGray
    continue
  }
  Write-Host "[$i/$($jobs.Count)] $($j.Name)" -ForegroundColor Cyan
  & (Join-Path $Here 'render.ps1') -SceneFile $j.File -SceneName $j.Name -Deck $j.Deck -Quality $Quality
  if ($LASTEXITCODE -ne 0) {
    $failed++
    $failList += $j.Name
    Write-Host "  FAILED $($j.Name) - continuing" -ForegroundColor Red
    continue
  }
}
Write-Host "Done: $($jobs.Count - $skipped - $failed) rendered, $skipped skipped, $failed failed." -ForegroundColor Green
if ($failList.Count) { Write-Host "Failed: $($failList -join ', ')" -ForegroundColor Yellow }

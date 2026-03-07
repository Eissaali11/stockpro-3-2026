$ErrorActionPreference = 'Stop'

$root = (Resolve-Path .).Path
$docsDir = Join-Path $root 'docs'
if (-not (Test-Path $docsDir)) {
  New-Item -ItemType Directory -Path $docsDir | Out-Null
}

$files = Get-ChildItem -Path $root -Recurse -File -Force -ErrorAction SilentlyContinue

$inventory = $files | ForEach-Object {
  $ext = if ([string]::IsNullOrWhiteSpace($_.Extension)) { '(none)' } else { $_.Extension.ToLower() }
  [PSCustomObject]@{
    RelativePath   = $_.FullName.Substring($root.Length + 1)
    SizeBytes      = [int64]$_.Length
    SizeKB         = [math]::Round($_.Length / 1KB, 2)
    SizeMB         = [math]::Round($_.Length / 1MB, 3)
    Extension      = $ext
    LastWriteTime  = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')
  }
}

$sorted = $inventory | Sort-Object SizeBytes -Descending
$csvPath = Join-Path $docsDir 'full-file-inventory.csv'
$sorted | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$extSummary = $inventory |
  Group-Object Extension |
  ForEach-Object {
    $sum = ($_.Group | Measure-Object SizeBytes -Sum).Sum
    [PSCustomObject]@{
      Extension = $_.Name
      Files     = $_.Count
      TotalBytes = $sum
      TotalMB    = [math]::Round($sum / 1MB, 3)
    }
  } |
  Sort-Object TotalBytes -Descending

$folderSummary = $inventory |
  ForEach-Object {
    $parts = $_.RelativePath -split '\\'
    $topFolder = if ($parts.Count -gt 1) { $parts[0] } else { '(root)' }
    [PSCustomObject]@{
      TopFolder = $topFolder
      SizeBytes = $_.SizeBytes
    }
  } |
  Group-Object TopFolder |
  ForEach-Object {
    $sum = ($_.Group | Measure-Object SizeBytes -Sum).Sum
    [PSCustomObject]@{
      TopFolder = $_.Name
      TotalBytes = $sum
      TotalMB    = [math]::Round($sum / 1MB, 3)
    }
  } |
  Sort-Object TotalBytes -Descending

$totalFiles = $inventory.Count
$totalBytes = ($inventory | Measure-Object SizeBytes -Sum).Sum
$largeFiles = $sorted | Where-Object { $_.SizeBytes -ge 1MB }

$summaryLines = New-Object System.Collections.Generic.List[string]
$summaryLines.Add('# Full File Inventory Summary')
$summaryLines.Add('')
$summaryLines.Add("GeneratedAt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$summaryLines.Add("TotalFiles: $totalFiles")
$summaryLines.Add("TotalSizeMB: $([math]::Round($totalBytes / 1MB, 3))")
$summaryLines.Add("LargeFiles(>=1MB): $($largeFiles.Count)")
$summaryLines.Add('')
$summaryLines.Add('## Top 30 Largest Files')
$summaryLines.Add('| # | File | Size MB |')
$summaryLines.Add('|---:|---|---:|')

$index = 1
foreach ($row in ($sorted | Select-Object -First 30)) {
  $summaryLines.Add("| $index | $($row.RelativePath) | $($row.SizeMB) |")
  $index++
}

$summaryLines.Add('')
$summaryLines.Add('## Size by Top-Level Folder (Top 20)')
$summaryLines.Add('| Folder | Size MB |')
$summaryLines.Add('|---|---:|')
foreach ($row in ($folderSummary | Select-Object -First 20)) {
  $summaryLines.Add("| $($row.TopFolder) | $($row.TotalMB) |")
}

$summaryLines.Add('')
$summaryLines.Add('## Size by Extension (Top 20)')
$summaryLines.Add('| Extension | Files | Size MB |')
$summaryLines.Add('|---|---:|---:|')
foreach ($row in ($extSummary | Select-Object -First 20)) {
  $summaryLines.Add("| $($row.Extension) | $($row.Files) | $($row.TotalMB) |")
}

$summaryPath = Join-Path $docsDir 'full-file-inventory-summary.md'
$summaryLines | Set-Content -Path $summaryPath -Encoding UTF8

Write-Output "INVENTORY_DONE"
Write-Output "TotalFiles=$totalFiles"
Write-Output "TotalSizeMB=$([math]::Round($totalBytes / 1MB, 3))"
Write-Output "LargeFilesGE1MB=$($largeFiles.Count)"
Write-Output "CSV=docs/full-file-inventory.csv"
Write-Output "SUMMARY=docs/full-file-inventory-summary.md"
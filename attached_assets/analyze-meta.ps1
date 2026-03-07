$meta = Get-Content 'dist/meta.json' -Raw | ConvertFrom-Json
$totals = @{}

foreach ($outProp in $meta.outputs.PSObject.Properties) {
  $out = $outProp.Value
  if ($null -ne $out.inputs) {
    foreach ($inProp in $out.inputs.PSObject.Properties) {
      $path = $inProp.Name
      $bytes = [int64]$inProp.Value.bytesInOutput
      if ($totals.ContainsKey($path)) {
        $totals[$path] += $bytes
      } else {
        $totals[$path] = $bytes
      }
    }
  }
}

Write-Output 'TOP5_INPUTS_BY_BYTES_IN_OUTPUT'
$i = 1
$totals.GetEnumerator() |
  Sort-Object Value -Descending |
  Select-Object -First 5 |
  ForEach-Object {
    Write-Output ("{0}. {1} | {2} bytes" -f $i, $_.Key, $_.Value)
    $i++
  }

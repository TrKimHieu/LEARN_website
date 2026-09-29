# Mở .docx bằng Microsoft Word (COM), cập nhật mục lục + mọi field (số trang), lưu lại,
# và xuất một bản PDF xem trước. Gọi từ build.mjs; chỉ chạy được trên Windows có cài Word.
param(
  [Parameter(Mandatory = $true)][string]$Docx,
  [Parameter(Mandatory = $true)][string]$Pdf
)
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx, $false, $false)
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $null = $doc.Fields.Update()
  # Cập nhật lần hai: mục lục dài có thể đẩy nội dung sang trang khác, làm số trang lệch.
  foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
  $doc.Save()
  $doc.ExportAsFixedFormat($Pdf, 17)
  "pages=" + $doc.ComputeStatistics(2)
  $doc.Close($false)
}
finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}

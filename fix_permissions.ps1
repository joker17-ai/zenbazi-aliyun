$keyPath = "d:\ZenBazi\aliyun_key"
Write-Host "修复私钥权限"

$acl = Get-Acl $keyPath
$acl.SetAccessRuleProtection($true, $false)
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity,"FullControl","Allow")
$acl.AddAccessRule($rule)
Set-Acl -Path $keyPath -AclObject $acl

Write-Host "完成"

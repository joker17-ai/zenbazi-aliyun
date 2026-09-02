# 修复SSH配置权限
$configPath = "$env:USERPROFILE\.ssh\config"
if (Test-Path $configPath) {
    Remove-Item $configPath -Force
    Write-Host "已删除旧的SSH配置文件"
}
New-Item -Path $configPath -ItemType File -Force | Out-Null
Write-Host "已创建新的SSH配置文件"

# 设置文件权限
$acl = Get-Acl $configPath
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("$env:USERNAME","FullControl","Allow")
$acl.AddAccessRule($rule)
Set-Acl -Path $configPath -AclObject $acl
Write-Host "已设置SSH配置文件权限"

# 测试SSH连接
Write-Host "`n正在测试SSH连接到阿里云服务器..."
$privateKeyPath = "d:\ZenBazi\aliyun_key"
$serverIP = "39.105.5.85"

$testResult = ssh -i $privateKeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$serverIP "echo 'SSH连接成功!' && whoami && uname -a"
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SSH连接成功!"
    Write-Host $testResult
} else {
    Write-Host "`n❌ SSH连接失败"
    Write-Host $testResult
}

Write-Host "`n按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

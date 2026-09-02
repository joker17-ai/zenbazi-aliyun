# SSH连接测试脚本
$privateKey = "d:\ZenBazi\aliyun_key"
$serverIP = "39.105.5.85"
$serverPort = 22
$timeout = 30  # 超时时间（秒）

Write-Host "开始测试SSH连接..."
Write-Host "服务器IP: $serverIP"
Write-Host "端口: $serverPort"
Write-Host "私钥: $privateKey"

# 测试TCP端口连接
Write-Host "`n测试端口连通性..."
$tcpClient = New-Object System.Net.Sockets.TcpClient
try {
    $connect = $tcpClient.BeginConnect($serverIP, $serverPort, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne($timeout * 1000, $false)

    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "端口 $serverPort 可达" -ForegroundColor Green
    } else {
        Write-Host "连接超时 ($timeout 秒)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "无法连接到端口 $serverPort: $_" -ForegroundColor Red
    exit 1
} finally {
    $tcpClient.Close()
}

# SSH连接测试
Write-Host "`n尝试SSH连接..."
$env:GIT_SSH_COMMAND = "ssh -i `"$privateKey`" -o StrictHostKeyChecking=no -o ConnectTimeout=$timeout -o BatchMode=yes"
$output = ssh -i $privateKey -o StrictHostKeyChecking=no -o ConnectTimeout=$timeout -o BatchMode=yes root@$serverIP "echo 'SUCCESS' && whoami 2>&1" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSSH连接成功!" -ForegroundColor Green
    Write-Host "输出: $output"
    Write-Host "`n开始检查服务器环境..."
    $envCheck = ssh -i $privateKey -o StrictHostKeyChecking=no -o ConnectTimeout=$timeout root@$serverIP "uname -a && whoami && pwd && node --version && npm --version 2>&1"
    Write-Host $envCheck
} else {
    Write-Host "`nSSH连接失败" -ForegroundColor Red
    Write-Host "退出码: $LASTEXITCODE"
    Write-Host "输出: $output"
}

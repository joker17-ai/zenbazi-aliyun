Write-Host "测试SSH连接..."

# 测试基本连接
Write-Host "测试端口连通性..."
$tcp = New-Object System.Net.Sockets.TcpClient
$tcp.Connect("39.105.5.85", 22)
Write-Host "端口22可达"
$tcp.Close()

Write-Host "尝试SSH连接..."
ssh -i "d:\ZenBazi\aliyun_key" -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@39.105.5.85 "echo '连接成功' && whoami && uname -a"

$env:STORAGE_DRIVER="oss"
$env:OSS_BUCKET="shikong-mima"
# Configure OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET outside this script.

$env:OSS_REGION="oss-cn-hangzhou"
# Configure ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET outside this script.

$env:ALIYUN_SMS_SIGN_NAME="生命时空密码"
$env:ALIYUN_SMS_TEMPLATE_CODE="SMS_463040960"
node server/server.mjs
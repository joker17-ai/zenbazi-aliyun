@echo off
set STORAGE_DRIVER=oss
set OSS_BUCKET=shikong-mima
REM Configure OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET outside this script.

set OSS_REGION=oss-cn-hangzhou
REM Configure ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET outside this script.

set ALIYUN_SMS_SIGN_NAME=生命时空密码
set ALIYUN_SMS_TEMPLATE_CODE=SMS_463040960
node server/server.mjs

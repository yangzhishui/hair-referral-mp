#!/usr/bin/env bash
# 将本项目推送到 GitHub（需先在 GitHub 网页端创建一个空仓库，不要勾选 README / .gitignore）
#
# 用法：
#   ./scripts/push-to-github.sh            # 默认：yangzhishui / hair-referral-mp / ssh
#   ./scripts/push-to-github.sh <用户名> [仓库名] [ssh|https]
set -e

USERNAME="${1:-yangzhishui}"
REPO="${2:-hair-referral-mp}"
MODE="${3:-ssh}"

cd "$(dirname "$0")/.."

if [ "$MODE" = "ssh" ]; then
  REMOTE="git@github.com:${USERNAME}/${REPO}.git"
else
  REMOTE="https://github.com/${USERNAME}/${REPO}.git"
fi

if [ ! -d .git ]; then
  git init -b main
  git config user.name "${USERNAME}"
  git config user.email "yangzs95@yeah.net"
fi

git add -A
git commit -m "feat: 毛发专病医联体全国转诊小程序（医生端 + 患者端，微信原生 + 微信云开发）"

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

echo "远程仓库: $REMOTE"
git push -u origin main

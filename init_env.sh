#!/bin/bash
# 检查conda环境是否存在
ENVIRONMENT_NAME="AuPC38"
source .bashrc
if ! conda env list | grep -q "^$ENVIRONMENT_NAME "; then
    echo "环境 $ENVIRONMENT_NAME 不存在，正在创建..."
    conda create --name $ENVIRONMENT_NAME python=3.8.10
    echo "环境 $ENVIRONMENT_NAME 已成功创建。"
else
    echo "环境 $ENVIRONMENT_NAME 已存在。"
fi
conda activate AuPC38
conda install paddlepaddle-gpu==2.4.2 cudatoolkit=11.7 -c https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/Paddle/ -c conda-forge
pip install -r requirements.txt
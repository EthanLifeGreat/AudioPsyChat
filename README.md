# Audio PsyChat：web端语音心理咨询系统

这是一个在服务器本地运行的web语音心理咨询系统，咨询系统内核使用[PsyChat](https://github.com/qiuhuachuan/PsyChat)，我们为其制作了Web前端，并拼接了ASR和TTS组件，使局域网内用户可以通过单纯的语音进行交互。其中ASR和TTS组件使用[PaddleSpeech](https://github.com/PaddlePaddle/PaddleSpeech) API。

## 使用

我们推荐使用Ubuntu 20.04.6 LTS系统与支持CUDA的显卡（显存大于16G），其中系统CUDA驱动版本不应低于11.7，推荐为12.0，python、pytorch、paddle等版本详见init_env.sh。

### 环境搭建

首先从[HuggingFace上的PsyChat目录](https://huggingface.co/qiuhuachuan/PsyChat/tree/main)下载以下模型文件：

- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00001-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00002-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00003-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00004-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00005-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00006-of-00007.bin
- https://huggingface.co/qiuhuachuan/PsyChat/blob/main/pytorch_model-00007-of-00007.bin

至 `AudioPsyChat/PsyChat/`目录

## 运行

```bash
# 解压文件并进入项目目录
cd AudioPsyChat/
# 运行创建/初始化环境脚本（需要提前安装anaconda/miniconda）
bash init_env.sh
# 运行后端程序和web服务器
python main.py
# 访问服务器ip:8086/static页面以进行交互
```



### 注意事项

若要使用语音输入，应当使浏览器允许http数据传输，在浏览器中输入：

`chrome://flags/#unsafely-treat-insecure-origin-as-secure`

填写域名或IP并选择Enabled/启用，在进入服务页面录音时点击允许录音即可。

## 免责声明
请注意，本程序仅用于学习交流，该系统不是医疗保健专业人员，不能替代医生、心理医生或其他专业人士的意见、诊断、建议或治疗。对于将本程序应用于医疗保健的行为，作者不对产生的结果负任何责任。

## DEMO
使用单卡3090能保证每次对话交互时间在1秒左右（显存占用16G左右）
[Audio PsyChat Demo](https://www.bilibili.com/video/BV13M4m1679N/)

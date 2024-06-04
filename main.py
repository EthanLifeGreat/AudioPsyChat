from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from api.ffmpeg_api import convert_opus_to_wav
from pydantic import BaseModel
from api.psy_chat_api import PsyChatModel
from paddlespeech.cli.tts.infer import TTSExecutor
from pathlib import Path as P
from paddlespeech.cli.asr.infer import ASRExecutor
from fastapi.staticfiles import StaticFiles
# from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# # 2、声明一个 源 列表；重点：要包含跨域的客户端 源
# origins = ["*"]
#
# # 3、配置 CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,  # 允许访问的源
#     allow_credentials=True,  # 支持 cookie
#     allow_methods=["*"],  # 允许使用的请求方法
#     allow_headers=["*"]  # 允许携带的 Headers
# )

app.mount("/static", StaticFiles(directory="web", html=True), name="static")


# 当用户上传录音文件，本方法用于接收和处理上传的音频文件
# TODO
@app.post('/api/audio_to_audio')
async def audio_to_audio(audio: UploadFile = File(...), history: str = Form(...)):
    if audio.filename == '':
        raise HTTPException(status_code=400, detail="No audio part")
    if not history:
        raise HTTPException(status_code=400, detail="No history part")

    try:
        # 读取音频文件
        contents = await audio.read()

        webm_path = './test/input_audio.webm'
        wav_path = './test/input_audio.wav'
        try:
            with open(webm_path, 'wb') as file:
                # 将字节流写入文件
                file.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error writing webm file: {e}")
        convert_opus_to_wav(webm_path, wav_path)

        try:
            # 调用自动语音识别（ASR）接口
            asr_text = call_asr_api(wav_path)
            # 将ASR识别结果用于调用大型语言模型（LLM）
            history += "\n" + "来访者：" + asr_text
            llm_response = call_llm_api(history)
            # llm_response = call_llm_api(asr_text)
            # 使用LLM的输出调用文本到语音（TTS）接口
            tts_audio_path = call_tts_api(llm_response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error in processing with ASR, LLM, or TTS APIs: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    # 临时数据
    # asr_text = "这是ASR的输出"
    # llm_response = "这是LLM的回应"
    # tts_audio_path = "tmp_0005.wav"

    # 返回ASR和TTS结果
    return JSONResponse(content={"asrText": asr_text, "llm_response": llm_response, "ttsAudio": tts_audio_path})


class TextItem(BaseModel):
    text: str


@app.post('/api/text_to_audio')
async def text_to_audio(item: TextItem):
    text = item.text
    if not text:
        raise HTTPException(status_code=400, detail="No text part")

    llm_response = call_llm_api(text)
    tts_audio = call_tts_api(llm_response)
    return JSONResponse(content={"llm_response": llm_response, "ttsAudio": tts_audio})


# 当用户点击“播放语音”，如果本地没有缓存那条语音，则会从服务器搜索，如果服务器没有缓存，那么调用TTS
# TODO
@app.get("/api/text_converte_audio")
async def text_converte_audio():
    # print("Current Working Directory:", os.getcwd())
    # dir_path = os.path.dirname(os.path.realpath(__file__))
    # file_path = os.path.join(dir_path, "tmp_0006.wav")
    # llm_response = "这是LLM的回应"
    # return JSONResponse(content={"llm_response": llm_response, "file_url123": file_path})

    # text = item.text
    # if not text:
    #     raise HTTPException(status_code=400, detail="No text part")

    # tts_audio = call_tts_api(llm_response)
    # return JSONResponse(content={"llm_response": llm_response, "ttsAudio": tts_audio})
    return JSONResponse(content={"temp_response": "此功能暂时未完成，请等待开发"})


asr = ASRExecutor()
tts = TTSExecutor()
llm = PsyChatModel()

# 先跑一遍ASR+TTS以加快推理速度
asr(P('./test/do_not_delete_please.wav'))
tts(text="你好，这是一段测试音频", output="./test/output.wav",
    am="fastspeech2_male", voc="pwgan_male")


# 模拟的ASR API调用函数
def call_asr_api(audio_path: str):
    # 这里应该是调用外部ASR服务的代码
    return asr(P(audio_path), force_yes=True)  # "转换后的文本"


# 模拟的LLM API调用函数
def call_llm_api(text: str):
    # 这里应该是调用外部LLM服务的代码
    return llm.new_line_with_history(text)


# 模拟的TTS API调用函数
def call_tts_api(text: str):
    # 调用外部TTS服务的代码
    output_wav_path = './web/wavs/tts.wav'
    tts(text=text, output=output_wav_path, am="fastspeech2_male", voc="pwgan_male")
    return output_wav_path


# 运行FastAPI应用
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8086)

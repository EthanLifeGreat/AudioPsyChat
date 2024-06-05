import os


def convert_opus_to_wav(webm_file_path, wav_file_path):
    ffmpeg_path = 'ffmpeg'  # ../miniconda3/envs/AuPC38/bin/ffmpeg (specify your own ffmpeg if needed)
    # 构建ffmpeg命令行
    command1 = 'rm ' + wav_file_path
    command2 = ffmpeg_path + ' -i ' + webm_file_path + ' -vn  -acodec pcm_s16le -f wav -ar 16000 -ac 1 ' + wav_file_path

    # 执行命令并等待完成
    os.system("which ffmpeg")
    os.system(command1)
    os.system(command2)


if __name__ == '__main__':
    # 示例使用
    webm_file = './test/input_audio.webm'
    wav_file = './test/input_audio.wav'
    convert_opus_to_wav(webm_file, wav_file)

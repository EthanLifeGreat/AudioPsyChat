let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let recordCount = 0; // 记录用户完成录音的次数

function toggleRecording() {
    let recordBtn = document.getElementById('record-btn');
    if (!isRecording) {
        startRecording();
        recordBtn.textContent = '停止';
        isRecording = true;
    } else {
        stopRecording();
        recordBtn.textContent = '录音';
        isRecording = false;
    }
}


function stopRecording() {
    console.log("停止录音...");
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop(); // 这会触发 'stop' 事件并执行下面的逻辑
    }
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("浏览器不支持 mediaDevices API，或者网站不支持Https。");
        return;
    }
    console.log("开始录音...");
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = []; // 清空数组以便新录音

            mediaRecorder.start();

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = []; // 重置音频块数组以备下次录音使用

                let formData = new FormData();
                formData.append("audio", audioBlob);

                // 获取聊天历史
                const messages = document.querySelectorAll('.chat-container .message span');
                let history = Array.from(messages).map(m => m.innerText).join('\n');

                // 将聊天历史作为字符串添加到表单数据
                formData.append("history", history);

                fetch("/api/audio_to_audio", {
                    method: "POST",
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    console.log("录音文件已发送", data);
                    addMessage('user', data.asrText);
                    addMessage('therapist', data.llm_response, true);
                    playTTSAudio(data.ttsAudio);
                })
                .catch(error => console.log("录音文件上传失败", error));
            });
        })
        .catch(error => console.log("获取音频流失败", error));
}

function playTTSAudio(audioUrl) {

    // 暂时手动指定
    audioUrl = "/static/wavs/tts.wav";

    // 使用fetch获取Blob
    fetch(audioUrl)
        .then(response => response.blob())
        .then(blob => {
            // 创建Blob URL
            const blobUrl = URL.createObjectURL(blob);

            // 创建audio元素并播放音频
            const audio = new Audio();
            audio.src = blobUrl;
            audio.play();

            // 可以选择在播放后释放这个Blob URL，但通常我们会在用户触发某个操作后释放
            // audio.onended = () => URL.revokeObjectURL(blobUrl);
        })
        .catch(error => console.error('Error playing TTS audio:', error));
}


function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        addMessage('user', userInput);
        document.getElementById('user-input').value = ''; // 清空输入框
        sendChatHistory(); // 发送聊天记录
    }
}

// 滚动聊天窗口到底部的函数，用于显示最新消息
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 将当前聊天记录保存到本地存储中
function saveChatHistory() {
    // 选择所有消息的span元素
    const messages = document.querySelectorAll('.chat-container .message span');
    // 将所有消息的文本内容转换为数组，然后连接成单一字符串，每条消息一行
    let history = Array.from(messages).map(m => m.innerText).join('\n');
    // 使用localStorage将整个聊天记录保存为一个字符串
    localStorage.setItem('chatHistory', history);
}

// 从本地存储加载聊天历史并显示在聊天界面上
function loadChatHistory() {
    // 从localStorage获取保存的聊天历史
    const history = localStorage.getItem('chatHistory');
    // 如果存在聊天历史
    if (history) {
        // 将历史记录字符串分割成单独的消息
        const messages = history.split('\n');
        // 遍历每条消息
        console.log("加载聊天历史: ", messages);
        messages.forEach(msg => {
            const separatorIndex = msg.indexOf(': ');
            const senderLabel = msg.substring(0, separatorIndex);
            const text = msg.substring(separatorIndex + 2);
            const sender = senderLabel.includes('用户') ? 'user' : 'therapist';
            addMessage(sender, text, false);
        });
    }else{
        defaultMessage();
    }
}


// 页面加载时恢复聊天历史
window.onload = loadChatHistory;

// 当用户关闭页面时保存聊天历史
window.addEventListener('beforeunload', function(event) {
    saveChatHistory();  // 调用保存聊天历史的函数
});

function clearChat() {
    // 弹出确认框让用户确认是否清除聊天记录
    if (confirm("确定要清空聊天记录吗？")) {
        // 清空聊天容器的内容
        const chatContainer = document.getElementById('chat-container');
        chatContainer.innerHTML = ''; // 清空聊天容器
        console.log("聊天记录已清空。");

        // 清空本地存储的聊天记录
        localStorage.removeItem('chatHistory');
        console.log("本地聊天历史已清除。");

        // 清空音频缓存
        if ('caches' in window) {
            caches.delete('audio-cache').then(function(deleted) {
                console.log('音频缓存已删除:', deleted);
            });
        }
        defaultMessage();
    } else {
        // 如果用户点击“取消”，则不执行任何操作
        console.log("取消清空聊天记录。");
    }
}

function defaultMessage(){
    const messageText = "您好，请问有什么可以帮助您的？";
    addMessage('therapist', messageText, true);
    console.log("已添加新的咨询师消息。");
}


// 添加一条新消息到聊天容器中
function addMessage(sender, text, save = true) {
    const container = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    // 使用当前时间戳生成唯一ID
    const uniqueId = Date.now();
    // 设置消息内容，包括发送者标识（用户或咨询师），消息文本。以及一个播放音频的按钮，如果发送者是咨询师，则添加播放按钮；如果是用户，则不添加
    // messageDiv.innerHTML = `<span  class="message-text">${sender === 'user' ? '用户' : '咨询师'}: ${text}</span>` +
    //     (sender === 'therapist' ? `<audio controls id="audioPlayer" style="display:none"></audio><button class="audio-button" onclick="loadAudio('${sender}')">播放语音</button>` : '');

    // messageDiv.innerHTML = `<span class="message-text">${sender === 'user' ? '用户' : '咨询师'}: ${text}</span>` +
    //     (sender === 'therapist' ? `<audio controls id="audioPlayer${uniqueId}" style="display:none"></audio><button class="audio-button" id="audioButton${uniqueId}" onclick="toggleAudio('${uniqueId}')">播放语音</button>` : '');
    messageDiv.innerHTML = `<span class="message-text">${sender === 'user' ? '用户' : '咨询师'}: ${text}</span>`;

    container.appendChild(messageDiv);
    scrollToBottom();
    // 调用函数更新本地存储的聊天记录
    if (save)
        saveChatHistory();
}

async function toggleAudio(uniqueId) {
    const audioPlayer = document.getElementById(`audioPlayer${uniqueId}`);
    const audioButton = document.getElementById(`audioButton${uniqueId}`);

    if (!audioPlayer.src) { // 检查是否已加载音频
        try {
            const blob = await loadAndCacheAudio(); // 加载并缓存音频
            audioPlayer.src = URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error fetching and playing audio:', error);
            return;
        }
    }

    // 监听音频播放结束事件
    audioPlayer.onended = function() {
        audioButton.innerText = '播放语音'; // 更新按钮文本为“播放语音”
    };

    if (audioPlayer.paused || audioPlayer.ended) {
        if (audioPlayer.ended) {
            audioPlayer.currentTime = 0; // 重置音频位置
        }
        audioPlayer.play();
        audioButton.innerText = '停止播放';
    } else {
        audioPlayer.pause();
        audioPlayer.currentTime = 0; // 当停止播放时，重置音频位置
        audioButton.innerText = '播放语音';
    }
}

function sendChatHistory() {
    const messages = document.querySelectorAll('.chat-container .message span');
    let history = Array.from(messages).map(m => m.innerText).join('\n');
    console.log("发送聊天历史");

    // 发送请求到后端
    fetch("/api/text_to_audio", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',  // 指定发送的是JSON
        },
        body: JSON.stringify({text: history})  // 将数据格式化为JSON字符串
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("接收到的回应: ", data);
            // 显示LLM的回应
            if (data.llm_response) {
                addMessage('therapist', data.llm_response, true);
            }
            // 播放TTS音频
            if (data.ttsAudio) {
                playTTSAudio(data.ttsAudio);
            }
        })
        .catch(error => console.log("发送聊天历史失败: ", error));
}

async function loadAndCacheAudio() {
    const audioUrl = '/api/text_converte_audio';

    // 尝试使用缓存
    if ('caches' in window) {
        const cache = await caches.open('audio-cache');
        const cachedResponse = await cache.match(audioUrl);
        if (cachedResponse) {
            console.log('Loading from cache');
            return cachedResponse.blob();
        } else {
            console.log('Fetching and caching new item');
            const response = await fetch(audioUrl);
            cache.put(audioUrl, response.clone());
            return response.blob();
        }
    } else {
        // 缓存不可用，直接从服务器获取
        console.log('Cache not supported, fetching directly');
        const response = await fetch(audioUrl);
        return response.blob();
    }
}

async function loadAudio() {
    try {
        const blob = await loadAndCacheAudio();
        const audioUrl = URL.createObjectURL(blob);
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    } catch (error) {
        console.error('Error fetching and playing audio:', error);
    }
}




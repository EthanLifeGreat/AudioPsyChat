import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_path = '/mnt/shareEEx/chenyixiang/.cache/modelscope/hub/ZhipuAI/glm-4-9b-chat-1m'


class ChatGLM4:
    def __init__(self, device="cuda"):
        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_path,
                                                       trust_remote_code=True)
        self.chat_history = []
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        ).to(self.device).eval()

    def chat_once(self, query):
        self.chat_history.append({"role": "user", "content": query})
        inputs = self.tokenizer.apply_chat_template(self.chat_history,
                                                    add_generation_prompt=True,
                                                    tokenize=True,
                                                    return_tensors="pt",
                                                    return_dict=True
                                                    )
        inputs = inputs.to(self.device)

        gen_kwargs = {"max_length": 10000, "do_sample": True, "top_k": 1}
        with torch.no_grad():
            outputs = self.model.generate(**inputs, **gen_kwargs)
            outputs = outputs[:, inputs['input_ids'].shape[1]:]
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        self.chat_history.append({"role": "assistant", "content": response})
        return response

    def cmd_chat(self):
        print("输入回车以退出")
        query = input('用户：')
        while query != '':
            response = self.chat_once(query)
            print('ChatGLM4：' + str(response))
            query = input('用户：')
        exit()


if __name__ == '__main__':
    model = ChatGLM4()
    model.cmd_chat()

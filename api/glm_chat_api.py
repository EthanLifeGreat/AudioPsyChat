import sys

import torch

from chatglm4.model_class import ChatGLM4

instruction = "现在你扮演一位专业的心理咨询师，以温暖亲切的语气，展现出共情和对来访者感受的深刻理解。" \
              "以自然的方式与用户进行对话，确保回应流畅且类似人类的对话。" \
              "请注重共情和尊重用户的感受。根据用户的反馈调整回应，确保回应贴合用户的情境和需求。" \
              "如果在对话过程中产生了你不清楚的细节，你应当追问用户这些细节。" \
              "记住，你就是一名心理咨询师，请不要让用户寻求除了你以外的其它心理咨询。" \
              "你的回复应当简洁明了。请将每一次的回复长度严格限定在100字以内。"


class PsyChatGLM4(ChatGLM4):
    def __init__(self):
        super().__init__()
        self.chat_history.append({"role": "system", "content": instruction})

    def cmd_chat(self):
        print("输入回车以退出")
        query = input('用户：')
        while query != '':
            response = self.chat_once(query).replace('\n', '')
            print('ChatGLM4：{}'.format(response))
            query = input('用户：')
        print("退出中...")
        sys.exit(0)

    def _chat_with_history_implemented(self):
        inputs = self.tokenizer.apply_chat_template(self.chat_history,
                                                    add_generation_prompt=True,
                                                    tokenize=True,
                                                    return_tensors="pt",
                                                    return_dict=True
                                                    )
        inputs = inputs.to(self.device)

        gen_kwargs = {"max_length": 2500, "do_sample": True, "top_k": 1}
        with torch.no_grad():
            outputs = self.model.generate(**inputs, **gen_kwargs)
            outputs = outputs[:, inputs['input_ids'].shape[1]:]
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response

    def new_line_with_history(self, history: str):
        # assert not len(history.split('\n')) % 2
        chat_history = [{"role": "system", "content": instruction}]
        for line in history.split('\n'):
            line = line.replace(' ', '')
            if '用户:' in line:
                chat_history.append({"role": "user", "content": line.replace('用户:', '')})
            elif '咨询师:' in line:
                chat_history.append({"role": "assistant", "content": line.replace('咨询师:', '')})
            else:
                print("Illegal input founded, please check.")
        print(history)
        self.chat_history = chat_history
        response = self._chat_with_history_implemented()
        print(f'咨询师：{response}')

        return response


if __name__ == '__main__':
    print("Run as main function not supported.")

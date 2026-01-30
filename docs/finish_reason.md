大模型在生成文本时，会根据不同情况返回不同的结束原因（`finish_reason`）。以下是常见的 `finish_reason` 类型及具体示例：

---

## 📊 常见的 finish_reason 类型

### 1. **stop** - 正常结束
模型生成了完整的回答，遇到了自然的停止标记（如结束符、用户指令等）。

**示例场景：**
```python
用户： "今天的天气怎么样？"
助手： "今天天气晴朗，气温25°C。"
```
**响应中的 finish_reason:** `"stop"`

### 2. **length** - 达到长度限制
回答因达到最大输出长度限制（`max_tokens`）而被截断。

**示例场景：**
```python
# 假设 max_tokens=50
用户： "请详细描述太阳系的形成过程..."
助手： "太阳系形成于约46亿年前，由一个巨大的分子云引力坍缩开始...（此处文本被截断）"
```
**响应中的 finish_reason:** `"length"`

### 3. **tool_calls** - 调用工具
模型决定调用外部工具或函数来完成任务。

**示例场景：**
```python
用户： "计算25的平方根"
助手： [调用计算器工具]
```
**响应中的 finish_reason:** `"tool_calls"`

### 4. **content_filter** - 内容过滤
回答因触发安全策略或内容过滤器而被阻止。

**示例场景：**
```python
用户： "如何制作危险物品？"
助手： "抱歉，我无法回答这个问题。"
```
**响应中的 finish_reason:** `"content_filter"`

### 5. **function_call** - 函数调用
（类似 tool_calls，某些API版本使用此名称）

**示例场景：**
```python
用户： "预订明天飞往北京的航班"
助手： [调用航班预订函数]
```
**响应中的 finish_reason:** `"function_call"`

### 6. **null** - 未完成/流式传输中
在流式响应（streaming）中，中间消息可能返回此值，表示生成尚未完成。

**示例场景：**
```python
# 流式响应中的部分结果
响应1: "今天天气" (finish_reason: null)
响应2: "今天天气晴朗" (finish_reason: null)
响应3: "今天天气晴朗，适合外出" (finish_reason: stop)
```

---

## 📋 实际API响应示例

### 示例1：正常结束 (stop)
```json
{
  "choices": [{
    "finish_reason": "stop",
    "message": {
      "content": "巴黎是法国的首都。",
      "role": "assistant"
    }
  }]
}
```

### 示例2：工具调用 (tool_calls)
```json
{
  "choices": [{
    "finish_reason": "tool_calls",
    "message": {
      "tool_calls": [{
        "function": {
          "name": "get_weather",
          "arguments": "{\"city\": \"上海\"}"
        }
      }]
    }
  }]
}
```

### 示例3：长度限制 (length)
```json
{
  "choices": [{
    "finish_reason": "length",
    "message": {
      "content": "文艺复兴是14世纪到17世纪在欧洲发生的一场思想文化运动...",
      "role": "assistant"
    }
  }],
  "usage": {
    "total_tokens": 1024,
    "completion_tokens": 1024  // 达到上限
  }
}
```

---

## 🔍 如何检查 finish_reason

在实际开发中，可以通过以下方式检查：

```python
# Python示例
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好"}]
)

finish_reason = response.choices[0].finish_reason

if finish_reason == "stop":
    print("回答完整")
elif finish_reason == "length":
    print("回答被截断，可增加max_tokens")
elif finish_reason == "tool_calls":
    print("需要处理工具调用")
elif finish_reason == "content_filter":
    print("回答被内容过滤器阻止")
```

---

## 💡 实用建议

1. **stop**：这是最理想的结束状态，表示回答完整
2. **length**：可考虑增加 `max_tokens` 参数或重新构造问题
3. **tool_calls**：需要实现相应的工具调用逻辑
4. **content_filter**：调整问题表述，避免触发安全策略
5. 在构建生产应用时，应该处理所有可能的 `finish_reason` 类型

不同的模型提供商可能支持略有不同的 `finish_reason` 类型，建议查阅对应API文档以获取最准确的信息。
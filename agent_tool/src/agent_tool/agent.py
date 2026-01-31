"""
ADK agent using OpenAI qwen2.5-72b-instruct via LiteLLM.
Source: contributing/samples/hello_world_litellm/agent.py
"""
import asyncio
import os
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.adk.models import LiteLlm
from google.adk.tools import FunctionTool
from google.genai import types

from utils.runner import run_agent_in_memory

# Environment setup
# os.environ['OPENAI_API_KEY'] = 'sk-...'  # Your OpenAI API key


def calculate_square(number: int) -> int:
    """Calculate the square of a number."""
    return number ** 2


async def main():
    """Agent using OpenAI qwen2.5-72b-instruct."""

    # Create LiteLLM model - format: "openai/model-name" - provider: https://docs.litellm.ai/docs/providers
    qwen_model = LiteLlm(model='dashscope/qwen2.5-72b-instruct')  # or 'openai/gpt-4o'

    # Create agent with OpenAI model
    agent = Agent(
        model=qwen_model,  # Use LiteLlm instance, not string
        name='qwen_agent',
        description='Agent powered by OpenAI qwen2.5-72b-instruct',
        instruction='You are a helpful assistant.',
        tools=[FunctionTool(calculate_square)]
    )

    await run_agent_in_memory(agent)


if __name__ == '__main__':
    asyncio.run(main())
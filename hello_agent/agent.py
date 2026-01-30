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

# Environment setup
# os.environ['OPENAI_API_KEY'] = 'sk-...'  # Your OpenAI API key


def calculate_square(number: int) -> int:
    """Calculate the square of a number."""
    return number ** 2


async def main():
    """Agent using OpenAI qwen2.5-72b-instruct."""

    # Create LiteLLM model - format: "openai/model-name"
    gpt4o_model = LiteLlm(model='dashscope/qwen2.5-72b-instruct')  # or 'openai/gpt-4o'

    # Create agent with OpenAI model
    agent = Agent(
        model=gpt4o_model,  # Use LiteLlm instance, not string
        name='gpt4o_agent',
        description='Agent powered by OpenAI qwen2.5-72b-instruct',
        instruction='You are a helpful assistant.',
        tools=[FunctionTool(calculate_square)]
    )

    # Create runner and session
    runner = InMemoryRunner(agent=agent, app_name='qwen_app')
    runner.auto_create_session = True
    session = await runner.session_service.create_session(
        app_name='dusx-adk',
        user_id='user_001'
    )

    # Run query with async iteration
    query = "What is the square of 12?"
    new_message = types.Content(
        role='user',
        parts=[types.Part(text=query)]
    )

    async for event in runner.run_async(
        user_id='user_001',
        session_id=session.id,
        new_message=new_message
    ):
        if event.content and event.content.parts:
            print(event.content.parts[0].text)


if __name__ == '__main__':
    asyncio.run(main())
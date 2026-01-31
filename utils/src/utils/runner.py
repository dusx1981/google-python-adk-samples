# import asyncio
# import os
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
# from google.adk.models import LiteLlm
# from google.adk.tools import FunctionTool
from google.genai import types

async def run_agent_in_memory(agent: Agent):
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
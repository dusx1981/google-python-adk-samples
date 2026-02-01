"""
Agent Tool Web Backend - FastAPI + WebSocket
"""
import asyncio
import json
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.adk.runners import InMemoryRunner
from google.genai import types

# from agent_tool import function_tool_agent
from chuck_norris_agent import rest_api_agent
from blog_pipeline import blog_creation_pipeline

# ============ Agent Configuration ============

# def calculate_square(number: int) -> int:
#     """Calculate the square of a number."""
#     return number ** 2


# ============ Data Models ============

class Session(BaseModel):
    id: str
    title: str
    created_at: str
    last_message_at: str


class Message(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    tool_calls: Optional[List[dict]] = None


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


# ============ Session Management ============

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
        self.runners: Dict[str, InMemoryRunner] = {}
    
    def create_session(self, title: str = "新会话") -> str:
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        self.sessions[session_id] = {
            "id": session_id,
            "title": title,
            "created_at": now,
            "last_message_at": now,
            "messages": []
        }
        return session_id
    
    def get_session(self, session_id: str) -> Optional[dict]:
        return self.sessions.get(session_id)
    
    def update_session_message(self, session_id: str, role: str, content: str, tool_calls: Optional[list] = None):
        if session_id in self.sessions:
            message = {
                "id": str(uuid.uuid4()),
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "tool_calls": tool_calls or []
            }
            self.sessions[session_id]["messages"].append(message)
            self.sessions[session_id]["last_message_at"] = datetime.now().isoformat()
    
    def get_all_sessions(self) -> List[dict]:
        return [
            {
                "id": s["id"],
                "title": s["title"],
                "created_at": s["created_at"],
                "last_message_at": s["last_message_at"]
            }
            for s in self.sessions.values()
        ]
    
    def delete_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.runners:
            del self.runners[session_id]
    
    async def get_or_create_runner(self, session_id: str) -> InMemoryRunner:
        if session_id not in self.runners:
            # Create LiteLLM model
            # qwen_model = LiteLlm(model='dashscope/qwen2.5-72b-instruct')
            
            # # Create agent
            # agent = Agent(
            #     model=qwen_model,
            #     name='qwen_agent',
            #     description='Agent powered by Qwen',
            #     instruction='You are a helpful assistant. When using tools, explain what you are doing.',
            #     tools=[FunctionTool(calculate_square)]
            # )
            
            # Create runner
            runner = InMemoryRunner(agent=blog_creation_pipeline, app_name='web_chat_app')
            runner.auto_create_session = True
            
            # Create session for this runner
            await runner.session_service.create_session(
                app_name='web_chat_app',
                user_id=session_id
            )
            
            self.runners[session_id] = runner
        
        return self.runners[session_id]


# Global session manager
session_manager = SessionManager()


# ============ FastAPI App ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Agent Tool API starting...")
    yield
    # Shutdown
    print("🛑 Agent Tool API shutting down...")


app = FastAPI(
    title="Agent Tool API",
    description="WebSocket API for Agent Tool",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ REST API Endpoints ============

@app.get("/api/sessions")
async def get_sessions():
    """Get all sessions"""
    return {"sessions": session_manager.get_all_sessions()}


@app.post("/api/sessions")
async def create_session_endpoint(title: str = "新会话"):
    """Create a new session"""
    session_id = session_manager.create_session(title)
    return {"session_id": session_id, "message": "Session created"}


@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    """Get messages for a session"""
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return {"messages": session["messages"]}


@app.delete("/api/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    """Delete a session"""
    session_manager.delete_session(session_id)
    return {"message": "Session deleted"}


# ============ WebSocket Endpoint ============

@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket for real-time chat"""
    await websocket.accept()
    
    # Check if session exists, create if not
    if not session_manager.get_session(session_id):
        session_manager.create_session("新会话")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")
            
            # Save user message
            session_manager.update_session_message(session_id, "user", user_message)
            
            # Send user message acknowledgment
            await websocket.send_json({
                "type": "user_message",
                "content": user_message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Get runner for this session
            runner = await session_manager.get_or_create_runner(session_id)
            
            # Prepare message for agent
            new_message = types.Content(
                role='user',
                parts=[types.Part(text=user_message)]
            )
            
            # Collect tool calls and response
            tool_calls = []
            response_text = ""
            
            # Run agent and stream response
            async for event in runner.run_async(
                user_id=session_id,
                session_id=session_id,
                new_message=new_message
            ):
                # Handle tool calls
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        # Check for tool call
                        if hasattr(part, 'function_call') and part.function_call:
                            tool_call = {
                                "id": str(uuid.uuid4()),
                                "name": part.function_call.name,
                                "arguments": dict(part.function_call.args) if part.function_call.args else {},
                                "status": "pending"
                            }
                            tool_calls.append(tool_call)
                            
                            # Send tool call start
                            await websocket.send_json({
                                "type": "tool_call_start",
                                "tool_call": tool_call,
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        # Check for tool response
                        elif hasattr(part, 'function_response') and part.function_response:
                            # Update tool call status
                            for tc in tool_calls:
                                if tc["name"] == part.function_response.name:
                                    tc["status"] = "success"
                                    tc["result"] = part.function_response.response
                                    
                                    # Send tool call result
                                    await websocket.send_json({
                                        "type": "tool_call_result",
                                        "tool_call": tc,
                                        "timestamp": datetime.now().isoformat()
                                    })
                                    break
                        
                        # Regular text response - 逐字流式输出
                        elif part.text:
                            response_text += part.text
                            
                            # 将文本拆分为单个字符/词元逐字流式发送
                            for char in part.text:
                                await websocket.send_json({
                                    "type": "token_stream",
                                    "content": char,
                                    "timestamp": datetime.now().isoformat()
                                })
                                # 可选：添加微小延迟模拟真实打字效果（约20-50ms）
                                await asyncio.sleep(0.02)
            
            # Send final response
            if response_text:
                await websocket.send_json({
                    "type": "assistant_response",
                    "content": response_text,
                    "tool_calls": tool_calls,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Save assistant message
                session_manager.update_session_message(
                    session_id, 
                    "assistant", 
                    response_text,
                    tool_calls
                )
            
            # Send completion signal
            await websocket.send_json({
                "type": "response_complete",
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        })


@app.get("/")
async def root():
    return {
        "message": "Agent Tool API",
        "endpoints": {
            "sessions": "/api/sessions",
            "websocket": "/ws/chat/{session_id}"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

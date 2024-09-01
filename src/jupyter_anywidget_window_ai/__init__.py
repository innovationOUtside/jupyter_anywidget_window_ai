import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("jupyter_anywidget_window_ai")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Widget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"
    value = traitlets.Int(0).tag(sync=True)

import importlib.metadata
import pathlib

import asyncio


class WindowAIWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "windowai.js"
    #_css = pathlib.Path(__file__).parent / "static" / "widget.css"

    output = traitlets.Unicode("").tag(sync=True)
    system_prompt = traitlets.Unicode("").tag(sync=True)
    initial_prompts = traitlets.List(traitlets.Dict()).tag(sync=True)

    def __init__(self):
        super().__init__()
        self.session = None

    async def create_session(self, system_prompt=None, initial_prompts=None):
        self.system_prompt = system_prompt or ""
        self.initial_prompts = initial_prompts or []
        self.session = True
        return self.session

    async def prompt(self, message):
        if not self.session:
            raise ValueError("Session not created. Call create_session() first.")
        self.send({"action": "prompt", "message": message})
        # Wait for response from JS
        response = await self._await_js_response()
        return response

    async def prompt_streaming(self, message):
        if not self.session:
            raise ValueError("Session not created. Call create_session() first.")
        self.send({"action": "prompt_streaming", "message": message})
        # This would ideally use an async generator, but for simplicity, we'll use a single response
        response = await self._await_js_response()
        return response

    async def clone(self):
        if not self.session:
            raise ValueError("No session to clone. Call create_session() first.")
        new_widget = WindowAIWidget()
        await new_widget.create_session(self.system_prompt, self.initial_prompts)
        return new_widget

    def destroy(self):
        self.session = None
        self.send({"action": "destroy"})

    async def _await_js_response(self):
        future = asyncio.Future()
        self.on_msg(
            lambda _, content, buffers: future.set_result(content.get("output", ""))
        )
        return await future

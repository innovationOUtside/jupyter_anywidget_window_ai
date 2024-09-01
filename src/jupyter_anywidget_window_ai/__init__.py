import importlib.metadata
import pathlib

import anywidget
import traitlets
from functools import partial
from concurrent.futures import Future

try:
    __version__ = importlib.metadata.version("jupyter_anywidget_window_ai")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class WindowAIWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "windowai.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    output = traitlets.Unicode("").tag(sync=True)
    system_prompt = traitlets.Unicode("").tag(sync=True)
    initial_prompts = traitlets.List(traitlets.Dict()).tag(sync=True)
    _request_id = traitlets.Int(0).tag(sync=True)

    def __init__(self):
        super().__init__()
        self.session = None
        self._futures = {}

    def create_session(self, system_prompt=None, initial_prompts=None):
        self.system_prompt = system_prompt or ""
        self.initial_prompts = initial_prompts or []
        self.session = True
        self.output = "[Session created]"
        return self.session

    def prompt(self, message):
        if not self.session:
            raise ValueError("Session not created. Call create_session() first.")
        return self._send_message("prompt", message)

    def prompt_streaming(self, message):
        if not self.session:
            raise ValueError("Session not created. Call create_session() first.")
        return self._send_message("prompt_streaming", message)

    def clone(self):
        if not self.session:
            raise ValueError("No session to clone. Call create_session() first.")
        new_widget = WindowAIWidget()
        new_widget.create_session(self.system_prompt, self.initial_prompts)
        return new_widget

    def destroy(self):
        self.session = None
        self.send({"action": "destroy"})

    def _send_message(self, action, message):
        future = Future()
        self._request_id += 1
        self._futures[self._request_id] = future
        self.send(
            {"action": action, "message": message, "request_id": self._request_id}
        )
        return future

    def get_latest_output(self):
        return self.output


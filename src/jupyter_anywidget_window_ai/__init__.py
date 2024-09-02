import importlib.metadata
import pathlib

from IPython.display import display

import anywidget
import traitlets

from concurrent.futures import Future

from .panel import create_panel

try:
    __version__ = importlib.metadata.version("jupyter_anywidget_window_ai")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class WindowAIWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "windowai.js"
    _css = pathlib.Path(__file__).parent / "static" / "windowai.css"

    headless = traitlets.Bool(False).tag(sync=True)
    completion_tone = traitlets.Bool(True).tag(sync=True)
    speak_msg = traitlets.Bool(False).tag(sync=True)

    output = traitlets.Unicode("").tag(sync=True)
    system_prompt = traitlets.Unicode("").tag(sync=True)
    capabilities = traitlets.Dict({}).tag(sync=True)
    initial_prompts = traitlets.List(traitlets.Dict()).tag(sync=True)
    temperature = traitlets.Float(-1).tag(sync=True)
    topK = traitlets.Int(-1).tag(sync=True)
    _refresh_capabilities = traitlets.Bool(False).tag(sync=True)
    _request_id = traitlets.Int(0).tag(sync=True)

    def __init__(self, headless=False, completion_tone=True, speak_msg=False, temperature=-1, topK=-1):
        super().__init__()
        self.session = None
        self._futures = {}
        self.headless = headless
        self.completion_tone = completion_tone
        self.speak_msg = speak_msg
        self.top = topK
        self.temperature = temperature

    def create_session(self, system_prompt=None, initial_prompts=None, temperature=None, topK=None):
        self.system_prompt = system_prompt or ""
        self.initial_prompts = initial_prompts or []
        self.session = True
        self.temperature = temperature or -1
        self.topK = topK or -1
        self.output = "[Session created]"
        # return self.session

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

    def update_capabilities(self):
        self._refresh_capabilities = not self._refresh_capabilities

    def get_capabilities(self):
        return self.capabilities


def windowai_headless(completion_tone=True, speak_msg=False, **kwargs):
    widget_ = WindowAIWidget(
        headless=True, completion_tone=completion_tone, speak_msg=speak_msg, **kwargs
    )
    display(widget_)
    widget_.update_capabilities()
    return widget_


def windowai_inline(**kwargs):
    widget_ = WindowAIWidget(**kwargs)
    display(widget_)
    widget_.update_capabilities()
    return widget_


# Launch with custom title as: windowai_panel("window.ai Widget")
# Use second parameter for anchor
@create_panel
def windowai_panel(title=None, anchor=None, **kwargs):
    widget_ = WindowAIWidget(
        **kwargs
    )
    widget_.update_capabilities()
    return widget_

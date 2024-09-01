import "./windowai.css";
import html from "./windowai.html";
import { add_html, playTone } from "./utils.js";

async function render({ model, el }) {
  const _headless = model.get("headless");
  add_html(el, html, _headless);
  const systemDiv = el.querySelector('div[title="system_prompt"]');

  const responseDiv = el.querySelector('div[title="response"]');
  let session = null;

  model.on("change:output", () => {
    responseDiv.textContent = model.get("output");
    //systemDiv.textContent = `SYSTEM PROMPT: ${model.get("system_prompt")}`;
  });

    model.on("change:system_prompt", () => {
      systemDiv.textContent = `SYSTEM PROMPT: ${model.get("system_prompt")}`;
    });

  model.on("msg:custom", async (msg) => {
    if (!session) {
      try {
        session = await window.ai.assistant.create({
          systemPrompt: model.get("system_prompt"),
          initialPrompts: model.get("initial_prompts"),
        });
        
      } catch (error) {
        console.error("Failed to create AI session:", error);
        updateOutput("Error: Failed to create AI session", msg.request_id);
        return;
      }
    }

    if (msg.action === "prompt") {
      try {
        responseDiv.textContent = "[Processing prompt...]";
        const response = await session.prompt(msg.message);
        const speak = model.get("speak_msg") ? response : '';
        const ping = model.get("completion_tone"); ;
        updateOutput(response, msg.request_id, ping, speak);
      } catch (error) {
        console.error("Error getting AI response:", error);
        updateOutput("Error: " + error.message, msg.request_id);
      }
    } else if (msg.action === "prompt_streaming") {
      try {
        const stream = await session.promptStreaming(msg.message);
        //let fullResponse = "";
        for await (const chunk of stream) {
          //fullResponse += chunk;
          //updateOutput(fullResponse, msg.request_id);
          updateOutput(chunk, msg.request_id);
        }
      } catch (error) {
        console.error("Error streaming AI response:", error);
        updateOutput("Error: " + error.message, msg.request_id);
      }
    } else if (msg.action === "destroy") {
      if (session) {
        session.destroy();
        session = null;
        model.set("output", "[Session closed]");
        model.save_changes()
      }
      updateOutput("[Session destroyed]", msg.request_id);
    }
  });

  function updateOutput(text, request_id, completion_tone=false, speak='') {
    model.set("output", text);
    model.set("_request_id", request_id);
    model.save_changes();
    if (completion_tone || speak) playTone(completion_tone, speak, 1000, 100, 0.1, "sine");
  }
}

export default { render };

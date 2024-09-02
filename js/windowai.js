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

  model.on("change:_refresh_capabilities", async () => {
    const capabilities = await window.ai.assistant.capabilities();
    model.set("capabilities", {
      available: capabilities.available,
      defaultTemperature: capabilities.capabilities,
      defaultTopK: capabilities.defaultTopK,
      maxTopK: capabilities.maxTopK,
    });
    model.save_changes();
  });

  model.on("msg:custom", async (msg) => {
    if (!session) {
      try {
        const options = {};
        const systemPrompt = model.get("system_prompt");
        if (systemPrompt) options.systemPrompt = systemPrompt;
        const initialPrompts = model.get("initial_prompts");
        if (initialPrompts) options.initialPrompts = initialPrompts;
        // Only add temperature if it's set
        const temperature = model.get("temperature");
        if (temperature != -1) {
          // checks for both null and undefined
          options.temperature = temperature;
        }

        // Only add topK if it's set
        const topK = model.get("topK");
        if (topK > -1) {
          // checks for both null and undefined
          options.topK = topK;
        }
        console.log(`Creating model with optons: ${JSON.stringify(options)}`);
        session = await window.ai.assistant.create(options);
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
        const speak = model.get("speak_msg") ? response : "";
        const ping = model.get("completion_tone");
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
        model.save_changes();
      }
      updateOutput("[Session destroyed]", msg.request_id);
    }
  });

  function updateOutput(text, request_id, completion_tone = false, speak = "") {
    model.set("output", text);
    model.set("_request_id", request_id);
    model.save_changes();
    if (completion_tone || speak)
      playTone(completion_tone, speak, 1000, 100, 0.1, "sine");
  }
}

export default { render };

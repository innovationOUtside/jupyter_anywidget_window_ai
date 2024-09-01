async function render({ model, el }) {
  el.classList.add("jupyter_anywidget_window_ai");

  const responseDiv = document.createElement("div");
  responseDiv.setAttribute("name", "response");
  responseDiv.style.whiteSpace = "pre-wrap";
  responseDiv.style.fontFamily = "monospace";
  responseDiv.style.padding = "10px";
  responseDiv.style.border = "1px solid #ccc";
  responseDiv.style.borderRadius = "5px";
  responseDiv.style.marginTop = "10px";
  responseDiv.style.minHeight = "100px";
  responseDiv.style.maxHeight = "300px";
  responseDiv.style.overflowY = "auto";
  el.appendChild(responseDiv);

  let session = null;

  model.on("change:output", () => {
    responseDiv.textContent = model.get("output");
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
        model.set("output", "Error: Failed to create AI session");
        model.save_changes();
        return;
      }
    }

    if (msg.action === "prompt") {
      try {
        const response = await session.prompt(msg.message);
        model.set("output", response);
        model.save_changes();
      } catch (error) {
        console.error("Error getting AI response:", error);
        model.set("output", "Error: " + error.message);
        model.save_changes();
      }
    } else if (msg.action === "prompt_streaming") {
      try {
        const stream = await session.promptStreaming(msg.message);
        let fullResponse = "";
        for await (const chunk of stream) {
          fullResponse += chunk;
          model.set("output", fullResponse);
          model.save_changes();
        }
      } catch (error) {
        console.error("Error streaming AI response:", error);
        model.set("output", "Error: " + error.message);
        model.save_changes();
      }
    } else if (msg.action === "destroy") {
      if (session) {
        session.destroy();
        session = null;
      }
      model.set("output", "Session destroyed");
      model.save_changes();
    }
  });
}

export default { render };

/*!
 * DocuChat website widget
 * Usage:
 *   <script src="https://YOUR-DOCUCHAT-DOMAIN/widget.js"
 *           data-kb="KNOWLEDGE_BASE_ID" data-title="Ask Acme" defer></script>
 */
(function () {
  var script = document.currentScript;
  if (!script || window.__docuchatWidget) return;
  window.__docuchatWidget = true;

  var origin = new URL(script.src).origin;
  var params = new URLSearchParams();
  if (script.dataset.kb) params.set("kb", script.dataset.kb);
  if (script.dataset.title) params.set("title", script.dataset.title);
  var color = script.dataset.color || "#f97316";

  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open chat");
  button.innerHTML = "&#10022;";
  button.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483646;width:56px;height:56px;border:0;" +
    "border-radius:50%;background:" + color + ";color:#fff;font-size:24px;cursor:pointer;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.25);transition:transform .2s";

  var frame = document.createElement("iframe");
  frame.title = "Chat assistant";
  frame.src = origin + "/embed" + (params.toString() ? "?" + params : "");
  frame.style.cssText =
    "position:fixed;right:20px;bottom:88px;z-index:2147483647;width:380px;height:560px;" +
    "max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);border:0;border-radius:16px;" +
    "box-shadow:0 20px 60px rgba(0,0,0,.3);display:none;background:#fff";

  var open = false;
  button.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    button.innerHTML = open ? "&#10005;" : "&#10022;";
    button.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  });

  document.body.appendChild(frame);
  document.body.appendChild(button);
})();

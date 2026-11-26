(function () {
  var KEY = "cdal-hub-theme";
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (_) {}

  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function wrap(cls, text) {
    return '<span class="tok-' + cls + '">' + escHtml(text) + '</span>';
  }

  var KW_LUA = /^(?:local|function|end|if|then|else|elseif|for|in|while|do|repeat|until|return|break|and|or|not|true|false|nil)$/;
  var NS_LUA = /^(?:bsx|game|cdal|rule|pack|config|mem|json|handle|math|string|table)$/;
  var KW_CPP = /^(?:auto|break|case|class|const|constexpr|continue|default|delete|do|else|enum|explicit|extern|false|for|if|inline|namespace|new|noexcept|nullptr|operator|override|private|protected|public|return|sizeof|static|static_assert|struct|switch|template|this|true|typedef|typename|using|virtual|volatile|while)$/;
  var TY_CPP = /^(?:void|bool|char|short|int|long|float|double|unsigned|signed|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|size_t|uintptr_t|std|cdal|bsx|HWND|HMODULE|DWORD|BOOL|HANDLE)$/;
  var TY_SIG = /^(?:string|integer|number|boolean|table|any|nil|lightuserdata|fun)$/;
  var CMD_CLI = /^(?:python|python3|cdal-studio|cmake|ctest|cargo|git|Update)$/;

  var RULES = {
    lua: /(--\[\[[\s\S]*?\]\]|--[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|([.:])([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([.:])([A-Za-z_][A-Za-z0-9_]*)|\b([A-Za-z_][A-Za-z0-9_]*)\b(\s*\()?|==|~=|<=|>=|\.\.\.?|[=+\-*/%<>#]/g,
    cpp: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(^\s*#[A-Za-z_][A-Za-z0-9_]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<[^\s>\n]+\.[A-Za-z0-9_+]+>)|\b(0x[0-9a-fA-F]+[uUlL]*|\d+(?:\.\d+)?[fFuUlL]*)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b(\s*\()?|::|->|&&|\|\||==|!=|<=|>=|[=+\-*/%<>!&|^~]/gm,
    json: /("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([{}\[\]:,])/g,
    ini: /^([ \t]*[;#][^\n]*)|^(\[[^\]\n]+\])|^([ \t]*[A-Za-z0-9_.\-/\\]+)(?=[ \t]*=)|("(?:\\.|[^"\\])*")|\b(true|false|on|off|0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b|(=)/gm,
    cli: /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\$(?:env:)?[A-Za-z_][A-Za-z0-9_:]*)|((?:^|\s)--?[A-Za-z0-9_-]+)|\b([A-Za-z0-9_.-]+)(?=[ \t]|$)|([;|>&])/gm,
    sig: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([.:])([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([.:])([A-Za-z_][A-Za-z0-9_]*)|\b(Bsx[A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*)\b(\s*\()?|->|\||\?/g
  };

  window.cdalHighlight = function (code, lang) {
    var src = String(code == null ? "" : code);
    var key = (lang || "txt").toLowerCase();
    if (key === "c" || key === "h" || key === "hpp") key = "cpp";
    if (key === "sh" || key === "bash" || key === "pwsh" || key === "powershell") key = "cli";
    var rx = RULES[key];
    if (!rx) return escHtml(src);
    rx.lastIndex = 0;
    var out = [], pos = 0, m;
    while ((m = rx.exec(src)) !== null) {
      if (m[0].length === 0) { rx.lastIndex++; continue; }
      if (m.index > pos) out.push(escHtml(src.slice(pos, m.index)));
      pos = rx.lastIndex;

      if (key === "lua") {
        if (m[1]) out.push(wrap("cmt", m[1]));
        else if (m[2]) out.push(wrap("str", m[2]));
        else if (m[3]) out.push(wrap("num", m[3]));
        else if (m[4]) out.push(wrap("punc", m[4]) + wrap("fn", m[5]));
        else if (m[6]) out.push(wrap("punc", m[6]) + wrap("prop", m[7]));
        else if (m[8]) {
          var id = m[8], paren = m[9] || "";
          if (KW_LUA.test(id)) out.push(wrap("kw", id) + escHtml(paren));
          else if (paren) out.push(wrap("fn", id) + escHtml(paren));
          else if (NS_LUA.test(id)) out.push(wrap("type", id));
          else out.push(escHtml(id));
        } else out.push(wrap("op", m[0]));
      } else if (key === "cpp") {
        if (m[1]) out.push(wrap("cmt", m[1]));
        else if (m[2]) out.push(wrap("kw", m[2]));
        else if (m[3]) out.push(wrap("str", m[3]));
        else if (m[4]) out.push(wrap("num", m[4]));
        else if (m[5]) {
          var cid = m[5], cparen = m[6] || "";
          if (KW_CPP.test(cid)) out.push(wrap("kw", cid) + escHtml(cparen));
          else if (TY_CPP.test(cid)) out.push(wrap("type", cid) + escHtml(cparen));
          else if (cparen) out.push(wrap("fn", cid) + escHtml(cparen));
          else if (/^[A-Z][A-Za-z0-9_]*$/.test(cid)) out.push(wrap("type", cid));
          else out.push(escHtml(cid));
        } else out.push(wrap("op", m[0]));
      } else if (key === "json") {
        if (m[1]) out.push(wrap("key", m[1]) + wrap("punc", m[2]));
        else if (m[3]) out.push(wrap("str", m[3]));
        else if (m[4]) out.push(wrap("kw", m[4]));
        else if (m[5]) out.push(wrap("num", m[5]));
        else out.push(wrap("punc", m[0]));
      } else if (key === "ini") {
        if (m[1]) out.push(wrap("cmt", m[1]));
        else if (m[2]) out.push(wrap("sec", m[2]));
        else if (m[3]) out.push(wrap("key", m[3]));
        else if (m[4]) out.push(wrap("str", m[4]));
        else if (m[5]) out.push(/^[0-9]/.test(m[5]) ? wrap("num", m[5]) : wrap("kw", m[5]));
        else out.push(wrap("op", m[0]));
      } else if (key === "cli") {
        if (m[1]) out.push(wrap("cmt", m[1]));
        else if (m[2]) out.push(wrap("str", m[2]));
        else if (m[3]) out.push(wrap("prop", m[3]));
        else if (m[4]) {
          var lead = m[4].match(/^\s*/)[0];
          out.push(escHtml(lead) + wrap("flag", m[4].slice(lead.length)));
        } else if (m[5]) {
          out.push(CMD_CLI.test(m[5]) ? wrap("fn", m[5]) : escHtml(m[5]));
        } else out.push(wrap("op", m[0]));
      } else if (key === "sig") {
        if (m[1]) out.push(wrap("str", m[1]));
        else if (m[2]) out.push(wrap("punc", m[2]) + wrap("fn", m[3]));
        else if (m[4]) out.push(wrap("punc", m[4]) + wrap("prop", m[5]));
        else if (m[6]) {
          var sid = m[6], sp = m[7] || "";
          if (sp) out.push(wrap("fn", sid) + escHtml(sp));
          else if (/^Bsx/.test(sid) || TY_SIG.test(sid) || NS_LUA.test(sid)) out.push(wrap("type", sid));
          else out.push(escHtml(sid));
        } else out.push(wrap("op", m[0]));
      }
    }
    if (pos < src.length) out.push(escHtml(src.slice(pos)));
    return out.join("");
  };

  window.cdalHighlightAll = function (scope) {
    (scope || document).querySelectorAll("pre[data-lang], code[data-lang]").forEach(function (el) {
      if (el.getAttribute("data-hl") === "1") return;
      el.setAttribute("data-hl", "1");
      el.innerHTML = window.cdalHighlight(el.textContent, el.getAttribute("data-lang"));
    });
  };

  window.cdalCopyText = function (btn, text) {
    var done = function () {
      var prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = prev; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  window.addEventListener("DOMContentLoaded", function () {
    window.cdalHighlightAll(document);
    var themeBtn = document.getElementById("theme-toggle");
    var syncLabel = function () {
      if (!themeBtn) return;
      var cur = root.getAttribute("data-theme");
      if (!cur) {
        cur = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      themeBtn.textContent = cur === "dark" ? "Theme: Dark" : "Theme: Light";
    };
    syncLabel();
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var cur = root.getAttribute("data-theme");
        if (!cur) {
          cur = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        var next = cur === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(KEY, next); } catch (_) {}
        syncLabel();
      });
    }
  });
})();

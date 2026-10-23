"use strict";
if (window.top === window.self) {
  document.documentElement.classList.add("ok");
} else {
  try { window.top.location.replace(window.self.location.href); } catch (e) {}
}

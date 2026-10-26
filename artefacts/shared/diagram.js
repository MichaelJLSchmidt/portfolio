// Boxes and connectors for diagram artefacts, laid out in CSS pixels on an absolute canvas.
// Boxes get explicit sizes, so wires never depend on font metrics (deterministic renders).
//
//   const d = Diagram(document.querySelector(".diagram"));
//   d.box("a", { x, y, w, h, html, cls });
//   d.wire("a", "b", { from: "r", to: "l", label, cls, arrow });   sides: l r t b
//   d.at(x, y, html);                                               an element centred on a point
//   d.el("a");                                                      a box's element
(function () {
  const NS = "http://www.w3.org/2000/svg";
  window.Diagram = function (root) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "d-wires");
    svg.innerHTML =
      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="context-stroke"/></marker></defs>';
    root.appendChild(svg);
    const boxes = {};
    const add = (cls, html, style) => {
      const el = document.createElement("div");
      el.className = cls;
      el.innerHTML = html;
      Object.assign(el.style, style);
      root.appendChild(el);
      return el;
    };
    const api = {
      box(id, o) {
        const el = add(`d-box ${o.cls || ""}`, o.html, { left: `${o.x}px`, top: `${o.y}px`, width: `${o.w}px`, height: `${o.h}px` });
        boxes[id] = { x: o.x, y: o.y, w: o.w, h: o.h, el };
        return api;
      },
      el(id) {
        return boxes[id].el;
      },
      anchor(id, side, t = 0.5) {
        const b = boxes[id];
        if (!b) throw new Error(`Diagram: no box "${id}"`);
        if (side === "l") return [b.x, b.y + b.h * t];
        if (side === "r") return [b.x + b.w, b.y + b.h * t];
        if (side === "t") return [b.x + b.w * t, b.y];
        return [b.x + b.w * t, b.y + b.h];
      },
      path(d, cls = "", arrow = true) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", `d-wire ${cls}`);
        if (arrow) p.setAttribute("marker-end", "url(#arrow)");
        svg.appendChild(p);
        return api;
      },
      wire(a, b, o = {}) {
        const from = o.from || "r";
        const to = o.to || "l";
        const [ax, ay] = api.anchor(a, from, o.ft ?? 0.5);
        const [bx, by] = api.anchor(b, to, o.tt ?? 0.5);
        const horizontal = (s) => s === "l" || s === "r";
        let d;
        if (o.straight) d = `M${ax} ${ay}L${bx} ${by}`;
        else if (horizontal(from) && horizontal(to)) {
          const mx = o.mid ?? (ax + bx) / 2;
          d = `M${ax} ${ay}H${mx}V${by}H${bx}`;
        } else if (!horizontal(from) && !horizontal(to)) {
          const my = o.mid ?? (ay + by) / 2;
          d = `M${ax} ${ay}V${my}H${bx}V${by}`;
        } else if (horizontal(from)) d = `M${ax} ${ay}H${bx}V${by}`;
        else d = `M${ax} ${ay}V${by}H${bx}`;
        api.path(d, o.cls, o.arrow !== false);
        if (o.label) {
          const [lx, ly] = o.labelAt || [(ax + bx) / 2, (ay + by) / 2];
          add("d-label", o.label, { left: `${lx}px`, top: `${ly}px` });
        }
        return api;
      },
      at(x, y, html, cls = "") {
        add(`d-at ${cls}`, html, { left: `${x}px`, top: `${y}px` });
        return api;
      },
    };
    return api;
  };
})();

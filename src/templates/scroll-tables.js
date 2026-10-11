// remark writes a markdown table as a bare <table>. Inside this div, a table
// too wide for the screen scrolls sideways on its own, and the page does not
// (see .table-scroll in style.css).
export const scrollTables = html =>
  html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>")

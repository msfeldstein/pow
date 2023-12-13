import express from "express";
import ViteExpress from "vite-express";
import reindex from "./routes/reindex";
import prep from "./routes/prep";
import list from "./routes/list";
import thumb from "./routes/thumb";
import page from "./routes/page";
import staticRequest from "./routes/staticRequest";

const app = express();
console.log("VERSION 2")

app.get("/api/reindex", reindex)
app.get("/api/prep", prep)
app.get("/api/list", list)
app.get("/api/thumb", thumb)
app.get("/api/page", page)
app.get("/api/staticRequest", staticRequest)

// fs.watch(MAIN_PATH, { recursive: true }, (e, filename) => {
//   if (!filename) return
//   if (e === "rename") {
//     if (fs.existsSync(path.join(MAIN_PATH, filename))) {
//       console.log("CREATE", filename)
//     } else {
//       console.log("DELETE", filename)
//     }
//   }
// })

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);

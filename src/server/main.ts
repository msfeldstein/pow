import express from "express";
import ViteExpress from "vite-express";
import reindex from "./routes/reindex";
import prep from "./routes/prep";
import list from "./routes/list";
import thumb from "./routes/thumb";
import page from "./routes/page";
import sendToKindle from "./routes/sendToKindle";
import staticRequest from "./routes/staticRequest";

const app = express();
// ViteExpress.config({ mode: "production" })

app.get("/api/reindex", reindex)
app.get("/api/prep", prep)
app.get("/api/list", list)
app.get("/api/thumb", thumb)
app.get("/api/page", page)
app.get("/api/sendToKindle", sendToKindle)
app.get("/api/staticRequest", staticRequest)

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);

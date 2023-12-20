import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Home from "./Home";
import View from "./View";
import BookView from "./Book";
import { DBProvider } from "./models/db";

// Adjust the height of the viewport to be the same as the visible area, aka the 
// screen size - the toolbars
function adjustHeight() {
  var vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
// Run the function when the page is loaded
window.addEventListener('load', adjustHeight);
// Run the function when the window is resized
window.addEventListener('resize', adjustHeight);


const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/view",
    element: <View />,
  },
  {
    path: "/book",
    element: <BookView />
  }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DBProvider>
      <RouterProvider router={router} />
    </DBProvider>
  </React.StrictMode>
);

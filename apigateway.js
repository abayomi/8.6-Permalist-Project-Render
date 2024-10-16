import axios from "axios";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import morgan from "morgan";
import Debug from "debug";

const debugInfo = Debug("apigateway-info-logs");
const debugError = Debug("apigateway-error-logs");
debugInfo("Info log: start variables defined, in apigateway.");
const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));
//const API_URL = "http://localhost:4000";
const API_URL = `https://eight-6-permalist-project-render-server.onrender.com`;

//const debug = debuglog("app");
debugInfo("API_URL:" + API_URL);
debugInfo("Info log: end variables defined, in apigateway.");

debugInfo("Info log: middleware start, in apigateway.");
app.use(express.static(_dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("combined"));
debugInfo("Info log: middleware end, in apigateway.");

debugInfo(
  "Info log: start of endpoint handling with routing methods, in apigateway."
);

async function createToDoList(req, res, error) {
  debugInfo("Info log: createToDoList start, in apigateway.");
  try {
    const response = await axios.get(`${API_URL}/items`);
    const objToReturn = {
      listTitle: response.data.listTitle,
      listItems: response.data.listItems,
    };
    if (error != undefined) objToReturn.error = error;
    res.render(_dirname + "/views/index.ejs", objToReturn);
  } catch (error) {
    debugError(`Error log: failed happened at: axios(${API_URL}/items)`);
    //res.status(500).json({ message: "Error fetching items, in apigateway" });
    sendErrorFile(res);
  }
  debugInfo("Info log: createToDoList end, in apigateway.");
}

function sendErrorFile(res) {
  debugInfo("Info log: sendErrorFile func start, in apigateway.");
  res.render("error.ejs");
  debugInfo("Info log: sendErrorFile func end, in apigateway.");
}

app.get("/", async (req, res) => {
  debugInfo("Info log: app.get / func start, in apigateway.");
  await createToDoList(req, res, undefined);
  debugInfo("Info log: app.get / func end, in apigateway.");
});

app.post("/add", async (req, res) => {
  debugInfo("Info log: app.post /add func start, in apigateway.");
  const item = req.body.newItem;
  try {
    const response = await axios.post(`${API_URL}/addItem`, req.body);
    await createToDoList(req, res, response.data.error);
  } catch (error) {
    debugInfo(`Error log: failed happened at: axios(${API_URL}/add)`);
    sendErrorFile(res);
  }
  debugInfo("Info log: app.post /add func end, in apigateway.");
});

app.post("/edit", async (req, res) => {
  debugInfo("Info log: app.post /edit func start, in apigateway.");
  try {
    const response = await axios.patch(`${API_URL}/editItem`, req.body);
    await createToDoList(req, res, response.data.error);
  } catch (error) {
    debugError(`Error log: failed happened at: axios(${API_URL}/edit)`);
    res.redirect("/");
  }
  debugInfo("Info log: app.post /edit func end, in apigateway.");
});

app.post("/delete", async (req, res) => {
  debugInfo("Info log: app.post /delete func start, in apigateway.");
  try {
    const response = await axios.delete(`${API_URL}/deleteItem`, {
      data: { deleteItemId: req.body.deleteItemId },
    });
    await createToDoList(req, res, response.data.error);
  } catch (error) {
    debugError(`Error log: failed happened at: axios(${API_URL}/edit)`);
    sendErrorFile(res);
  }
  debugInfo("Info log: app.post /delete func end, in apigateway.");
});

debugInfo(
  "Info log: end of endpoint handling  with routing methods, in apigateway."
);

debugInfo("Info log: app.listen start, in apigateway");
app.listen(port, () => {
  debugInfo(`API Gateway listening on port ${port}, in apigateway`);
});
debugInfo("Info log: app.listen end, in apigateway");
